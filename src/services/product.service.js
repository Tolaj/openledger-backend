import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";
import Inventory from "../models/inventory.model.js";
import Order from "../models/order.model.js";
import Finance from "../models/finance.model.js";
import Budget from "../models/budget.model.js";
import Group from "../models/group.model.js";

export const getAllProducts = () => Product.find().populate("category");

export const getProductById = async (id) => {
    const product = await Product.findById(id).populate("category");
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    return product;
};

export const createProduct = async (body) => {
    const product = await new Product(body).save();
    await Group.updateOne({ _id: body.groupId }, { $addToSet: { products: product._id } });
    return product;
};

export const updateProduct = async (id, body) => {
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    return product;
};

const conv = (val, rate, decimals = 2) => {
    const n = parseFloat(val)
    return isNaN(n) ? val : (n * rate).toFixed(decimals)
}

/**
 * Convert all monetary values across the entire project for a user's groups.
 * Covers: Products, Inventory, Wishlists, Orders, Finance, Budgets.
 * rate = multiplier (e.g. 83.5 to go from USD → INR)
 */
export const convertGroupPrices = async (userId, rate) => {
    const groups = await Group.find({ members: userId }).select("_id products")
    if (!groups.length) return { updated: {} }

    const groupIds = groups.map(g => g._id)
    const productIds = groups.flatMap(g => g.products)

    const totals = {}

    // ── 1. Products ────────────────────────────────────────────────────────────
    if (productIds.length) {
        const products = await Product.find({ _id: { $in: productIds } })
        const ops = products
            .filter(p => !isNaN(parseFloat(p.price)))
            .map(p => ({
                updateOne: {
                    filter: { _id: p._id },
                    update: { $set: { price: conv(p.price, rate) } },
                },
            }))
        if (ops.length) { await Product.bulkWrite(ops); totals.products = ops.length }
    }

    // ── 2. Inventory ───────────────────────────────────────────────────────────
    // Inventory has no group field — it links to products, so query by product IDs
    const inventories = await Inventory.find({ product: { $in: productIds } })
    if (inventories.length) {
        const ops = inventories
            .filter(i => !isNaN(parseFloat(i.price)))
            .map(i => ({
                updateOne: {
                    filter: { _id: i._id },
                    update: { $set: { price: parseFloat(conv(i.price, rate)) } },
                },
            }))
        if (ops.length) { await Inventory.bulkWrite(ops); totals.inventory = ops.length }
    }

    // ── 3. Wishlists ───────────────────────────────────────────────────────────
    const wishlists = await Wishlist.find({ $or: [
        { createdBy: userId },
        { paidBy: userId },
    ]})
    if (wishlists.length) {
        const ops = wishlists.map(w => ({
            updateOne: {
                filter: { _id: w._id },
                update: {
                    $set: {
                        totalPrice: conv(w.totalPrice, rate),
                        items: w.items.map(item => ({
                            ...item.toObject(),
                            price: conv(item.price, rate),
                        })),
                    },
                },
            },
        }))
        await Wishlist.bulkWrite(ops)
        totals.wishlists = ops.length
    }

    // ── 4. Orders ──────────────────────────────────────────────────────────────
    const orders = await Order.find({ $or: [
        { createdBy: userId },
        { paidBy: userId },
    ]})
    if (orders.length) {
        const ops = orders.map(o => ({
            updateOne: {
                filter: { _id: o._id },
                update: {
                    $set: {
                        totalPrice: conv(o.totalPrice, rate),
                        items: o.items.map(item => ({
                            ...item.toObject ? item.toObject() : item,
                            price: conv(item.price, rate),
                        })),
                    },
                },
            },
        }))
        await Order.bulkWrite(ops)
        totals.orders = ops.length
    }

    // ── 5. Finance transactions ────────────────────────────────────────────────
    const finances = await Finance.find({ group: { $in: groupIds } })
    if (finances.length) {
        const ops = finances.map(f => ({
            updateOne: {
                filter: { _id: f._id },
                update: {
                    $set: {
                        amount: parseFloat(conv(f.amount, rate)),
                        splitAmong: f.splitAmong.map(s => ({
                            ...s.toObject(),
                            amount: parseFloat(conv(s.amount, rate)),
                        })),
                        debtTracking: f.debtTracking.map(d => ({
                            ...d.toObject(),
                            amount: parseFloat(conv(d.amount, rate)),
                        })),
                    },
                },
            },
        }))
        await Finance.bulkWrite(ops)
        totals.finance = ops.length
    }

    // ── 6. Budgets ─────────────────────────────────────────────────────────────
    const budgets = await Budget.find({ $or: [
        { group: { $in: groupIds } },
        { user: userId },
    ]})
    if (budgets.length) {
        const ops = budgets.map(b => ({
            updateOne: {
                filter: { _id: b._id },
                update: {
                    $set: {
                        totalAmount: parseFloat(conv(b.totalAmount, rate)),
                        amountSpent: parseFloat(conv(b.amountSpent, rate)),
                        categories: b.categories.map(c => ({
                            ...c.toObject(),
                            allocatedAmount: parseFloat(conv(c.allocatedAmount, rate)),
                            spentAmount: parseFloat(conv(c.spentAmount, rate)),
                        })),
                    },
                },
            },
        }))
        await Budget.bulkWrite(ops)
        totals.budgets = ops.length
    }

    return { updated: totals }
}

export const deleteProduct = async (id) => {
    const inWishlist = await Wishlist.exists({ "items.product": id });
    const inInventory = await Inventory.exists({ product: id });
    if (inWishlist || inInventory)
        throw Object.assign(new Error("Product is referenced by wishlists or inventory"), { status: 400 });
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
};
