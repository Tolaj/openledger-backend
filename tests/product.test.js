import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    productService: {
        getAllProducts: vi.fn(),
        getProductById: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
    },
}));

import { productService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const product = { _id: "p1", name: "Apples", price: "2.99", unit: "kg", category: { _id: "c1", name: "Fruits" } };

describe("GET /api/products", () => {
    it("returns 200 with all products", async () => {
        productService.getAllProducts.mockResolvedValue([product]);
        const res = await request(app).get("/api/products");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([product]);
    });
});

describe("GET /api/products/:id", () => {
    it("returns 200 with product", async () => {
        productService.getProductById.mockResolvedValue(product);
        const res = await request(app).get("/api/products/p1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(product);
    });

    it("returns 404 when not found", async () => {
        productService.getProductById.mockRejectedValue(Object.assign(new Error("Product not found"), { status: 404 }));
        const res = await request(app).get("/api/products/missing");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Product not found");
    });
});

describe("POST /api/products", () => {
    it("returns 201 with created product", async () => {
        productService.createProduct.mockResolvedValue(product);
        const res = await request(app).post("/api/products").send({ name: "Apples", price: "2.99", unit: "kg", category: "c1", groupId: "g1" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(product);
    });
});

describe("PUT /api/products/:id", () => {
    it("returns 200 with updated product", async () => {
        const updated = { ...product, price: "3.49" };
        productService.updateProduct.mockResolvedValue(updated);
        const res = await request(app).put("/api/products/p1").send({ price: "3.49" });
        expect(res.status).toBe(200);
        expect(res.body.price).toBe("3.49");
    });

    it("returns 404 when not found", async () => {
        productService.updateProduct.mockRejectedValue(Object.assign(new Error("Product not found"), { status: 404 }));
        const res = await request(app).put("/api/products/missing").send({});
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/products/:id", () => {
    it("returns 200 on success", async () => {
        productService.deleteProduct.mockResolvedValue();
        const res = await request(app).delete("/api/products/p1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Product deleted");
    });

    it("returns 400 when product is referenced", async () => {
        productService.deleteProduct.mockRejectedValue(Object.assign(new Error("Product is referenced by wishlists or inventory"), { status: 400 }));
        const res = await request(app).delete("/api/products/p1");
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/referenced/);
    });

    it("returns 404 when not found", async () => {
        productService.deleteProduct.mockRejectedValue(Object.assign(new Error("Product not found"), { status: 404 }));
        const res = await request(app).delete("/api/products/missing");
        expect(res.status).toBe(404);
    });
});
