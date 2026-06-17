import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "express-handlebars";

import { sessionConfig } from "./middlewares/sessionConfig.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { methodOverride } from "./middlewares/methodOverride.js";
import { setSessionLocals } from "./middlewares/auth.js";
import lastSeen from "./middlewares/lastSeen.js";
import configRoutes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override (PUT/DELETE from HTML forms)
app.use(methodOverride);

// Session
app.use(sessionConfig);

// Per-request middlewares (need session to be set first)
app.use(requestLogger);
app.use(lastSeen);
app.use(setSessionLocals);

// Handlebars
app.engine(
    "handlebars",
    handlebars.engine({
        defaultLayout: "main",
        layoutsDir: path.join(__dirname, "views/layouts"),
        partialsDir: path.join(__dirname, "views/partials"),
        helpers: {
            eq: (a, b) => a === b,
            notEq: (a, b) => a !== b,
            eqStr: (a, b) => String(a) === String(b),
            or: (a, b) => a || b,
            and: (a, b) => a && b,
            not: (a) => !a,
            json: (obj) => JSON.stringify(obj),
        },
    })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Routes
configRoutes(app);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).render("error", {
        title: "Error",
        message: err.message || "Something went wrong.",
    });
});

export default app;
