import { authService } from "../services/index.js";

export const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { token, user } = await authService.login(req.body);
        res.cookie("auth", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ user: user.toJSON() });
    } catch (err) {
        next(err);
    }
};

export const logout = (req, res) => {
    res.clearCookie("auth", { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ message: "Logged out" });
};

export const session = (req, res, next) => {
    try {
        const user = authService.decodeSession(req.cookies?.auth);
        res.json({ user });
    } catch (err) {
        next(err);
    }
};
