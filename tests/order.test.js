import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/index.js", () => ({
    orderService: {
        getAllOrders: vi.fn(),
        getOrderById: vi.fn(),
        createOrder: vi.fn(),
        updateOrder: vi.fn(),
        deleteOrder: vi.fn(),
    },
}));

import { orderService } from "../src/services/index.js";

beforeEach(() => vi.clearAllMocks());

const order = { _id: "o1", name: "Weekly Shop", date: "2024-01-01", totalPrice: "50.00", items: [] };

describe("GET /api/orders", () => {
    it("returns 200 with all orders", async () => {
        orderService.getAllOrders.mockResolvedValue([order]);
        const res = await request(app).get("/api/orders");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([order]);
    });
});

describe("GET /api/orders/:id", () => {
    it("returns 200 with order", async () => {
        orderService.getOrderById.mockResolvedValue(order);
        const res = await request(app).get("/api/orders/o1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(order);
    });

    it("returns 404 when not found", async () => {
        orderService.getOrderById.mockRejectedValue(Object.assign(new Error("Order not found"), { status: 404 }));
        const res = await request(app).get("/api/orders/missing");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Order not found");
    });
});

describe("POST /api/orders", () => {
    it("returns 201 with created order", async () => {
        orderService.createOrder.mockResolvedValue(order);
        const res = await request(app).post("/api/orders").send({ name: "Weekly Shop", date: "2024-01-01", totalPrice: "50.00", groupId: "g1", items: [] });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(order);
    });
});

describe("PUT /api/orders/:id", () => {
    it("returns 200 with updated order", async () => {
        const updated = { ...order, name: "Monthly Shop" };
        orderService.updateOrder.mockResolvedValue(updated);
        const res = await request(app).put("/api/orders/o1").send({ name: "Monthly Shop" });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Monthly Shop");
    });

    it("returns 404 when not found", async () => {
        orderService.updateOrder.mockRejectedValue(Object.assign(new Error("Order not found"), { status: 404 }));
        const res = await request(app).put("/api/orders/missing").send({});
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/orders/:id", () => {
    it("returns 200 on success", async () => {
        orderService.deleteOrder.mockResolvedValue();
        const res = await request(app).delete("/api/orders/o1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Order deleted");
    });

    it("returns 404 when not found", async () => {
        orderService.deleteOrder.mockRejectedValue(Object.assign(new Error("Order not found"), { status: 404 }));
        const res = await request(app).delete("/api/orders/missing");
        expect(res.status).toBe(404);
    });
});
