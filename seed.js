
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 35, reorderLevel: 10, supplier: 'Logitech India' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-102', category: 'Electronics', price: 2499, quantity: 8, reorderLevel: 10, supplier: 'boAt' },
  { name: 'Laptop 15 inch', sku: 'ELEC-LP-103', category: 'Electronics', price: 54999, quantity: 3, reorderLevel: 5, supplier: 'Lenovo' },
  { name: 'USB-C Charger', sku: 'ELEC-CH-104', category: 'Electronics', price: 1199, quantity: 50, reorderLevel: 15, supplier: 'Anker' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-201', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 20, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APRL-JK-202', category: 'Apparel', price: 2999, quantity: 18, reorderLevel: 8, supplier: 'Levis' },
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-813', category: 'Furniture', price: 6499, quantity: 12, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Gel Pen Pack of 15', sku: 'STNY-PN-713', category: 'Stationery', price: 120, quantity: 4, reorderLevel: 20, supplier: 'Cello Pens' },
  { name: 'A4 Notebook', sku: 'STNY-NB-714', category: 'Stationery', price: 90, quantity: 100, reorderLevel: 30, supplier: 'Classmate' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-301', category: 'Grocery', price: 650, quantity: 25, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-302', category: 'Grocery', price: 899, quantity: 6, reorderLevel: 10, supplier: 'Figaro' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`Added ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
