import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    templateService: {
        getTemplates: vi.fn(),
        createTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
    },
}));

import { templateService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const template = { _id: "t1", name: "Basic Grocery", isSystem: true, categories: [], products: [] };
const customTemplate = { _id: "t2", name: "My List", isSystem: false, createdBy: "user123" };

describe("GET /api/templates", () => {
    it("returns 200 with system and user templates", async () => {
        templateService.getTemplates.mockResolvedValue([template, customTemplate]);
        const res = await request(app).get("/api/templates").set("Cookie", "auth=any");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });

    it("passes userId from query param to service when not authenticated", async () => {
        templateService.getTemplates.mockResolvedValue([template]);
        await request(app).get("/api/templates?userId=user123");
        expect(templateService.getTemplates).toHaveBeenCalledWith("user123");
    });
});

describe("POST /api/templates", () => {
    it("returns 201 with created template (auth required)", async () => {
        templateService.createTemplate.mockResolvedValue(customTemplate);
        const res = await request(app).post("/api/templates").set("Cookie", "auth=any").send({ name: "My List" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(customTemplate);
        expect(templateService.createTemplate).toHaveBeenCalledWith({ name: "My List" }, "user123");
    });
});

describe("DELETE /api/templates/:id", () => {
    it("returns 200 on success (auth required)", async () => {
        templateService.deleteTemplate.mockResolvedValue();
        const res = await request(app).delete("/api/templates/t2").set("Cookie", "auth=any");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Template deleted");
        expect(templateService.deleteTemplate).toHaveBeenCalledWith("t2", "user123");
    });

    it("returns 403 when not owner or system template", async () => {
        templateService.deleteTemplate.mockRejectedValue(Object.assign(new Error("Forbidden"), { status: 403 }));
        const res = await request(app).delete("/api/templates/t1").set("Cookie", "auth=any");
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Forbidden");
    });

    it("returns 404 when not found", async () => {
        templateService.deleteTemplate.mockRejectedValue(Object.assign(new Error("Template not found"), { status: 404 }));
        const res = await request(app).delete("/api/templates/missing").set("Cookie", "auth=any");
        expect(res.status).toBe(404);
    });
});
