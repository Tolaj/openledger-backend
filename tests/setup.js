import { vi } from "vitest";

// Mock auth middleware so protected routes can be tested without a real JWT
vi.mock("../src/middlewares/auth.js", () => ({
    requireAuth: (req, res, next) => {
        req.user = { id: "user123", email: "test@test.com", groupId: "group123" };
        next();
    },
    ensureRole: () => (req, res, next) => next(),
    redirectIfAuthenticated: (req, res, next) => next(),
    noCacheAuth: (req, res, next) => next(),
    setSessionLocals: (req, res, next) => next(),
}));
