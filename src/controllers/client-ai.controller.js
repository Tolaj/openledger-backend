import { getDecryptedGeminiKey } from "../services/group.service.js";
import Group from "../models/group.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

// Returns the group's Gemini API key to the client for direct browser-side calls.
// Also returns a financial context snapshot so the client doesn't need to make
// multiple data-fetch calls before starting the chat session.
export const getKeyAndContext = async (req, res, next) => {
    try {
        const { groupId } = req.query;
        if (!groupId) return res.status(400).json({ error: "groupId is required" });

        const group = await Group.findById(groupId).select("products orders currency geminiApiKey aiEnabled aiModel").lean();
        if (!group) return res.status(404).json({ error: "Group not found" });
        if (!group.aiEnabled) return res.status(403).json({ error: "AI is not enabled for this group" });

        const apiKey = await getDecryptedGeminiKey(groupId);
        if (!apiKey) return res.status(403).json({ error: "No Gemini API key configured. Add your key in Settings → AI (Gemini)." });

        // Build context snapshot (last 3 months)
        const since = new Date();
        since.setMonth(since.getMonth() - 3);
        const orders = await Order.find({ _id: { $in: group.orders || [] }, createdAt: { $gte: since } })
            .populate({ path: "items.product", select: "name", populate: { path: "category", select: "name" } })
            .lean();

        const byCategory = {};
        let total = 0;
        for (const o of orders) {
            total += parseFloat(o.totalPrice || 0);
            for (const item of o.items || []) {
                const cat = item.product?.category?.name || "Uncategorised";
                byCategory[cat] = (byCategory[cat] || 0) + (item.price || 0) * (item.count || 1);
            }
        }

        const products = await Product.find({ _id: { $in: group.products || [] } }).select("name price unit").lean();

        const context = `Currency: ${group.currency || "INR"}
Orders last 3 months: ${orders.length} orders, total spend ${total.toFixed(2)}
Spend by category: ${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(", ")}
Products in catalog: ${products.map((p) => `${p.name} (${p.price} ${group.currency || "INR"}/${p.unit || "pcs"})`).slice(0, 30).join(", ")}`;

        res.json({ apiKey, model: group.aiModel || 'gemini-2.5-flash-lite', context });
    } catch (err) { next(err); }
};
