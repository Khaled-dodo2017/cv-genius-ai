import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

/* =========================================================
   BASIC SECURITY
========================================================= */

const ALLOWED_ORIGINS = new Set([
  "https://khaled-dodo2017.github.io",
  "https://cv-genius-ai-eight.vercel.app"
]);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // يسمح بطلبات الخادم مثل Paddle Webhooks
      // التي لا تحتوي على Origin
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
      "Content-Type"
    ],

    optionsSuccessStatus: 204
  })
);

/* =========================================================
   PADDLE WEBHOOK
   IMPORTANT:
   This MUST come before express.json()
========================================================= */

app.post(
  "/paddle-webhook",
  express.raw({
    type: "application/json"
  }),
  async (req, res) => {
    try {
      console.log(
        "Paddle webhook request received"
      );

      /* -----------------------------------------------------
         WEBHOOK SECRET
      ----------------------------------------------------- */

      const webhookSecret =
        process.env.PADDLE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error(
          "PADDLE_WEBHOOK_SECRET is missing"
        );

        return res.status(500).json({
          error:
            "Paddle webhook secret is missing"
        });
      }

      /* -----------------------------------------------------
         SIGNATURE HEADER
      ----------------------------------------------------- */

      const paddleSignature =
        req.headers["paddle-signature"];

      if (!paddleSignature) {
        console.error(
          "Paddle-Signature header is missing"
        );

        return res.status(400).json({
          error:
            "Missing Paddle-Signature"
        });
      }

      /* -----------------------------------------------------
         RAW BODY
      ----------------------------------------------------- */

      if (!Buffer.isBuffer(req.body)) {
        console.error(
          "Paddle webhook body is not raw"
        );

        return res.status(400).json({
          error:
            "Invalid webhook body"
        });
      }

      const rawBody =
        req.body.toString("utf8");

      /* -----------------------------------------------------
         PARSE PADDLE SIGNATURE
         
         Example:
         ts=1750000000;h1=abcdef...
      ----------------------------------------------------- */

      const signatureParts =
        String(paddleSignature)
          .split(";");

      let timestamp = "";
      let receivedSignature = "";

      for (
        const part of signatureParts
      ) {
        const separatorIndex =
          part.indexOf("=");

        if (
          separatorIndex === -1
        ) {
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

        if (key === "h1") {
          receivedSignature = value;
        }
      }

      if (
        !timestamp ||
        !receivedSignature
      ) {
        console.error(
          "Invalid Paddle-Signature format"
        );

        return res.status(400).json({
          error:
            "Invalid Paddle-Signature"
        });
      }

      /* -----------------------------------------------------
         TIMESTAMP VALIDATION
      ----------------------------------------------------- */

      const timestampNumber =
        Number(timestamp);

      if (
        !Number.isFinite(
          timestampNumber
        )
      ) {
        console.error(
          "Invalid Paddle timestamp"
        );

        return res.status(400).json({
          error:
            "Invalid webhook timestamp"
        });
      }

      const currentTimestamp =
        Math.floor(
          Date.now() / 1000
        );

      const timestampDifference =
        Math.abs(
          currentTimestamp -
            timestampNumber
        );

      /*
        Reject very old webhook requests.
        This protects against replay attacks.
      */

      const WEBHOOK_TOLERANCE_SECONDS =
        5 * 60;

      if (
        timestampDifference >
        WEBHOOK_TOLERANCE_SECONDS
      ) {
        console.error(
          "Paddle webhook timestamp expired"
        );

        return res.status(408).json({
          error:
            "Webhook timestamp expired"
        });
      }

      /* -----------------------------------------------------
         BUILD SIGNED PAYLOAD
         
         Paddle signs:
         
         timestamp + ":" + rawBody
      ----------------------------------------------------- */

      const signedPayload =
        `${timestamp}:${rawBody}`;

      /* -----------------------------------------------------
         CREATE EXPECTED HMAC
      ----------------------------------------------------- */

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            webhookSecret
          )
          .update(
            signedPayload,
            "utf8"
          )
          .digest("hex");

      /* -----------------------------------------------------
         SAFE SIGNATURE COMPARISON
      ----------------------------------------------------- */

      const expectedBuffer =
        Buffer.from(
          expectedSignature,
          "utf8"
        );

      const receivedBuffer =
        Buffer.from(
          receivedSignature,
          "utf8"
        );

      if (
        expectedBuffer.length !==
        receivedBuffer.length
      ) {
        console.error(
          "Paddle signature length mismatch"
        );

        return res.status(401).json({
          error:
            "Invalid Paddle signature"
        });
      }

      const signatureValid =
        crypto.timingSafeEqual(
          expectedBuffer,
          receivedBuffer
        );

      if (!signatureValid) {
        console.error(
          "Invalid Paddle webhook signature"
        );

        return res.status(401).json({
          error:
            "Invalid Paddle signature"
        });
      }

      /* -----------------------------------------------------
         SIGNATURE VERIFIED
      ----------------------------------------------------- */

      console.log(
        "Paddle webhook signature verified"
      );

      /* -----------------------------------------------------
         PARSE EVENT
      ----------------------------------------------------- */

      let event;

      try {
        event =
          JSON.parse(rawBody);
      } catch (error) {
        console.error(
          "Invalid Paddle webhook JSON:",
          error
        );

        return res.status(400).json({
          error:
            "Invalid webhook JSON"
        });
      }

      /* -----------------------------------------------------
         EVENT INFORMATION
      ----------------------------------------------------- */

      console.log(
        "========================================"
      );

      console.log(
        "PADDLE WEBHOOK VERIFIED"
      );

      console.log(
        "Event ID:",
        event?.event_id
      );

      console.log(
        "Event Type:",
        event?.event_type
      );

      console.log(
        "Occurred At:",
        event?.occurred_at
      );

      console.log(
        "Transaction ID:",
        event?.data?.id
      );

      console.log(
        "Customer ID:",
        event?.data?.customer_id
      );

      console.log(
        "Subscription ID:",
        event?.data?.subscription_id
      );

      console.log(
        "========================================"
      );

      /* =====================================================
         TRANSACTION COMPLETED
      ===================================================== */

      if (
        event?.event_type ===
        "transaction.completed"
      ) {
        console.log(
          "PADDLE PAYMENT COMPLETED"
        );

        console.log(
          "Transaction:",
          event?.data?.id
        );

        /*
          IMPORTANT:
          We are NOT granting paid usage yet.

          First we verify that the webhook works correctly.

          After successful testing we will connect this event
          to Supabase and grant:

          $4.99  -> 30 uses
          $9.99  -> 60 uses
        */
      }

      /* =====================================================
         SUBSCRIPTION EVENTS
      ===================================================== */

      if (
        event?.event_type ===
        "subscription.created"
      ) {
        console.log(
          "PADDLE SUBSCRIPTION CREATED"
        );

        console.log(
          "Subscription:",
          event?.data?.id
        );
      }

      if (
        event?.event_type ===
        "subscription.updated"
      ) {
        console.log(
          "PADDLE SUBSCRIPTION UPDATED"
        );

        console.log(
          "Subscription:",
          event?.data?.id
        );
      }

      if (
        event?.event_type ===
        "subscription.canceled"
      ) {
        console.log(
          "PADDLE SUBSCRIPTION CANCELED"
        );

        console.log(
          "Subscription:",
          event?.data?.id
        );
      }

      /* -----------------------------------------------------
         SUCCESS RESPONSE
      ----------------------------------------------------- */

      return res.status(200).json({
        success: true
      });

    } catch (error) {
      console.error(
        "Paddle webhook error:",
        error
      );

      return res.status(500).json({
        error:
          "Paddle webhook processing failed"
      });
    }
  }
);

