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

const IDENTITY_HASH_SECRET =
  process.env.IDENTITY_HASH_SECRET?.trim();

/* =========================================================
   PLISIO
========================================================= */

const PLISIO_SECRET_KEY =
  process.env.PLISIO_SECRET_KEY?.trim();

const PLISIO_MONTHLY_AMOUNT =
  process.env.PLISIO_MONTHLY_AMOUNT?.trim();

const PLISIO_ONE_TIME_AMOUNT =
  process.env.PLISIO_ONE_TIME_AMOUNT?.trim();

const PLISIO_MONTHLY_CREDITS = 30;

const PLISIO_ONE_TIME_CREDITS = 60;

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
      "Authorization",
      "apikey",
      "x-client-info"
    ],

    optionsSuccessStatus: 204
  })
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
   AI CONFIGURATION VALIDATION
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
   RPC RESULT HELPER
========================================================= */

function rpcReturnedTrue(result) {
  if (result === true) {
    return true;
  }

  if (
    Array.isArray(result) &&
    result.length > 0
  ) {
    if (result[0] === true) {
      return true;
    }

    if (
      result[0] &&
      typeof result[0] === "object"
    ) {
      return Object.values(
        result[0]
      ).includes(true);
    }
  }

  if (
    result &&
    typeof result === "object"
  ) {
    return Object.values(
      result
    ).includes(true);
  }

  return false;
}

/* =========================================================
   PLISIO CREATE INVOICE
========================================================= */

