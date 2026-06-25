import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        displayName: { type: String },
        type: { type: String, enum: ["personal", "business"], default: "personal" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        memberRoles: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
        }],
        currency: { type: String, default: "INR" },   // shared by all group members
        // Business details (only relevant when type === 'business')
        businessDetails: {
            logo:     { type: String },
            template: { type: String, enum: ["classic", "modern", "minimal", "executive", "bold", "elegant", "retro", "compact", "stripe", "bureau"], default: "classic" },
            color:    { type: String, default: "forest" },
            emailEnabled: { type: Boolean, default: false },
            smtpUser:     { type: String },
            smtpPass:     { type: String },   // stored but never returned to client
            legalName:   { type: String },
            gstin:       { type: String },
            pan:         { type: String },
            email:       { type: String },
            phone:       { type: String },
            website:     { type: String },
            addressLine1:{ type: String },
            addressLine2:{ type: String },
            city:        { type: String },
            state:       { type: String },
            pincode:     { type: String },
            country:     { type: String, default: "India" },
        },
        orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
        wishlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Wishlist" }],
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        inventories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inventory" }],
        finances: [{ type: mongoose.Schema.Types.ObjectId, ref: "Finance" }],
        resourcePlans: [{ type: mongoose.Schema.Types.ObjectId, ref: "ResourcePlan" }],
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                if (ret.businessDetails) {
                    ret.businessDetails.smtpConfigured = !!(ret.businessDetails.smtpUser && ret.businessDetails.smtpPass)
                    delete ret.businessDetails.smtpPass
                }
                return ret
            }
        }
    }
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
