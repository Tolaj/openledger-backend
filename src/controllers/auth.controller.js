import { authService } from "../services/index.js";

const isProd = process.env.NODE_ENV === "production";

const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setAuthCookie = (res, token) => res.cookie("auth", token, cookieOpts);

export const register = async (req, res, next) => {
    try {
        const { token, user } = await authService.register(req.body);
        setAuthCookie(res, token);
        res.status(201).json({ token, user: user.toJSON() });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { token, user } = await authService.login(req.body);
        setAuthCookie(res, token);
        res.json({ token, user: user.toJSON() });
    } catch (err) {
        next(err);
    }
};

export const logout = (req, res) => {
    res.clearCookie("auth", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" });
    res.json({ message: "Logged out" });
};

export const session = (req, res, next) => {
    try {
        const headerToken = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.slice(7)
            : null;
        const user = authService.decodeSession(headerToken || req.cookies?.auth);
        res.json({ user });
    } catch (err) {
        next(err);
    }
};
