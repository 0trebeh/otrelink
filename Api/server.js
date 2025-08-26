import 'dotenv/config';
import app from "./src/index.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running locally at http://localhost:${PORT}`);
});
