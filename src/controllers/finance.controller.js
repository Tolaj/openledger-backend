import { financeService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await financeService.getAllFinance(req.query)); } catch (err) { next(err); }
};

export const getSummary = async (req, res, next) => {
    try { res.json(await financeService.getSummary(req.query)); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await financeService.getFinanceById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await financeService.createFinance(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await financeService.updateFinance(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await financeService.deleteFinance(req.params.id); res.json({ message: "Finance entry deleted" }); } catch (err) { next(err); }
};

export const settle = async (req, res, next) => {
    try { res.json(await financeService.settleDebt(req.params.id, Number(req.params.debtIndex))); } catch (err) { next(err); }
};
