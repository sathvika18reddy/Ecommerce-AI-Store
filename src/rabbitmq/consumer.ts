import amqp from "amqplib";
import db from "../database/db.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "machiraju.vijayaram@gmail.com",
    pass: "tksfehboelmnuadd"
  }
});

const startWorker = async () => {
  const conn = await amqp.connect("amqp://localhost");
  const channel = await conn.createChannel();
  /*
  // ── user activity ──────────────────────────────────────────
  await channel.assertQueue("user-activity");
  channel.consume("user-activity", async (msg: any) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      await db.execute(
        `INSERT INTO user_activity (email, action, timestamp) VALUES (?, ?, ?)`,
        [data.email, data.action, data.time]
      );
      channel.ack(msg);
    }
  });
  */
  // ── send email ─────────────────────────────────────────────
  await channel.assertQueue("send-email");
  channel.consume("send-email", async (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      await transporter.sendMail({
        from: "machiraju.vijayaram@gmail.com",
        to: data.email,
        subject: "Welcome 🎉",
        text: `Hello ${data.name}, your account was created successfully!`
      });
      console.log("📧 Email sent to:", data.email);
      channel.ack(msg);
    }
  });

  // ── fraud attempts ─────────────────────────────────────────
  await channel.assertQueue("fraud-attempts");
  channel.consume("fraud-attempts", async (msg) => {
    if (msg) {
      const { email, attempted_role, platform, ip } = JSON.parse(msg.content.toString());
      await db.execute(
        `INSERT INTO fraud_logs (email, attempted_role, platform, ip) VALUES (?, ?, ?, ?)`,
        [email, attempted_role, platform, ip ?? "unknown"]
      );
      console.log(`🚨 Fraud attempt: ${email} tried as ${attempted_role} on ${platform}`);
      channel.ack(msg);
    }
  });

  console.log("✅ Worker running...");
};

startWorker();