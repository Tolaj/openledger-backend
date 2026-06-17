import { inventoryService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await inventoryService.getAllInventory()); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await inventoryService.getInventoryById(req.params.id)); } catch (err) { next(err); }
};

export const upsert = async (req, res, next) => {
    try { res.status(201).json(await inventoryService.upsertInventory(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await inventoryService.updateInventory(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await inventoryService.deleteInventory(req.params.id); res.json({ message: "Inventory item deleted" }); } catch (err) { next(err); }
};
