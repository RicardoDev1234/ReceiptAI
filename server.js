'use strict';
require('dotenv').config();

const express           = require('express');
const cors              = require('cors');
const path              = require('path');
const fs                = require('fs');
const fetch             = require('node-fetch');
const Anthropic         = require('@anthropic-ai/sdk');
const { createClient }  = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
  'https://receipt-ai-coral.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin OR explicit 'null' origin (file://, redirects, mobile)
    if (!origin || origin === 'null') return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

/* ── PayPal helpers ── */
async function getPayPalAccessToken() {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');

  const base = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return { token: data.access_token, base };
}

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set in .env');
  return new Anthropic({ apiKey: key });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/* ── Verify Bearer token and return Supabase user ── */
async function getAuthUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return null;
  const { data: { user }, error } = await getSupabase().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/* ── Subscription / auth middleware ── */
async function isSubscriptionActive(userId) {
  const { data } = await getSupabase()
    .from('users').select('plan').eq('id', userId).single();
  return data?.plan === 'pro';
}

async function requireAuth(req, res, next) {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.authUser = user;
    next();
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function requireSubscription(req, res, next) {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!(await isSubscriptionActive(user.id)))
      return res.status(402).json({ error: 'subscription_required', message: 'An active subscription is required.' });
    req.authUser = user;
    next();
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function requireAdmin(req, res, next) {
  try {
    const user    = await getAuthUser(req);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!user || !adminEmail || user.email !== adminEmail)
      return res.status(403).json({ error: 'Forbidden' });
    req.authUser = user;
    next();
  } catch (err) { res.status(500).json({ error: err.message }); }
}

/* ── GET /health ── */
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

/* ── GET /api/config — public client-side config ── */
app.get('/api/config', (req, res) => {
  res.json({
    paypalClientId:       process.env.PAYPAL_CLIENT_ID       || '',
    paypalPlanIdMonthly:  process.env.PAYPAL_PLAN_ID_MONTHLY || '',
    supabaseUrl:          process.env.SUPABASE_URL            || '',
    supabaseAnonKey:      process.env.SUPABASE_ANON_KEY       || '',
  });
});

/* ── JSON body parser ── */
app.use(express.json({ limit: '20mb' }));

/* ── GET / — serve index.html with injected public config ── */
app.get('/', (req, res) => {
  const html      = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const injection = `<script>
window.SUPABASE_URL            = ${JSON.stringify(process.env.SUPABASE_URL           || '')};
window.SUPABASE_ANON_KEY       = ${JSON.stringify(process.env.SUPABASE_ANON_KEY      || '')};
window.PAYPAL_CLIENT_ID        = ${JSON.stringify(process.env.PAYPAL_CLIENT_ID       || '')};
window.PAYPAL_PLAN_ID_MONTHLY  = ${JSON.stringify(process.env.PAYPAL_PLAN_ID_MONTHLY || '')};
</script>`;
  res.send(html.replace('</head>', injection + '\n</head>'));
});

/* ── POST /api/signup ── */
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, fullName, country } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || '' } },
    });
    if (error) throw error;

    if (data.user) {
      const { error: dbErr } = await supabase.from('users').insert({
        id:          data.user.id,
        email,
        full_name:   fullName || '',
        plan:        'free_trial',
        trial_start: new Date().toISOString(),
        country:     country  || '',
      });
      if (dbErr) console.warn('[Supabase users insert]', dbErr.message);
    }

    // Supabase silently succeeds but returns empty identities if email already registered
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }
    res.json({ user: data.user, session: data.session });
  } catch (err) {
    console.error('[Signup]', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ── POST /api/login ── */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    console.error('[Login]', err.message);
    res.status(401).json({ error: err.message });
  }
});

