const Product = require('../models/Product');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});


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

  const sortBy = sort ? sort.split(',').join(' ') : '-createdAt';

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

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

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

const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const { id } = req.params;

  const filter = { _id: id };

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

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ message: 'Product deleted', id: product._id });
});

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
