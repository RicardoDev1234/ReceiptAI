'use strict';
require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const fs             = require('fs');
const Stripe         = require('stripe');
const Anthropic      = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
  'https://receipt-ai-coral.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
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

// Handle preflight for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));

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

/* ── GET /health — Railway uptime check ── */
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

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
    console.error('[analyze-receipt] full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    res.status(500).json({ error: err.message || 'Failed to analyze receipt', status: err.status });
  }
});

app.listen(PORT, () =>
  console.log(`\n  ReceiptAI web server running → http://localhost:${PORT}\n`)
);
