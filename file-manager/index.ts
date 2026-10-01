import express from 'express';
import routes from "./routes/index.route";
const app = express();
import dotenv from "dotenv";
dotenv.config();
const port = process.env.PORT || 4000;

// Kiểm tra sức khỏe cho Docker healthcheck (không qua kiểm tra Referer)
app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", routes);

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});