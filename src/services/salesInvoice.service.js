import SalesInvoice from "../models/salesInvoice.model.js";
import Delivery from "../models/delivery.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import Counter from "../models/counter.model.js";
import Finance from "../models/finance.model.js";

const nextInvoiceNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `sinv_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `SINV-${String(counter.seq).padStart(4, "0")}`;
};

const populateInvoice = (query) =>
    query
        .populate({ path: "customer", select: "name" })
        .populate({ path: "salesOrder", select: "soNumber" })
        .populate({ path: "delivery", select: "deliveryNumber" })
        .populate({ path: "items.product", select: "name unit", populate: { path: "category", select: "name icon" } });

export const getAllSalesInvoices = (groupId) =>
    populateInvoice(
        SalesInvoice.find({ group: groupId }).sort({ createdAt: -1 })
    );

export const getSalesInvoiceById = async (id, groupId) => {
    const inv = await populateInvoice(
        SalesInvoice.findOne({ _id: id, group: groupId })
    );
    if (!inv) throw Object.assign(new Error("Sales invoice not found"), { status: 404 });
    return inv;
};

export const createSalesInvoice = async (body) => {
    const { group, salesOrder: soId, delivery: deliveryId, createdBy, items = [], dueDate, notes, invoiceDate } = body;

    let resolvedItems = items;
    let customerId = body.customer;

    if (deliveryId && (!items || items.length === 0)) {
        const delivery = await Delivery.findOne({ _id: deliveryId, group }).populate("salesOrder");
        if (delivery) {
            const so = delivery.salesOrder;
            customerId = customerId || so?.customer;
            resolvedItems = delivery.items.map((it) => ({
                ...(it.product ? { product: it.product } : {}),
                description: it.description,
                qty: it.qtyDelivered,
                unit: it.unit,
                unitPrice: it.unitPrice,
                taxRate: 0,
                amount: it.qtyDelivered * it.unitPrice,
            }));
        }
    } else if (soId && (!items || items.length === 0)) {
        const so = await SalesOrder.findOne({ _id: soId, group });
        if (so) {
            customerId = customerId || so.customer;
            resolvedItems = so.items.map((it) => ({
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

    const inv = await new SalesInvoice({
        invoiceNumber,
        salesOrder:  soId || undefined,
        delivery:    deliveryId || undefined,
        customer:    customerId,
        group,
        items:       resolvedItems,
        subtotal,
        taxAmount,
        grandTotal,
        invoiceDate: invoiceDate || new Date(),
        dueDate:     dueDate || undefined,
        notes,
        createdBy,
    }).save();

    return populateInvoice(SalesInvoice.findById(inv._id));
};

export const updateSalesInvoice = async (id, groupId, data) => {
    const existing = await SalesInvoice.findOne({ _id: id, group: groupId }).populate("customer", "name");
    if (!existing) throw Object.assign(new Error("Sales invoice not found"), { status: 404 });

    const inv = await SalesInvoice.findOneAndUpdate(
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

    // Auto-create income Finance entry when invoice is marked paid
    if (data.status === "paid" && existing.status !== "paid" && !existing.financeEntryId) {
        // Populate product with category for line items
        const populated = await SalesInvoice.findById(existing._id)
            .populate("items.product", "name category");

        const financeItems = (populated?.items || []).map((it) => ({
            name:     it.product?.name || it.description || "Item",
            qty:      it.qty || 1,
            amount:   it.amount || 0,
            category: it.product?.category || undefined,
        }));

        const entry = await new Finance({
            type:        "income",
            amount:      existing.grandTotal,
            description: `${existing.invoiceNumber}${existing.customer?.name ? " — " + existing.customer.name : ""}`,
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

export const deleteSalesInvoice = async (id, groupId) => {
    const inv = await SalesInvoice.findOneAndDelete({ _id: id, group: groupId });
    if (!inv) throw Object.assign(new Error("Sales invoice not found"), { status: 404 });
    if (inv.financeEntryId) {
        await Finance.findByIdAndDelete(inv.financeEntryId).catch(() => {});
    }
};
