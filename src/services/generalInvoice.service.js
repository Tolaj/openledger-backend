import GeneralInvoice from "../models/generalInvoice.model.js";
import GeneralOrder from "../models/generalOrder.model.js";
import Counter from "../models/counter.model.js";
import Finance from "../models/finance.model.js";
import Group from "../models/group.model.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderGeneralInvoiceHtml } from "../utils/generalInvoiceTemplate.js";

const nextInvoiceNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `ginv_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `GINV-${String(counter.seq).padStart(4, "0")}`;
};

const populate = (query) =>
    query
        .populate({ path: "recipient", select: "name email phone type" })
        .populate({ path: "generalOrder", select: "goNumber" })
        .populate({ path: "items.product", select: "name unit", populate: { path: "category", select: "name icon" } });

const calcTotals = (items = []) => {
    const subtotal  = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0)) / 100, 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

const markOverdue = async (groupId) => {
    await GeneralInvoice.updateMany(
        { group: groupId, status: "sent", dueDate: { $lt: new Date() } },
        { $set: { status: "overdue" } }
    );
};

export const getAllGeneralInvoices = async (groupId) => {
    await markOverdue(groupId);
    return populate(GeneralInvoice.find({ group: groupId }).sort({ createdAt: -1 }));
};

export const getGeneralInvoiceById = async (id, groupId) => {
    const inv = await populate(GeneralInvoice.findOne({ _id: id, group: groupId }));
    if (!inv) throw Object.assign(new Error("General invoice not found"), { status: 404 });
    return inv;
};

export const createGeneralInvoice = async (body) => {
    const { group, generalOrder: goId, createdBy, items = [], dueDate, notes, invoiceDate, direction = "expense" } = body;

    let resolvedItems = items;
    let recipientId   = body.recipient;

    // Auto-populate items from the linked General Order if none provided
    if (goId && items.length === 0) {
        const go = await GeneralOrder.findOne({ _id: goId, group });
        if (go) {
            recipientId   = recipientId || go.recipient;
            resolvedItems = go.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty:         it.qty,
                unit:        it.unit,
                unitPrice:   it.unitPrice,
                taxRate:     it.taxRate || 0,
                amount:      it.amount,
            }));
        }
    }

    const totals        = calcTotals(resolvedItems);
    const invoiceNumber = await nextInvoiceNumber(group);

    const inv = await new GeneralInvoice({
        invoiceNumber,
        generalOrder: goId || undefined,
        recipient:    recipientId,
        group,
        direction,
        items:       resolvedItems,
        ...totals,
        invoiceDate: invoiceDate || new Date(),
        dueDate:     dueDate || undefined,
        notes,
        createdBy,
    }).save();

    return populate(GeneralInvoice.findById(inv._id));
};

export const updateGeneralInvoice = async (id, groupId, data) => {
    const existing = await GeneralInvoice.findOne({ _id: id, group: groupId })
        .populate("recipient", "name");
    if (!existing) throw Object.assign(new Error("General invoice not found"), { status: 404 });

    if (existing.status === "paid" && data.status && data.status !== "paid")
        throw Object.assign(new Error("Cannot change status of a paid invoice."), { status: 409 });

    if (data.items) {
        const totals = calcTotals(data.items);
        Object.assign(data, totals);
    }

    const inv = await GeneralInvoice.findOneAndUpdate(
        { _id: id, group: groupId },
        data,
        { new: true }
    );

    // Auto-create Finance entry when status → paid (same lifecycle as PI/SI)
    if (data.status === "paid" && existing.status !== "paid" && !existing.financeEntryId) {
        const populated = await GeneralInvoice.findById(existing._id)
            .populate("items.product", "name category");

        const financeItems = (populated?.items || []).map((it) => ({
            name:     it.product?.name || it.description || "Item",
            qty:      it.qty || 1,
            amount:   it.amount || 0,
            category: it.product?.category || undefined,
        }));

        const entry = await new Finance({
            type:        existing.direction === "income" ? "income" : "expense",
            amount:      existing.grandTotal,
            description: `${existing.invoiceNumber}${existing.recipient?.name ? " — " + existing.recipient.name : ""}`,
            date:        new Date(),
            group:       groupId,
            user:        existing.createdBy,
            items:       financeItems,
        }).save();

        inv.financeEntryId = entry._id;
        await inv.save();
    }

    return inv;
};

export const deleteGeneralInvoice = async (id, groupId) => {
    const inv = await GeneralInvoice.findOneAndDelete({ _id: id, group: groupId });
    if (!inv) throw Object.assign(new Error("General invoice not found"), { status: 404 });
    if (inv.financeEntryId) {
        await Finance.findByIdAndDelete(inv.financeEntryId).catch(() => {});
    }
};

export const getGeneralInvoicePDF = async (id, groupId) => {
    const inv = await GeneralInvoice.findOne({ _id: id, group: groupId })
        .populate("recipient")
        .populate("generalOrder", "goNumber")
        .populate("items.product", "name unit");
    if (!inv) throw Object.assign(new Error("General invoice not found"), { status: 404 });
    const group = await Group.findById(groupId).lean();
    return generatePDF(renderGeneralInvoiceHtml(inv.toObject(), group));
};

export const sendGeneralInvoice = async (id, groupId, { recipientEmail } = {}) => {
    const inv = await GeneralInvoice.findOne({ _id: id, group: groupId })
        .populate("recipient")
        .populate("generalOrder", "goNumber")
        .populate("items.product", "name unit");
    if (!inv) throw Object.assign(new Error("General invoice not found"), { status: 404 });

    const toEmail = recipientEmail || inv.recipient?.email;
    if (!toEmail) throw Object.assign(new Error("No recipient email address available."), { status: 400 });

    const group = await Group.findById(groupId).lean();
    const pdf   = await generatePDF(renderGeneralInvoiceHtml(inv.toObject(), group));

    await sendMail({
        to: toEmail,
        subject: `Invoice ${inv.invoiceNumber} from ${group?.name || "OpenLedger"}`,
        html: `<p>Hi ${inv.recipient?.name || "there"},</p><p>Please find invoice <strong>${inv.invoiceNumber}</strong> attached.</p><p>Amount: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(inv.grandTotal || 0)}${inv.dueDate ? " · Due " + new Date(inv.dueDate).toLocaleDateString("en-IN") : ""}.</p><p>Thank you.</p>`,
        attachments: [{ filename: `${inv.invoiceNumber}.pdf`, content: pdf }],
    });

    await GeneralInvoice.findByIdAndUpdate(id, { status: "sent" });
    return { success: true };
};
