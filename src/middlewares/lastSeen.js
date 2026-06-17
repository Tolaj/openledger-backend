const lastSeen = (req, res, next) => {
    if (req.session?.user) {
        req.session.lastSeen = Date.now();
    }
    next();
};

export default lastSeen;
