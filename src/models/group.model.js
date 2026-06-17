import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
        wishlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Wishlist" }],
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        inventories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inventory" }],
        finances: [{ type: mongoose.Schema.Types.ObjectId, ref: "Finance" }],
        resourcePlans: [{ type: mongoose.Schema.Types.ObjectId, ref: "ResourcePlan" }],
    },
    { timestamps: true }
);

groupSchema.post("save", async function (doc) {
    if (doc.$locals?.isNew && doc.name !== "ISOLATED_GROUP") {
        const User = mongoose.model("User");
        await User.updateMany(
            { _id: { $in: doc.members } },
            { $addToSet: { groups: doc._id } }
        );
    }
});

groupSchema.post("findOneAndDelete", async function (doc) {
    if (!doc) return;
    const User = mongoose.model("User");
    await User.updateMany(
        { _id: { $in: doc.members } },
        { $pull: { groups: doc._id } }
    );
});

export default mongoose.model("Group", groupSchema);
