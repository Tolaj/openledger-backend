import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";
import Inventory from "../models/inventory.model.js";
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

export const deleteProduct = async (id) => {
    const inWishlist = await Wishlist.exists({ "items.product": id });
    const inInventory = await Inventory.exists({ product: id });
    if (inWishlist || inInventory)
        throw Object.assign(new Error("Product is referenced by wishlists or inventory"), { status: 400 });
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
};
