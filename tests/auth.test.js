import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    authService: {
        register: vi.fn(),
        login: vi.fn(),
        decodeSession: vi.fn(),
    },
}));

import { authService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/register", () => {
    it("returns 201 with created user", async () => {
        const user = { _id: "u1", name: "Alice", email: "alice@test.com" };
        authService.register.mockResolvedValue(user);

        const res = await request(app).post("/api/auth/register").send({ name: "Alice", email: "alice@test.com", password: "pass" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(user);
    });

    it("returns 400 when service throws a 400 error", async () => {
        authService.register.mockRejectedValue(Object.assign(new Error("Email already in use"), { status: 400 }));

        const res = await request(app).post("/api/auth/register").send({ name: "Alice", email: "alice@test.com", password: "pass" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Email already in use");
    });
});

describe("POST /api/auth/login", () => {
    it("returns 200, sets auth cookie, and returns user", async () => {
        const user = { _id: "u1", email: "alice@test.com", toJSON: () => ({ _id: "u1", email: "alice@test.com" }) };
        authService.login.mockResolvedValue({ token: "jwt-token", user });

        const res = await request(app).post("/api/auth/login").send({ email: "alice@test.com", password: "pass" });

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ email: "alice@test.com" });
        expect(res.headers["set-cookie"]).toBeDefined();
        expect(res.headers["set-cookie"][0]).toMatch(/auth=/);
    });

    it("returns 401 on invalid credentials", async () => {
        authService.login.mockRejectedValue(Object.assign(new Error("Invalid credentials"), { status: 401 }));

        const res = await request(app).post("/api/auth/login").send({ email: "x@x.com", password: "wrong" });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Invalid credentials");
    });
});

describe("POST /api/auth/logout", () => {
    it("returns 200 and clears auth cookie", async () => {
        const res = await request(app).post("/api/auth/logout");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Logged out");
    });
});

describe("GET /api/auth/session", () => {
    it("returns 200 with decoded user when token is valid", async () => {
        const decoded = { id: "u1", email: "alice@test.com" };
        authService.decodeSession.mockReturnValue(decoded);

        const res = await request(app).get("/api/auth/session").set("Cookie", "auth=valid-token");

        expect(res.status).toBe(200);
        expect(res.body.user).toEqual(decoded);
    });

    it("returns 401 when token is missing", async () => {
        authService.decodeSession.mockImplementation(() => {
            throw Object.assign(new Error("No session"), { status: 401 });
        });

        const res = await request(app).get("/api/auth/session");

        expect(res.status).toBe(401);
    });
});
