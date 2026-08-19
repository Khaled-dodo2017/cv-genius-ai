import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

/* =========================================================
   CONFIGURATION
========================================================= */

const ALLOWED_ORIGINS = new Set([
  "https://khaled-dodo2017.github.io",
  "https://cv-genius-ai-eight.vercel.app"
]);

const RATE_LIMIT_WINDOW_MS =
  15 * 60 * 1000;

const RATE_LIMIT_MAX = 10;

const FREE_AI_USES = 2;

const MAX_CV_LENGTH = 15000;

const MAX_DEVICE_ID_LENGTH = 200;

const PADDLE_TIMESTAMP_TOLERANCE_SECONDS = 5;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.6-flash";

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim();

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY?.trim();

const PADDLE_WEBHOOK_SECRET =
  process.env.PADDLE_WEBHOOK_SECRET?.trim();

const IDENTITY_HASH_SECRET =
  process.env.IDENTITY_HASH_SECRET?.trim();

/*
  Paddle price IDs

  ضع نفس Price IDs الموجودة في Paddle/Vercel.
*/

const PADDLE_PRICE_ID_MONTHLY =
  process.env.PADDLE_PRICE_ID_MONTHLY?.trim();

const PADDLE_PRICE_ID_ONE_TIME =
  process.env.PADDLE_PRICE_ID_ONE_TIME?.trim();

const IS_PRODUCTION =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

/* =========================================================
   BASIC SECURITY
========================================================= */

app.set("trust proxy", 1);

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "DENY"
  );

  res.setHeader(
    "Referrer-Policy",
    "no-referrer"
  );

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  next();
});

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: (origin, callback) => {
      /*
        Paddle webhooks normally do not contain
        an Origin header.
      */

      if (!origin) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.has(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed")
      );
    },

    methods: [
      "GET",
      "POST",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Paddle-Signature"
    ],

    optionsSuccessStatus: 204
  })
);

/* =========================================================
   CONFIGURATION VALIDATION
========================================================= */

