import { APP_CONFIG } from "../config/settings.js";

const ensureAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/auth/sign-in");
    }
    next();
};

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

export { ensureAuth, ensureRole, redirectIfAuthenticated, noCacheAuth, setSessionLocals };
