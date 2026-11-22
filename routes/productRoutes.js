const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
} = require('../controllers/productController');

const {
  validateId,
  validateCreate,
  validateUpdate,
  validateStockChange,
} = require('../middleware/validateProduct');

router.route('/').get(getProducts).post(validateCreate, createProduct);

// these need to be above '/:id' or express will treat "low-stock" as an id
router.get('/low-stock', getLowStock);
router.get('/summary', getCategorySummary);

router
  .route('/:id')
  .get(validateId, getProductById)
  .put(validateId, validateUpdate, updateProduct)
  .delete(validateId, deleteProduct);

router.patch('/:id/stock', validateId, validateStockChange, adjustStock);

module.exports = router;
