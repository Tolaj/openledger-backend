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
import financeRoutes from "./finance.routes.js";
import budgetRoutes from "./budget.routes.js";
import vendorRoutes from "./vendor.routes.js";
import customerRoutes from "./customer.routes.js";
import purchaseOrderRoutes from "./purchaseOrder.routes.js";
import salesOrderRoutes from "./salesOrder.routes.js";
import grnRoutes from "./grn.routes.js";
import deliveryRoutes from "./delivery.routes.js";
import purchaseInvoiceRoutes from "./purchaseInvoice.routes.js";
import salesInvoiceRoutes from "./salesInvoice.routes.js";
import recipientRoutes from "./recipient.routes.js";
import generalOrderRoutes from "./generalOrder.routes.js";
import generalInvoiceRoutes from "./generalInvoice.routes.js";
import recurringRoutes from "./recurring.routes.js";
import stockMovementRoutes from "./stockMovement.routes.js";

const configRoutes = (app) => {
    app.get("/", (req, res) => {
        res.json({ message: "Welcome to the OpenLedger API" });
    });

    app.get("/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Exchange rate proxy — avoids CORS issues fetching rates from the browser
    // Uses open.er-api.com (free, no key, reliable)
    app.get("/api/exchange-rate", async (req, res) => {
        const { from, to } = req.query
        if (!from || !to) return res.status(400).json({ error: "from and to are required" })
        if (from === to) return res.json({ rate: 1 })
        try {
            const r = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`)
            if (!r.ok) throw new Error(`Exchange API responded ${r.status}`)
            const data = await r.json()
            if (data.result !== "success") throw new Error(data["error-type"] || "API error")
            const rate = data.rates?.[to.toUpperCase()]
            if (!rate) throw new Error(`Currency ${to} not supported`)
            res.json({ rate })
        } catch (err) {
            res.status(502).json({ error: err.message || "Failed to fetch exchange rate" })
        }
    })

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
    app.use("/api/finance", financeRoutes);
    app.use("/api/budgets", budgetRoutes);
    app.use("/api/vendors", vendorRoutes);
    app.use("/api/customers", customerRoutes);
    app.use("/api/purchase-orders", purchaseOrderRoutes);
    app.use("/api/sales-orders", salesOrderRoutes);
    app.use("/api/grns", grnRoutes);
    app.use("/api/deliveries", deliveryRoutes);
    app.use("/api/purchase-invoices", purchaseInvoiceRoutes);
    app.use("/api/sales-invoices", salesInvoiceRoutes);
    app.use("/api/recipients", recipientRoutes);
    app.use("/api/general-orders", generalOrderRoutes);
    app.use("/api/general-invoices", generalInvoiceRoutes);
    app.use("/api/recurring", recurringRoutes);
    app.use("/api/stock-movements", stockMovementRoutes);

    app.use("/{*splat}", (req, res) => {
        res.status(404).json({ error: "Not Found" });
    });
};

export default configRoutes;
