const notFound = (req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  // mongoose validation errors (schema rules)
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // bad value for a field type, e.g. price: "abc" in a query
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }

  // duplicate key (sku is unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `A product with this ${field} already exists` });
  }

  // malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
};

module.exports = { notFound, errorHandler };
