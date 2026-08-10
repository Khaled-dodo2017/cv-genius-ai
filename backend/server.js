import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "1mb" }));

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

app.post("/improve-cv", async (req, res) => {
  try {
    const { text, language = "ar" } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        error: "لم يتم إرسال نص السيرة الذاتية"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        error: "مفتاح Gemini غير موجود في Environment Variables"
      });
    }

    const languageInstruction = {
      ar: "اكتب النتيجة باللغة العربية.",
      fr: "Écrivez le résultat en français.",
      en: "Write the result in English."
    }[language] || "اكتب النتيجة باللغة العربية.";

    const prompt = `نخير
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

${String(text).trim()}
`;

    /* =====================================================
       GEMINI API
    ===================================================== */

    const response = await fetch(
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
            responseMimeType: "application/json"
          }
        })
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    /* =====================================================
       GEMINI ERROR
    ===================================================== */

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "حدث خطأ أثناء الاتصال بـ Gemini"
      });
    }

    /* =====================================================
       RESULT
    ===================================================== */

    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      console.error(
        "Gemini returned no result:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error: "لم يتم الحصول على نتيجة من Gemini"
      });
    }

    return res.status(200).json({
      result: String(result).trim()
    });

  } catch (error) {

    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "حدث خطأ في الخادم"
    });
  }
});

/* =========================================================
   VERCEL
========================================================= */

export default app;
