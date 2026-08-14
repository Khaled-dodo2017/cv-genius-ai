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

app.use(express.json({ limit: "100kb" }));

/* =========================================================
   UPSTASH REDIS
========================================================= */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error("Upstash Redis environment variables are missing");
  }

  const response = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Redis error ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

/* =========================================================
   HELPERS
========================================================= */

function hash(value) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]
      ?.toString()
      .split(",")[0]
      .trim() ||
    req.ip ||
    "unknown"
  );
}

function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}

/* =========================================================
   RATE LIMIT
========================================================= */

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const rateLimitStore = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = getClientIp(req);

  const current = rateLimitStore.get(ip);

  if (
    !current ||
    now - current.start >= RATE_LIMIT_WINDOW_MS
  ) {
    rateLimitStore.set(ip, {
      start: now,
      count: 1
    });

    return next();
  }

  current.count += 1;

  if (current.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (RATE_LIMIT_WINDOW_MS -
        (now - current.start)) /
        1000
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
   EXTRACT EMAIL
========================================================= */

function extractEmail(text) {
  const match = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  return match ? normalizeEmail(match[0]) : "";
}

/* =========================================================
   USER USAGE
========================================================= */

/*
  كل مستخدم لديه:

  freeUses
  plan
  paid
  monthly
  lifetime

  أول استعمال  -> مجاني
  ثاني استعمال -> مجاني
  بعد ذلك      -> الدفع
*/

async function getUsage(userKey) {
  const key = `cvgenius:user:${userKey}`;

  const result = await redis([
    "GET",
    key
  ]);

  if (!result.result) {
    return {
      freeUses: 0,
      plan: "free",
      paid: false
    };
  }

  try {
    return JSON.parse(result.result);
  } catch {
    return {
      freeUses: 0,
      plan: "free",
      paid: false
    };
  }
}

async function saveUsage(userKey, usage) {
  const key = `cvgenius:user:${userKey}`;

  await redis([
    "SET",
    key,
    JSON.stringify(usage)
  ]);
}

/* =========================================================
   USER ID
========================================================= */

function getUserIdentity(req, text) {
  /*
    الأفضل لاحقًا أن يأتي userId من نظام الحسابات.

    حاليًا نستخدم عدة إشارات:
    - userId القادم من Frontend
    - البريد الموجود في CV
    - IP

    ويتم تخزين hash فقط.
  */

  const suppliedUserId =
    typeof req.body?.userId === "string"
      ? req.body.userId.trim()
      : "";

  const email = extractEmail(text);

  const ip = getClientIp(req);

  const identityParts = [
    suppliedUserId,
    email,
    ip
  ].filter(Boolean);

  return hash(
    identityParts.join("|")
  );
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "CV Genius AI Backend",
    status: "running"
  });
});

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

      if (typeof text !== "string") {
        return res.status(400).json({
          error:
            "نص السيرة الذاتية غير صالح."
        });
      }

      const cleanText = text.trim();

      if (!cleanText) {
        return res.status(400).json({
          error:
            "لم يتم إرسال نص السيرة الذاتية."
        });
      }

      if (cleanText.length > 15000) {
        return res.status(413).json({
          error:
            "السيرة الذاتية طويلة جدًا. اختصر النص وحاول مرة أخرى."
        });
      }

      /* -----------------------------------------------------
         LANGUAGE
      ----------------------------------------------------- */

      const allowedLanguages = new Set([
        "ar",
        "fr",
        "en"
      ]);

      if (!allowedLanguages.has(language)) {
        return res.status(400).json({
          error:
            "لغة غير مدعومة."
        });
      }

      /* -----------------------------------------------------
         API KEY
      ----------------------------------------------------- */

      const apiKey =
        process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error(
          "GEMINI_API_KEY is missing"
        );

        return res.status(500).json({
          error:
            "خدمة الذكاء الاصطناعي غير متاحة حاليًا."
        });
      }

      /* -----------------------------------------------------
         IDENTITY
      ----------------------------------------------------- */

      const userKey =
        getUserIdentity(
          req,
          cleanText
        );

      /* -----------------------------------------------------
         USAGE CHECK
      ----------------------------------------------------- */

      const usage =
        await getUsage(userKey);

      /*
        إذا كان المستخدم مدفوعًا:
        يسمح له باستخدام AI.
      */

      if (!usage.paid) {
        /*
          بعد استعمالين مجانيين:
          لا نرسل الطلب إلى Gemini.
        */

        if (usage.freeUses >= 2) {
          return res.status(402).json({
            error:
              "لقد أكملت الاستعمالين المجانيين. اختر خطة للمتابعة.",
            code:
              "PAYMENT_REQUIRED",
            freeUses:
              usage.freeUses,
            requiresPayment:
              true,
            plans: [
              "monthly",
              "lifetime"
            ]
          });
        }
      }

      /* -----------------------------------------------------
         LANGUAGE INSTRUCTION
      ----------------------------------------------------- */

      const languageInstruction = {
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
        attempt <= maxAttempts;
        attempt++
      ) {
        try {
          response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                "x-goog-api-key":
                  apiKey
              },

              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: prompt
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
        } catch (networkError) {
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
                1000 * attempt
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
         COUNT SUCCESSFUL AI USE
      ===================================================== */

      /*
        مهم:
        لا نحتسب المحاولة إذا فشل Gemini.

        نحتسب فقط بعد الحصول على
        نتيجة ناجحة.
      */

      if (!usage.paid) {
        usage.freeUses += 1;

        await saveUsage(
          userKey,
          usage
        );
      }

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.status(200).json({
        result:
          String(result).trim(),

        freeUses:
          usage.freeUses,

        freeUsesRemaining:
          usage.paid
            ? null
            : Math.max(
                0,
                2 -
                  usage.freeUses
              ),

        paid:
          usage.paid,

        requiresPayment:
          !usage.paid &&
          usage.freeUses >= 2
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
