import mongoose from "mongoose";

// Full page→tab→actions map (single source of truth)
export const PAGES = [
  { key: "products", label: "Products", tabs: [
    { key: "products",  label: "Products",  actions: ["view","add","edit","delete","cart"] },
    { key: "category",  label: "Category",  actions: ["view","add","edit","delete"] },
    { key: "wishlist",  label: "Wish List", actions: ["view","add","edit","delete","cart"] },
    { key: "orders",    label: "Orders",    actions: ["view","delete"] },
  ]},
  { key: "stock", label: "Stock", tabs: [
    { key: "levels",     label: "Levels",     actions: ["view","cart","delete"] },
    { key: "movements",  label: "Movements",  actions: ["view"] },
    { key: "adjustment", label: "Adjustment", actions: ["view","add"] },
  ]},
  { key: "general_orders", label: "General Orders", tabs: [
    { key: "gen_orders",   label: "Orders",     actions: ["view","add","status","email","delete"] },
    { key: "gen_invoices", label: "Invoice",    actions: ["view","add","status","email","delete"] },
    { key: "recipients",   label: "Recipients", actions: ["view","add","edit","delete"] },
    { key: "recurring",    label: "Recurring",  actions: ["view","add","status","edit","delete"] },
  ]},
  { key: "purchase_orders", label: "Purchase Orders", tabs: [
    { key: "po",       label: "Purchase Orders", actions: ["view","add","status","email","delete"] },
    { key: "grn",      label: "Goods Receipt",   actions: ["view","add","delete"] },
    { key: "po_inv",   label: "Invoice",         actions: ["view","add","status","email","delete"] },
    { key: "vendors",  label: "Vendors",         actions: ["view","add","edit","delete"] },
  ]},
  { key: "sales_orders", label: "Sales Orders", tabs: [
    { key: "so",       label: "Sales Orders", actions: ["view","add","status","email","delete"] },
    { key: "delivery", label: "Delivery",     actions: ["view","add","delete"] },
    { key: "so_inv",   label: "Invoice",      actions: ["view","add","status","email","delete"] },
    { key: "customers",label: "Customers",    actions: ["view","add","edit","delete"] },
  ]},
  { key: "finance", label: "Finance", tabs: [
    { key: "overview",      label: "Overview",     actions: ["view"] },
    { key: "transactions",  label: "Transactions", actions: ["view","add","edit","delete"] },
    { key: "budget",        label: "Budget",       actions: ["view","add","edit","delete"] },
    { key: "ap_ar",         label: "AP/AR",        actions: ["view"] },
  ]},
  { key: "cart", label: "Cart", tabs: [] },   // page-level only
  { key: "settings", label: "Settings", tabs: [
    { key: "team",          label: "Team",          actions: ["view","add","edit","delete"] },
    { key: "roles",         label: "Roles",         actions: ["view","add","edit","delete"] },
    { key: "workspace",     label: "Workspace",     actions: ["view","edit","delete"] },
    { key: "configuration", label: "Configuration", actions: ["view","edit"] },
  ], alwaysAccessible: true },
];

// All possible action fields across all tabs
const ALL_ACTIONS = ["view","add","edit","delete","status","email","cart","place_order"];

const permissionSchema = new mongoose.Schema(
  {
    page:        { type: String, required: true },
    tab:         { type: String, default: null },   // null = page-level entry
    view:        { type: Boolean, default: false },
    add:         { type: Boolean, default: false },
    edit:        { type: Boolean, default: false },
    delete:      { type: Boolean, default: false },
    status:      { type: Boolean, default: false },
    email:       { type: Boolean, default: false },
    cart:        { type: Boolean, default: false },
    place_order: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    groupId:     { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    name:        { type: String, required: true },
    description: { type: String },
    isDefault:   { type: Boolean, default: false },
    isSystem:    { type: Boolean, default: false },   // true = Admin role, non-editable
    permissions: [permissionSchema],
  },
  { timestamps: true }
);

// Build all-true permissions for the Admin role
export const buildAdminPermissions = () => {
  const perms = [];
  for (const page of PAGES) {
    // page-level view
    const pageEntry = { page: page.key, tab: null, view: true };
    if (page.key === "cart") pageEntry.place_order = true;
    perms.push(pageEntry);
    // tab-level — all applicable actions true
    for (const tab of page.tabs) {
      const entry = { page: page.key, tab: tab.key };
      for (const action of ALL_ACTIONS) {
        entry[action] = tab.actions.includes(action);
      }
      perms.push(entry);
    }
  }
  return perms;
};

export default mongoose.model("Role", roleSchema);
