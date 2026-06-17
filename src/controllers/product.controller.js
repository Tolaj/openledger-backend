import { productService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await productService.getAllProducts()); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await productService.getProductById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await productService.createProduct(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await productService.updateProduct(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await productService.deleteProduct(req.params.id); res.json({ message: "Product deleted" }); } catch (err) { next(err); }
};
