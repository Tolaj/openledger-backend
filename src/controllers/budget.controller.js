import { budgetService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await budgetService.getAllBudgets(req.query)); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await budgetService.getBudgetById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await budgetService.createBudget(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await budgetService.updateBudget(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await budgetService.deleteBudget(req.params.id); res.json({ message: "Budget deleted" }); } catch (err) { next(err); }
};
