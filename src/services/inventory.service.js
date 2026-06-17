import Inventory from "../models/inventory.model.js";
import Group from "../models/group.model.js";

export const getAllInventory = () => Inventory.find().populate("product").populate("splitAmong");

export const getInventoryById = async (id) => {
    const item = await Inventory.findById(id);
    if (!item) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
    return item;
};

export const upsertInventory = async ({ inventoryData, groupId }) => {
    const results = [];
    for (const item of inventoryData) {
        const existing = await Inventory.findOne({
            product: item.product,
            splitAmong: item.splitAmong,
        });
        if (existing) {
            existing.unit = item.unit;
            existing.price = item.price;
            existing.quantityAvailable += item.quantityAvailable;
            existing.lastUpdated = new Date();
            await existing.save();
            results.push(existing);
        } else {
            const created = await new Inventory(item).save();
            await Group.updateOne({ _id: groupId }, { $addToSet: { inventories: created._id } });
            results.push(created);
        }
    }
    return results;
};

export const updateInventory = async (id, body) => {
    const item = await Inventory.findByIdAndUpdate(id, body, { new: true });
    if (!item) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
    return item;
};

export const deleteInventory = async (id) => {
    const item = await Inventory.findByIdAndDelete(id);
    if (!item) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
};
