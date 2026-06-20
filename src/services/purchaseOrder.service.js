import PurchaseOrder from "../models/purchaseOrder.model.js";
import Group from "../models/group.model.js";
import Counter from "../models/counter.model.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderPOHtml } from "../utils/poTemplate.js";

const calcTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0) / 100), 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

const nextPoNumber = async (groupId) => {
    const key = `po_${groupId}`;
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `PO-${String(counter.seq).padStart(4, "0")}`;
};

export const getAllPurchaseOrders = (groupId) =>
    PurchaseOrder.find({ group: groupId })
        .populate("vendor", "name email phone")
        .populate("items.product", "name")
        .sort({ createdAt: -1 });

export const getPurchaseOrderById = async (id, groupId) => {
    const po = await PurchaseOrder.findOne({ _id: id, group: groupId })
        .populate("vendor")
        .populate("items.product");
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
    return po;
};

export const createPurchaseOrder = async (body) => {
    const poNumber = await nextPoNumber(body.group);
    const totals = calcTotals(body.items || []);
    return new PurchaseOrder({ ...body, poNumber, ...totals }).save();
};

export const updatePurchaseOrder = async (id, groupId, body) => {
    const totals = body.items ? calcTotals(body.items) : {};
    const po = await PurchaseOrder.findOneAndUpdate(
        { _id: id, group: groupId },
        { ...body, ...totals },
        { new: true }
    ).populate("vendor", "name email phone").populate("items.product", "name");
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
    return po;
};

export const deletePurchaseOrder = async (id, groupId) => {
    const po = await PurchaseOrder.findOneAndDelete({ _id: id, group: groupId });
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
};

export const getPurchaseOrderPDF = async (id, groupId) => {
    const po = await PurchaseOrder.findOne({ _id: id, group: groupId })
        .populate("vendor")
        .populate("items.product", "name unit");
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });

    const group = await Group.findById(groupId).lean();
    const html = renderPOHtml(po.toObject(), group);
    const pdfBuffer = await generatePDF(html);
    return { pdfBuffer, filename: `${po.poNumber}.pdf` };
};

export const sendPurchaseOrder = async (id, groupId, { recipientEmail } = {}) => {
    const po = await PurchaseOrder.findOne({ _id: id, group: groupId })
        .populate("vendor")
        .populate("items.product", "name unit");
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });

    const toEmail = recipientEmail || po.vendor?.email;
    if (!toEmail) throw Object.assign(new Error("Vendor has no email address. Please provide a recipient email."), { status: 400 });

    const group = await Group.findById(groupId).lean();

    // Generate PDF
    const html = renderPOHtml(po.toObject(), group);
    const pdfBuffer = await generatePDF(html);

    // Send email
    await sendMail({
        to: toEmail,
        subject: `Purchase Order ${po.poNumber} from ${group?.name || "OpenLedger"}`,
        html: `
            <p>Dear ${po.vendor?.name || "Vendor"},</p>
            <p>Please find attached our Purchase Order <strong>${po.poNumber}</strong>.</p>
            <p>Please review and confirm at your earliest convenience.</p>
            <br/>
            <p>Thank you,<br/>${group?.name || "OpenLedger"}</p>
        `,
        attachments: [
            {
                filename: `${po.poNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    });

    // Mark PO as sent
    const updated = await PurchaseOrder.findByIdAndUpdate(
        id,
        { status: "sent" },
        { new: true }
    ).populate("vendor", "name").populate("items.product", "name");

    return updated;
};
