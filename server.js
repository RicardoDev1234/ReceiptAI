'use strict';
require('dotenv').config();

const express           = require('express');
const cors              = require('cors');
const path              = require('path');
const fs                = require('fs');
const Stripe            = require('stripe');
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
    if (!origin) return cb(null, true);
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

/* ── Lazy service clients ── */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in .env');
  return new Stripe(key);
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

/* ── GET /health ── */
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

/* ── POST /api/webhook — Stripe (raw body BEFORE express.json) ── */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email   = session.customer_email || session.customer_details?.email;

    if (email) {
      const { error } = await getSupabase()
        .from('users')
        .update({ plan: 'pro' })
        .eq('email', email);

      if (error) console.error('[Webhook] Failed to update plan:', error.message);
      else console.log('[Webhook] Plan → pro for:', email);
    } else {
      console.warn('[Webhook] checkout.session.completed — no email found in session');
    }
  }

  res.json({ received: true });
});

/* ── JSON body parser (after webhook route) ── */
app.use(express.json({ limit: '20mb' }));

/* ── GET / — serve index.html with injected public config ── */
app.get('/', (req, res) => {
  const html      = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const injection = `<script>
window.SUPABASE_URL           = ${JSON.stringify(process.env.SUPABASE_URL           || '')};
window.SUPABASE_ANON_KEY      = ${JSON.stringify(process.env.SUPABASE_ANON_KEY      || '')};
window.STRIPE_PUBLISHABLE_KEY = ${JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY || '')};
</script>`;
  res.send(html.replace('</head>', injection + '\n</head>'));
});

/* ── POST /api/signup ── */
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
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
      });
      if (dbErr) console.warn('[Supabase users insert]', dbErr.message);
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

/* ── POST /api/create-checkout-session ── */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { plan, email } = req.body;
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price ID not configured. Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY in .env' });
    }

    const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const session = await getStripe().checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      customer_email:       email || undefined,
      line_items:           [{ price: priceId, quantity: 1 }],
      subscription_data:    { trial_period_days: 7 },
      success_url:          `${baseUrl}/?checkout=success`,
      cancel_url:           `${baseUrl}/`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/expenses — fetch authenticated user's expenses ── */
app.get('/api/expenses', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

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

/* ── POST /api/expenses — save a new expense ── */
app.post('/api/expenses', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

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

/* ── GET /api/admin/stats — real data for admin dashboard ── */
app.get('/api/admin/stats', async (req, res) => {
  try {
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
      supabase.from('users')
        .select('full_name, email, plan, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
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

/* ── GET /api/setup-db — create expenses table + RLS policies ── */
app.get('/api/setup-db', async (req, res) => {
  const sql = `
CREATE TABLE IF NOT EXISTS public.expenses (
  id         UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor     TEXT          NOT NULL DEFAULT 'Unknown',
  date       DATE,
  amount     NUMERIC(10,2) DEFAULT 0,
  tax        NUMERIC(10,2) DEFAULT 0,
  category   TEXT          DEFAULT 'Other',
  payment    TEXT          DEFAULT '',
  notes      TEXT          DEFAULT '',
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own expenses"   ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can read own expenses"
  ON public.expenses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE USING (auth.uid() = user_id);
`.trim();

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await pool.query(sql);
      await pool.end();
      return res.json({ success: true, message: 'Expenses table and RLS policies created successfully.' });
    } catch (err) {
      console.error('[setup-db]', err.message);
      return res.status(500).json({ error: err.message, sql });
    }
  }

  res.json({
    message: 'DATABASE_URL not set — run this SQL manually in Supabase Dashboard → SQL Editor:',
    sql,
  });
});

/* ── POST /api/analyze-receipt ── */
app.post('/api/analyze-receipt', async (req, res) => {
  try {
    const { base64, mediaType } = req.body;

    if (!base64 || !mediaType) {
      return res.status(400).json({ error: 'Missing base64 or mediaType in request body.' });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(mediaType)) {
      return res.status(400).json({
        error: `Unsupported mediaType "${mediaType}". Must be one of: ${validTypes.join(', ')}`,
      });
    }

    console.log(`[analyze-receipt] mediaType=${mediaType} base64Length=${base64.length}`);

    const msg = await getAnthropic().messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role:    'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Extract the following from this receipt and respond ONLY with valid JSON, no other text:
{
  "vendor": "store or restaurant name",
  "date": "YYYY-MM-DD",
  "amount": "total with currency symbol",
  "tax": "tax amount with currency symbol or empty string",
  "category": "one of: Food & Drink, Travel, Office Supplies, Software & Subscriptions, Marketing, Utilities, Other",
  "payment": "payment method if visible or empty string"
}`,
          },
        ],
      }],
    });

    const text  = msg.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    console.log('[analyze-receipt] AI response:', clean);

    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseErr) {
      console.error('[analyze-receipt] JSON parse failed. Raw text:', clean);
      return res.status(500).json({ error: 'AI returned non-JSON response.', raw: clean.slice(0, 300) });
    }

    res.json(result);
  } catch (err) {
    console.error('[analyze-receipt] status=%s message=%s', err.status ?? 'n/a', err.message);
    res.status(500).json({ error: err.message || 'Failed to analyze receipt', status: err.status });
  }
});

app.listen(PORT, () =>
  console.log(`\n  ReceiptAI web server running → http://localhost:${PORT}\n`)
);
