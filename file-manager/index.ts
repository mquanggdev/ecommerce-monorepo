import express from 'express';
import routes from "./routes/index.route";
const app = express();
import dotenv from "dotenv";
dotenv.config();
const port = process.env.PORT || 4000;

app.use("/", routes);

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});