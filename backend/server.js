import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/improve-cv", (req, res) => {
  const { text } = req.body;

  const improved = `
${text}

صياغة محسّنة:
محترف لديه خبرة في المجال، يمتلك مهارات في التواصل والعمل ضمن فريق، ويسعى لتقديم قيمة مضافة وتحقيق أهداف المؤسسة.
`;

  res.json({ result: improved });
});

app.get("/", (req, res) => {
  res.send("CV Genius AI Backend يعمل");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
