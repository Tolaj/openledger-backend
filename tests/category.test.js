import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    categoryService: {
        getAllCategories: vi.fn(),
        getCategoryById: vi.fn(),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn(),
    },
}));

import { categoryService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const cat = { _id: "c1", name: "Fruits", icon: "🍎", color: "#green" };

describe("GET /api/categories", () => {
    it("returns 200 with all categories", async () => {
        categoryService.getAllCategories.mockResolvedValue([cat]);
        const res = await request(app).get("/api/categories");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([cat]);
    });
});

describe("GET /api/categories/:id", () => {
    it("returns 200 with category", async () => {
        categoryService.getCategoryById.mockResolvedValue(cat);
        const res = await request(app).get("/api/categories/c1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(cat);
    });

    it("returns 404 when not found", async () => {
        categoryService.getCategoryById.mockRejectedValue(Object.assign(new Error("Category not found"), { status: 404 }));
        const res = await request(app).get("/api/categories/missing");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Category not found");
    });
});

describe("POST /api/categories", () => {
    it("returns 201 with created category", async () => {
        categoryService.createCategory.mockResolvedValue(cat);
        const res = await request(app).post("/api/categories").send({ name: "Fruits", groupId: "g1" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(cat);
    });
});

describe("PUT /api/categories/:id", () => {
    it("returns 200 with updated category", async () => {
        const updated = { ...cat, name: "Veggies" };
        categoryService.updateCategory.mockResolvedValue(updated);
        const res = await request(app).put("/api/categories/c1").send({ name: "Veggies" });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Veggies");
    });
});

describe("DELETE /api/categories/:id", () => {
    it("returns 200 on success", async () => {
        categoryService.deleteCategory.mockResolvedValue();
        const res = await request(app).delete("/api/categories/c1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Category deleted");
    });

    it("returns 400 when category is in use", async () => {
        categoryService.deleteCategory.mockRejectedValue(Object.assign(new Error("Category is referenced by one or more products"), { status: 400 }));
        const res = await request(app).delete("/api/categories/c1");
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/referenced/);
    });

    it("returns 404 when not found", async () => {
        categoryService.deleteCategory.mockRejectedValue(Object.assign(new Error("Category not found"), { status: 404 }));
        const res = await request(app).delete("/api/categories/missing");
        expect(res.status).toBe(404);
    });
});
