import { orderService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await orderService.getAllOrders()); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await orderService.getOrderById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await orderService.createOrder(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await orderService.updateOrder(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await orderService.deleteOrder(req.params.id); res.json({ message: "Order deleted" }); } catch (err) { next(err); }
};
