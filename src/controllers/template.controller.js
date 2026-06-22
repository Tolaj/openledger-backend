import { templateService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try {
        const userId = req.user?.id ?? req.query.userId;
        const type = req.query.type;
        res.json(await templateService.getTemplates(userId, type));
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await templateService.createTemplate(req.body, req.user.id)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await templateService.deleteTemplate(req.params.id, req.user.id); res.json({ message: "Template deleted" }); } catch (err) { next(err); }
};
