import { vendorService } from "../services/index.js";

export const vendorController = {
    getAll: async (req, res, next) => {
        try {
            res.json(await vendorService.getAllVendors(req.query.groupId));
        } catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try {
            res.json(await vendorService.getVendorById(req.params.id, req.query.groupId));
        } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await vendorService.createVendor({ ...req.body, group: req.query.groupId, createdBy: req.user.id }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try {
            res.json(await vendorService.updateVendor(req.params.id, req.query.groupId, req.body));
        } catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await vendorService.deleteVendor(req.params.id, req.query.groupId);
            res.json({ message: "Vendor deleted" });
        } catch (err) { next(err); }
    },
};
