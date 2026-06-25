import SalesOrder from "../models/salesOrder.model.js";
import Delivery from "../models/delivery.model.js";
import SalesInvoice from "../models/salesInvoice.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Group from "../models/group.model.js";
import Counter from "../models/counter.model.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderSOHtml } from "../utils/soTemplate.js";
import { writeMovement } from "./stockMovement.service.js";

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
    const existing = await SalesOrder.findOne({ _id: id, group: groupId });
    if (!existing) throw Object.assign(new Error("Sales order not found"), { status: 404 });

    if (existing.status === "delivered" && body.status)
        throw Object.assign(new Error("Cannot change status of a fully delivered sales order."), { status: 409 });

    const totals = body.items ? calcTotals(body.items) : {};
    const updated = await SalesOrder.findOneAndUpdate(
        { _id: id, group: groupId },
        { ...body, ...totals },
        { new: true }
    ).populate("customer", "name").populate("items.product", "name");

    // Auto-create Delivery + draft invoice when SO is manually marked delivered
    if (body.status === "delivered" && existing.status !== "delivered") {
        const existingDelivery = await Delivery.findOne({ salesOrder: id, group: groupId });
        if (!existingDelivery) {
            // Create Delivery
            const delCounter = await Counter.findOneAndUpdate(
                { key: `delivery_${groupId}` },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const deliveryNumber = `DEL-${String(delCounter.seq).padStart(4, "0")}`;
            const delItems = existing.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qtyOrdered: it.qty,
                qtyDelivered: it.qty,
                unit: it.unit,
                unitPrice: it.unitPrice,
            }));
            const delivery = await new Delivery({
                deliveryNumber,
                salesOrder: id,
                group: groupId,
                status: "complete",
                items: delItems,
                deliveredDate: existing.deliveryDate || new Date(),
                createdBy: body.createdBy,
            }).save();

            // Stock OUT (only for tracked products)
            for (const item of existing.items) {
                if (!item.product || item.qty <= 0) continue;
                const prod = await Product.findById(item.product).select("inventory");
                if (!prod?.inventory) continue;
                const inv = await Inventory.findOne({ product: item.product });
                if (inv) {
                    inv.quantityAvailable = Math.max(0, inv.quantityAvailable - item.qty);
                    inv.lastUpdated = new Date();
                    await inv.save();
                }
                await writeMovement({
                    group: groupId,
                    product: item.product,
                    change: -item.qty,
                    sourceType: "delivery",
                    sourceRef: deliveryNumber,
                    sourceId: delivery._id,
                    createdBy: body.createdBy,
                });
            }

            // Create draft sales invoice linked to SO and Delivery
            const invCounter = await Counter.findOneAndUpdate(
                { key: `sinv_${groupId}` },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const invoiceNumber = `SINV-${String(invCounter.seq).padStart(4, "0")}`;
            const invItems = existing.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty: it.qty,
                unit: it.unit,
                unitPrice: it.unitPrice,
                taxRate: it.taxRate ?? 0,
                amount: it.qty * it.unitPrice,
            }));
            const subtotal   = invItems.reduce((s, i) => s + (i.amount || 0), 0);
            const taxAmount  = invItems.reduce((s, i) => s + (i.amount || 0) * (i.taxRate || 0) / 100, 0);
            const grandTotal = subtotal + taxAmount;
            await new SalesInvoice({
                invoiceNumber,
                salesOrder: id,
                delivery: delivery._id,
                customer: existing.customer,
                group: groupId,
                items: invItems,
                subtotal,
                taxAmount,
                grandTotal,
                invoiceDate: new Date(),
                dueDate: existing.deliveryDate || undefined,
                status: "draft",
                createdBy: body.createdBy,
            }).save();
        }
    }

    return updated;
};

export const deleteSalesOrder = async (id, groupId) => {
    const so = await SalesOrder.findOne({ _id: id, group: groupId });
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });

    const deliveryCount = await Delivery.countDocuments({ salesOrder: id, group: groupId });
    if (deliveryCount > 0)
        throw Object.assign(new Error(`Cannot delete SO — ${deliveryCount} delivery/deliveries exist against it. Delete them first.`), { status: 409 });

    const invoiceCount = await SalesInvoice.countDocuments({ salesOrder: id, group: groupId });
    if (invoiceCount > 0)
        throw Object.assign(new Error(`Cannot delete SO — ${invoiceCount} sales invoice(s) exist against it. Delete them first.`), { status: 409 });

    await so.deleteOne();
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

    await sendMail({ smtpConfig: group?.businessDetails,
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

    const updated = await SalesOrder.findOneAndUpdate({ _id: id, status: { $ne: "delivered" } }, { status: "sent" }, { new: true })
        .populate("customer", "name email phone")
        .populate("items.product", "name");
    return updated;
};
