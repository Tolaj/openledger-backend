import * as gemini from "../services/gemini.service.js";

// Convert Gemini SDK errors into clean HTTP errors
// hasOwnKey: true = user's own key was used, false = server fallback
const geminiError = (err, hasOwnKey = false) => {
    const msg = err?.message || "";
    if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("quota")) {
        const text = hasOwnKey
            ? "Your Gemini API key has exceeded its quota. Check your usage at aistudio.google.com or wait and retry."
            : "AI quota exceeded. Add your own Gemini API key in Settings → AI (Gemini).";
        return Object.assign(new Error(text), { status: 429 });
    }
    if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("unregistered callers") || msg.includes("API Key"))
        return Object.assign(new Error("No Gemini API key configured. Add your key in Settings → AI (Gemini)."), { status: 403 });
    if (msg.includes("404") || msg.includes("not found for API version"))
        return Object.assign(new Error("Gemini model unavailable. Please try again later."), { status: 502 });
    return err;
};
import { getDecryptedGeminiKey } from "../services/group.service.js";
import Group from "../models/group.model.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Order from "../models/order.model.js";

// ── Receipt scan ───────────────────────────────────────────────────────────────
export const scanReceipt = async (req, res, next) => {
    try {
        const { imageBase64, mimeType, groupId } = req.body;
        if (!imageBase64 || !mimeType) return res.status(400).json({ error: "imageBase64 and mimeType are required" });

        let products = [];
        if (groupId) {
            const group = await Group.findById(groupId).select("products");
            if (group?.products?.length) {
                products = await Product.find({ _id: { $in: group.products } }).select("_id name unit price").lean();
            }
        }

        const apiKey = groupId ? await getDecryptedGeminiKey(groupId) : null;
        const result = await gemini.scanReceipt(imageBase64, mimeType, products, apiKey);
        res.json(result);
    } catch (err) { next(geminiError(err, !!groupId)); }
};

// ── Product auto-suggest ───────────────────────────────────────────────────────
export const suggestProduct = async (req, res, next) => {
    try {
        const { productName, groupId } = req.body;
        if (!productName) return res.status(400).json({ error: "productName is required" });

        let categories = [];
        if (groupId) {
            const group = await Group.findById(groupId).select("categories");
            if (group?.categories?.length) {
                categories = await Category.find({ _id: { $in: group.categories } }).select("_id name").lean();
            }
        }

        const apiKey = groupId ? await getDecryptedGeminiKey(groupId) : null;
        const result = await gemini.suggestProduct(productName, categories, apiKey);
        res.json(result);
    } catch (err) { next(geminiError(err, !!groupId)); }
};

// ── Financial insights ─────────────────────────────────────────────────────────
export const getInsights = async (req, res, next) => {
    try {
        const { groupId } = req.body;
        if (!groupId) return res.status(400).json({ error: "groupId is required" });

        const group = await Group.findById(groupId).select("products orders currency");
        if (!group) return res.status(404).json({ error: "Group not found" });

        // Gather last 6 months of orders
        const since = new Date();
        since.setMonth(since.getMonth() - 6);
        const orders = await Order.find({ _id: { $in: group.orders || [] }, createdAt: { $gte: since } })
            .populate({ path: "items.product", select: "name category price", populate: { path: "category", select: "name" } })
            .lean();

        const byCategory = {};
        const byMonth = {};
        const byProduct = {};
        let totalSpend = 0;

        for (const o of orders) {
            const month = new Date(o.createdAt).toISOString().slice(0, 7);
            const total = parseFloat(o.totalPrice || 0);
            totalSpend += total;
            byMonth[month] = (byMonth[month] || 0) + total;

            for (const item of o.items || []) {
                const catName = item.product?.category?.name || "Uncategorised";
                const prodName = item.product?.name || item.description || "Unknown";
                const amount = (item.price || 0) * (item.count || 1);
                byCategory[catName] = (byCategory[catName] || 0) + amount;
                byProduct[prodName] = (byProduct[prodName] || 0) + amount;
            }
        }

        const data = {
            currency: group.currency || "INR",
            period: "last 6 months",
            orderCount: orders.length,
            totalSpend: +totalSpend.toFixed(2),
            byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, total]) => ({ name, total: +total.toFixed(2) })),
            byMonth: Object.entries(byMonth).sort().map(([month, total]) => ({ month, total: +total.toFixed(2) })),
            topProducts: Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({ name, total: +total.toFixed(2) })),
        };

        const apiKey = await getDecryptedGeminiKey(groupId);
        const insights = await gemini.getInsights(data, apiKey);
        res.json({ insights, data });
    } catch (err) { next(geminiError(err, true)); }
};

// ── Chat assistant ─────────────────────────────────────────────────────────────
export const chat = async (req, res, next) => {
    let apiKey = null;
    try {
        const { groupId, message, history = [] } = req.body;
        if (!message) return res.status(400).json({ error: "message is required" });

        let context = "No financial data available.";
        if (groupId) {
            const group = await Group.findById(groupId).select("products orders currency");
            if (group) {
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

                context = `Currency: ${group.currency || "INR"}
Orders last 3 months: ${orders.length} orders, total spend ${total.toFixed(2)}
Spend by category: ${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(", ")}
Products in catalog: ${products.map((p) => `${p.name} (${p.price} ${group.currency || "INR"}/${p.unit || "pcs"})`).slice(0, 30).join(", ")}`;
            }
        }

        apiKey = groupId ? await getDecryptedGeminiKey(groupId) : null;
        const reply = await gemini.chat(history, message, context, apiKey);
        res.json({ reply });
    } catch (err) { next(geminiError(err, !!apiKey)); }
};
