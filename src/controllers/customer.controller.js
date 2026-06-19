import { customerService } from "../services/index.js";

export const customerController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await customerService.getAllCustomers(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await customerService.getCustomerById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await customerService.createCustomer({ ...req.body, group: req.query.groupId, createdBy: req.user.id }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try {
            res.json(await customerService.updateCustomer(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await customerService.deleteCustomer(req.params.id, req.query.groupId);
            res.json({ message: "Customer deleted" });
        } catch (err) { next(err); }
    },
};
