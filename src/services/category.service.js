import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import Group from "../models/group.model.js";

export const getAllCategories = async (groupId) => {
    if (groupId) {
        const group = await Group.findById(groupId).select("categories")
        const ids = group?.categories || []
        return Category.find({ _id: { $in: ids } })
    }
    return Category.find()
};

export const getCategoryById = async (id) => {
    const cat = await Category.findById(id);
    if (!cat) throw Object.assign(new Error("Category not found"), { status: 404 });
    return cat;
};

export const createCategory = async (body) => {
    const cat = await new Category(body).save();
    await Group.updateOne({ _id: body.groupId }, { $addToSet: { categories: cat._id } });
    return cat;
};

export const updateCategory = async (id, body) => {
    const cat = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!cat) throw Object.assign(new Error("Category not found"), { status: 404 });
    return cat;
};

export const deleteCategory = async (id) => {
    const inUse = await Product.exists({ category: id });
    if (inUse)
        throw Object.assign(new Error("Category is referenced by one or more products"), { status: 400 });
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) throw Object.assign(new Error("Category not found"), { status: 404 });
};
