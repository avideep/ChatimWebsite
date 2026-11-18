import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

// First run: generate a .env with a random session secret and admin credentials.
if (!fs.existsSync(ENV_FILE)) {
  const pw = crypto.randomBytes(9).toString('base64url');
  fs.writeFileSync(ENV_FILE, [
    '# Generated on first run – keep this file private.',
    'PORT=8080',
    `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`,
    'ADMIN_EMAIL=admin@chatimcollections.in',
    `ADMIN_PASSWORD=${pw}`,
    '',
  ].join('\n'));
  console.log('ℹ Created .env with a fresh admin password (see ADMIN_PASSWORD in .env)');
}

await import('dotenv/config');
const { default: express } = await import('express');
const { default: helmet } = await import('helmet');
const { default: compression } = await import('compression');
const { default: cookieParser } = await import('cookie-parser');
const { seed, ensureAdmin } = await import('./seed.js');
const { sessionMiddleware, HttpError } = await import('./lib.js');
const { default: api } = await import('./routes/api.js');
const { default: admin, UPLOAD_DIR } = await import('./routes/admin.js');

if (seed()) console.log('✔ Seeded catalogue, reviews, coupons and demo orders');
ensureAdmin();

const app = express();
app.set('trust proxy', 1); // behind Cloudflare tunnel
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'connect-src': ["'self'"],
      'frame-src': ['https://www.google.com'],
      'upgrade-insecure-requests': null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(sessionMiddleware);

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/admin', admin);
app.use('/api', api);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));

// Serve the built React app in production
const DIST = process.env.BUILD_DIR || path.join((await import('node:os')).homedir(), '.chatim-collections', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false,
    setHeaders: (res, p) => { if (p.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); } }));
  app.get(/^\/(?!api\/|uploads\/|assets\/|media\/).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html'), { dotfiles: 'allow' }));
} else {
  console.warn(`⚠ No build found at ${DIST} – run "npm run build" first.`);
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message, details: err.details });
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, (err) => {
  if (err) { console.error(`✖ Could not start on port ${PORT}: ${err.code === 'EADDRINUSE' ? 'port already in use' : err.message}`); process.exit(1); }
  console.log(`✨ Chatim Collections running at http://localhost:${PORT}`);
});
