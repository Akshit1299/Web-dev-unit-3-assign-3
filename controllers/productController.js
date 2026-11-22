const Product = require('../models/Product');

// small wrapper so we don't need try/catch in every function
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// GET /api/products
// supports ?category= &supplier= &search= &minPrice= &maxPrice= &inStock=true
// ?sort=-price,name  &page=1 &limit=10
const getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock, sort } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), 'i');
  if (search) {
    filter.$or = [
      { name: new RegExp(escapeRegex(search), 'i') },
      { sku: new RegExp(escapeRegex(search), 'i') },
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (inStock === 'true') filter.quantity = { $gt: 0 };
  if (inStock === 'false') filter.quantity = 0;

  // sorting - newest first if nothing is given
  const sortBy = sort ? sort.split(',').join(' ') : '-createdAt';

  // pagination
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort(sortBy).skip(skip).limit(limit);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// PATCH /api/products/:id/stock
// body: { "change": 10 } to restock, { "change": -3 } for a sale
const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const { id } = req.params;

  const filter = { _id: id };
  // for a sale, only match if there is enough stock. doing it in the query
  // means two requests at the same time can't push the quantity below zero
  if (change < 0) {
    filter.quantity = { $gte: -change };
  }

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: id });
    if (!exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(400).json({ error: 'Not enough stock to complete this sale' });
  }

  res.json({ message: 'Stock updated', product });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ message: 'Product deleted', id: product._id });
});

// GET /api/products/low-stock
// anything at or below its own reorder level
const getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $sort: { quantity: 1, name: 1 } },
    {
      $addFields: {
        stockValue: { $multiply: ['$price', '$quantity'] },
        id: { $toString: '$_id' },
      },
    },
  ]);

  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary
// per category totals
const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
};
