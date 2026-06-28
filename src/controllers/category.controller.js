import { categoryService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await categoryService.getAllCategories(req.query.groupId)); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await categoryService.getCategoryById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await categoryService.createCategory(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await categoryService.updateCategory(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await categoryService.deleteCategory(req.params.id); res.json({ message: "Category deleted" }); } catch (err) { next(err); }
};
