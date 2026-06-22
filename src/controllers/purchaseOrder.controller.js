import { purchaseOrderService } from "../services/index.js";

export const purchaseOrderController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await purchaseOrderService.getAllPurchaseOrders(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await purchaseOrderService.getPurchaseOrderById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await purchaseOrderService.createPurchaseOrder({ ...req.body, group: req.query.groupId, createdBy: req.user.id }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try {
            res.json(await purchaseOrderService.updatePurchaseOrder(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await purchaseOrderService.deletePurchaseOrder(req.params.id, req.query.groupId);
            res.json({ message: "Purchase order deleted" });
        } catch (err) { next(err); }
    },
    pdf: async (req, res, next) => {
        try {
            const { pdfBuffer, filename } = await purchaseOrderService.getPurchaseOrderPDF(
                req.params.id, req.query.groupId
            );
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `${req.query.disposition || "inline"}; filename="${filename}"`,
                "Content-Length": pdfBuffer.length,
            });
            res.end(pdfBuffer);
        } catch (err) { next(err); }
    },
    send: async (req, res, next) => {
        try {
            const po = await purchaseOrderService.sendPurchaseOrder(
                req.params.id,
                req.query.groupId,
                { recipientEmail: req.body.recipientEmail }
            );
            res.json(po);
        } catch (err) { next(err); }
    },
};
