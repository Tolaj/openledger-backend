import { generalOrderService } from "../services/index.js";

export const generalOrderController = {
    getAll: async (req, res, next) => {
        try { res.json(await generalOrderService.getAllGeneralOrders(req.query.groupId)); }
        catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await generalOrderService.getGeneralOrderById(req.params.id, req.query.groupId)); }
        catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await generalOrderService.createGeneralOrder({
                ...req.body,
                group:     req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try { res.json(await generalOrderService.updateGeneralOrder(req.params.id, req.query.groupId, req.body)); }
        catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await generalOrderService.deleteGeneralOrder(req.params.id, req.query.groupId);
            res.json({ message: "General order deleted" });
        } catch (err) { next(err); }
    },
    pdf: async (req, res, next) => {
        try {
            const disposition = req.query.disposition || "inline";
            const pdf = await generalOrderService.getGeneralOrderPDF(req.params.id, req.query.groupId);
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `${disposition}; filename="${req.params.id}.pdf"`,
            });
            res.send(pdf);
        } catch (err) { next(err); }
    },
    send: async (req, res, next) => {
        try {
            const result = await generalOrderService.sendGeneralOrder(req.params.id, req.query.groupId, req.body);
            res.json(result);
        } catch (err) { next(err); }
    },
};
