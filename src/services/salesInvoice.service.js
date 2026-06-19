import SalesInvoice from "../models/salesInvoice.model.js";
import Delivery from "../models/delivery.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import Counter from "../models/counter.model.js";

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
        .populate("items.product", "name unit");

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
    const inv = await SalesInvoice.findOneAndUpdate(
        { _id: id, group: groupId },
        data,
        { new: true }
    );
    if (!inv) throw Object.assign(new Error("Sales invoice not found"), { status: 404 });
    return inv;
};

export const deleteSalesInvoice = async (id, groupId) => {
    const inv = await SalesInvoice.findOneAndDelete({ _id: id, group: groupId });
    if (!inv) throw Object.assign(new Error("Sales invoice not found"), { status: 404 });
};
