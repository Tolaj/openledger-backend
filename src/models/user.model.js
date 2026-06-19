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
        onboardingComplete: { type: Boolean, default: false },
        accountType: { type: String, enum: ["personal", "business"], default: "personal" },
        businessName: { type: String },
        currency: { type: String, default: "INR" },
        country: { type: String, default: "IN" },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    this.email = this.email.toLowerCase();
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    this.$locals.isNew = this.isNew;
});

// No auto-group on registration — the first group is created during onboarding.

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
