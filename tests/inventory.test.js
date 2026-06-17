import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    inventoryService: {
        getAllInventory: vi.fn(),
        getInventoryById: vi.fn(),
        upsertInventory: vi.fn(),
        updateInventory: vi.fn(),
        deleteInventory: vi.fn(),
    },
}));

import { inventoryService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const item = { _id: "i1", product: "p1", quantityAvailable: 5, unit: 1, price: 2.99 };

describe("GET /api/inventory", () => {
    it("returns 200 with all inventory", async () => {
        inventoryService.getAllInventory.mockResolvedValue([item]);
        const res = await request(app).get("/api/inventory");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([item]);
    });
});

describe("GET /api/inventory/:id", () => {
    it("returns 200 with item", async () => {
        inventoryService.getInventoryById.mockResolvedValue(item);
        const res = await request(app).get("/api/inventory/i1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(item);
    });

    it("returns 404 when not found", async () => {
        inventoryService.getInventoryById.mockRejectedValue(Object.assign(new Error("Inventory item not found"), { status: 404 }));
        const res = await request(app).get("/api/inventory/missing");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Inventory item not found");
    });
});

describe("POST /api/inventory", () => {
    it("returns 201 with upserted inventory items", async () => {
        inventoryService.upsertInventory.mockResolvedValue([item]);
        const res = await request(app).post("/api/inventory").send({ inventoryData: [{ product: "p1", quantityAvailable: 5, unit: 1, price: 2.99 }], groupId: "g1" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual([item]);
    });

    it("increments quantity when item already exists", async () => {
        const updated = { ...item, quantityAvailable: 10 };
        inventoryService.upsertInventory.mockResolvedValue([updated]);
        const res = await request(app).post("/api/inventory").send({ inventoryData: [{ product: "p1", quantityAvailable: 5 }], groupId: "g1" });
        expect(res.status).toBe(201);
        expect(res.body[0].quantityAvailable).toBe(10);
    });
});

describe("PUT /api/inventory/:id", () => {
    it("returns 200 with updated item", async () => {
        const updated = { ...item, quantityAvailable: 8 };
        inventoryService.updateInventory.mockResolvedValue(updated);
        const res = await request(app).put("/api/inventory/i1").send({ quantityAvailable: 8 });
        expect(res.status).toBe(200);
        expect(res.body.quantityAvailable).toBe(8);
    });

    it("returns 404 when not found", async () => {
        inventoryService.updateInventory.mockRejectedValue(Object.assign(new Error("Inventory item not found"), { status: 404 }));
        const res = await request(app).put("/api/inventory/missing").send({});
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/inventory/:id", () => {
    it("returns 200 on success", async () => {
        inventoryService.deleteInventory.mockResolvedValue();
        const res = await request(app).delete("/api/inventory/i1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Inventory item deleted");
    });

    it("returns 404 when not found", async () => {
        inventoryService.deleteInventory.mockRejectedValue(Object.assign(new Error("Inventory item not found"), { status: 404 }));
        const res = await request(app).delete("/api/inventory/missing");
        expect(res.status).toBe(404);
    });
});
