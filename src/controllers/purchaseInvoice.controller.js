import { purchaseInvoiceService } from "../services/index.js";

export const purchaseInvoiceController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await purchaseInvoiceService.getAllPurchaseInvoices(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await purchaseInvoiceService.getPurchaseInvoiceById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await purchaseInvoiceService.createPurchaseInvoice({
                ...req.body,
                group: req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try {
            res.json(await purchaseInvoiceService.updatePurchaseInvoice(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await purchaseInvoiceService.deletePurchaseInvoice(req.params.id, req.query.groupId);
            res.json({ message: "Purchase invoice deleted" });
        } catch (err) { next(err); }
    },
    pdf: async (req, res, next) => {
        try {
            const disposition = req.query.disposition || "inline";
            const pdf = await purchaseInvoiceService.getPurchaseInvoicePDF(req.params.id, req.query.groupId);
            res.set({ "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${req.params.id}.pdf"` });
            res.send(pdf);
        } catch (err) { next(err); }
    },
    send: async (req, res, next) => {
        try {
            res.json(await purchaseInvoiceService.sendPurchaseInvoice(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
};
