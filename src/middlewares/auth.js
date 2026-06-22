import jwt from "jsonwebtoken";
import { APP_CONFIG } from "../config/settings.js";

const ensureRole = (...roles) => (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
        return res.status(403).render("error", {
            title: "Forbidden",
            message: "You do not have permission to access this page.",
        });
    }
    next();
};

const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return res.redirect(APP_CONFIG.afterLoginRedirect);
    }
    next();
};

const noCacheAuth = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "-1");
    next();
};

const setSessionLocals = (req, res, next) => {
    res.locals.user = req.session?.user || null;
    next();
};

const requireAuth = (req, res, next) => {
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null;
    const token = headerToken || req.cookies?.auth;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
};

export { ensureRole, redirectIfAuthenticated, noCacheAuth, setSessionLocals, requireAuth };
