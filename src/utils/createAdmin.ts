import db from "../database/db.js";
import bcrypt from "bcrypt";
import { encryptPassword } from "../utils/AES.js";

export const createAdminIfNotExists = async () => {
  try {
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      ["admin@gmail.com"]
    );

    if (rows.length > 0) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await encryptPassword("admin123");

    await db.execute(
      "INSERT INTO users (name, email, password, role, active, approval_status) VALUES (?, ?, ?, ?, ?, ?)",
      ["Admin", "admin@gmail.com", hashedPassword, "admin", true, "approved"]
    );

    console.log("🔥 Admin created: admin@gmail.com / admin123");
  } catch (err) {
    console.error("Error creating admin:", err);
  }
};