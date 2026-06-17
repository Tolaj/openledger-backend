import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    friendService: {
        sendFriendRequest: vi.fn(),
        receiveFriendRequest: vi.fn(),
    },
}));

import { friendService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

describe("POST /api/friends/send", () => {
    it("returns 200 when request is sent", async () => {
        friendService.sendFriendRequest.mockResolvedValue({ message: "Friend request sent" });
        const res = await request(app).post("/api/friends/send").send({ _id: "u1", friendEmail: "bob@test.com" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Friend request sent");
    });

    it("returns 200 with auto-accepted when reverse pending exists", async () => {
        friendService.sendFriendRequest.mockResolvedValue({ message: "Friend request auto-accepted" });
        const res = await request(app).post("/api/friends/send").send({ _id: "u1", friendEmail: "bob@test.com" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Friend request auto-accepted");
    });

    it("returns 400 when friend not found", async () => {
        friendService.sendFriendRequest.mockRejectedValue(Object.assign(new Error("User not found"), { status: 400 }));
        const res = await request(app).post("/api/friends/send").send({ _id: "u1", friendEmail: "nobody@test.com" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("User not found");
    });

    it("returns 400 when sending to self", async () => {
        friendService.sendFriendRequest.mockRejectedValue(Object.assign(new Error("Cannot send friend request to yourself"), { status: 400 }));
        const res = await request(app).post("/api/friends/send").send({ _id: "u1", friendEmail: "self@test.com" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/yourself/);
    });

    it("returns 400 when already friends", async () => {
        friendService.sendFriendRequest.mockRejectedValue(Object.assign(new Error("Already friends"), { status: 400 }));
        const res = await request(app).post("/api/friends/send").send({ _id: "u1", friendEmail: "bob@test.com" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Already friends");
    });

    it("returns 400 when request already pending", async () => {
        friendService.sendFriendRequest.mockRejectedValue(Object.assign(new Error("Friend request already pending"), { status: 400 }));
        const res = await request(app).post("/api/friends/send").send({ _id: "u1", friendEmail: "bob@test.com" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/pending/);
    });
});

describe("POST /api/friends/receive", () => {
    it("returns 200 when request is accepted", async () => {
        friendService.receiveFriendRequest.mockResolvedValue({ message: "Friend request accepted" });
        const res = await request(app).post("/api/friends/receive").send({ userId: "u1", friendId: "u2", action: "ACCEPTED" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Friend request accepted");
    });

    it("returns 200 when request is rejected", async () => {
        friendService.receiveFriendRequest.mockResolvedValue({ message: "Friend request rejected" });
        const res = await request(app).post("/api/friends/receive").send({ userId: "u1", friendId: "u2", action: "REJECTED" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Friend request rejected");
    });

    it("returns 200 when friend is deleted", async () => {
        friendService.receiveFriendRequest.mockResolvedValue({ message: "Friend removed" });
        const res = await request(app).post("/api/friends/receive").send({ userId: "u1", friendId: "u2", action: "DELETE" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Friend removed");
    });

    it("returns 400 when users share a group", async () => {
        friendService.receiveFriendRequest.mockRejectedValue(Object.assign(new Error("Remove friend from shared groups before unfriending"), { status: 400 }));
        const res = await request(app).post("/api/friends/receive").send({ userId: "u1", friendId: "u2", action: "DELETE" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/shared groups/);
    });

    it("returns 400 for invalid action", async () => {
        friendService.receiveFriendRequest.mockRejectedValue(Object.assign(new Error("Invalid action"), { status: 400 }));
        const res = await request(app).post("/api/friends/receive").send({ userId: "u1", friendId: "u2", action: "INVALID" });
        expect(res.status).toBe(400);
    });

    it("returns 404 when user not found", async () => {
        friendService.receiveFriendRequest.mockRejectedValue(Object.assign(new Error("User not found"), { status: 404 }));
        const res = await request(app).post("/api/friends/receive").send({ userId: "missing", friendId: "u2", action: "ACCEPTED" });
        expect(res.status).toBe(404);
    });
});
