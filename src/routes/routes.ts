import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

import {
  // AUTH
  signup,
  login,
  // ADMIN
  getUsers,
  getCompanies,
  deleteUser,
  deleteCompany,
  blockUser,
  unblockUser,
  blockCompany,
  unblockCompany,
  pendingCompanies,
  approveCompanies,
  rejectCompanies,
  pendingProducts,
  approveProduct,
  rejectProduct,
  getActiveUsers,
  // COMPANY
  getCompany,
  // USER
  getUser,
  logFraudAttempt

} from "../controllers/controller.js";

import {
  createProduct,
  getCompanyProducts,
  updateProduct,
  deleteProduct,
  getCompanyProfile,
  updateCompany,
} from "../controllers/companyControllers.js";
import {
  getProfile,
  updateProfile,
  getProducts,
  getCart,
  addToCart,
  updateCart,
  deleteCart,
  checkout,
  buyAgain,
  setPaymentPin,
  getOrders,
  canBuyAgain,
  downloadInvoice
} from "../controllers/userControllers.js";
import {
  getUserRecommendations,
  getSimilarProducts,
} from "../controllers/recommendationController.js";
import { decryptPassword } from "../utils/AES.js";
import db from "../database/db.js";

const router = express.Router();


// ================= AUTH =================
router.post("/signup", signup);
router.post("/login", login);
router.get("/debug-admin", async (req, res) => {
  const [rows]: any = await db.execute(
    "SELECT email, password, active, role FROM users WHERE email = 'admin@gmail.com'"
  );
  const user = rows[0];
  const decrypted = decryptPassword(user.password);
  res.json({
    stored_password: user.password,
    decrypted_password: decrypted,
    active: user.active,
    role: user.role,
  });
});

// ================= PROFILE =================
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

router.get("/company/profile", authMiddleware, getCompanyProfile);
router.put("/company/profile", authMiddleware, updateCompany);


// ================= ADMIN =================
router.get("/admin", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin" });
});

router.get("/users", authMiddleware, isAdmin, getUsers);
router.get("/companies", authMiddleware, isAdmin, getCompanies);

router.get("/companies/pending", authMiddleware, isAdmin, pendingCompanies);
router.get("/products/pending", authMiddleware, isAdmin, pendingProducts);

router.put("/user/block/:id", authMiddleware, isAdmin, blockUser);
router.put("/user/unblock/:id", authMiddleware, isAdmin, unblockUser);
router.delete("/user/:id", authMiddleware, isAdmin, deleteUser);

router.put("/company/block/:id", authMiddleware, isAdmin, blockCompany);
router.put("/company/unblock/:id", authMiddleware, isAdmin, unblockCompany);

router.put("/company/approve/:id", authMiddleware, isAdmin, approveCompanies);
router.put("/company/reject/:id", authMiddleware, isAdmin, rejectCompanies);
router.delete("/company/:id", authMiddleware, isAdmin, deleteCompany);

router.put("/product/approve/:id", authMiddleware, isAdmin, approveProduct);
router.put("/product/reject/:id", authMiddleware, isAdmin, rejectProduct);


// ================= PUBLIC / GENERAL =================
router.get("/activeUsers", getActiveUsers);
router.get("/user/:id", getUser);
router.get("/company/:id", getCompany);


// ================= PRODUCT =================
router.post("/products", authMiddleware, createProduct);
router.get("/products", getProducts);
router.get("/products/company/:companyId", getCompanyProducts);

router.put("/product/:id", authMiddleware, updateProduct);
router.delete("/product/:id", authMiddleware, deleteProduct);


// ================= CART =================
router.get("/cart", authMiddleware, getCart);
router.post("/cart", authMiddleware, addToCart);
router.put("/cart/:id", authMiddleware, updateCart);
router.delete("/cart/:id", authMiddleware, deleteCart);
router.post("/checkout", authMiddleware, checkout);
router.post("/cart/buy-again", authMiddleware, buyAgain);
router.post("/user/set-pin", authMiddleware, setPaymentPin);
router.get("/orders", authMiddleware, getOrders);
router.get("/orders/can-buy-again", authMiddleware, canBuyAgain);
router.get("/orders/invoice/:created_at", authMiddleware, downloadInvoice);

//================= Mobile Login =================
router.post("/log-fraud", logFraudAttempt);

// ================= AI/ML RECOMMENDATIONS =================
router.get("/recommendations", getUserRecommendations);
router.get("/recommendations/product/:productId", getSimilarProducts);

export default router;