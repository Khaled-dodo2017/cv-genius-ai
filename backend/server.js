import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

/* =========================================================
   BASIC SECURITY
========================================================= */

const ALLOWED_ORIGINS = new Set([
  "https://khaled-dodo2017.github.io"
]);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed"));
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: ["Content-Type"],

    optionsSuccessStatus: 204
  })
);

app.use(
  express.json({
    limit: "100kb"
  })
);

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const IDENTITY_HASH_SECRET =
  process.env.IDENTITY_HASH_SECRET ||
  "cv-genius-default-secret-change-this";

/* =========================================================
   SUPABASE
========================================================= */

async function supabaseRequest(
  path,
  options = {}
) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Supabase environment variables are missing"
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        apikey:
          SUPABASE_SERVICE_ROLE_KEY,

        Authorization:
          `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

        "Content-Type":
          "application/json",

        ...(options.headers || {})
      }
    }
  );

  const text =
    await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

/* =========================================================
   HELPERS
========================================================= */

function hash(value) {
  return crypto
    .createHmac(
      "sha256",
      IDENTITY_HASH_SECRET
    )
    .update(String(value))
    .digest("hex");
}

function getClientIp(req) {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded
      .toString()
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function normalizeEmail(email) {
  if (
    !email ||
    typeof email !== "string"
  ) {
    return "";
  }

  return email
    .trim()
    .toLowerCase();
}

function normalizeDeviceId(deviceId) {
  if (
    !deviceId ||
    typeof deviceId !== "string"
  ) {
    return "";
  }

  return deviceId.trim();
}

/* =========================================================
   EXTRACT EMAIL FROM CV
========================================================= */

function extractEmail(text) {
  const match =
    text.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

  return match
    ? normalizeEmail(match[0])
    : "";
}

/* =========================================================
   RATE LIMIT
========================================================= */

const RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;

const RATE_LIMIT_MAX = 10;

const rateLimitStore =
  new Map();

function rateLimit(
  req,
  res,
  next
) {
  const now =
    Date.now();

  const ip =
    getClientIp(req);

  const current =
    rateLimitStore.get(ip);

  if (
    !current ||
    now - current.start >=
      RATE_LIMIT_WINDOW_MS
  ) {
    rateLimitStore.set(
      ip,
      {
        start: now,
        count: 1
      }
    );

    return next();
  }

  current.count += 1;

  if (
    current.count >
    RATE_LIMIT_MAX
  ) {
    const retryAfter =
      Math.ceil(
        (
          RATE_LIMIT_WINDOW_MS -
          (now - current.start)
        ) / 1000
      );

    res.set(
      "Retry-After",
      String(retryAfter)
    );

    return res.status(429).json({
      error:
        "تم تجاوز عدد الطلبات المسموح بها مؤقتًا. حاول لاحقًا."
    });
  }

  return next();
}

/* =========================================================
   BUILD IDENTITIES
========================================================= */

function getIdentities(
  req,
  text
) {
  const email =
    extractEmail(text);

  const ip =
    getClientIp(req);

  const deviceId =
    normalizeDeviceId(
      req.body?.deviceId
    );

  return {
    emailHash: email
      ? hash(`email:${email}`)
      : "",

    ipHash: ip
      ? hash(`ip:${ip}`)
      : "",

    deviceHash: deviceId
      ? hash(`device:${deviceId}`)
      : ""
  };
}

/* =========================================================
   FIND PREVIOUS USAGE
========================================================= */

async function getPreviousUsage(
  identities
) {
  const conditions = [];

  if (identities.emailHash) {
    conditions.push(
      `email_hash.eq.${identities.emailHash}`
    );
  }

  if (identities.ipHash) {
    conditions.push(
      `ip_hash.eq.${identities.ipHash}`
    );
  }

  if (identities.deviceHash) {
    conditions.push(
      `device_hash.eq.${identities.deviceHash}`
    );
  }

  if (
    conditions.length === 0
  ) {
    return [];
  }

  const query =
    `ai_usage?select=id,created_at&or=(${conditions.join(",")})&order=created_at.asc`;

  return await supabaseRequest(
    query,
    {
      method: "GET"
    }
  );
}

/* =========================================================
   SAVE SUCCESSFUL USAGE
========================================================= */

async function saveUsage(
  identities
) {
  await supabaseRequest(
    "ai_usage",
    {
      method: "POST",

      headers: {
        Prefer:
          "return=minimal"
      },

      body: JSON.stringify({
        email_hash:
          identities.emailHash ||
          null,

        ip_hash:
          identities.ipHash ||
          null,

        device_hash:
          identities.deviceHash ||
          null,

        action:
          "improve-cv"
      })
    }
  );
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      ok: true,

      service:
        "CV Genius AI Backend",

      status:
        "running"
    });
  }
);

/* =========================================================
   CV IMPROVEMENT
========================================================= */

app.post(
  "/improve-cv
