import PurchaseOrder from "../models/purchaseOrder.model.js";
import GRN from "../models/grn.model.js";
import PurchaseInvoice from "../models/purchaseInvoice.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Group from "../models/group.model.js";
import Counter from "../models/counter.model.js";
import { sendMail } from "../utils/mailer.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { renderPOHtml } from "../utils/poTemplate.js";
import { writeMovement } from "./stockMovement.service.js";

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
    const existing = await PurchaseOrder.findOne({ _id: id, group: groupId });
    if (!existing) throw Object.assign(new Error("Purchase order not found"), { status: 404 });

    if (existing.status === "received" && body.status)
        throw Object.assign(new Error("Cannot change status of a fully received purchase order."), { status: 409 });

    const totals = body.items ? calcTotals(body.items) : {};
    const updated = await PurchaseOrder.findOneAndUpdate(
        { _id: id, group: groupId },
        { ...body, ...totals },
        { new: true }
    ).populate("vendor", "name email phone").populate("items.product", "name");

    // Auto-create GRN + draft invoice when PO is manually marked received
    if (body.status === "received" && existing.status !== "received") {
        // Check no GRN already exists for this PO
        const existingGRN = await GRN.findOne({ purchaseOrder: id, group: groupId });
        if (!existingGRN) {
            // Create GRN
            const grnCounter = await Counter.findOneAndUpdate(
                { key: `grn_${groupId}` },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const grnNumber = `GRN-${String(grnCounter.seq).padStart(4, "0")}`;
            const grnItems = existing.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qtyOrdered: it.qty,
                qtyReceived: it.qty,
                unit: it.unit,
                unitPrice: it.unitPrice,
            }));
            const grn = await new GRN({
                grnNumber,
                purchaseOrder: id,
                group: groupId,
                status: "complete",
                items: grnItems,
                receivedDate: existing.expectedDate || new Date(),
                createdBy: body.createdBy,
            }).save();

            // Update inventory stock IN (only for tracked products)
            for (const item of existing.items) {
                if (!item.product || item.qty <= 0) continue;
                const prod = await Product.findById(item.product).select("inventory");
                if (!prod?.inventory) continue;
                const inv = await Inventory.findOne({ product: item.product });
                if (inv) {
                    inv.quantityAvailable += item.qty;
                    inv.lastUpdated = new Date();
                    await inv.save();
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
                await writeMovement({
                    group: groupId,
                    product: item.product,
                    change: item.qty,
                    sourceType: "grn",
                    sourceRef: grnNumber,
                    sourceId: grn._id,
                    createdBy: body.createdBy,
                });
            }

            // Create draft invoice linked to GRN
            const invCounter = await Counter.findOneAndUpdate(
                { key: `pinv_${groupId}` },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const invoiceNumber = `PINV-${String(invCounter.seq).padStart(4, "0")}`;
            const invItems = grnItems.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty: it.qtyReceived,
                unit: it.unit,
                unitPrice: it.unitPrice,
                taxRate: 0,
                amount: it.qtyReceived * it.unitPrice,
            }));
            const subtotal   = invItems.reduce((s, i) => s + (i.amount || 0), 0);
            const taxAmount  = 0;
            const grandTotal = subtotal;
            await new PurchaseInvoice({
                invoiceNumber,
                purchaseOrder: id,
                grn: grn._id,
                vendor: existing.vendor,
                group: groupId,
                items: invItems,
                subtotal,
                taxAmount,
                grandTotal,
                invoiceDate: new Date(),
                dueDate: existing.expectedDate || undefined,
                status: "draft",
                createdBy: body.createdBy,
            }).save();
        }
    }

    return updated;
};

export const deletePurchaseOrder = async (id, groupId) => {
    const po = await PurchaseOrder.findOne({ _id: id, group: groupId });
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });

    const grnCount = await GRN.countDocuments({ purchaseOrder: id, group: groupId });
    if (grnCount > 0)
        throw Object.assign(new Error(`Cannot delete PO — ${grnCount} GRN(s) exist against it. Delete them first.`), { status: 409 });

    const invoiceCount = await PurchaseInvoice.countDocuments({ purchaseOrder: id, group: groupId });
    if (invoiceCount > 0)
        throw Object.assign(new Error(`Cannot delete PO — ${invoiceCount} purchase invoice(s) exist against it. Delete them first.`), { status: 409 });

    await po.deleteOne();
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

    // Mark PO as sent (only if not already at terminal status)
    const updated = await PurchaseOrder.findOneAndUpdate(
        { _id: id, status: { $ne: "received" } },
        { status: "sent" },
        { new: true }
    ).populate("vendor", "name").populate("items.product", "name");

    return updated;
};
