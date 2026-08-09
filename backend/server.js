
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/improve-cv", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "لم يتم إرسال نص السيرة الذاتية"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                
                 text: text
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(500).json({
        error: "حدث خطأ أثناء الاتصال بـ Gemini"
      });
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "لم يتم إنشاء السيرة الذاتية";

    res.json({ result });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "حدث خطأ في الخادم"
    });
  }
});

app.get("/", (req, res) => {
  res.send("CV Genius AI Backend يعمل");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
