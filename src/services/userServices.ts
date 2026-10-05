import db from "../database/db.js";
import { User } from "../models/model.js";
import { initDB } from "../database/db.js";
import bcrypt from "bcrypt";
import { encryptPassword, decryptPassword } from "../utils/AES.js";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";


export const getAllProducts = async (page: number = 1, limit: number = 10) => {
  const offset = (page - 1) * limit;
  const [products] = await db.query(
    `SELECT * FROM products 
     WHERE approval_status = 'approved' 
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return products;
};

export const getCartService = async (userId: number) => {
  const [rows]: any = await db.execute(
    `SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, 
            p.discount_price, p.qty as stock, p.image_url
     FROM cart c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`,
    [userId]
  );
  return rows;
};

export const addToCartService = async (
  userId: number,
  product_id: number,
  quantity: number
) => {
  await db.execute(
    `INSERT INTO cart (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [userId, product_id, quantity, quantity]
  );
};

export const updateCartService = async (
  userId: number,
  id: number,
  quantity: number
) => {
  await db.execute(
    'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
    [quantity, id, userId]
  );
};

export const deleteCartService = async (userId: number, id: number) => {
  await db.execute(
    'DELETE FROM cart WHERE id = ? AND user_id = ?',
    [id, userId]
  );
};

export const getProfileService = async (userId: number) => {
  const [rows]: any = await db.execute(
    'SELECT id, name, email, role FROM users WHERE id = ?',
    [userId]
  );

  return rows[0];
};

export const updateProfileService = async (
  userId: number,
  name: string,
  email: string
) => {
  await db.execute(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, userId]
  );
};

export const checkoutService = async (userId: number) => {
  const [cartItems]: any = await db.execute(
    `SELECT c.product_id, c.quantity, p.name, p.price, p.discount_price
     FROM cart c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`,
    [userId]
  );

  if (cartItems.length === 0) throw new Error("Cart is empty");

  for (const item of cartItems) {
    await db.execute(
      `UPDATE products SET qty = qty - ? WHERE id = ?`,
      [item.quantity, item.product_id]
    );
  }

  // ── same timestamp for all items in this order ──
  const orderTime = new Date();

  for (const item of cartItems) {
    const effectivePrice=item.discount_price ?? item.price;
    await db.execute(
      `INSERT INTO orders (user_id, product_id, name, quantity, price, discount_price, effective_price, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, item.product_id, item.name, item.quantity, item.price, item.discount_price ?? item.price, effectivePrice, orderTime]
    );
  }

  await redis.set(
    `recent_orders:${userId}`,
    JSON.stringify(cartItems),
    { EX: 60 * 60 * 24 * 7 }
  );

  await db.execute(`DELETE FROM cart WHERE user_id = ?`, [userId]);

  return { success: true };
};

export const buyAgainService = async (userId: number) => {
  const cached = await redis.get(`recent_orders:${userId}`);

  if (!cached) throw new Error("No recent orders found. Buy Again is only available for 7 days.");

  const items = JSON.parse(cached);

  for (const item of items) {
    await db.execute(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [userId, item.product_id, item.quantity, item.quantity]
    );
  }

  return { message: "Recent order added to cart" };
};

export const getOrdersService = async (userId: number) => {
  const [rows]: any = await db.execute(
    `SELECT id, product_id, name, quantity, price, discount_price, status, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

export const getInvoiceDataService = async (userId: number, created_at: string) => {
  const [rows]: any = await db.execute(
    `SELECT id, product_id, name, quantity, price, discount_price, status, created_at
     FROM orders
     WHERE user_id = ? AND DATE(created_at) = DATE(?)`,
    [userId, created_at]
  );

  return rows;
};