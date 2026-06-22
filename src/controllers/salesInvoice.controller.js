import { salesInvoiceService } from "../services/index.js";

export const salesInvoiceController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await salesInvoiceService.getAllSalesInvoices(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await salesInvoiceService.getSalesInvoiceById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await salesInvoiceService.createSalesInvoice({
                ...req.body,
                group: req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try {
            res.json(await salesInvoiceService.updateSalesInvoice(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await salesInvoiceService.deleteSalesInvoice(req.params.id, req.query.groupId);
            res.json({ message: "Sales invoice deleted" });
        } catch (err) { next(err); }
    },
    pdf: async (req, res, next) => {
        try {
            const disposition = req.query.disposition || "inline";
            const pdf = await salesInvoiceService.getSalesInvoicePDF(req.params.id, req.query.groupId);
            res.set({ "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${req.params.id}.pdf"` });
            res.send(pdf);
        } catch (err) { next(err); }
    },
    send: async (req, res, next) => {
        try {
            res.json(await salesInvoiceService.sendSalesInvoice(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
};
