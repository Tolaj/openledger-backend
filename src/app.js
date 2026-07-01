import express from "express";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middlewares/requestLogger.js";
import configRoutes from "./routes/index.js";

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://openledger.swapniljadhav.com',
  // extra origins can be added via env (comma-separated)
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean) : []),
];
// Vercel preview/prod deploys and any subdomain of swapniljadhav.com
const ORIGIN_PATTERNS = [
  /^https:\/\/openledger-frontend.*\.vercel\.app$/,
  /^https:\/\/([a-z0-9-]+\.)*swapniljadhav\.com$/,
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || ORIGIN_PATTERNS.some((re) => re.test(origin)))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestLogger);

configRoutes(app);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
