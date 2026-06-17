import { friendService } from "../services/index.js";

export const send = async (req, res, next) => {
    try { res.json(await friendService.sendFriendRequest(req.body)); } catch (err) { next(err); }
};

export const receive = async (req, res, next) => {
    try { res.json(await friendService.receiveFriendRequest(req.body)); } catch (err) { next(err); }
};
