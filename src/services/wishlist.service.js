import Wishlist from "../models/wishlist.model.js";
import Group from "../models/group.model.js";

const populate = [
    { path: "items.product" },
    { path: "paidBy" },
    { path: "createdBy" },
    { path: "items.splitAmong" },
];

export const getAllWishlists = async (groupId) => {
    if (groupId) {
        const group = await Group.findById(groupId).select("wishlists").lean();
        return Wishlist.find({ _id: { $in: group?.wishlists || [] } }).populate(populate);
    }
    return Wishlist.find().populate(populate);
};

export const getWishlistById = async (id) => {
    const wishlist = await Wishlist.findById(id).populate(populate);
    if (!wishlist) throw Object.assign(new Error("Wishlist not found"), { status: 404 });
    return wishlist;
};

export const createWishlist = async (body) => {
    const wishlist = await new Wishlist(body).save();
    await Group.updateOne({ _id: body.groupId }, { $addToSet: { wishlists: wishlist._id } });
    return wishlist;
};

export const updateWishlist = async (id, body) => {
    const wishlist = await Wishlist.findByIdAndUpdate(id, body, { new: true });
    if (!wishlist) throw Object.assign(new Error("Wishlist not found"), { status: 404 });
    return wishlist;
};

export const deleteWishlist = async (id) => {
    const wishlist = await Wishlist.findByIdAndDelete(id);
    if (!wishlist) throw Object.assign(new Error("Wishlist not found"), { status: 404 });
};
