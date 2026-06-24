import * as roleService from "../services/role.service.js";

export const getAll = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ error: "groupId is required" });
    res.json(await roleService.getRoles(groupId));
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    res.json(await roleService.getRoleById(req.params.id, groupId));
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    res.status(201).json(await roleService.createRole(req.body));
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { groupId } = req.body;
    res.json(await roleService.updateRole(req.params.id, groupId, req.body));
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    await roleService.deleteRole(req.params.id, groupId);
    res.json({ message: "Role deleted" });
  } catch (err) { next(err); }
};