app.post(
  "/api/create-plisio-invoice",
  async (req, res) => {
    try {
      if (!PLISIO_SECRET_KEY) {
        console.error(
          "PLISIO_SECRET_KEY is missing"
        );

        return res.status(503).json({
          error:
            "Payment service is not configured."
        });
      }

      const authHeader =
        req.headers.authorization || "";

      if (
        !authHeader.startsWith(
          "Bearer "
        )
      ) {
        return res.status(401).json({
          error:
            "Unauthorized"
        });
      }

      const accessToken =
        authHeader
          .slice(7)
          .trim();

      if (!accessToken) {
        return res.status(401).json({
          error:
            "Unauthorized"
        });
      }

      const userResponse =
        await fetch(
          `${SUPABASE_URL}/auth/v1/user`,
          {
            method: "GET",

            headers: {
              apikey:
                SUPABASE_SERVICE_ROLE_KEY,

              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );

      if (!userResponse.ok) {
        return res.status(401).json({
          error:
            "Invalid authentication"
        });
      }

      const user =
        await userResponse.json();

      if (!user?.id) {
        return res.status(401).json({
          error:
            "Invalid user"
        });
      }

      const {
        plan
      } = req.body || {};

      let sourceAmount;

      let credits;

      if (
        plan ===
        "monthly"
      ) {
        sourceAmount =
          PLISIO_MONTHLY_AMOUNT;

        credits =
          PLISIO_MONTHLY_CREDITS;

      } else if (
        plan ===
        "one-time"
      ) {
        sourceAmount =
          PLISIO_ONE_TIME_AMOUNT;

        credits =
          PLISIO_ONE_TIME_CREDITS;

      } else {
        console.error(
          "Invalid payment plan received:",
          plan
        );

        return res.status(400).json({
          error:
            "Invalid payment plan."
        });
      }

      if (
        !sourceAmount ||
        !Number.isFinite(
          Number(sourceAmount)
        ) ||
        Number(sourceAmount) <= 0
      ) {
        return res.status(503).json({
          error:
            "Payment amount is not configured."
        });
      }

      const orderNumber =
        `CVG-${user.id}-${Date.now()}`;

      const callbackUrl =
        "https://cv-genius-ai-eight.vercel.app/api/webhook-plisio?json=true";

      const successUrl =
        "https://cv-genius-ai-eight.vercel.app/success";

      const failedUrl =
        "https://cv-genius-ai-eight.vercel.app/failed";

      const params =
        new URLSearchParams({
          source_currency:
            "USD",

          source_amount:
            String(
              sourceAmount
            ),

          currency:
            "USDT_BSC",

          allowed_psys_cids:
            "USDT_BSC",

          order_number:
            orderNumber,

          order_name:
            plan ===
            "monthly"
              ? "CV Genius Monthly"
              : "CV Genius One-Time",

          description:
            `CV Genius ${plan} - ${credits} AI credits`,

          callback_url:
            callbackUrl,

          success_callback_url:
            `${successUrl}?json=true`,

          fail_callback_url:
            `${failedUrl}?json=true`,

          success_invoice_url:
            successUrl,

          fail_invoice_url:
            failedUrl,

          expire_min:
            "30",

          api_key:
            PLISIO_SECRET_KEY
        });

      const response =
        await fetch(
          `https://api.plisio.net/api/v1/invoices/new?${params.toString()}`,
          {
            method: "GET"
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        data?.status !==
          "success"
      ) {
        console.error(
          "Plisio invoice creation failed:",
          data
        );

        return res.status(502).json({
          error:
            "Failed to create payment invoice."
        });
      }

      const invoiceUrl =
        data?.data?.invoice_url;

      if (!invoiceUrl) {
        console.error(
          "Plisio returned no invoice URL:",
          data
        );

        return res.status(502).json({
          error:
            "Payment invoice URL was not returned."
        });
      }

      console.log(
        "Plisio invoice created:",
        {
          userId:
            user.id,

          plan,

          credits,

          orderNumber,

          txnId:
            data?.data?.txn_id
        }
      );

      return res.status(200).json({
        success:
          true,

        invoiceUrl,

        transactionId:
          data?.data?.txn_id,

        orderNumber,

        plan
      });

    } catch (error) {
      console.error(
        "Create Plisio invoice error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to create payment invoice."
      });
    }
  }
);

/* =========================================================
   PLISIO CALLBACK SIGNATURE
========================================================= */

function verifyPlisioCallback(
  data
) {
  if (
    !data ||
    typeof data !==
      "object" ||
    !data.verify_hash ||
    !PLISIO_SECRET_KEY
  ) {
    return false;
  }

  const receivedHash =
    String(
      data.verify_hash
    );

  const ordered = {
    ...data
  };

  delete ordered.verify_hash;

  const stringData =
    JSON.stringify(
      ordered
    );

  const expectedHash =
    crypto
      .createHmac(
        "sha1",
        PLISIO_SECRET_KEY
      )
      .update(
        stringData,
        "utf8"
      )
      .digest("hex");

  const expectedBuffer =
    Buffer.from(
      expectedHash,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      receivedHash,
      "utf8"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

/* =========================================================
   PLISIO WEBHOOK
========================================================= */

app.post(
  "/api/webhook-plisio",

  express.json({
    limit:
      "100kb"
  }),

  async (
    req,
    res
  ) => {
    try {
      const data =
        req.body;

      if (
        !verifyPlisioCallback(
          data
        )
      ) {
        console.error(
          "Invalid Plisio callback signature"
        );

        return res.status(401).json({
          error:
            "Invalid Plisio signature."
        });
      }

      console.log(
        "Verified Plisio callback:",
        {
          txnId:
            data?.txn_id,

          orderNumber:
            data?.order_number,

          status:
            data?.status,

          amount:
            data?.amount,

          currency:
            data?.currency
        }
      );

      if (
        data?.status !==
        "completed"
      ) {
        return res.status(200).json({
          ok:
            true,

          received:
            true,

          status:
            data?.status ||
            null
        });
      }

      const orderNumber =
        typeof data?.order_number ===
        "string"
          ? data.order_number
          : "";

      const match =
        orderNumber.match(
          /^CVG-([0-9a-fA-F-]{36})-(\d+)$/
        );

      if (!match) {
        console.error(
          "Invalid Plisio order number:",
          orderNumber
        );

        return res.status(400).json({
          error:
            "Invalid order number."
        });
      }

      const userId =
        match[1];

      const transactionId =
        typeof data?.txn_id ===
        "string"
          ? data.txn_id
          : "";

      if (!transactionId) {
        return res.status(400).json({
          error:
            "Missing transaction ID."
        });
      }

      const description =
        String(
          data?.order_name ||
          ""
        ).toLowerCase();

      let credits = 0;

      let plan = "";

      if (
        description.includes(
          "monthly"
        )
      ) {
        credits =
          PLISIO_MONTHLY_CREDITS;

        plan =
          "monthly";

      } else if (
        description.includes(
          "one-time"
        )
      ) {
        credits =
          PLISIO_ONE_TIME_CREDITS;

        plan =
          "one-time";
      }

      if (credits <= 0) {
        console.error(
          "Unable to determine Plisio plan:",
          data
        );

        return res.status(400).json({
          error:
            "Unable to determine payment plan."
        });
      }

      const creditResult =
        await supabaseRequest(
          "rpc/grant_paid_credits",
          {
            method:
              "POST",

            headers: {
              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify({
                p_event_id:
                  `plisio:${transactionId}`,

                p_user_id:
                  userId,

                p_credits:
                  credits,

                p_price_id:
                  `plisio_${plan}`
              })
          }
        );

      console.log(
        "Plisio paid credits processed:",
        {
          transactionId,

          userId,

          plan,

          credits,

          result:
            creditResult
        }
      );

      return res.status(200).json({
        ok:
          true,

        received:
          true
      });

    } catch (error) {
      console.error(
        "Plisio webhook error:",
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

function normalizeEmail(
  email
) {
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
    normalized.length ===
      0 ||
    normalized.length >
      254
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
    normalized.length ===
      0 ||
    normalized.length >
      MAX_DEVICE_ID_LENGTH
  ) {
    return "";
  }

  return normalized;
}

function extractEmail(
  text
) {
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

async function checkRateLimit(
  key
) {
  const result =
    await supabaseRequest(
      "rpc/check_rate_limit",
      {
        method:
          "POST",

        headers: {
          Prefer:
            "return=representation"
        },

        body:
          JSON.stringify({
            p_key:
              key,

            p_window_seconds:
              Math.floor(
                RATE_LIMIT_WINDOW_MS /
                  1000
              ),

            p_max_requests:
              RATE_LIMIT_MAX
          })
      }
    );

  const row =
    Array.isArray(result)
      ? result[0]
      : result;

  if (
    !row ||
    typeof row.allowed !==
      "boolean"
  ) {
    throw new Error(
      "Invalid rate limit response"
    );
  }

  return {
    allowed:
      row.allowed,

    retryAfter:
      Number(
        row.retry_after ||
          0
      )
  };
}

async function rateLimit(
  req,
  res,
  next
) {
  try {
    const ip =
      getClientIp(req);

    let key;

    try {
      key =
        hash(
          `rate:${ip}`
        );
    } catch {
      key =
        ip;
    }

    const result =
      await checkRateLimit(
        key
      );

    if (
      !result.allowed
    ) {
      res.set(
        "Retry-After",
        String(
          Math.max(
            1,
            result.retryAfter
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

  } catch (error) {
    console.error(
      "Rate limit error:",
      error
    );

    return res.status(503).json({
      error:
        "تعذر التحقق من حد الطلبات حاليًا. حاول مرة أخرى."
    });
  }
}

/* =========================================================
   PAID CREDITS
========================================================= */

async function getPaidCredits(
  userId
) {
  const rows =
    await supabaseRequest(
      `paid_credits?select=credits&user_id=eq.${encodeURIComponent(
        userId
      )}&limit=1`,
      {
        method:
          "GET"
      }
    );

  return Number(
    rows?.[0]?.credits ||
      0
  );
}

/* =========================================================
   FREE AI USES
========================================================= */

async function getFreeAiUses(
  userId
) {
  const rows =
    await supabaseRequest(
      `ai_usage?select=uses&user_id=eq.${encodeURIComponent(
        userId
      )}&action=eq.improve-cv&limit=1`,
      {
        method:
          "GET"
      }
    );

  return Number(
    rows?.[0]?.uses ||
      0
  );
}

async function incrementFreeAiUsage(
  accessToken
) {
  if (!accessToken) {
    throw new Error(
      "Access token is missing"
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/increment_ai_usage`,
      {
        method:
          "POST",

        headers: {
          apikey:
            SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json"
        },

        body:
          "{}"
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
      data =
        text;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Failed to increment free AI usage: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return Number(data);
}

/* =========================================================
   PARSE GEMINI RESULT
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
      JSON.parse(
        clean
      );

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
  (
    req,
    res
  ) => {
    res.status(200).json({
      ok:
        true,

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
   PAID CREDITS ENDPOINT
========================================================= */

app.get(
  "/paid-credits",
  async (
    req,
    res
  ) => {
    try {
      const authHeader =
        req.headers.authorization ||
        "";

      if (
        !authHeader.startsWith(
          "Bearer "
        )
      ) {
        return res.status(401).json({
          error:
            "Unauthorized"
        });
      }

      const accessToken =
        authHeader
          .slice(7)
          .trim();

      if (!accessToken) {
        return res.status(401).json({
          error:
            "Unauthorized"
        });
      }

      const userResponse =
        await fetch(
          `${SUPABASE_URL}/auth/v1/user`,
          {
            method:
              "GET",

            headers: {
              apikey:
                SUPABASE_SERVICE_ROLE_KEY,

              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );

      if (
        !userResponse.ok
      ) {
        return res.status(401).json({
          error:
            "Invalid authentication"
        });
      }

      const user =
        await userResponse.json();

      if (!user?.id) {
        return res.status(401).json({
          error:
            "Invalid user"
        });
      }

      const credits =
        await getPaidCredits(
          user.id
        );

      return res.status(200).json({
        credits
      });

    } catch (error) {
      console.error(
        "GET /paid-credits error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to get paid credits"
      });
    }
  }
);

/* =========================================================
   CV IMPROVEMENT
========================================================= */

app.post(
  "/improve-cv",

  async (
    req,
    res
  ) => {
    try {
      if (
        !validateAiConfiguration()
      ) {
        return res.status(503).json({
          error:
            "الخدمة غير متاحة حاليًا."
        });
      }

      const {
        text,
        language = "ar"
      } =
        req.body || {};

      /* =====================================================
         AUTHENTICATE USER
      ===================================================== */

      const authHeader =
        req.headers.authorization ||
        "";

      if (
        !authHeader.startsWith(
          "Bearer "
        )
      ) {
        return res.status(401).json({
          error:
            "جلسة تسجيل الدخول غير صالحة."
        });
      }

      const accessToken =
        authHeader
          .slice(7)
          .trim();

      if (!accessToken) {
        return res.status(401).json({
          error:
            "جلسة تسجيل الدخول غير صالحة."
        });
      }

      const userResponse =
        await fetch(
          `${SUPABASE_URL}/auth/v1/user`,
          {
            method:
              "GET",

            headers: {
              apikey:
                SUPABASE_SERVICE_ROLE_KEY,

              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );

      if (
        !userResponse.ok
      ) {
        return res.status(401).json({
          error:
            "جلسة تسجيل الدخول غير صالحة."
        });
      }

      const authenticatedUser =
        await userResponse.json();

      if (
        !authenticatedUser?.id
      ) {
        return res.status(401).json({
          error:
            "جلسة تسجيل الدخول غير صالحة."
        });
      }

      const cleanUserId =
        authenticatedUser.id;

      /* =====================================================
         VALIDATE INPUT
      ===================================================== */

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

      /* =====================================================
         FREE USAGE
      ===================================================== */

      const successfulUses =
        await getFreeAiUses(
          cleanUserId
        );

      /* =====================================================
         PAID CREDITS
      ===================================================== */

      let paidCredits;

      try {
        paidCredits =
          await getPaidCredits(
            cleanUserId
          );

      } catch (
        creditError
      ) {
        console.error(
          "Failed to read paid credits:",
          creditError
        );

        return res.status(503).json({
          error:
            "تعذر قراءة رصيدك حاليًا. حاول مرة أخرى."
        });
      }

      const usingPaidCredit =
        successfulUses >=
        FREE_AI_USES;

      /* =====================================================
         PAYMENT REQUIRED
      ===================================================== */

      if (
        usingPaidCredit &&
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

          paidCredits,

          requiresPayment:
            true,

          plans: [
            "monthly",
            "one-time"
          ]
        });
      }

      /* =====================================================
         LANGUAGE
      ===================================================== */

      const languageInstruction =
        {
          ar:
            "اكتب النتيجة باللغة العربية.",

          fr:
            "Écrivez le résultat en français.",

          en:
            "Write the result in English."
        }[language];

      /* =====================================================
         PROMPT
      ===================================================== */

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
         GEMINI API
      ===================================================== */

      const maxAttempts = 3;

      let response = null;

      let data = null;

      for (
        let attempt = 1;
        attempt <=
          maxAttempts;
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
          data =
            null;
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
          if (
            attempt <
            maxAttempts
          ) {
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
          ?.map(
            part =>
              typeof part?.text ===
              "string"
                ? part.text
                : ""
          )
          .join("")
          .trim();

      if (!rawResult) {
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
        return res.status(502).json({
          error:
            "تعذر قراءة نتيجة الذكاء الاصطناعي."
        });
      }

      /* =====================================================
         CONSUME CREDIT
      ===================================================== */

      if (usingPaidCredit) {
        let creditUsed;

        console.log(
          "PAID CREDIT DEBUG - BEFORE",
          {
            userId:
              cleanUserId,

            paidCredits,

            successfulUses,

            usingPaidCredit
          }
        );

        try {
          creditUsed =
            await supabaseRequest(
              "rpc/use_ai_credit",
              {
                method:
                  "POST",

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

          console.log(
            "PAID CREDIT DEBUG - RPC RESULT",
            {
              userId:
                cleanUserId,

              creditUsed
            }
          );

        } catch (
          creditError
        ) {
          console.error(
            "Failed to consume paid AI credit:",
            creditError
          );

          return res.status(503).json({
            error:
              "تعذر خصم رصيد الذكاء الاصطناعي. حاول مرة أخرى."
          });
        }

        const creditWasUsed =
          rpcReturnedTrue(
            creditUsed
          );

        console.log(
          "PAID CREDIT DEBUG - PARSED",
          {
            userId:
              cleanUserId,

            creditWasUsed
          }
        );

        if (
          !creditWasUsed
        ) {
          return res.status(402).json({
            error:
              "لا يوجد رصيد كافٍ للمتابعة. اختر خطة للمتابعة.",

            code:
              "PAYMENT_REQUIRED",

            requiresPayment:
              true
          });
        }

      } else {

        /* ---------------------------------------------------
           FIRST TWO SUCCESSFUL USES ARE FREE
        --------------------------------------------------- */

        try {
          await incrementFreeAiUsage(
            accessToken
          );

        } catch (
          usageError
        ) {
          console.error(
            "Failed to increment free AI usage:",
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

      const returnedFreeUses =
        usingPaidCredit
          ? successfulUses
          : newUsageCount;

      const remainingPaidCredits =
        usingPaidCredit
          ? Math.max(
              0,
              paidCredits - 1
            )
          : paidCredits;

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
          remainingPaidCredits,

        requiresPayment:
          usingPaidCredit
            ? remainingPaidCredits <=
              0
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

 