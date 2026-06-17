import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    groupService: {
        getAllGroups: vi.fn(),
        getGroupById: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
    },
}));

import { groupService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const group = { _id: "g1", name: "Family", members: [] };

describe("GET /api/groups", () => {
    it("returns 200 with all groups", async () => {
        groupService.getAllGroups.mockResolvedValue([group]);
        const res = await request(app).get("/api/groups");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([group]);
    });
});

describe("GET /api/groups/:id", () => {
    it("returns 200 with group", async () => {
        groupService.getGroupById.mockResolvedValue(group);
        const res = await request(app).get("/api/groups/g1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(group);
    });

    it("returns 404 when not found", async () => {
        groupService.getGroupById.mockRejectedValue(Object.assign(new Error("Group not found"), { status: 404 }));
        const res = await request(app).get("/api/groups/missing");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Group not found");
    });
});

describe("POST /api/groups", () => {
    it("returns 201 with created group", async () => {
        groupService.createGroup.mockResolvedValue(group);
        const res = await request(app).post("/api/groups").send({ name: "Family", members: ["u1"], userId: "u2" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(group);
    });
});

describe("PUT /api/groups/:id", () => {
    it("returns 200 with updated group", async () => {
        const updated = { ...group, name: "Updated" };
        groupService.updateGroup.mockResolvedValue(updated);
        const res = await request(app).put("/api/groups/g1").send({ name: "Updated" });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Updated");
    });

    it("returns 404 when not found", async () => {
        groupService.updateGroup.mockRejectedValue(Object.assign(new Error("Group not found"), { status: 404 }));
        const res = await request(app).put("/api/groups/missing").send({});
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/groups/:id", () => {
    it("returns 200 on success", async () => {
        groupService.deleteGroup.mockResolvedValue();
        const res = await request(app).delete("/api/groups/g1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Group deleted");
    });

    it("returns 404 when not found", async () => {
        groupService.deleteGroup.mockRejectedValue(Object.assign(new Error("Group not found"), { status: 404 }));
        const res = await request(app).delete("/api/groups/missing");
        expect(res.status).toBe(404);
    });
});
