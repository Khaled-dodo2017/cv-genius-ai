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

      return callback(
        new Error("Origin not allowed")
      );
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Paddle-Signature"
    ],

    optionsSuccessStatus: 204
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

const PADDLE_WEBHOOK_SECRET =
  process.env.PADDLE_WEBHOOK_SECRET;

const IDENTITY_HASH_SECRET =
  process.env.IDENTITY_HASH_SECRET ||
  "cv-genius-default-secret-change-this";

/* =========================================================
   PADDLE WEBHOOK SIGNATURE VERIFICATION
========================================================= */

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

  const parts =
    signatureHeader
      .split(";")
      .map(part => part.trim());

  let timestamp = "";
  let signature = "";

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

    if (key === "h1") {
      signature = value;
    }
  }

  if (
    !timestamp ||
    !signature
  ) {
    return false;
  }

  const timestampNumber =
    Number(timestamp);

  if (
    !Number.isFinite(
      timestampNumber
    )
  ) {
    return false;
  }

  /*
    Paddle recommends a short timestamp
    tolerance to protect against replay attacks.
  */

  const now =
    Math.floor(
      Date.now() / 1000
    );

  const age =
    Math.abs(
      now - timestampNumber
    );

  const TIMESTAMP_TOLERANCE_SECONDS =
    5;

  if (
    age >
    TIMESTAMP_TOLERANCE_SECONDS
  ) {
    console.error(
      "Paddle webhook timestamp expired"
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

  const receivedBuffer =
    Buffer.from(
      signature,
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
   PADDLE WEBHOOK
========================================================= */

/*
  مهم جدًا:

  هذا المسار يأتي قبل express.json()
  حتى نحصل على raw body كما أرسله Paddle.

  Paddle-Signature يتم التحقق منه قبل
  قبول الحدث.
*/

app.post(
  "/paddle-webhook",
  express.raw({
    type: "application/json",
    limit: "1mb"
  }),
  async (req, res) => {
    try {
      if (!PADDLE_WEBHOOK_SECRET) {
        console.error(
          "PADDLE_WEBHOOK_SECRET is missing"
        );

        return res.status(503).json({
          error:
            "Paddle webhook secret is not configured."
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
          "Paddle-Signature header is missing"
        );

        return res.status(401).json({
          error:
            "Invalid Paddle signature."
        });
      }

      const rawBody =
        Buffer.isBuffer(req.body)
          ? req.body.toString("utf8")
          : "";

      if (!rawBody) {
        return res.status(400).json({
          error:
            "Empty webhook body."
        });
      }

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

      let event = null;

      try {
        event =
          JSON.parse(
            rawBody
          );
      } catch {
        return res.status(400).json({
          error:
            "Invalid webhook JSON."
        });
      }

      const eventType =
        event?.event_type ||
        event?.type ||
        "unknown";

      const eventId =
        event?.event_id ||
        event?.id ||
        "unknown";

      console.log(
        "Paddle webhook verified:",
        {
          eventType,
          eventId
        }
      );

      /*
        في هذه المرحلة نحن نثبت أن:

        Paddle
           ↓
        Vercel
           ↓
        Backend
           ↓
        Signature verified

        لن نعتبر الدفع ناجحًا هنا بشكل أعمى.
        سنضيف منطق منح الخطة بعد اختبار
        وصول الـWebhook بنجاح.
      */

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
    typeof email !==
      "string"
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
    typeof deviceId !==
      "string"
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
    now -
      current.start >=
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

      if (!GEMINI_API_KEY) {
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
