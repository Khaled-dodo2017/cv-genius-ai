import express from "express";
import cors from "cors";

const app = express();

/* =========================================================
   BASIC SECURITY
========================================================= */

// السماح فقط بموقع CV Genius AI الحالي
const ALLOWED_ORIGINS = new Set([
  "https://khaled-dodo2017.github.io"
]);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بطلبات الخادم التي لا تحتوي Origin
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

// تقليل حجم الطلبات لمنع إساءة الاستخدام
app.use(express.json({ limit: "100kb" }));

/* =========================================================
   RATE LIMIT
========================================================= */

// حماية أولية من إرسال عدد كبير من الطلبات
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const RATE_LIMIT_MAX = 10; // 10 طلبات

function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || "unknown";

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

    res.set("Retry-After", String(retryAfter));

    return res.status(429).json({
      error:
        "تم تجاوز عدد الطلبات المسموح بها مؤقتًا. حاول لاحقًا."
    });
  }

  return next();
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

app.post("/improve-cv", rateLimit, async (req, res) => {
  try {
    const {
      text,
      language = "ar"
    } = req.body || {};

    /* -------------------------------------------------------
       INPUT VALIDATION
    ------------------------------------------------------- */

    if (typeof text !== "string") {
      return res.status(400).json({
        error: "نص السيرة الذاتية غير صالح."
      });
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return res.status(400).json({
        error: "لم يتم إرسال نص السيرة الذاتية."
      });
    }

    // منع إرسال نصوص ضخمة تستهلك موارد Gemini
    if (cleanText.length > 15000) {
      return res.status(413).json({
        error:
          "السيرة الذاتية طويلة جدًا. اختصر النص وحاول مرة أخرى."
      });
    }

    /* -------------------------------------------------------
       LANGUAGE VALIDATION
    ------------------------------------------------------- */

    const allowedLanguages = new Set([
      "ar",
      "fr",
      "en"
    ]);

    if (!allowedLanguages.has(language)) {
      return res.status(400).json({
        error: "لغة غير مدعومة."
      });
    }

    /* -------------------------------------------------------
       API KEY
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       LANGUAGE
    ------------------------------------------------------- */

    const languageInstruction = {
      ar: "اكتب النتيجة باللغة العربية.",
      fr: "Écrivez le résultat en français.",
      en: "Write the result in English."
    }[language];

    /* -------------------------------------------------------
       PROMPT
    ------------------------------------------------------- */

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
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
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

        if (attempt === maxAttempts) {
          throw networkError;
        }

        await new Promise(resolve =>
          setTimeout(
            resolve,
            1000 * attempt
          )
        );

        continue;
      }

      data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      // إعادة المحاولة عند الضغط أو تحديد المعدل
      if (
        response.status === 503 ||
        response.status === 429
      ) {
        console.error(
          `Gemini ${response.status} - attempt ${attempt}/${maxAttempts}`
        );

        if (attempt < maxAttempts) {
          const delay =
            1500 *
            Math.pow(
              2,
              attempt - 1
            );

          await new Promise(resolve =>
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

    if (!response || !response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(
        response?.status === 429
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
        ?.content?.parts?.[0]?.text;

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

    return res.status(200).json({
      result:
        String(result).trim()
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
});

/* =========================================================
   VERCEL
========================================================= */

export default app;
