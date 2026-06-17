import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    applyTemplateService: {
        applyTemplate: vi.fn(),
    },
}));

import { applyTemplateService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const updatedGroup = { _id: "g1", categories: [{ name: "Fruits" }], products: [{ name: "Apples" }] };

describe("POST /api/apply-template", () => {
    it("returns 200 with updated group on success (auth required)", async () => {
        applyTemplateService.applyTemplate.mockResolvedValue(updatedGroup);
        const res = await request(app)
            .post("/api/apply-template")
            .set("Cookie", "auth=any")
            .send({ templateId: "t1", groupId: "g1" });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(updatedGroup);
        expect(applyTemplateService.applyTemplate).toHaveBeenCalledWith({ templateId: "t1", groupId: "g1" });
    });

    it("returns 409 with conflict list when products are in use", async () => {
        const err = Object.assign(new Error("conflict"), { status: 409, conflicts: ["OldProduct"] });
        applyTemplateService.applyTemplate.mockRejectedValue(err);
        const res = await request(app)
            .post("/api/apply-template")
            .set("Cookie", "auth=any")
            .send({ templateId: "t1", groupId: "g1" });
        expect(res.status).toBe(409);
        expect(res.body.message).toBe("conflict");
        expect(res.body.conflicts).toEqual(["OldProduct"]);
    });

    it("returns 404 when template not found", async () => {
        applyTemplateService.applyTemplate.mockRejectedValue(Object.assign(new Error("Template not found"), { status: 404 }));
        const res = await request(app)
            .post("/api/apply-template")
            .set("Cookie", "auth=any")
            .send({ templateId: "missing", groupId: "g1" });
        expect(res.status).toBe(404);
    });

    it("returns 404 when group not found", async () => {
        applyTemplateService.applyTemplate.mockRejectedValue(Object.assign(new Error("Group not found"), { status: 404 }));
        const res = await request(app)
            .post("/api/apply-template")
            .set("Cookie", "auth=any")
            .send({ templateId: "t1", groupId: "missing" });
        expect(res.status).toBe(404);
    });
});
