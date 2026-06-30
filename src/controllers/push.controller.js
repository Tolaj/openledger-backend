import { getVapidPublicKey, saveSubscription, removeSubscription } from "../services/push.service.js";

export const pushController = {
    vapidKey: (req, res) => {
        res.json({ key: getVapidPublicKey() });
    },
    subscribe: async (req, res, next) => {
        try {
            await saveSubscription(req.user.id, req.body.subscription, req.headers["user-agent"]);
            res.status(201).json({ ok: true });
        } catch (err) { next(err); }
    },
    unsubscribe: async (req, res, next) => {
        try {
            await removeSubscription(req.body.endpoint);
            res.json({ ok: true });
        } catch (err) { next(err); }
    },
};
