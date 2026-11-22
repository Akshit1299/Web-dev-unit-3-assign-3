const mongoose = require('mongoose');

// makes sure the :id in the url is a real ObjectId before we hit the db
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  next();
};

const checkNumbers = (body) => {
  const errors = [];
  ['price', 'quantity', 'reorderLevel'].forEach((field) => {
    if (body[field] !== undefined && typeof body[field] !== 'number') {
      errors.push(`${field} must be a number`);
    }
  });
  return errors;
};

// POST - all the main fields have to be there
const validateCreate = (req, res, next) => {
  const errors = [];
  ['name', 'sku', 'category', 'price'].forEach((field) => {
    if (req.body[field] === undefined || req.body[field] === '') {
      errors.push(`${field} is required`);
    }
  });
  errors.push(...checkNumbers(req.body));

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
};

// PUT - fields are optional but if they are sent they should be the right type
const validateUpdate = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }
  const errors = checkNumbers(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
};

// PATCH /:id/stock
const validateStockChange = (req, res, next) => {
  const { change } = req.body;
  if (!Number.isInteger(change) || change === 0) {
    return res
      .status(400)
      .json({ error: 'change must be a non-zero whole number (use a negative value for a sale)' });
  }
  next();
};

module.exports = { validateId, validateCreate, validateUpdate, validateStockChange };
