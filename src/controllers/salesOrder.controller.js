import { salesOrderService } from "../services/index.js";

export const salesOrderController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await salesOrderService.getAllSalesOrders(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await salesOrderService.getSalesOrderById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await salesOrderService.createSalesOrder({ ...req.body, group: req.query.groupId, createdBy: req.user.id }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try {
            res.json(await salesOrderService.updateSalesOrder(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await salesOrderService.deleteSalesOrder(req.params.id, req.query.groupId);
            res.json({ message: "Sales order deleted" });
        } catch (err) { next(err); }
    },
};
