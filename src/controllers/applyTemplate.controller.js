import { applyTemplateService } from "../services/index.js";

export const apply = async (req, res, next) => {
    try {
        const group = await applyTemplateService.applyTemplate(req.body);
        res.json(group);
    } catch (err) {
        if (err.status === 409) return res.status(409).json({ message: "conflict", conflicts: err.conflicts });
        next(err);
    }
};