/* ── GET /api/subscription-status ── */
app.get('/api/subscription-status', requireAuth, async (req, res) => {
  try {
    const { data } = await getSupabase()
      .from('users')
      .select('plan, paypal_subscription_id')
      .eq('id', req.authUser.id)
      .single();
    const plan   = data?.plan || 'free';
    const active = plan === 'pro';
    res.json({ active, plan, subscriptionId: data?.paypal_subscription_id || null });
  } catch (err) {
    console.error('[subscription-status]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/create-checkout-session — PayPal subscription ── */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // SECURITY: require valid session — no anonymous checkouts
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'You must be signed in to start a subscription.' });

    const { plan, email } = req.body;

    const planId = plan === 'yearly'
      ? process.env.PAYPAL_PLAN_ID_YEARLY
      : process.env.PAYPAL_PLAN_ID_MONTHLY;

    if (!planId) {
      return res.status(500).json({ error: 'PayPal plan ID not configured.' });
    }

    const { token, base } = await getPayPalAccessToken();
    const baseUrl = process.env.APP_URL || `https://receipt-ai-coral.vercel.app`;

    const response = await fetch(`${base}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'Prefer':        'return=representation',
      },
      body: JSON.stringify({
        plan_id:    planId,
        subscriber: { email_address: email || undefined },
        application_context: {
          brand_name:          'ReceiptAI',
          locale:              'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action:         'SUBSCRIBE_NOW',
          payment_method:      { payer_selected: 'PAYPAL', payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED' },
          landing_page:        'BILLING',
          return_url:          `${baseUrl}/?checkout=success`,
          cancel_url:          `${baseUrl}/`,
        },
      }),
    });

    const subscription = await response.json();

    if (!subscription.id) {
      console.error('[PayPal] Failed to create subscription:', subscription);
      return res.status(500).json({ error: 'Failed to create PayPal subscription' });
    }

    const approvalUrl = subscription.links?.find(l => l.rel === 'approve')?.href;
    if (!approvalUrl) {
      return res.status(500).json({ error: 'No approval URL returned from PayPal' });
    }

    res.json({ url: approvalUrl, subscriptionId: subscription.id });
  } catch (err) {
    console.error('[PayPal create-checkout-session]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/paypal-webhook — PayPal subscription events ── */
app.post('/api/paypal-webhook', async (req, res) => {
  try {
    const event     = req.body;
    const eventType = event.event_type;

    console.log('[PayPal Webhook] Event:', eventType);

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const email          = event.resource?.subscriber?.email_address;
      const subscriptionId = event.resource?.id;
      if (email) {
        const update = { plan: 'pro' };
        if (subscriptionId) update.paypal_subscription_id = subscriptionId;
        const { error } = await getSupabase().from('users').update(update).eq('email', email);
        if (error) console.error('[Webhook] Failed to update plan:', error.message);
        else console.log('[Webhook] Plan → pro for:', email);
      }
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
      const email = event.resource?.subscriber?.email_address;
      if (email) {
        const { error } = await getSupabase().from('users').update({ plan: 'free' }).eq('email', email);
        if (error) console.error('[Webhook] Failed to downgrade plan:', error.message);
        else console.log('[Webhook] Plan → free for:', email);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[PayPal Webhook]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/activate-pro — called after successful PayPal checkout ── */
app.post('/api/activate-pro', requireAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const update = { plan: 'pro' };
    if (subscriptionId) update.paypal_subscription_id = subscriptionId;

    const { error } = await getSupabase()
      .from('users')
      .update(update)
      .eq('id', req.authUser.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[activate-pro]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/cancel-subscription — cancel user's PayPal subscription ── */
app.post('/api/cancel-subscription', requireAuth, async (req, res) => {
  try {
    const user = req.authUser;

    let { subscriptionId } = req.body;
    if (!subscriptionId) {
      const { data } = await getSupabase().from('users').select('paypal_subscription_id').eq('id', user.id).single();
      subscriptionId = data?.paypal_subscription_id;
    }
    if (!subscriptionId) return res.status(400).json({ error: 'No active subscription found.' });

    const { token, base } = await getPayPalAccessToken();

    const response = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reason: 'User requested cancellation' }),
    });

    if (response.status === 204) {
      await getSupabase().from('users').update({ plan: 'free', paypal_subscription_id: null }).eq('id', user.id);
      return res.json({ success: true });
    }

    const data = await response.json();
    res.status(400).json({ error: data.message || 'Failed to cancel subscription' });
  } catch (err) {
    console.error('[cancel-subscription]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/expenses ── */
app.get('/api/expenses', requireSubscription, async (req, res) => {
  try {
    const user = req.authUser;

    const { data, error } = await getSupabase()
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[GET /api/expenses]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/expenses ── */
app.post('/api/expenses', requireSubscription, async (req, res) => {
  try {
    const user = req.authUser;

    const { vendor, date, amount, tax, category, payment, notes } = req.body;

    const { data, error } = await getSupabase()
      .from('expenses')
      .insert({
        user_id:  user.id,
        vendor:   vendor   || 'Unknown',
        date:     date     || new Date().toISOString().split('T')[0],
        amount:   parseFloat(String(amount  || '0').replace(/[^0-9.]/g, '')) || 0,
        tax:      parseFloat(String(tax     || '0').replace(/[^0-9.]/g, '')) || 0,
        category: category || 'Other',
        payment:  payment  || '',
        notes:    notes    || '',
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[POST /api/expenses]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/admin/stats ── */
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user || user.email !== 'ricardohatoum4@gmail.com') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const supabase = getSupabase();
    const [
      { count: totalUsers },
      { count: proUsers },
      { count: totalExpenses },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('full_name, email, plan, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    res.json({
      totalUsers:    totalUsers    || 0,
      proUsers:      proUsers      || 0,
      totalExpenses: totalExpenses || 0,
      revenue:       ((proUsers || 0) * 7.99).toFixed(2),
      recentUsers:   recentUsers   || [],
    });
  } catch (err) {
    console.error('[Admin stats]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/setup-db ── */
app.get('/api/setup-db', async (req, res) => {
  const sql = `
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT DEFAULT NULL;
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL DEFAULT 'Unknown',
  date DATE,
  amount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  category TEXT DEFAULT 'Other',
  payment TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can read own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
`.trim();

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await pool.query(sql);
      await pool.end();
      return res.json({ success: true, message: 'DB setup complete.' });
    } catch (err) {
      console.error('[setup-db]', err.message);
      return res.status(500).json({ error: err.message, sql });
    }
  }
  res.json({ message: 'Run this SQL in Supabase Dashboard → SQL Editor:', sql });
});

/* ── POST /api/analyze-receipt ── */
app.post('/api/analyze-receipt', requireSubscription, async (req, res) => {
  try {
    const { base64, mediaType } = req.body;
    if (!base64 || !mediaType) return res.status(400).json({ error: 'Missing base64 or mediaType.' });

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(mediaType)) return res.status(400).json({ error: `Unsupported mediaType "${mediaType}".` });

    const msg = await getAnthropic().messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Extract the following from this receipt and respond ONLY with valid JSON, no other text:
{
  "vendor": "store or restaurant name",
  "date": "YYYY-MM-DD",
  "amount": "total with currency symbol",
  "tax": "tax amount with currency symbol or empty string",
  "category": "one of: Food & Drink, Travel, Office Supplies, Software & Subscriptions, Marketing, Utilities, Other",
  "payment": "payment method if visible or empty string"
}` },
        ],
      }],
    });

    const text  = msg.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let result;
    try { result = JSON.parse(clean); }
    catch { return res.status(500).json({ error: 'AI returned non-JSON response.', raw: clean.slice(0, 300) }); }

    res.json(result);
  } catch (err) {
    console.error('[analyze-receipt]', err.message);
    res.status(500).json({ error: err.message || 'Failed to analyze receipt' });
  }
});

app.listen(PORT, () =>
  console.log(`\n  ReceiptAI web server running → http://localhost:${PORT}\n`)
);
