import { stockMovementService } from "../services/index.js";

export const stockMovementController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await stockMovementService.getAllMovements(req.query.groupId));
        } catch (err) { next(err); }
    },
    createAdjustment: async (req, res, next) => {
        try {
            res.status(201).json(await stockMovementService.createAdjustment({
                ...req.body,
                group: req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
};
