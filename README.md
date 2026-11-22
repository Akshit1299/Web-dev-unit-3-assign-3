# Inventory and Data Management System

Backend for Web Dev III, Assignment 3. Built with Node.js, Express, MongoDB (Mongoose) and dotenv.

## Setup

1. Create a free cluster on MongoDB Atlas and get your connection string
2. `npm install`
3. Open `.env` and replace `MONGO_URI` with your Atlas connection string (add `/inventory_db` before the `?`)
4. `npm run seed` (optional, adds 12 sample products)
5. `npm start`  (server runs on http://localhost:5000)

## Endpoints

| Method | URL | What it does |
|--------|-----|--------------|
| POST | /api/products | create a product |
| GET | /api/products | list products (filter, sort, paginate) |
| GET | /api/products/:id | get one product |
| PUT | /api/products/:id | update product details |
| PATCH | /api/products/:id/stock | restock / sale, body `{ "change": 10 }` or `{ "change": -3 }` |
| DELETE | /api/products/:id | delete a product |
| GET | /api/products/low-stock | products with quantity <= reorderLevel |
| GET | /api/products/summary | category wise totals (aggregation) |

### Query params for GET /api/products

- `category=Electronics`
- `supplier=ikea`
- `search=pen` (name or sku)
- `minPrice=100&maxPrice=5000`
- `inStock=true`
- `sort=-price,name` (prefix `-` for descending)
- `page=2&limit=5`

### Sample create body

```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```
