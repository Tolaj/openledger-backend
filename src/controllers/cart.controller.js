import { cartService } from "../services/index.js";

export const getCart = async (req, res, next) => {
    try { res.json(await cartService.getCart(req.query.userId)); } catch (err) { next(err); }
};

export const upsertCart = async (req, res, next) => {
    try { res.status(201).json(await cartService.upsertCart(req.body)); } catch (err) { next(err); }
};

export const deleteCart = async (req, res, next) => {
    try { await cartService.deleteCart(req.body.userId); res.json({ message: "Cart deleted" }); } catch (err) { next(err); }
};
