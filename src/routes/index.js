import usersRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import { ensureAuth, redirectIfAuthenticated, noCacheAuth } from "../middlewares/auth.js";
import { APP_CONFIG } from "../config/settings.js";

const configRoutes = (app) => {
    // Auth views — redirect away if already logged in, no-cache so back button doesn't restore
    app.use("/auth", redirectIfAuthenticated, noCacheAuth, authRoutes);

    // Sign-out is separate so redirectIfAuthenticated doesn't block it
    app.get("/auth/sign-out", (req, res) => {
        req.session.destroy(() => {
            res.clearCookie(APP_CONFIG.sessionName);
            res.redirect("/auth/sign-in");
        });
    });

    // Protected routes
    app.use("/users", ensureAuth, usersRoutes);

    // Home
    app.get("/", (req, res) => {
        res.status(200).render("home", { title: "Home" });
    });

    // 404
    app.use("/{*splat}", (req, res) => {
        res.status(404).render("error", {
            title: "Page Not Found",
            message: "The page you requested could not be found.",
        });
    });
};

export default configRoutes;
