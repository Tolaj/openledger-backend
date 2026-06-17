# OpenLedger Backend — API Reference

## Overview
REST API for a household finance and grocery management app. Base URL: `/api`. Auth uses a JWT stored in an `httpOnly` cookie named `auth` — the frontend never touches the token directly, just sends cookies with every request.

---

## Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | `{ name, email, password }` → creates user, returns user object |
| POST | `/login` | ❌ | `{ email, password }` → sets `auth` cookie, returns `{ user }` |
| POST | `/logout` | ❌ | Clears `auth` cookie |
| GET | `/session` | ❌ | Returns `{ user: { id, email, groupId } }` from current cookie |

> On login, `groupId` in the response is the user's **personal isolated group** — use it as the default scope for all data operations.

---

## Users — `/api/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | ✅ | Returns current user with populated groups and friends |
| PATCH | `/:id` | ❌ | Partial update e.g. `{ onboardingSeen: true }` |

---

## Groups — `/api/groups`
Everything in the app is scoped to a group. Every user gets a personal `ISOLATED_GROUP` on registration. Shared groups can be created with friends.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All groups |
| GET | `/:id` | Single group with members |
| POST | `/` | `{ name, members: [userId], userId }` — `userId` is always added to members |
| PUT | `/:id` | Update group |
| DELETE | `/:id` | Delete group (removes from all members) |

---

## Categories — `/api/categories`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All categories |
| GET | `/:id` | Single category |
| POST | `/` | `{ name, icon, color, groupId }` |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Fails with `400` if any product references this category |

---

## Products — `/api/products`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All products (populated `category`) |
| GET | `/:id` | Single product |
| POST | `/` | `{ name, category, price, unit, groupId, description?, manufacturer?, fileUrl? }` |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Fails with `400` if referenced by wishlist or inventory |

---

## Orders — `/api/orders`
Shopping trips. Product data is **snapshot-stored** on the order — not a reference. Never try to populate `items.product`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All orders (populated `paidBy`, `createdBy`, `items.splitAmong`) |
| GET | `/:id` | Single order |
| POST | `/` | `{ name, date, totalPrice, groupId, createdBy, paidBy, items[] }` |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

**Item shape:**
```json
{
  "product": "<productId or full object>",
  "unit": "kg",
  "price": "2.99",
  "count": "2",
  "splitType": "equal | percentage | custom",
  "splitAmong": ["userId1", "userId2"]
}
```

---

## Inventory — `/api/inventory`
Tracks stock levels. POST **upserts** — if the same `product + splitAmong` combo exists, it increments `quantityAvailable`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All inventory (populated `product`, `splitAmong`) |
| GET | `/:id` | Single item |
| POST | `/` | `{ inventoryData: [{ product, unit, price, quantityAvailable, splitAmong }], groupId }` |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

---

## Wishlists — `/api/wishlists`
Same structure as orders but items reference products by ID (not snapshots).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All wishlists (populated `items.product`, `paidBy`, `createdBy`, `items.splitAmong`) |
| GET | `/:id` | Single wishlist |
| POST | `/` | `{ name, date, totalPrice, groupId, items[] }` |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

---

## Friends — `/api/friends`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | `{ _id: userId, friendEmail }` — sends request; auto-accepts if reverse-pending |
| POST | `/receive` | `{ userId, friendId, action: "ACCEPTED" \| "REJECTED" \| "DELETE" }` |

> `DELETE` action fails with `400` if the two users share a non-isolated group. Remove from shared group first.

---

## Templates — `/api/templates`
Pre-built or custom product/category sets that can be applied to a group.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Returns system templates + caller's own. Pass `?userId=` if unauthenticated |
| POST | `/` | ✅ | Create custom template |
| DELETE | `/:id` | ✅ | Delete (only own non-system templates) |

---

## Apply Template — `/api/apply-template`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | `{ templateId, groupId }` — replaces group's categories/products with template's. Returns `409 { message: "conflict", conflicts: [productNames] }` if referenced products would be removed |

---

## Carts — `/api/carts`
Lightweight server-side cart (localStorage is primary on frontend).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/?userId=` | Get cart for user |
| POST | `/` | `{ userId, items: [{ groceryItemId, unit }] }` — upserts |
| DELETE | `/` | `{ userId }` — clears cart |

---

## Error Responses
All errors follow the same shape:
```json
{ "error": "Human readable message" }
```
| Status | Meaning |
|--------|---------|
| `400` | Validation or business logic failure |
| `401` | Missing or invalid auth cookie |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict (template apply with referenced products) |
| `500` | Unexpected server error |

---

## Key Frontend Notes
- Send all requests with `credentials: "include"` (or `withCredentials: true` in axios) so cookies are attached automatically
- On app load, call `GET /api/auth/session` to check if the user is logged in
- The `groupId` from the session payload is the user's personal group — use it as the default `groupId` for all create operations
- `GET /health` can be polled to check server status
