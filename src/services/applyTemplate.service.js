import Template from "../models/template.model.js";
import Group from "../models/group.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import "../models/resourcePlan.model.js"; // register model so populate("resourcePlans") doesn't throw

export const applyTemplate = async ({ templateId, groupId }) => {
    const [template, group] = await Promise.all([
        Template.findById(templateId),
        Group.findById(groupId)
            .populate("categories")
            .populate("products")
            .populate("orders")
            .populate("inventories")
            .populate("wishlists"),
    ]);

    if (!template) throw Object.assign(new Error("Template not found"), { status: 404 });
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });

    const referencedProductIds = new Set();
    for (const order of group.orders) {
        for (const item of order.items ?? []) {
            const pid = item.product?._id ?? item.product;
            if (pid) referencedProductIds.add(String(pid));
        }
    }
    for (const inv of group.inventories) {
        if (inv.product) referencedProductIds.add(String(inv.product));
    }
    for (const wl of group.wishlists) {
        for (const item of wl.items ?? []) {
            if (item.product) referencedProductIds.add(String(item.product));
        }
    }

    const templateProductNames = new Set(template.products.map((p) => p.name));

    const conflicts = group.products
        .filter((p) => referencedProductIds.has(String(p._id)) && !templateProductNames.has(p.name))
        .map((p) => p.name);

    if (conflicts.length > 0)
        throw Object.assign(new Error("conflict"), { status: 409, conflicts });

    const productsToDelete = group.products.filter((p) => !referencedProductIds.has(String(p._id)));
    const productIdsToDelete = productsToDelete.map((p) => p._id);
    await Product.deleteMany({ _id: { $in: productIdsToDelete } });
    await Group.updateOne({ _id: groupId }, { $pull: { products: { $in: productIdsToDelete } } });

    const remainingProducts = group.products.filter(
        (p) => !productIdsToDelete.some((id) => String(id) === String(p._id))
    );
    const categoriesToDelete = group.categories.filter(
        (c) => !remainingProducts.some((p) => String(p.category) === String(c._id))
    );
    const catIdsToDelete = categoriesToDelete.map((c) => c._id);
    await Category.deleteMany({ _id: { $in: catIdsToDelete } });
    await Group.updateOne({ _id: groupId }, { $pull: { categories: { $in: catIdsToDelete } } });

    const freshGroup = await Group.findById(groupId).populate("categories").populate("products");
    const existingCatNames = new Set(freshGroup.categories.map((c) => c.name));
    const existingProductNames = new Set(freshGroup.products.map((p) => p.name));

    const catNameToId = Object.fromEntries(freshGroup.categories.map((c) => [c.name, c._id]));
    const newCatIds = [];
    for (const catDef of template.categories) {
        if (!existingCatNames.has(catDef.name)) {
            // Strip _id so Mongoose always does an INSERT, not an UPDATE
            const { _id, __v, ...catData } = catDef.toObject ? catDef.toObject() : catDef;
            const created = await new Category(catData).save();
            newCatIds.push(created._id);
            catNameToId[catDef.name] = created._id;
        }
    }
    if (newCatIds.length > 0) {
        await Group.updateOne({ _id: groupId }, { $addToSet: { categories: { $each: newCatIds } } });
    }

    const newProductIds = [];
    for (const prodDef of template.products) {
        if (!existingProductNames.has(prodDef.name)) {
            const catId = catNameToId[prodDef.category];
            if (!catId) continue;
            const created = await new Product({
                name: prodDef.name,
                category: catId,
                price: prodDef.price ?? "0",
                unit: prodDef.unit ?? "unit",
                description: prodDef.description,
            }).save();
            newProductIds.push(created._id);
        }
    }
    if (newProductIds.length > 0) {
        await Group.updateOne({ _id: groupId }, { $addToSet: { products: { $each: newProductIds } } });
    }

    return Group.findById(groupId).populate("categories").populate("products");
};
