import PurchaseInvoice from "../models/purchaseInvoice.model.js";
import GRN from "../models/grn.model.js";
import PurchaseOrder from "../models/purchaseOrder.model.js";
import Counter from "../models/counter.model.js";
import Finance from "../models/finance.model.js";

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
        .populate({ path: "vendor", select: "name" })
        .populate({ path: "purchaseOrder", select: "poNumber" })
        .populate({ path: "grn", select: "grnNumber" })
        .populate("items.product", "name unit");

export const getAllPurchaseInvoices = (groupId) =>
    populateInvoice(
        PurchaseInvoice.find({ group: groupId }).sort({ createdAt: -1 })
    );

export const getPurchaseInvoiceById = async (id, groupId) => {
    const inv = await populateInvoice(
        PurchaseInvoice.findOne({ _id: id, group: groupId })
    );
    if (!inv) throw Object.assign(new Error("Purchase invoice not found"), { status: 404 });
    return inv;
};

export const createPurchaseInvoice = async (body) => {
    const { group, purchaseOrder: poId, grn: grnId, createdBy, items = [], dueDate, notes, invoiceDate } = body;

    // Auto-populate items from GRN if provided and no items passed
    let resolvedItems = items;
    let vendorId = body.vendor;

    if (grnId && (!items || items.length === 0)) {
        const grn = await GRN.findOne({ _id: grnId, group }).populate("purchaseOrder");
        if (grn) {
            const po = grn.purchaseOrder;
            vendorId = vendorId || po?.vendor;
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
        purchaseOrder: poId || undefined,
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

    const inv = await PurchaseInvoice.findOneAndUpdate(
        { _id: id, group: groupId },
        data,
        { new: true }
    );

    // Auto-create expense Finance entry when invoice is marked paid
    if (data.status === "paid" && existing.status !== "paid" && !existing.financeEntryId) {
        const entry = await new Finance({
            type:        "expense",
            amount:      existing.grandTotal,
            description: `${existing.invoiceNumber}${existing.vendor?.name ? " — " + existing.vendor.name : ""}`,
            date:        new Date(),
            group:       groupId,
            user:        existing.createdBy,
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
