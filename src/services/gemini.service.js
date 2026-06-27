import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = (apiKey) => new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || "");
const flash = (apiKey) => getClient(apiKey).getGenerativeModel({ model: "gemini-2.5-flash" });

// ── Receipt scan ───────────────────────────────────────────────────────────────
// imageBase64: base64-encoded image string (no data: prefix)
// mimeType: e.g. "image/jpeg"
// products: optional array of existing products {_id, name, unit, price} to match against
export const scanReceipt = async (imageBase64, mimeType, products = [], apiKey) => {
    const productHint = products.length
        ? `\nKnown products in catalog (try to match by name):\n${products.map((p) => `- id:${p._id} name:"${p.name}" unit:${p.unit || "pcs"} price:${p.price}`).join("\n")}`
        : "";

    const prompt = `You are a receipt scanner for a personal finance app.
Extract every line item from this receipt and return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "storeName": "string or null",
  "date": "YYYY-MM-DD or null",
  "items": [
    {
      "description": "item name",
      "qty": number,
      "unit": "pcs/kg/ltr/etc",
      "unitPrice": number,
      "taxRate": 0,
      "matchedProductId": "id from catalog or null"
    }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "grandTotal": number or null
}
${productHint}
Rules:
- qty defaults to 1 if not shown
- unitPrice is per-unit price (divide total by qty if needed)
- taxRate is percentage (e.g. 18 for 18%), 0 if unknown
- matchedProductId: only set if name is a confident match to a catalog product`;

    const result = await flash(apiKey).generateContent([
        prompt,
        { inlineData: { mimeType, data: imageBase64 } },
    ]);
    const text = result.response.text().trim();
    const jsonStr = text.startsWith("{") ? text : text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) throw new Error("Gemini did not return valid JSON");
    return JSON.parse(jsonStr);
};

// ── Product auto-suggest ───────────────────────────────────────────────────────
// productName: string entered by user
// categories: array of {_id, name} available in the group
export const suggestProduct = async (productName, categories = [], apiKey) => {
    const catList = categories.map((c) => `id:${c._id} name:"${c.name}"`).join("\n");

    const prompt = `You are a product cataloging assistant.
Given this product name: "${productName}"
And these available categories:
${catList || "(none)"}

Return ONLY a JSON object (no markdown, no explanation):
{
  "description": "concise 1-sentence product description",
  "categoryId": "best matching category id from the list, or null",
  "unit": "best unit: pcs/kg/g/ltr/mL/mtr/box/pack/dozen/bottle/can/bag",
  "suggestedPrice": number or null
}`;

    const result = await flash(apiKey).generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.startsWith("{") ? text : text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) throw new Error("Gemini did not return valid JSON");
    return JSON.parse(jsonStr);
};

// ── Financial insights ─────────────────────────────────────────────────────────
// data: { currency, period, totalSpend, byCategory:[{name,total}], byMonth:[{month,total}], topProducts:[{name,total}], orderCount }
export const getInsights = async (data, apiKey) => {
    const prompt = `You are a personal finance analyst. Analyse this spending data and give 3-5 actionable insights.
Data:
${JSON.stringify(data, null, 2)}

Return ONLY a JSON array (no markdown):
[
  { "type": "info|warning|tip", "title": "short title", "body": "1-2 sentence insight" }
]
Be specific, use actual numbers from the data. Focus on patterns, top categories, and saving opportunities.`;

    const result = await flash(apiKey).generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.startsWith("[") ? text : text.match(/\[[\s\S]*\]/)?.[0];
    if (!jsonStr) throw new Error("Gemini did not return valid JSON");
    return JSON.parse(jsonStr);
};

// ── Chat assistant ─────────────────────────────────────────────────────────────
// history: [{role:"user"|"model", parts:[{text}]}]
// userMessage: string
// context: serialised financial snapshot for the group
export const chat = async (history, userMessage, context, apiKey) => {
    const systemPrompt = `You are Ledger, a friendly AI assistant built into OpenLedger — a personal finance and inventory app.
You can answer any question the user asks, whether it's about their finances, general knowledge, or anything else.
When relevant, use the user's financial data below to give personalised answers. For general questions, just answer helpfully.
Your name is Ledger. You were built by the OpenLedger team.

User's financial snapshot:
${context}`;

    const model = flash(apiKey);
    const cleanHistory = history
        .filter((m) => m?.role && m?.parts?.[0]?.text?.trim())
        .map((m) => ({ role: m.role, parts: [{ text: m.parts[0].text }] }));

    const session = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood! I'm ready to help you with your finances and inventory." }] },
            ...cleanHistory,
        ],
    });
    const result = await session.sendMessage(userMessage);
    return result.response.text();
};
