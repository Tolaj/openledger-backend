import webpush from "web-push";
import PushSubscription from "../models/pushSubscription.model.js";

let configured = false;
function ensureConfigured() {
    if (configured) return true;
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) return false;
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@openledger.app", pub, priv);
    configured = true;
    return true;
}

export const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

export const saveSubscription = async (userId, sub, userAgent) => {
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
        throw Object.assign(new Error("Invalid subscription"), { status: 400 });
    }
    return PushSubscription.findOneAndUpdate(
        { endpoint: sub.endpoint },
        { user: userId, endpoint: sub.endpoint, keys: sub.keys, userAgent },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const removeSubscription = (endpoint) =>
    PushSubscription.deleteOne({ endpoint });

/**
 * Send a push payload to every device registered for a user.
 * Silently prunes dead subscriptions (410/404).
 */
export const sendToUser = async (userId, payload) => {
    if (!ensureConfigured()) {
        console.warn("[push] VAPID keys not set — skipping push");
        return { sent: 0 };
    }
    const subs = await PushSubscription.find({ user: userId });
    let sent = 0;
    await Promise.all(
        subs.map(async (s) => {
            try {
                await webpush.sendNotification(
                    { endpoint: s.endpoint, keys: s.keys },
                    JSON.stringify(payload)
                );
                sent += 1;
            } catch (err) {
                if (err?.statusCode === 410 || err?.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: s._id });
                } else {
                    console.error("[push] send failed:", err?.statusCode, err?.body || err?.message);
                }
            }
        })
    );
    return { sent };
};
