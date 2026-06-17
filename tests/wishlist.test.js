import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    wishlistService: {
        getAllWishlists: vi.fn(),
        getWishlistById: vi.fn(),
        createWishlist: vi.fn(),
        updateWishlist: vi.fn(),
        deleteWishlist: vi.fn(),
    },
}));

import { wishlistService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const wishlist = { _id: "w1", name: "Holiday Wishlist", date: "2024-12-01", totalPrice: "120.00", items: [] };

describe("GET /api/wishlists", () => {
    it("returns 200 with all wishlists", async () => {
        wishlistService.getAllWishlists.mockResolvedValue([wishlist]);
        const res = await request(app).get("/api/wishlists");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([wishlist]);
    });
});

describe("GET /api/wishlists/:id", () => {
    it("returns 200 with wishlist", async () => {
        wishlistService.getWishlistById.mockResolvedValue(wishlist);
        const res = await request(app).get("/api/wishlists/w1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(wishlist);
    });

    it("returns 404 when not found", async () => {
        wishlistService.getWishlistById.mockRejectedValue(Object.assign(new Error("Wishlist not found"), { status: 404 }));
        const res = await request(app).get("/api/wishlists/missing");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Wishlist not found");
    });
});

describe("POST /api/wishlists", () => {
    it("returns 201 with created wishlist", async () => {
        wishlistService.createWishlist.mockResolvedValue(wishlist);
        const res = await request(app).post("/api/wishlists").send({ name: "Holiday Wishlist", date: "2024-12-01", totalPrice: "120.00", groupId: "g1" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(wishlist);
    });
});

describe("PUT /api/wishlists/:id", () => {
    it("returns 200 with updated wishlist", async () => {
        const updated = { ...wishlist, name: "Birthday Wishlist" };
        wishlistService.updateWishlist.mockResolvedValue(updated);
        const res = await request(app).put("/api/wishlists/w1").send({ name: "Birthday Wishlist" });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Birthday Wishlist");
    });

    it("returns 404 when not found", async () => {
        wishlistService.updateWishlist.mockRejectedValue(Object.assign(new Error("Wishlist not found"), { status: 404 }));
        const res = await request(app).put("/api/wishlists/missing").send({});
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/wishlists/:id", () => {
    it("returns 200 on success", async () => {
        wishlistService.deleteWishlist.mockResolvedValue();
        const res = await request(app).delete("/api/wishlists/w1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Wishlist deleted");
    });

    it("returns 404 when not found", async () => {
        wishlistService.deleteWishlist.mockRejectedValue(Object.assign(new Error("Wishlist not found"), { status: 404 }));
        const res = await request(app).delete("/api/wishlists/missing");
        expect(res.status).toBe(404);
    });
});
