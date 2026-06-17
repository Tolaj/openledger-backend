import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    cartService: {
        getCart: vi.fn(),
        upsertCart: vi.fn(),
        deleteCart: vi.fn(),
    },
}));

import { cartService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const cart = { _id: "cart1", user: "u1", items: [{ groceryItemId: "p1", unit: 2 }] };

describe("GET /api/carts", () => {
    it("returns 200 with cart", async () => {
        cartService.getCart.mockResolvedValue(cart);
        const res = await request(app).get("/api/carts?userId=u1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(cart);
        expect(cartService.getCart).toHaveBeenCalledWith("u1");
    });

    it("returns empty cart when none exists", async () => {
        cartService.getCart.mockResolvedValue({ items: [] });
        const res = await request(app).get("/api/carts?userId=u1");
        expect(res.status).toBe(200);
        expect(res.body.items).toEqual([]);
    });
});

describe("POST /api/carts", () => {
    it("returns 201 with upserted cart", async () => {
        cartService.upsertCart.mockResolvedValue(cart);
        const res = await request(app).post("/api/carts").send({ userId: "u1", items: [{ groceryItemId: "p1", unit: 2 }] });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(cart);
        expect(cartService.upsertCart).toHaveBeenCalledWith({ userId: "u1", items: [{ groceryItemId: "p1", unit: 2 }] });
    });
});

describe("DELETE /api/carts", () => {
    it("returns 200 on success", async () => {
        cartService.deleteCart.mockResolvedValue();
        const res = await request(app).delete("/api/carts").send({ userId: "u1" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Cart deleted");
        expect(cartService.deleteCart).toHaveBeenCalledWith("u1");
    });
});
