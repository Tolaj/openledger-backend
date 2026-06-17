import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const friendSchema = new mongoose.Schema(
    {
        requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        friends: [friendSchema],
        groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
        onboardingSeen: { type: Boolean, default: false },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    this.email = this.email.toLowerCase();
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    this.$locals.isNew = this.isNew;
    next();
});

userSchema.post("save", async function (doc) {
    if (!doc.$locals?.isNew) return;
    const Group = mongoose.model("Group");
    const group = new Group({ name: "ISOLATED_GROUP", members: [doc._id] });
    group.$locals = { isNew: true };
    const saved = await group.save();
    await mongoose.model("User").updateOne({ _id: doc._id }, { $push: { groups: saved._id } });
});

userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password;
        return ret;
    },
});

export default mongoose.model("User", userSchema);