/* =========================================================
   JSON BODY
   MUST COME AFTER PADDLE WEBHOOK
========================================================= */

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
    .update(
      String(value)
    )
    .digest("hex");
}

function getClientIp(req) {
  const forwarded =
    req.headers[
      "x-forwarded-for"
    ];

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

function normalizeDeviceId(
  deviceId
) {
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
          (
            now -
            current.start
          )
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
      `email_hash.eq.${identities.emailHash}`
    );
  }

  if (
    identities.ipHash
  ) {
    conditions.push(
      `ip_hash.eq.${identities.ipHash}`
    );
  }

  if (
    identities.deviceHash
  ) {
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

      body:
        JSON.stringify({
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
  "/improve-cv",
  rateLimit,
  async (req, res) => {
    try {
      const {
        text,
        language = "ar"
      } = req.body || {};

      /* -----------------------------------------------------
         INPUT VALIDATION
      ----------------------------------------------------- */

      if (
        typeof text !== "string"
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
        15000
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
         API KEYS
      ----------------------------------------------------- */

      if (
        !GEMINI_API_KEY
      ) {
        console.error(
          "GEMINI_API_KEY is missing"
        );

        return res.status(500).json({
          error:
            "خدمة الذكاء الاصطناعي غير متاحة حاليًا."
        });
      }

      if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
      ) {
        console.error(
          "Supabase environment variables are missing"
        );

        return res.status(500).json({
          error:
            "خدمة قاعدة البيانات غير متاحة حاليًا."
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

      /* -----------------------------------------------------
         USAGE CHECK
      ----------------------------------------------------- */

      const previousUsage =
        await getPreviousUsage(
          identities
        );

      const successfulUses =
        previousUsage.length;

      /*
        الاستعمال الأول والثاني مجانيان.

        الاستعمال الثالث:
        نوقف Gemini ونطلب الدفع.
      */

      if (
        successfulUses >= 2
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

          requiresPayment:
            true,

          plans: [
            "monthly",
            "lifetime"
          ]
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

مهم جدًا:
- لا تخترع أي معلومات.
- لا تحذف المعلومات الموجودة.
- احتفظ بالاسم والوظيفة والبريد والهاتف والموقع كما هي.
- حسّن صياغة الملخص والخبرة والتعليم والمهارات واللغات فقط.
- أعد JSON فقط.
- لا تستخدم Markdown.
- لا تضف أي شرح خارج JSON.

استخدم هذا الشكل:

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
  "skills": ["مهارة 1", "مهارة 2"],
  "languages": ["لغة 1", "لغة 2"]
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
        attempt <=
        maxAttempts;
        attempt++
      ) {
        try {
          response =
            await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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
                        "application/json"
                    }
                  })
              }
            );
        } catch (
          networkError
        ) {
          console.error(
            `Gemini network error - attempt ${attempt}:`,
            networkError
          );

          if (
            attempt ===
            maxAttempts
          ) {
            throw networkError;
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
            503 ||
          response.status ===
            429
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

          JSON.stringify(
            data,
            null,
            2
          )
        );

        return res.status(
          response?.status ===
            429
            ? 429
            : 502
        ).json({
          error:
            "تعذر معالجة السيرة الذاتية حاليًا. حاول مرة أخرى."
        });
      }

      /* =====================================================
         RESULT
      ===================================================== */

      const result =
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text;

      if (!result) {
        console.error(
          "Gemini returned no result:",

          JSON.stringify(
            data,
            null,
            2
          )
        );

        return res.status(502).json({
          error:
            "لم يتم الحصول على نتيجة من Gemini."
        });
      }

      /* =====================================================
         SAVE SUCCESSFUL USE
      ===================================================== */

      await saveUsage(
        identities
      );

      const newUsageCount =
        successfulUses + 1;

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.status(200).json({
        result:
          String(result).trim(),

        freeUses:
          newUsageCount,

        freeUsesRemaining:
          Math.max(
            0,
            2 -
              newUsageCount
          ),

        paid:
          false,

        requiresPayment:
          newUsageCount >= 3
      });

    } catch (error) {
      console.error(
        "Server error:",
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
   VERCEL
========================================================= */

export default app;
