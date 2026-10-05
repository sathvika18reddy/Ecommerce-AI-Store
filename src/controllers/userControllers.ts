import { Request, Response } from "express";
import * as Service from "../services/userServices.js";
import redis from "../config/redis.js";
/*
import jwt from "jsonwebtoken";
import { encryptPassword, decryptPassword } from "../utils/AES.js";
import { io } from "../app.js";
import { sendToQueue } from "../rabbitmq/producer.js";*/
import { AuthRequest } from "../middleware/authMiddleware.js";
import PDFDocument from "pdfkit";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const products = await Service.getAllProducts(page, limit);
    res.json(products);
  } catch {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ─── CART ─────────────────────────────────────────────────────────────────────

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const data = await Service.getCartService(req.user!.id);
    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    await Service.addToCartService(req.user!.id, product_id, quantity);
    res.json({ message: "Added to cart" });
  } catch {
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

export const updateCart = async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }
    await Service.updateCartService(req.user!.id, Number(req.params.id), quantity);
    res.json({ message: "Updated" });
  } catch {
    res.status(500).json({ message: "Failed to update cart" });
  }
};

export const deleteCart = async (req: AuthRequest, res: Response) => {
  try {
    await Service.deleteCartService(req.user!.id, Number(req.params.id));
    res.json({ message: "Removed" });
  } catch {
    res.status(500).json({ message: "Failed to remove from cart" });
  }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await Service.getProfileService(req.user!.id);
    res.json(user);
  } catch {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    await Service.updateProfileService(req.user!.id, name, email);
    res.json({ message: "Profile updated" });
  } catch {
    res.status(500).json({ message: "Error updating profile" });
  }
};


export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const result = await Service.checkoutService(req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const buyAgain = async (req: AuthRequest, res: Response) => {
  try {
    const result = await Service.buyAgainService(req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// ─── PAYMENT PIN (set PIN on profile page) ────────────────────────────────────

export const setPaymentPin = async (req: AuthRequest, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }
    // Store in Redis — no expiry, user controls it
    await redis.set(`payment_pin:${req.user!.id}`, pin);
    res.json({ message: "PIN set successfully" });
  } catch {
    res.status(500).json({ message: "Failed to set PIN" });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Service.getOrdersService(req.user!.id);
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const canBuyAgain = async (req: AuthRequest, res: Response) => {
  try {
    const cached = await redis.get(`recent_orders:${req.user!.id}`);
    res.json({ available: !!cached });
  } catch {
    res.status(500).json({ available: false });
  }
};


export const downloadInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const created_at = decodeURIComponent(req.params.created_at as string);
    
    const orders = await Service.getInvoiceDataService(
      req.user!.id,
      created_at as string
    );
    if (!orders.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${created_at}.pdf`
    );

    doc.pipe(res);

    // 🧾 HEADER
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Date: ${new Date(created_at as string).toDateString()}`);
    doc.moveDown();

    // 🛒 ITEMS
    let total = 0;

    orders.forEach((item: any) => {
      const price = item.discount_price ?? item.price;
      const lineTotal = price * item.quantity;
      total += lineTotal;

      doc.text(
        `${item.name}  |  ${item.quantity} × ₹${price} = ₹${lineTotal}`
      );
    });

    doc.moveDown();
    doc.text(`Total: ₹${total}`, { align: "right" });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};