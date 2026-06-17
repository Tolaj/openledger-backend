import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import groupRoutes from "./group.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import templateRoutes from "./template.routes.js";
import applyTemplateRoutes from "./applyTemplate.routes.js";
import friendRoutes from "./friend.routes.js";
import cartRoutes from "./cart.routes.js";

const configRoutes = (app) => {
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/groups", groupRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/wishlists", wishlistRoutes);
    app.use("/api/templates", templateRoutes);
    app.use("/api/apply-template", applyTemplateRoutes);
    app.use("/api/friends", friendRoutes);
    app.use("/api/carts", cartRoutes);

    app.use("/{*splat}", (req, res) => {
        res.status(404).json({ error: "Not Found" });
    });
};

export default configRoutes;
