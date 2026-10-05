import { Server, Socket } from "socket.io";
import redis from "../config/redis.js";
import { checkoutService } from "../services/userServices.js";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const registerPaymentHandlers = (io: Server, socket: Socket) => {

  socket.on("start_payment", async ({ userId, pin }: { userId: number; pin: string }) => {

    const emit = (stage: string, message: string) =>
      socket.emit("payment_update", { stage, message });

    // 1. brute-force guard
    const attemptsKey = `pin_attempts:${userId}`;
    const attempts = Number(await redis.get(attemptsKey) ?? 0);
    if (attempts >= 3) {
      return emit("blocked", "Too many failed attempts. Try again in 10 minutes.");
    }

    // 2. verify PIN
    const storedPin = await redis.get(`payment_pin:${userId}`);
    if (!storedPin) {
      return emit("error", "No payment PIN set. Please set one in your profile.");
    }
    if (storedPin !== pin) {
      await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 600);
      const remaining = 3 - (Number(await redis.get(attemptsKey)));
      return emit("pin_error", `Incorrect PIN. ${remaining} attempt(s) left.`);
    }

    // 3. clear attempts on correct PIN
    await redis.del(attemptsKey);

    // 4. prevent double-payment (Redis lock)
    const lockKey = `payment_lock:${userId}`;
    const locked = await redis.set(lockKey, "1", { EX: 60, NX: true });
    if (!locked) {
      return emit("error", "Payment already in progress.");
    }

    try {
      emit("initiating", "Initiating payment...");
      await delay(1000);

      emit("verifying", "Verifying your details...");
      await delay(1200);

      emit("processing", "Processing transaction...");
      await delay(1500);

      await checkoutService(userId);   // reduce stock, clear cart, save Redis order

      emit("success", "Payment successful! 🎉 Order placed.");
    } catch (err: any) {
      emit("error", err.message ?? "Payment failed. Please try again.");
    } finally {
      await redis.del(lockKey);
    }
  });
};