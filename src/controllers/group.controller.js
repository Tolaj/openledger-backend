import { groupService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await groupService.getAllGroups()); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await groupService.getGroupById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await groupService.createGroup(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await groupService.updateGroup(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await groupService.deleteGroup(req.params.id); res.json({ message: "Group deleted" }); } catch (err) { next(err); }
};
