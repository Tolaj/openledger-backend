const requestLogger = (req, res, next) => {
    const timestamp = new Date().toUTCString();
    const authStatus = req.session?.user ? `Authenticated (${req.session.user.role || "user"})` : "Guest";
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} — ${authStatus}`);
    next();
};

export { requestLogger };
