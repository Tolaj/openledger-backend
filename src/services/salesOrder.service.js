import SalesOrder from "../models/salesOrder.model.js";
import Group from "../models/group.model.js";
import Counter from "../models/counter.model.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderSOHtml } from "../utils/soTemplate.js";

const calcTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0) / 100), 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

const nextSoNumber = async (groupId) => {
    const key = `so_${groupId}`;
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `SO-${String(counter.seq).padStart(4, "0")}`;
};

export const getAllSalesOrders = (groupId) =>
    SalesOrder.find({ group: groupId })
        .populate("customer", "name email phone")
        .populate("items.product", "name")
        .sort({ createdAt: -1 });

export const getSalesOrderById = async (id, groupId) => {
    const so = await SalesOrder.findOne({ _id: id, group: groupId })
        .populate("customer")
        .populate("items.product");
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });
    return so;
};

export const createSalesOrder = async (body) => {
    const soNumber = await nextSoNumber(body.group);
    const totals = calcTotals(body.items || []);
    return new SalesOrder({ ...body, soNumber, ...totals }).save();
};

export const updateSalesOrder = async (id, groupId, body) => {
    const totals = body.items ? calcTotals(body.items) : {};
    const so = await SalesOrder.findOneAndUpdate(
        { _id: id, group: groupId },
        { ...body, ...totals },
        { new: true }
    ).populate("customer", "name").populate("items.product", "name");
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });
    return so;
};

export const deleteSalesOrder = async (id, groupId) => {
    const so = await SalesOrder.findOneAndDelete({ _id: id, group: groupId });
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });
};

export const getSalesOrderPDF = async (id, groupId) => {
    const so = await SalesOrder.findOne({ _id: id, group: groupId })
        .populate("customer")
        .populate("items.product", "name unit");
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });

    const group = await Group.findById(groupId).lean();
    const html = renderSOHtml(so.toObject(), group);
    const pdfBuffer = await generatePDF(html);
    return { pdfBuffer, filename: `${so.soNumber}.pdf` };
};

export const sendSalesOrder = async (id, groupId, { recipientEmail } = {}) => {
    const so = await SalesOrder.findOne({ _id: id, group: groupId })
        .populate("customer")
        .populate("items.product", "name unit");
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });

    const toEmail = recipientEmail || so.customer?.email;
    if (!toEmail) throw Object.assign(new Error("Customer has no email address. Please provide a recipient email."), { status: 400 });

    const group = await Group.findById(groupId).lean();
    const html = renderSOHtml(so.toObject(), group);
    const pdfBuffer = await generatePDF(html);

    await sendMail({
        to: toEmail,
        subject: `Sales Order ${so.soNumber} from ${group?.name || "OpenLedger"}`,
        html: `
            <p>Dear ${so.customer?.name || "Customer"},</p>
            <p>Please find attached our Sales Order <strong>${so.soNumber}</strong> for your reference.</p>
            <p>Kindly review and confirm at your earliest convenience.</p>
            <br/>
            <p>Thank you,<br/>${group?.name || "OpenLedger"}</p>
        `,
        attachments: [{ filename: `${so.soNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });

    const updated = await SalesOrder.findByIdAndUpdate(id, { status: "sent" }, { new: true })
        .populate("customer", "name email phone")
        .populate("items.product", "name");
    return updated;
};