function validateAiConfiguration() {
  const missing = [];

  if (!SUPABASE_URL) {
    missing.push("SUPABASE_URL");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    missing.push(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (!GEMINI_API_KEY) {
    missing.push("GEMINI_API_KEY");
  }

  if (!IDENTITY_HASH_SECRET) {
    missing.push(
      "IDENTITY_HASH_SECRET"
    );
  }

  if (missing.length > 0) {
    console.error(
      "Missing AI environment variables:",
      missing
    );

    return false;
  }

  return true;
}

function validatePaddleConfiguration() {
  const missing = [];

  if (!SUPABASE_URL) {
    missing.push("SUPABASE_URL");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    missing.push(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (!PADDLE_WEBHOOK_SECRET) {
    missing.push(
      "PADDLE_WEBHOOK_SECRET"
    );
  }

  if (!PADDLE_PRICE_ID_MONTHLY) {
    missing.push(
      "PADDLE_PRICE_ID_MONTHLY"
    );
  }

  if (!PADDLE_PRICE_ID_ONE_TIME) {
    missing.push(
      "PADDLE_PRICE_ID_ONE_TIME"
    );
  }

  if (missing.length > 0) {
    console.error(
      "Missing Paddle environment variables:",
      missing
    );

    return false;
  }

  return true;
}

/* =========================================================
   PADDLE WEBHOOK SIGNATURE
========================================================= */

function parsePaddleSignature(
  signatureHeader
) {
  if (
    typeof signatureHeader !==
    "string"
  ) {
    return null;
  }

  const parts =
    signatureHeader
      .split(";")
      .map(part =>
        part.trim()
      );

  let timestamp = "";

  const signatures = [];

  for (const part of parts) {
    const separatorIndex =
      part.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key =
      part.slice(
        0,
        separatorIndex
      );

    const value =
      part.slice(
        separatorIndex + 1
      );

    if (key === "ts") {
      timestamp = value;
    }

    if (
      key === "h1" &&
      value
    ) {
      signatures.push(value);
    }
  }

  if (
    !timestamp ||
    signatures.length === 0
  ) {
    return null;
  }

  return {
    timestamp,
    signatures
  };
}

function verifyPaddleSignature(
  rawBody,
  signatureHeader
) {
  if (
    !PADDLE_WEBHOOK_SECRET ||
    !rawBody ||
    !signatureHeader
  ) {
    return false;
  }

  const parsed =
    parsePaddleSignature(
      signatureHeader
    );

  if (!parsed) {
    return false;
  }

  const {
    timestamp,
    signatures
  } = parsed;

  const timestampNumber =
    Number(timestamp);

  if (
    !Number.isInteger(
      timestampNumber
    )
  ) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );

  const age =
    Math.abs(
      now -
      timestampNumber
    );

  if (
    age >
    PADDLE_TIMESTAMP_TOLERANCE_SECONDS
  ) {
    console.error(
      "Paddle webhook timestamp outside tolerance"
    );

    return false;
  }

  const signedPayload =
    `${timestamp}:${rawBody}`;

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        PADDLE_WEBHOOK_SECRET
      )
      .update(
        signedPayload,
        "utf8"
      )
      .digest("hex");

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  for (
    const receivedSignature
    of signatures
  ) {
    const receivedBuffer =
      Buffer.from(
        receivedSignature,
        "utf8"
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      continue;
    }

    if (
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return true;
    }
  }

  return false;
}

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

  const response =
    await fetch(
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

  if (text) {
    try {
      data =
        JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Supabase error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

/* =========================================================
   PADDLE EVENT STORAGE
========================================================= */

async function savePaddleEvent({
  eventId,
  eventType,
  occurredAt,
  data
}) {
  if (!eventId) {
    return;
  }

  /*
    event_id must be UNIQUE in paddle_events.

    If Paddle sends the same event again,
    Supabase ignores the duplicate.
  */

  await supabaseRequest(
    "paddle_events",
    {
      method: "POST",

      headers: {
        Prefer:
          "return=representation,resolution=ignore-duplicates"
      },

      body: JSON.stringify({
        event_id:
          eventId,

        event_type:
          eventType,

        occurred_at:
          occurredAt,

        payload:
          data
      })
    }
  );
}

/* =========================================================
   PADDLE SUBSCRIPTION STORAGE
========================================================= */

async function savePaddleSubscription(
  subscription
) {
  const subscriptionId =
    subscription?.id;

  if (
    typeof subscriptionId !==
      "string" ||
    !subscriptionId.startsWith(
      "sub_"
    )
  ) {
    return;
  }

  const customerId =
    subscription?.customer_id ||
    null;

  const status =
    subscription?.status ||
    null;

  const priceId =
    subscription
      ?.items?.[0]
      ?.price?.id ||
    null;

  await supabaseRequest(
    "paddle_subscriptions?on_conflict=subscription_id",
    {
      method: "POST",

      headers: {
        Prefer:
          "resolution=merge-duplicates,return=minimal"
      },

      body: JSON.stringify({
        subscription_id:
          subscriptionId,

        customer_id:
          customerId,

        status:
          status,

        price_id:
          priceId,

        updated_at:
          new Date().toISOString(),

        raw_data:
          subscription
      })
    }
  );
}

/* =========================================================
   GRANT PAID AI CREDITS
========================================================= */

async function grantPaidCredits({
  eventId,
  userId,
  priceId
}) {
  if (
    !eventId ||
    !userId ||
    !priceId
  ) {
    return {
      granted: false,
      credits: 0
    };
  }

  let credits = 0;

  if (
    priceId ===
    PADDLE_PRICE_ID_MONTHLY
  ) {
    credits = 30;
  }

  if (
    priceId ===
    PADDLE_PRICE_ID_ONE_TIME
  ) {
    credits = 60;
  }

  if (credits <= 0) {
    return {
      granted: false,
      credits: 0
    };
  }

  /*
    IMPORTANT:

    grant_paid_credits must use event_id
    to make the operation idempotent.

    Therefore the same Paddle event
    cannot grant credits twice.
  */

  const result =
    await supabaseRequest(
      "rpc/grant_paid_credits",
      {
        method: "POST",

        headers: {
          Prefer:
            "return=representation"
        },

        body:
          JSON.stringify({
            p_event_id:
              eventId,

            p_user_id:
              userId,

            p_credits:
              credits,

            p_price_id:
              priceId
          })
      }
    );

  return {
    granted: true,
    credits,
    result
  };
}

/* =========================================================
   PADDLE WEBHOOK
========================================================= */

/*
  MUST remain before express.json()
  because Paddle signature verification
  requires the exact raw request body.
*/

app.post(
  "/paddle-webhook",

  express.raw({
    type: "application/json",
    limit: "1mb"
  }),

  async (req, res) => {
    try {
      if (
        !validatePaddleConfiguration()
      ) {
        return res.status(503).json({
          error:
            "Webhook service is not configured."
        });
      }

      const signature =
        req.headers[
          "paddle-signature"
        ];

      if (
        typeof signature !==
        "string"
      ) {
        console.error(
          "Paddle-Signature header missing"
        );

        return res.status(401).json({
          error:
            "Invalid Paddle signature."
        });
      }

      if (
        !Buffer.isBuffer(
          req.body
        )
      ) {
        console.error(
          "Paddle webhook body is not raw"
        );

        return res.status(400).json({
          error:
            "Invalid webhook body."
        });
      }

      const rawBody =
        req.body.toString(
          "utf8"
        );

      if (!rawBody) {
        return res.status(400).json({
          error:
            "Empty webhook body."
        });
      }

      /* -----------------------------------------------------
         VERIFY SIGNATURE
      ----------------------------------------------------- */

      const valid =
        verifyPaddleSignature(
          rawBody,
          signature
        );

      if (!valid) {
        console.error(
          "Invalid Paddle webhook signature"
        );

        return res.status(401).json({
          error:
            "Invalid Paddle signature."
        });
      }

      /* -----------------------------------------------------
         PARSE EVENT
      ----------------------------------------------------- */

      let event;

      try {
        event =
          JSON.parse(
            rawBody
          );
      } catch {
        console.error(
          "Paddle webhook JSON parsing failed"
        );

        return res.status(400).json({
          error:
            "Invalid webhook JSON."
        });
      }

      const eventType =
        typeof event?.event_type ===
        "string"
          ? event.event_type
          : "unknown";

      const eventId =
        typeof event?.event_id ===
        "string"
          ? event.event_id
          : "";

      const occurredAt =
        event?.occurred_at ||
        null;

      const data =
        event?.data ||
        null;

      console.log(
        "Paddle webhook verified:",
        {
          eventType,
          eventId,
          occurredAt
        }
      );

      /* -----------------------------------------------------
         SAVE EVENT
      ----------------------------------------------------- */

      if (eventId) {
        try {
          await savePaddleEvent({
            eventId,
            eventType,
            occurredAt,
            data
          });
        } catch (error) {
          console.error(
            "Failed to persist Paddle event:",
            error
          );

          return res.status(500).json({
            error:
              "Webhook processing failed."
          });
        }
      }

      /* -----------------------------------------------------
         SAVE SUBSCRIPTION
      ----------------------------------------------------- */

      if (
        data &&
        typeof data === "object" &&
        typeof data.id === "string" &&
        data.id.startsWith("sub_")
      ) {
        try {
          await savePaddleSubscription(
            data
          );
        } catch (error) {
          console.error(
            "Failed to save Paddle subscription:",
            error
          );

          return res.status(500).json({
            error:
              "Subscription processing failed."
          });
        }
      }

      /* =====================================================
         PAID CREDITS

         ONLY transaction.completed
         is allowed to grant credits.

         This prevents subscription.created,
         subscription.updated, etc. from
         accidentally granting credits.
      ===================================================== */

      if (
        eventType ===
        "transaction.completed" &&
        data &&
        typeof data === "object"
      ) {
        const userId =
          typeof data?.custom_data?.user_id ===
          "string"
            ? data.custom_data.user_id.trim()
            : "";

        const priceId =
          data
            ?.items?.[0]
            ?.price?.id ||
          "";

        if (
          !userId
        ) {
          console.error(
            "transaction.completed has no custom_data.user_id"
          );

          /*
            Do not grant credits without a
            user_id because we must know exactly
            which account receives the credits.
          */

          return res.status(200).json({
            ok: true,
            received: true,
            creditsGranted: false
          });
        }

        if (
          !priceId
        ) {
          console.error(
            "transaction.completed has no price ID"
          );

          return res.status(200).json({
            ok: true,
            received: true,
            creditsGranted: false
          });
        }

        try {
          const creditResult =
            await grantPaidCredits({
              eventId,
              userId,
              priceId
            });

          console.log(
            "Paid AI credits processed:",
            {
              eventId,
              userId,
              priceId,
              credits:
                creditResult.credits
            }
          );

        } catch (error) {
          console.error(
            "Failed to grant paid AI credits:",
            error
          );

          return res.status(500).json({
            error:
              "Failed to grant paid credits."
          });
        }
      }

      return res.status(200).json({
        ok: true,
        received: true
      });

    } catch (error) {
      console.error(
        "Paddle webhook error:",
        error
      );

      return res.status(500).json({
        error:
          "Webhook processing failed."
      });
    }
  }
);

/* =========================================================
   JSON BODY
========================================================= */

app.use(
  express.json({
    limit: "100kb"
  })
);

/* =========================================================
   HELPERS
========================================================= */

function hash(value) {
  if (
    !IDENTITY_HASH_SECRET
  ) {
    throw new Error(
      "IDENTITY_HASH_SECRET is missing"
    );
  }

  return crypto
    .createHmac(
      "sha256",
      IDENTITY_HASH_SECRET
    )
    .update(
      String(value),
      "utf8"
    )
    .digest("hex");
}

function getClientIp(req) {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function normalizeEmail(email) {
  if (
    typeof email !==
    "string"
  ) {
    return "";
  }

  const normalized =
    email
      .trim()
      .toLowerCase();

  if (
    normalized.length === 0 ||
    normalized.length > 254
  ) {
    return "";
  }

  return normalized;
}

function normalizeDeviceId(
  deviceId
) {
  if (
    typeof deviceId !==
    "string"
  ) {
    return "";
  }

  const normalized =
    deviceId.trim();

  if (
    normalized.length === 0 ||
    normalized.length >
      MAX_DEVICE_ID_LENGTH
  ) {
    return "";
  }

  return normalized;
}

/* =========================================================
   EXTRACT EMAIL FROM CV
========================================================= */

function extractEmail(text) {
  if (
    typeof text !==
    "string"
  ) {
    return "";
  }

  const match =
    text.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

  return match
    ? normalizeEmail(
        match[0]
      )
    : "";
}

/* =========================================================
   RATE LIMIT
========================================================= */

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

  let key;

  try {
    key = hash(
      `rate:${ip}`
    );
  } catch {
    key = ip;
  }

  const current =
    rateLimitStore.get(key);

  if (
    !current ||
    now -
      current.start >=
      RATE_LIMIT_WINDOW_MS
  ) {
    rateLimitStore.set(
      key,
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
          (
            now -
            current.start
          )
        ) / 1000
      );

    res.set(
      "Retry-After",
      String(
        Math.max(
          1,
          retryAfter
        )
      )
    );

    return res.status(429).json({
      error:
        "تم تجاوز عدد الطلبات المسموح بها مؤقتًا. حاول لاحقًا.",

      code:
        "RATE_LIMITED"
    });
  }

  return next();
}

function cleanupRateLimitStore() {
  const now =
    Date.now();

  for (
    const [
      key,
      value
    ]
    of rateLimitStore
  ) {
    if (
      now -
        value.start >=
      RATE_LIMIT_WINDOW_MS
    ) {
      rateLimitStore.delete(
        key
      );
    }
  }
}

setInterval(
  cleanupRateLimitStore,
  RATE_LIMIT_WINDOW_MS
).unref?.();

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
      ? hash(
          `email:${email}`
        )
      : "",

    ipHash: ip
      ? hash(
          `ip:${ip}`
        )
      : "",

    deviceHash: deviceId
      ? hash(
          `device:${deviceId}`
        )
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

  if (
    identities.emailHash
  ) {
    conditions.push(
      `email_hash.eq.${encodeURIComponent(
        identities.emailHash
      )}`
    );
  }

  if (
    identities.ipHash
  ) {
    conditions.push(
      `ip_hash.eq.${encodeURIComponent(
        identities.ipHash
      )}`
    );
  }

  if (
    identities.deviceHash
  ) {
    conditions.push(
      `device_hash.eq.${encodeURIComponent(
        identities.deviceHash
      )}`
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
   SAVE SUCCESSFUL FREE USAGE
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
   VALIDATE GEMINI RESULT
========================================================= */

function parseGeminiResult(
  result
) {
  if (
    typeof result !==
    "string"
  ) {
    return null;
  }

  const clean =
    result.trim();

  if (!clean) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(clean);

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
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
        "running",

      model:
        GEMINI_MODEL
    });
  }
);

/* =========================================================
   CV IMPROVEMENT
========================================================= */

app.post(
  "/improve-cv",

  rateLimit,

  async (req, res) => {
    try {
      /* -----------------------------------------------------
         SERVER CONFIGURATION
      ----------------------------------------------------- */

      if (
        !validateAiConfiguration()
      ) {
        console.error(
          "AI server configuration is incomplete"
        );

        return res.status(503).json({
          error:
            "الخدمة غير متاحة حاليًا."
        });
      }

      /* -----------------------------------------------------
         INPUT
      ----------------------------------------------------- */

      const {
        text,
        language = "ar",
        user_id
      } =
        req.body || {};

      /*
        Paid credits belong to the logged-in
        user account, not to the CV email.

        Therefore the user_id is required.
      */

      if (
        typeof user_id !== "string" ||
        !user_id.trim()
      ) {
        return res.status(401).json({
          error:
            "جلسة تسجيل الدخول غير صالحة."
        });
      }

      const cleanUserId =
        user_id.trim();

      /* -----------------------------------------------------
         TEXT VALIDATION
      ----------------------------------------------------- */

      if (
        typeof text !==
        "string"
      ) {
        return res.status(400).json({
          error:
            "نص السيرة الذاتية غير صالح."
        });
      }

      const cleanText =
        text.trim();

      if (!cleanText) {
        return res.status(400).json({
          error:
            "لم يتم إرسال نص السيرة الذاتية."
        });
      }

      if (
        cleanText.length >
        MAX_CV_LENGTH
      ) {
        return res.status(413).json({
          error:
            "السيرة الذاتية طويلة جدًا. اختصر النص وحاول مرة أخرى."
        });
      }

      /* -----------------------------------------------------
         LANGUAGE VALIDATION
      ----------------------------------------------------- */

      const allowedLanguages =
        new Set([
          "ar",
          "fr",
          "en"
        ]);

      if (
        typeof language !==
          "string" ||
        !allowedLanguages.has(
          language
        )
      ) {
        return res.status(400).json({
          error:
            "لغة غير مدعومة."
        });
      }

      /* -----------------------------------------------------
         IDENTITIES
      ----------------------------------------------------- */

      const identities =
        getIdentities(
          req,
          cleanText
        );

      const hasIdentity =
        Boolean(
          identities.emailHash ||
          identities.ipHash ||
          identities.deviceHash
        );

      if (!hasIdentity) {
        return res.status(400).json({
          error:
            "تعذر التحقق من هوية الجهاز."
        });
      }

      /* -----------------------------------------------------
         FREE USAGE CHECK
      ----------------------------------------------------- */

      const previousUsage =
        await getPreviousUsage(
          identities
        );

      const successfulUses =
        Array.isArray(
          previousUsage
        )
          ? previousUsage.length
          : 0;

      /* -----------------------------------------------------
         PAID CREDIT CHECK
      ----------------------------------------------------- */

      let paidCredits = 0;

      try {
        const creditRows =
          await supabaseRequest(
            `ai_credits?select=credits&user_id=eq.${encodeURIComponent(cleanUserId)}&limit=1`,
            {
              method: "GET"
            }
          );

        paidCredits =
          Number(
            creditRows?.[0]?.credits ||
            0
          );

      } catch (creditError) {
        console.error(
          "Failed to read paid credits:",
          creditError
        );

        return res.status(503).json({
          error:
            "تعذر قراءة رصيدك حاليًا. حاول مرة أخرى."
        });
      }

      /* -----------------------------------------------------
         PAYMENT REQUIRED
      ----------------------------------------------------- */

      if (
        successfulUses >=
          FREE_AI_USES &&
        paidCredits <= 0
      ) {
        return res.status(402).json({
          error:
            "لقد أكملت الاستعمالين المجانيين. اختر خطة للمتابعة.",

          code:
            "PAYMENT_REQUIRED",

          freeUses:
            successfulUses,

          freeUsesRemaining:
            0,

          paidCredits:
            paidCredits,

          requiresPayment:
            true,

          plans: [
            "monthly",
            "one-time"
          ]
        });
      }

      /* -----------------------------------------------------
         GEMINI
      ----------------------------------------------------- */

      if (!GEMINI_API_KEY) {
        console.error(
          "GEMINI_API_KEY is missing"
        );

        return res.status(503).json({
          error:
            "خدمة الذكاء الاصطناعي غير متاحة حاليًا."
        });
      }

      /* -----------------------------------------------------
         LANGUAGE INSTRUCTION
      ----------------------------------------------------- */

      const languageInstruction =
        {
          ar:
            "اكتب النتيجة باللغة العربية.",

          fr:
            "Écrivez le résultat en français.",

          en:
            "Write the result in English."
        }[language];

      /* -----------------------------------------------------
         PROMPT
      ----------------------------------------------------- */

      const prompt = `
أنت مساعد متخصص في تحسين السير الذاتية.

${languageInstruction}

حسّن السيرة الذاتية التالية بشكل احترافي.

قواعد صارمة:
- لا تخترع أي معلومات.
- لا تضف شركات أو وظائف أو شهادات أو مهارات غير موجودة.
- لا تحذف المعلومات الموجودة.
- لا تغير الاسم.
- لا تغير البريد الإلكتروني.
- لا تغير رقم الهاتف.
- لا تغير الموقع.
- لا تغير التواريخ الموجودة.
- حسّن صياغة الملخص والخبرة والتعليم والمهارات واللغات.
- اجعل الوصف مهنيًا وواضحًا.
- لا تستخدم Markdown.
- أعد JSON فقط.

يجب أن يكون JSON بهذا الشكل:

{
  "summary": "ملخص مهني",
  "experience": [
    {
      "role": "المسمى الوظيفي",
      "company": "الشركة",
      "dates": "الفترة",
      "description": "الوصف والإنجازات"
    }
  ],
  "education": [
    {
      "degree": "المؤهل",
      "school": "المؤسسة التعليمية",
      "year": "السنة"
    }
  ],
  "skills": [
    "مهارة 1",
    "مهارة 2"
  ],
  "languages": [
    "لغة 1",
    "لغة 2"
  ]
}

معلومات السيرة الذاتية:

${cleanText}
`;

      /* =====================================================
         GEMINI API WITH RETRY
      ===================================================== */

      const maxAttempts = 3;

      let response = null;

      let data = null;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {
        try {
          response =
            await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
                GEMINI_MODEL
              )}:generateContent`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  "x-goog-api-key":
                    GEMINI_API_KEY
                },

                body:
                  JSON.stringify({
                    contents: [
                      {
                        role:
                          "user",

                        parts: [
                          {
                            text:
                              prompt
                          }
                        ]
                      }
                    ],

                    generationConfig: {
                      responseMimeType:
                        "application/json",

                      responseSchema: {
                        type:
                          "OBJECT",

                        properties: {
                          summary: {
                            type:
                              "STRING"
                          },

                          experience: {
                            type:
                              "ARRAY",

                            items: {
                              type:
                                "OBJECT",

                              properties: {
                                role: {
                                  type:
                                    "STRING"
                                },

                                company: {
                                  type:
                                    "STRING"
                                },

                                dates: {
                                  type:
                                    "STRING"
                                },

                                description: {
                                  type:
                                    "STRING"
                                }
                              },

                              required: [
                                "role",
                                "company",
                                "dates",
                                "description"
                              ]
                            }
                          },

                          education: {
                            type:
                              "ARRAY",

                            items: {
                              type:
                                "OBJECT",

                              properties: {
                                degree: {
                                  type:
                                    "STRING"
                                },

                                school: {
                                  type:
                                    "STRING"
                                },

                                year: {
                                  type:
                                    "STRING"
                                }
                              },

                              required: [
                                "degree",
                                "school",
                                "year"
                              ]
                            }
                          },

                          skills: {
                            type:
                              "ARRAY",

                            items: {
                              type:
                                "STRING"
                            }
                          },

                          languages: {
                            type:
                              "ARRAY",

                            items: {
                              type:
                                "STRING"
                            }
                          }
                        },

                        required: [
                          "summary",
                          "experience",
                          "education",
                          "skills",
                          "languages"
                        ]
                      }
                    }
                  })
              }
            );

        } catch (
          networkError
        ) {
          console.error(
            `Gemini network error - attempt ${attempt}:`,
            networkError?.message ||
              networkError
          );

          if (
            attempt ===
            maxAttempts
          ) {
            return res.status(502).json({
              error:
                "تعذر الاتصال بخدمة الذكاء الاصطناعي حاليًا."
            });
          }

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                1000 *
                  attempt
              )
          );

          continue;
        }

        data = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (
          response.status ===
            429 ||
          response.status ===
            500 ||
          response.status ===
            502 ||
          response.status ===
            503 ||
          response.status ===
            504
        ) {
          console.error(
            `Gemini ${response.status} - attempt ${attempt}/${maxAttempts}`
          );

          if (
            attempt <
            maxAttempts
          ) {
            const delay =
              1500 *
              Math.pow(
                2,
                attempt - 1
              );

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  delay
                )
            );

            continue;
          }
        }

        break;
      }

      /* =====================================================
         GEMINI ERROR
      ===================================================== */

      if (
        !response ||
        !response.ok
      ) {
        console.error(
          "Gemini API error:",
          {
            status:
              response?.status ||
              null,

            statusText:
              response?.statusText ||
              null,

            error:
              data?.error?.status ||
              data?.error?.message ||
              "unknown"
          }
        );

        if (
          response?.status ===
          429
        ) {
          return res.status(429).json({
            error:
              "خدمة الذكاء الاصطناعي مشغولة حاليًا. حاول مرة أخرى بعد قليل.",

            code:
              "AI_RATE_LIMITED"
          });
        }

        if (
          response?.status ===
          401 ||
          response?.status ===
          403
        ) {
          return res.status(503).json({
            error:
              "خدمة الذكاء الاصطناعي غير مهيأة بشكل صحيح."
          });
        }

        return res.status(502).json({
          error:
            "تعذر معالجة السيرة الذاتية حاليًا. حاول مرة أخرى."
        });
      }

      /* =====================================================
         GEMINI RESULT
      ===================================================== */

      const rawResult =
        data
          ?.candidates?.[0]
          ?.content?.parts
          ?.map(part =>
            typeof part?.text ===
            "string"
              ? part.text
              : ""
          )
          .join("")
          .trim();

      if (!rawResult) {
        console.error(
          "Gemini returned no text"
        );

        return res.status(502).json({
          error:
            "لم يتم الحصول على نتيجة من Gemini."
        });
      }

      const parsedResult =
        parseGeminiResult(
          rawResult
        );

      if (!parsedResult) {
        console.error(
          "Gemini returned invalid JSON"
        );

        return res.status(502).json({
          error:
            "تعذر قراءة نتيجة الذكاء الاصطناعي."
        });
      }

      /* =====================================================
         CONSUME USAGE AFTER SUCCESSFUL GEMINI RESULT
      ===================================================== */

      const usingPaidCredit =
        successfulUses >=
        FREE_AI_USES;

      if (usingPaidCredit) {
        try {
          const creditUsed =
            await supabaseRequest(
              "rpc/use_ai_credit",
              {
                method: "POST",

                headers: {
                  Prefer:
                    "return=representation"
                },

                body:
                  JSON.stringify({
                    p_user_id:
                      cleanUserId
                  })
              }
            );

          /*
            The RPC must return true when
            exactly one credit was consumed.

            If there is no credit, do not
            count the AI result as successful.
          */

          if (
            creditUsed !== true
          ) {
            console.error(
              "Paid AI credit could not be consumed:",
              creditUsed
            );

            return res.status(402).json({
              error:
                "لا يوجد رصيد كافٍ للمتابعة. اختر خطة للمتابعة.",

              code:
                "PAYMENT_REQUIRED",

              requiresPayment:
                true
            });
          }

        } catch (creditError) {
          console.error(
            "Failed to consume paid AI credit:",
            creditError
          );

          return res.status(503).json({
            error:
              "تعذر خصم رصيد الذكاء الاصطناعي. حاول مرة أخرى."
          });
        }

      } else {
        /*
          First two successful uses are free.
        */

        try {
          await saveUsage(
            identities
          );

        } catch (usageError) {
          console.error(
            "Failed to save AI usage:",
            usageError
          );

          return res.status(503).json({
            error:
              "تعذر تسجيل العملية حاليًا. حاول مرة أخرى."
          });
        }
      }

      /* =====================================================
         RESPONSE
      ===================================================== */

      const newUsageCount =
        successfulUses + 1;

      /*
        If this was a paid request,
        keep the actual free-use count
        unchanged.
      */

      const returnedFreeUses =
        usingPaidCredit
          ? successfulUses
          : newUsageCount;

      return res.status(200).json({
        result:
          JSON.stringify(
            parsedResult
          ),

        freeUses:
          returnedFreeUses,

        freeUsesRemaining:
          Math.max(
            0,
            FREE_AI_USES -
              returnedFreeUses
          ),

        paid:
          usingPaidCredit,

        paidCreditsRemaining:
          usingPaidCredit
            ? Math.max(
                0,
                paidCredits - 1
              )
            : paidCredits,

        requiresPayment:
          usingPaidCredit
            ? paidCredits - 1 <= 0
            : newUsageCount >=
              FREE_AI_USES
      });

    } catch (error) {
      console.error(
        "Server error:",
        error?.message ||
          error
      );

      return res.status(500).json({
        error:
          "حدث خطأ غير متوقع في الخادم."
      });
    }
  }
);

/* =========================================================
   CORS / ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error?.message ===
      "Origin not allowed"
    ) {
      return res.status(403).json({
        error:
          "Origin not allowed."
      });
    }

    console.error(
      "Unhandled middleware error:",
      error
    );

    return res.status(500).json({
      error:
        "حدث خطأ غير متوقع في الخادم."
    });
  }
);

/* =========================================================
   VERCEL
========================================================= */

export default app;
