import express from "express";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middlewares/requestLogger.js";
import configRoutes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

configRoutes(app);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
