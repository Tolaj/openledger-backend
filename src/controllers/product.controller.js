import { productService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await productService.getAllProducts(req.query.groupId)); } catch (err) { next(err); }
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

export const convertCurrency = async (req, res, next) => {
    try {
        const { rate, groupId, newCurrency } = req.body
        if (!rate || isNaN(rate) || rate <= 0) {
            return res.status(400).json({ error: "Invalid rate" })
        }
        if (!groupId) {
            return res.status(400).json({ error: "groupId is required" })
        }
        const result = await productService.convertGroupPrices(groupId, parseFloat(rate), newCurrency)
        res.json(result)
    } catch (err) {
        console.error("convertCurrency error:", err)
        next(err)
    }
};
