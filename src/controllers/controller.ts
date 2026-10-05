import { Request, Response } from "express";
import * as Service from "../services/service.js";
import jwt from "jsonwebtoken";
import { encryptPassword, decryptPassword } from "../utils/AES.js";
import { io } from "../app.js";
import redis from "../config/redis.js";
import { sendToQueue } from "../rabbitmq/producer.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await Service.getAllUsers();
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Service.getAllCompanies();
    res.json(companies);
  } catch {
    res.status(500).json({ message: "Failed to fetch companies" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await Service.getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const getCompany = async (req: Request, res: Response) => {
  try {
    const company = await Service.getCompanyById(Number(req.params.id));
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch {
    res.status(500).json({ message: "Failed to fetch company" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const deleted = await Service.deleteUser(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "User not found" });
    io.emit("userDeleted", { id: req.params.id });
    res.json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const deleted = await Service.deleteCompany(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Company not found" });
    io.emit("companyDeleted", { id: req.params.id });
    res.json({ message: "Company deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete company" });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const blocked = await Service.blockUser(Number(req.params.id));
    if (!blocked) return res.status(404).json({ message: "User not found" });
    io.emit("userBlocked", { id: req.params.id });
    res.json({ message: "User blocked successfully" });
  } catch {
    res.status(500).json({ message: "Failed to block user" });
  }
};

export const blockCompany = async (req: Request, res: Response) => {
  try {
    const blocked = await Service.blockCompany(Number(req.params.id));
    if (!blocked) return res.status(404).json({ message: "Company not found" });
    io.emit("companyBlocked", { id: req.params.id });
    res.json({ message: "Company blocked successfully" });
  } catch {
    res.status(500).json({ message: "Failed to block company" });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const unblocked = await Service.unblockUser(Number(req.params.id));
    if (!unblocked) return res.status(404).json({ message: "User not found" });
    io.emit("userUnblocked", { id: req.params.id });
    res.json({ message: "User unblocked successfully" });
  } catch {
    res.status(500).json({ message: "Failed to unblock user" });
  }
};

export const unblockCompany = async (req: Request, res: Response) => {
  try {
    const unblocked = await Service.unblockCompany(Number(req.params.id));
    if (!unblocked) return res.status(404).json({ message: "Company not found" });
    io.emit("companyUnblocked", { id: req.params.id });
    res.json({ message: "Company unblocked successfully" });
  } catch {
    res.status(500).json({ message: "Failed to unblock company" });
  }
};

export const pendingCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Service.getPendingCompanies();
    res.status(200).json(companies);
  } catch {
    res.status(500).json({ message: "Error fetching pending companies" });
  }
};

export const approveCompanies = async (req: Request, res: Response) => {
  try {
    const result = await Service.approveCompany(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Company not found or already processed" });
    res.status(200).json({ message: "Company approved successfully" });
  } catch {
    res.status(500).json({ message: "Error approving company" });
  }
};

export const rejectCompanies = async (req: Request, res: Response) => {
  try {
    const result = await Service.rejectCompany(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Company not found or already processed" });
    res.status(200).json({ message: "Company rejected successfully" });
  } catch {
    res.status(500).json({ message: "Error rejecting company" });
  }
};

export const pendingProducts = async (req: Request, res: Response) => {
  try {
    const products = await Service.getPendingProducts();
    res.json(products);
  } catch {
    res.status(500).json({ message: "Failed to fetch pending products" });
  }
};

export const approveProduct = async (req: Request, res: Response) => {
  try {
    const updated = await Service.approveProduct(Number(req.params.id));
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product approved" });
  } catch {
    res.status(500).json({ message: "Failed to approve product" });
  }
};

export const rejectProduct = async (req: Request, res: Response) => {
  try {
    const updated = await Service.rejectProduct(Number(req.params.id));
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product rejected" });
  } catch {
    res.status(500).json({ message: "Failed to reject product" });
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, companyName, location, type, establishedYear } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const id = await Service.signup(
      name, email, password, role,
      role === "company" ? { companyName, location, type, establishedYear } : undefined
    );

    await sendToQueue("send-email", { email, name, role });

    res.json({
      message: role === "company"
        ? "Company registration submitted for approval"
        : "User created successfully",
      id,
    });
  } catch {
    res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { token, role } = await Service.login(email, password);

    await sendToQueue("user-activity", { email, action: "login", time: Date.now() });
    io.emit("userLogin");

    res.json({ token, role });
  } catch (error) {
    res.status(401).json({ message: (error as any).message });
  }
};

export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const keys = await redis.keys("active:*");
    const emails = keys.map((key: string) => key.replace("active:", ""));
    res.json({ activeUsers: emails });
  } catch {
    res.status(500).json({ message: "Error fetching active users" });
  }
};
/*
// ─── COMPANY SIDE ─────────────────────────────────────────────────────────────

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

// ─── USER SIDE ────────────────────────────────────────────────────────────────

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Service.getAllProducts();
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

// ─── CHECKOUT (HTTP fallback — socket is primary) ─────────────────────────────

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
*/
export const logFraudAttempt = async (req: Request, res: Response) => {
  try {
    const { email, attempted_role, platform } = req.body;
    const ip = req.headers["x-forwarded-for"] as string
              ?? req.socket.remoteAddress
              ?? "unknown";

    await sendToQueue("fraud-attempts", {
      email,
      attempted_role,
      platform,
      ip,
    });

    res.json({ message: "Logged" });
  } catch {
    res.status(500).json({ message: "Failed to log attempt" });
  }
};
/*
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
*/