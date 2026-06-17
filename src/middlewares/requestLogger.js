import jwt from "jsonwebtoken";

const requestLogger = (req, res, next) => {
    const timestamp = new Date().toUTCString();
    let authStatus = "Guest";
    const token = req.cookies?.auth;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            authStatus = `Authenticated (${decoded.email})`;
        } catch {
            authStatus = "Invalid token";
        }
    }
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} — ${authStatus}`);
    next();
};

export { requestLogger };
