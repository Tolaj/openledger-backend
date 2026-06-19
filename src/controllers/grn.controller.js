import { grnService } from "../services/index.js";

export const grnController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await grnService.getAllGRNs(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await grnService.getGRNById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await grnService.createGRN({
                ...req.body,
                group: req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await grnService.deleteGRN(req.params.id, req.query.groupId);
            res.json({ message: "GRN deleted" });
        } catch (err) { next(err); }
    },
};
