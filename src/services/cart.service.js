import Cart from "../models/cart.model.js";

export const getCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate("items.groceryItemId");
    return cart ?? { items: [] };
};

export const upsertCart = async ({ userId, items }) => {
    return Cart.findOneAndUpdate(
        { user: userId },
        { user: userId, items },
        { upsert: true, new: true }
    );
};

export const deleteCart = async (userId) => {
    await Cart.deleteOne({ user: userId });
};
