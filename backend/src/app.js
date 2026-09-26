const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("node:path");
const fs = require("node:fs");

const app = express();

const production = process.env.NODE_ENV === "production";

const origins = new Set(
  process.env.APP_ORIGIN
    ? [process.env.APP_ORIGIN]
    : ["http://localhost:5173", "http://127.0.0.1:5173"]
);

if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "upgrade-insecure-requests": production ? [] : null,
        "frame-src": ["'none'"],
        "worker-src": ["'self'"],
        "object-src": ["'none'"],
        "font-src": ["'self'", "blob:"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
    strictTransportSecurity: production ? undefined : false,
    referrerPolicy: { policy: "no-referrer" },
  })
);

app.use(
  cors({
    origin(origin, cb) {
      cb(null, !origin || origins.has(origin));
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("Origin");

    if (
      (origin && !origins.has(origin)) ||
      (!origin &&
        (req.get("Sec-Fetch-Site") === "cross-site" ||
          (req.headers.cookie && !req.headers.authorization)))
    ) {
      return res.status(403).json({
        success: false,
        message: "Request origin is not allowed.",
      });
    }
  }

  next();
});

app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (req, res) =>
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
  })
);

const limiter = (limit, windowMs) =>
  rateLimit({
    limit,
    windowMs,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please wait a few minutes and try again.",
    },
  });

app.use("/api", limiter(300, 60000));
app.use("/api/auth/login", limiter(15, 15 * 60000));
app.use("/api/auth/signup", limiter(10, 60 * 60000));

app.use("/api/share", limiter(90, 60000), require("./routes/share.route"));
app.use("/api/files", require("./routes/file.route"));
app.use("/api/auth", require("./routes/auth.route"));

app.use("/api", (req, res) =>
  res.status(404).json({
    success: false,
    message: "API route not found.",
  })
);

const frontend = path.resolve(__dirname, "../../frontend/dist");

if (fs.existsSync(path.join(frontend, "index.html"))) {
  app.use(
    express.static(frontend, {
      index: false,
      maxAge: "1h",
      setHeaders(res, file) {
        if (file.includes(path.sep + "assets" + path.sep)) {
          res.set("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  app.get("/{*path}", (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(frontend, "index.html"));
  });
}

app.use(require("./middleware/error.middleware"));

module.exports = app;