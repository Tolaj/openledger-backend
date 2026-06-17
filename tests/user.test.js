import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    userService: {
        getMe: vi.fn(),
        updateUser: vi.fn(),
    },
}));

import { userService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/users/me", () => {
    it("returns 200 with current user", async () => {
        const user = { _id: "user123", name: "Alice", email: "alice@test.com" };
        userService.getMe.mockResolvedValue(user);

        const res = await request(app).get("/api/users/me").set("Cookie", "auth=any");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(user);
        expect(userService.getMe).toHaveBeenCalledWith("user123");
    });

    it("returns 404 when user not found", async () => {
        userService.getMe.mockRejectedValue(Object.assign(new Error("User not found"), { status: 404 }));

        const res = await request(app).get("/api/users/me").set("Cookie", "auth=any");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });
});

describe("PATCH /api/users/:id", () => {
    it("returns 200 with updated user", async () => {
        const updated = { _id: "user123", onboardingSeen: true };
        userService.updateUser.mockResolvedValue(updated);

        const res = await request(app).patch("/api/users/user123").send({ onboardingSeen: true });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
        expect(userService.updateUser).toHaveBeenCalledWith("user123", { onboardingSeen: true });
    });

    it("returns 404 when user not found", async () => {
        userService.updateUser.mockRejectedValue(Object.assign(new Error("User not found"), { status: 404 }));

        const res = await request(app).patch("/api/users/missing").send({});

        expect(res.status).toBe(404);
    });
});
