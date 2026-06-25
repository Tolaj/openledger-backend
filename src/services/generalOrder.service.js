import GeneralOrder from "../models/generalOrder.model.js";
import GeneralInvoice from "../models/generalInvoice.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import StockMovement from "../models/stockMovement.model.js";
import Group from "../models/group.model.js";
import Counter from "../models/counter.model.js";
import { writeMovement } from "./stockMovement.service.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderGOHtml } from "../utils/goTemplate.js";

const nextGoNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `go_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `GO-${String(counter.seq).padStart(4, "0")}`;
};

const populate = (query) =>
    query
        .populate({ path: "recipient", select: "name email phone type" })
        .populate({ path: "items.product", select: "name unit", populate: { path: "category", select: "name icon" } });

const calcTotals = (items = []) => {
    const subtotal  = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0)) / 100, 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

// Stock IN — payable direction (we are receiving/buying)
const applyStockIn = async (items, groupId) => {
    for (const item of items) {
        if (!item.product || item.qty <= 0) continue;
        const prod = await Product.findById(item.product).select("inventory");
        if (!prod?.inventory) continue;
        const existing = await Inventory.findOne({ product: item.product });
        if (existing) {
            existing.quantityAvailable += item.qty;
            existing.lastUpdated = new Date();
            await existing.save();
        } else {
            const created = await new Inventory({
                product: item.product,
                quantityAvailable: item.qty,
                price: item.unitPrice || 0,
                splitAmong: [],
                lastUpdated: new Date(),
            }).save();
            await Group.updateOne({ _id: groupId }, { $addToSet: { inventories: created._id } });
        }
    }
};

// Stock OUT — receivable direction (we are selling/delivering)
const applyStockOut = async (items) => {
    for (const item of items) {
        if (!item.product || item.qty <= 0) continue;
        const prod = await Product.findById(item.product).select("inventory");
        if (!prod?.inventory) continue;
        const inv = await Inventory.findOne({ product: item.product });
        if (inv) {
            inv.quantityAvailable = Math.max(0, inv.quantityAvailable - item.qty);
            inv.lastUpdated = new Date();
            await inv.save();
        }
    }
};

export const getAllGeneralOrders = (groupId) =>
    populate(GeneralOrder.find({ group: groupId }).sort({ createdAt: -1 }));

export const getGeneralOrderById = async (id, groupId) => {
    const o = await populate(GeneralOrder.findOne({ _id: id, group: groupId }));
    if (!o) throw Object.assign(new Error("General order not found"), { status: 404 });
    return o;
};

export const createGeneralOrder = async (body) => {
    const { group, items = [] } = body;
    const goNumber = await nextGoNumber(group);
    const totals   = calcTotals(items);
    const order = await new GeneralOrder({ ...body, goNumber, ...totals }).save();
    // Stock moves when status reaches received/delivered, not on creation
    return populate(GeneralOrder.findById(order._id));
};

export const updateGeneralOrder = async (id, groupId, data) => {
    const existing = await GeneralOrder.findOne({ _id: id, group: groupId });
    if (!existing) throw Object.assign(new Error("General order not found"), { status: 404 });

    // Lock status once terminal
    const terminalStatuses = existing.direction === "payable" ? ["received"] : ["delivered"];
    if (terminalStatuses.includes(existing.status) && data.status)
        throw Object.assign(new Error(`Cannot change status of a fully ${existing.status} general order.`), { status: 409 });

    if (data.items) {
        const totals = calcTotals(data.items);
        Object.assign(data, totals);
    }

    const order = await GeneralOrder.findOneAndUpdate({ _id: id, group: groupId }, data, { new: true });

    // Trigger stock + auto draft invoice when hitting a terminal status for the first time
    const newStatus  = data.status;
    const wasTerminal = terminalStatuses.includes(existing.status);
    if (!wasTerminal && newStatus && terminalStatuses.includes(newStatus)) {
        const items    = existing.items;
        const group    = existing.group;
        const goNumber = existing.goNumber;
        const createdBy = existing.createdBy;

        if (existing.direction === "payable") {
            await applyStockIn(items, group);
            for (const item of items) {
                if (!item.product || item.qty <= 0) continue;
                await writeMovement({ group, product: item.product, change: item.qty, sourceType: "go", sourceRef: goNumber, sourceId: existing._id, createdBy });
            }
        } else {
            await applyStockOut(items);
            for (const item of items) {
                if (!item.product || item.qty <= 0) continue;
                await writeMovement({ group, product: item.product, change: -item.qty, sourceType: "go", sourceRef: goNumber, sourceId: existing._id, createdBy });
            }
        }

        // Auto-create draft invoice if none exists yet
        const existingInvoice = await GeneralInvoice.findOne({ generalOrder: id, group });
        if (!existingInvoice) {
            const invCounter = await Counter.findOneAndUpdate(
                { key: `ginv_${group}` },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const invoiceNumber = `GINV-${String(invCounter.seq).padStart(4, "0")}`;
            const invItems = items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty: it.qty,
                unit: it.unit,
                unitPrice: it.unitPrice,
                taxRate: it.taxRate || 0,
                amount: it.amount || it.qty * it.unitPrice,
            }));
            const subtotal  = invItems.reduce((s, i) => s + (i.amount || 0), 0);
            const taxAmount = invItems.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0)) / 100, 0);
            await new GeneralInvoice({
                invoiceNumber,
                generalOrder: id,
                recipient: existing.recipient,
                direction: existing.direction === "payable" ? "expense" : "income",
                group,
                items: invItems,
                subtotal,
                taxAmount,
                grandTotal: subtotal + taxAmount,
                invoiceDate: new Date(),
                dueDate: existing.orderDate || undefined,
                status: "draft",
                createdBy,
            }).save();
        }
    }

    return populate(GeneralOrder.findById(order._id));
};

export const deleteGeneralOrder = async (id, groupId) => {
    const order = await GeneralOrder.findOne({ _id: id, group: groupId });
    if (!order) throw Object.assign(new Error("General order not found"), { status: 404 });

    const invoiceCount = await GeneralInvoice.countDocuments({ generalOrder: id, group: groupId });
    if (invoiceCount > 0)
        throw Object.assign(new Error(`Cannot delete GO — ${invoiceCount} invoice(s) exist against it. Delete them first.`), { status: 409 });

    await order.deleteOne();

    // Only reverse stock if the order had actually moved stock (terminal status reached)
    const terminalStatuses = order.direction === "payable" ? ["received"] : ["delivered"];
    if (terminalStatuses.includes(order.status)) {
        if (order.direction === "payable") {
            // Was stock IN — reverse by deducting
            for (const item of order.items) {
                if (!item.product || item.qty <= 0) continue;
                const prod = await Product.findById(item.product).select("inventory");
                if (!prod?.inventory) continue;
                const inv = await Inventory.findOne({ product: item.product });
                if (inv) {
                    inv.quantityAvailable = Math.max(0, inv.quantityAvailable - item.qty);
                    inv.lastUpdated = new Date();
                    await inv.save();
                }
            }
        } else {
            // Was stock OUT — reverse by adding back
            for (const item of order.items) {
                if (!item.product || item.qty <= 0) continue;
                const prod = await Product.findById(item.product).select("inventory");
                if (!prod?.inventory) continue;
                const inv = await Inventory.findOne({ product: item.product });
                if (inv) {
                    inv.quantityAvailable += item.qty;
                    inv.lastUpdated = new Date();
                    await inv.save();
                }
            }
        }
        await StockMovement.deleteMany({ sourceType: "go", sourceId: order._id });
    }
};

export const getGeneralOrderPDF = async (id, groupId) => {
    const go = await GeneralOrder.findOne({ _id: id, group: groupId })
        .populate("recipient")
        .populate("items.product", "name unit");
    if (!go) throw Object.assign(new Error("General order not found"), { status: 404 });

    const group = await Group.findById(groupId).lean();
    const html  = renderGOHtml(go.toObject(), group);
    return generatePDF(html);
};

export const sendGeneralOrder = async (id, groupId, { recipientEmail } = {}) => {
    const go = await GeneralOrder.findOne({ _id: id, group: groupId })
        .populate("recipient")
        .populate("items.product", "name unit");
    if (!go) throw Object.assign(new Error("General order not found"), { status: 404 });

    const toEmail = recipientEmail || go.recipient?.email;
    if (!toEmail) throw Object.assign(new Error("No recipient email address available."), { status: 400 });

    const group = await Group.findById(groupId).lean();
    const html  = renderGOHtml(go.toObject(), group);
    const pdf   = await generatePDF(html);

    const dirLabel = go.direction === "payable" ? "Purchase" : "Sales";

    await sendMail({ smtpConfig: group?.businessDetails,
        to: toEmail,
        subject: `${dirLabel} Order ${go.goNumber} from ${group?.name || "OpenLedger"}`,
        html: `<p>Hi ${go.recipient?.name || "there"},</p><p>Please find attached the general order <strong>${go.goNumber}</strong>.</p><p>Thank you.</p>`,
        attachments: [{ filename: `${go.goNumber}.pdf`, content: pdf }],
    });

    await GeneralOrder.findOneAndUpdate({ _id: id, status: { $nin: ["received", "delivered"] } }, { status: "sent" });
    return { success: true };
};
