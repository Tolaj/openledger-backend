import { recipientService } from "../services/index.js";

export const recipientController = {
    getAll: async (req, res, next) => {
        try { res.json(await recipientService.getAllRecipients(req.query.groupId)); }
        catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await recipientService.getRecipientById(req.params.id, req.query.groupId)); }
        catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await recipientService.createRecipient({
                ...req.body,
                group:     req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try { res.json(await recipientService.updateRecipient(req.params.id, req.query.groupId, req.body)); }
        catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await recipientService.deleteRecipient(req.params.id, req.query.groupId);
            res.json({ message: "Recipient deleted" });
        } catch (err) { next(err); }
    },
};
