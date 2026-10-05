import { Request, Response } from "express";
import * as Service from "../services/companyServices.js";
/*
import jwt from "jsonwebtoken";
import { encryptPassword, decryptPassword } from "../utils/AES.js";
import { io } from "../app.js";
import redis from "../config/redis.js";
import { sendToQueue } from "../rabbitmq/producer.js";*/
import { AuthRequest } from "../middleware/authMiddleware.js";


export const createProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const company = await Service.getCompanyByUserId(user.id);
    if (!company) return res.status(403).json({ message: "Company not found" });

    const product = await Service.createProduct({
      company_id: company.id,
      name: req.body.name,
      price: req.body.price,
      discount_price: req.body.discount_price,
      qty: req.body.qty,
      image_url:req.body.image_url,
      description:req.body.description,
    });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const getCompanyProducts = async (req: Request, res: Response) => {
  try {
    const products = await Service.getProductsByCompany(Number(req.params.companyId));
    res.json(products);
  } catch {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const updated = await Service.updateProduct(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated" });
  } catch {
    res.status(500).json({ message: "Failed to update product" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deleted = await Service.deleteProduct(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete product" });
  }
};


export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const company = await Service.getCompanyProfileService(req.user!.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch {
    res.status(500).json({ message: "Error fetching company profile" });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, type, established_year } = req.body;
    await Service.updateCompanyService(req.user!.id, name, location, type, established_year);
    res.json({ message: "Company updated" });
  } catch {
    res.status(500).json({ message: "Error updating company" });
  }
};
