import { recurringService } from "../services/index.js";

export const recurringController = {
    getAll: async (req, res, next) => {
        try { res.json(await recurringService.getAllRecurring(req.query.groupId)); }
        catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await recurringService.getRecurringById(req.params.id, req.query.groupId)); }
        catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await recurringService.createRecurring({
                ...req.body,
                group:     req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try { res.json(await recurringService.updateRecurring(req.params.id, req.query.groupId, req.body)); }
        catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await recurringService.deleteRecurring(req.params.id, req.query.groupId);
            res.json({ message: "Recurring deleted" });
        } catch (err) { next(err); }
    },
};
