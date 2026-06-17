import { userService } from "../services/index.js";

export const getMe = async (req, res, next) => {
    try { res.json(await userService.getMe(req.user.id)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await userService.updateUser(req.params.id, req.body)); } catch (err) { next(err); }
};
