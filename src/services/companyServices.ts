import db from "../database/db.js";
import { User } from "../models/model.js";
import { initDB } from "../database/db.js";
import bcrypt from "bcrypt";
import { encryptPassword, decryptPassword } from "../utils/AES.js";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

export const createProduct = async (product: any) => {
  const [result]: any = await db.execute(
    `INSERT INTO products (company_id, name, price, discount_price, qty, image_url, description, approval_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      product.company_id,
      product.name,
      product.price,
      product.discount_price || null,
      product.qty,
      product.image_url || null,
      product.description,
    ]
  );

  return { id: result.insertId, ...product };
};

export const getCompanyByUserId = async (userId: number) => {
  const [rows]: any = await db.execute(
    "SELECT id FROM companies WHERE user_id = ?",
    [userId]
  );

  return rows[0]; // returns { id: companyId }
};

export const getProductsByCompany = async (companyId: number) => {
  const [rows] = await db.execute(
    "SELECT * FROM products WHERE company_id = ?",
    [companyId]
  );

  return rows;
};

export const updateProduct = async (id: number, product: any) => {
  const [result]: any = await db.execute(
    `UPDATE products
     SET name = ?, price = ?, discount_price = ?, qty = ?, image_url = ?, description = ?
     WHERE id = ?`,
    [product.name, product.price, product.discount_price || null, product.qty, product.image_url || null, product.description, id]
  );

  return result.affectedRows > 0;
};

export const deleteProduct = async (id: number) => {
  const [result]: any = await db.execute(
    "DELETE FROM products WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
};

export const getCompanyProfileService = async (userId: number) => {
  const [rows]: any = await db.execute(
    `SELECT 
        id,
        name,
        location,
        type,
        established_year,
        approval_status,
        created_at
     FROM companies
     WHERE user_id = ?`,
    [userId]
  );

  return rows[0]; // one company per user
};

export const updateCompanyService = async (
  userId: number,
  name: string,
  location: string,
  type: string,
  established_year: number
) => {
  await db.execute(
    `UPDATE companies 
     SET name = ?, location = ?, type = ?, established_year = ?
     WHERE user_id = ?`,
    [name, location, type, established_year, userId]
  );
};