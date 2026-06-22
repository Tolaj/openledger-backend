import PurchaseInvoice from "../models/purchaseInvoice.model.js";
import GRN from "../models/grn.model.js";
import PurchaseOrder from "../models/purchaseOrder.model.js";
import Counter from "../models/counter.model.js";
import Finance from "../models/finance.model.js";
import Group from "../models/group.model.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderPurchaseInvoiceHtml } from "../utils/purchaseInvoiceTemplate.js";

const nextInvoiceNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `pinv_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `PINV-${String(counter.seq).padStart(4, "0")}`;
};

const populateInvoice = (query) =>
    query
        .populate({ path: "vendor", select: "name email phone" })
        .populate({ path: "purchaseOrder", select: "poNumber" })
        .populate({ path: "grn", select: "grnNumber" })
        .populate({ path: "items.product", select: "name unit", populate: { path: "category", select: "name icon" } });

const markOverdue = async (groupId) => {
    await PurchaseInvoice.updateMany(
        { group: groupId, status: "sent", dueDate: { $lt: new Date() } },
        { $set: { status: "overdue" } }
    );
};

export const getAllPurchaseInvoices = async (groupId) => {
    await markOverdue(groupId);
    return populateInvoice(PurchaseInvoice.find({ group: groupId }).sort({ createdAt: -1 }));
};

export const getPurchaseInvoiceById = async (id, groupId) => {
    const inv = await populateInvoice(
        PurchaseInvoice.findOne({ _id: id, group: groupId })
    );
    if (!inv) throw Object.assign(new Error("Purchase invoice not found"), { status: 404 });
    return inv;
};

export const createPurchaseInvoice = async (body) => {
    const { group, purchaseOrder: poId, grn: grnId, createdBy, items = [], dueDate, notes, invoiceDate } = body;

    // Block: GRN already has an invoice
    if (grnId) {
        const existing = await PurchaseInvoice.findOne({ grn: grnId, group });
        if (existing)
            throw Object.assign(new Error(`This GRN already has an invoice (${existing.invoiceNumber}). Each GRN can only be invoiced once.`), { status: 409 });
    }

    // Auto-populate items from GRN if provided and no items passed
    let resolvedItems = items;
    let vendorId = body.vendor;

    if (grnId && (!items || items.length === 0)) {
        const grn = await GRN.findOne({ _id: grnId, group }).populate("purchaseOrder");
        if (grn) {
            const po = grn.purchaseOrder;
            vendorId = vendorId || po?.vendor;
            if (po && !body.purchaseOrder) body.purchaseOrder = po._id;
            resolvedItems = grn.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty: it.qtyReceived,
                unit: it.unit,
                unitPrice: it.unitPrice,
                taxRate: 0,
                amount: it.qtyReceived * it.unitPrice,
            }));
        }
    } else if (poId && (!items || items.length === 0)) {
        const po = await PurchaseOrder.findOne({ _id: poId, group });
        if (po) {
            vendorId = vendorId || po.vendor;
            resolvedItems = po.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty: it.qty,
                unit: it.unit,
                unitPrice: it.unitPrice,
                taxRate: it.taxRate || 0,
                amount: it.amount,
            }));
        }
    }

    const subtotal   = resolvedItems.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount  = resolvedItems.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0)) / 100, 0);
    const grandTotal = subtotal + taxAmount;

    const invoiceNumber = await nextInvoiceNumber(group);

    const inv = await new PurchaseInvoice({
        invoiceNumber,
        purchaseOrder: poId || body.purchaseOrder || undefined,
        grn: grnId || undefined,
        vendor: vendorId,
        group,
        items: resolvedItems,
        subtotal,
        taxAmount,
        grandTotal,
        invoiceDate: invoiceDate || new Date(),
        dueDate: dueDate || undefined,
        notes,
        createdBy,
    }).save();

    return populateInvoice(PurchaseInvoice.findById(inv._id));
};

export const updatePurchaseInvoice = async (id, groupId, data) => {
    const existing = await PurchaseInvoice.findOne({ _id: id, group: groupId }).populate("vendor", "name");
    if (!existing) throw Object.assign(new Error("Purchase invoice not found"), { status: 404 });

    if (existing.status === "paid" && data.status && data.status !== "paid")
        throw Object.assign(new Error("Cannot change status of a paid invoice."), { status: 409 });

    const inv = await PurchaseInvoice.findOneAndUpdate(
        { _id: id, group: groupId },
        data,
        { new: true }
    );

    // If moving AWAY from paid, delete the linked Finance entry
    if (existing.status === "paid" && data.status && data.status !== "paid" && existing.financeEntryId) {
        await Finance.findByIdAndDelete(existing.financeEntryId).catch(() => {});
        inv.financeEntryId = undefined;
        await inv.save();
    }

    // Auto-create expense Finance entry when invoice is marked paid
    if (data.status === "paid" && existing.status !== "paid" && !existing.financeEntryId) {
        // Populate product with category for line items
        const populated = await PurchaseInvoice.findById(existing._id)
            .populate({ path: "items.product", populate: { path: "category", select: "_id name" } });

        const financeItems = (populated?.items || []).map((it) => ({
            name:     it.product?.name || it.description || "Item",
            qty:      it.qty || 1,
            amount:   it.amount || 0,
            category: it.product?.category?._id || it.product?.category || undefined,
        }));

        // Set top-level category if all items share the same category
        const itemCategories = financeItems.map((it) => it.category?.toString()).filter(Boolean);
        const uniqueCategories = [...new Set(itemCategories)];
        const topCategory = uniqueCategories.length === 1 ? uniqueCategories[0] : undefined;

        const entry = await new Finance({
            type:        "expense",
            amount:      existing.grandTotal,
            description: `${existing.invoiceNumber}${existing.vendor?.name ? " — " + existing.vendor.name : ""}`,
            date:        new Date(),
            group:       groupId,
            user:        existing.createdBy,
            category:    topCategory,
            items:       financeItems,
        }).save();
        inv.financeEntryId = entry._id;
        await inv.save();
    }

    return inv;
};

export const deletePurchaseInvoice = async (id, groupId) => {
    const inv = await PurchaseInvoice.findOneAndDelete({ _id: id, group: groupId });
    if (!inv) throw Object.assign(new Error("Purchase invoice not found"), { status: 404 });
    if (inv.financeEntryId) {
        await Finance.findByIdAndDelete(inv.financeEntryId).catch(() => {});
    }
};

export const getPurchaseInvoicePDF = async (id, groupId) => {
    const inv = await PurchaseInvoice.findOne({ _id: id, group: groupId })
        .populate("vendor")
        .populate("purchaseOrder", "poNumber")
        .populate("grn", "grnNumber")
        .populate("items.product", "name unit");
    if (!inv) throw Object.assign(new Error("Purchase invoice not found"), { status: 404 });
    const group = await Group.findById(groupId).lean();
    return generatePDF(renderPurchaseInvoiceHtml(inv.toObject(), group));
};

export const sendPurchaseInvoice = async (id, groupId, { recipientEmail } = {}) => {
    const inv = await PurchaseInvoice.findOne({ _id: id, group: groupId })
        .populate("vendor")
        .populate("purchaseOrder", "poNumber")
        .populate("items.product", "name unit");
    if (!inv) throw Object.assign(new Error("Purchase invoice not found"), { status: 404 });

    const toEmail = recipientEmail || inv.vendor?.email;
    if (!toEmail) throw Object.assign(new Error("No vendor email address available."), { status: 400 });

    const group = await Group.findById(groupId).lean();
    const pdf   = await generatePDF(renderPurchaseInvoiceHtml(inv.toObject(), group));

    await sendMail({
        to: toEmail,
        subject: `Purchase Invoice ${inv.invoiceNumber} from ${group?.name || "OpenLedger"}`,
        html: `<p>Hi ${inv.vendor?.name || "there"},</p><p>Please find purchase invoice <strong>${inv.invoiceNumber}</strong> attached for your records.</p><p>Amount: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(inv.grandTotal || 0)}${inv.dueDate ? " · Due " + new Date(inv.dueDate).toLocaleDateString("en-IN") : ""}.</p><p>Thank you.</p>`,
        attachments: [{ filename: `${inv.invoiceNumber}.pdf`, content: pdf }],
    });

    await PurchaseInvoice.findByIdAndUpdate(id, { status: "sent" });
    return { success: true };
};
