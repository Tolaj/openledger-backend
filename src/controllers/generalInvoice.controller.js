import { generalInvoiceService } from "../services/index.js";

export const generalInvoiceController = {
    getAll: async (req, res, next) => {
        try { res.json(await generalInvoiceService.getAllGeneralInvoices(req.query.groupId)); }
        catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await generalInvoiceService.getGeneralInvoiceById(req.params.id, req.query.groupId)); }
        catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await generalInvoiceService.createGeneralInvoice({
                ...req.body,
                group:     req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try { res.json(await generalInvoiceService.updateGeneralInvoice(req.params.id, req.query.groupId, req.body)); }
        catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await generalInvoiceService.deleteGeneralInvoice(req.params.id, req.query.groupId);
            res.json({ message: "General invoice deleted" });
        } catch (err) { next(err); }
    },
};
