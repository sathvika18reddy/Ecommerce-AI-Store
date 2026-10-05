"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  discount_price?: number;  // ← add this
  quantity: number;
  stock: number;
  image_url?: string;
};

type PaymentStage =
  | "idle" | "initiating" | "verifying" | "processing"
  | "success" | "error" | "pin_error" | "blocked";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [payStage, setPayStage] = useState<PaymentStage>("idle");
  const [payMessage, setPayMessage] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : data.items ?? data.cart ?? data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (cartId: number, delta: number, current: number, stock: number) => {
    const next = current + delta;
    if (next < 1 || next > stock) return;

    setItems((prev) =>
      prev.map((item) => item.id === cartId ? { ...item, quantity: next } : item)
    );

    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/cart/${cartId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: next }),
    });
  };

  const removeItem = async (cartId: number) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/cart/${cartId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.filter((i) => i.id !== cartId));
  };

  // ── THIS WAS MISSING ──────────────────────────────────────────
  const initiatePayment = () => {
    if (items.length === 0) return;
    setPayStage("idle");
    setPayMessage("");
    setShowPinModal(true);
  };

  const submitPayment = () => {
    if (pin.length !== 4) return;
    setShowPinModal(false);

    const socket = io("http://localhost:3000", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      const userId = getUserIdFromToken();
      socket.emit("start_payment", { userId, pin });
      setPayStage("initiating");
      setPayMessage("Initiating payment...");
    });

    socket.on(
      "payment_update",
      ({ stage, message }: { stage: PaymentStage; message: string }) => {
        setPayStage(stage);
        setPayMessage(message);

        if (stage === "success") {
          setItems([]);
          socket.disconnect();
          setTimeout(() => router.push("/orders"), 2000);
        }
        if (stage === "error" || stage === "blocked") {
          socket.disconnect();
        }
      }
    );

    socket.on("connect_error", () => {
      setPayStage("error");
      setPayMessage("Could not connect to payment server.");
    });
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (loading) return <div className="p-8 text-center">Loading cart…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">Your cart is empty.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-xl"
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-800">{item.name}</h2>
                  <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQty(item.id, -1, item.quantity, item.stock)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 text-lg font-bold disabled:opacity-30 hover:bg-gray-100 transition"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, +1, item.quantity, item.stock)}
                    disabled={item.quantity >= item.stock}
                    className="w-8 h-8 rounded-full border border-gray-300 text-lg font-bold disabled:opacity-30 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                  <span className="ml-auto text-sm text-gray-400">{item.stock} in stock</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow p-6 max-w-sm ml-auto">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={initiatePayment}
              disabled={payStage !== "idle" && payStage !== "error" && payStage !== "pin_error"}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
            >
              Pay Now
            </button>

            {payStage !== "idle" && (
              <PaymentStatus stage={payStage} message={payMessage} />
            )}
          </div>
        </>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl">
            <h2 className="text-xl font-bold mb-2">Enter Payment PIN</h2>
            <p className="text-sm text-gray-500 mb-4">4-digit PIN to confirm payment</p>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:border-black outline-none"
              placeholder="••••"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowPinModal(false); setPin(""); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                disabled={pin.length !== 4}
                className="flex-1 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-40 hover:bg-gray-800 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentStatus({ stage, message }: { stage: PaymentStage; message: string }) {
  const styles: Record<PaymentStage, string> = {
    idle: "",
    initiating: "bg-blue-50 text-blue-700",
    verifying: "bg-yellow-50 text-yellow-700",
    processing: "bg-purple-50 text-purple-700",
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
    pin_error: "bg-orange-50 text-orange-700",
    blocked: "bg-red-100 text-red-800",
  };

  const icons: Partial<Record<PaymentStage, string>> = {
    initiating: "⏳",
    verifying: "🔍",
    processing: "⚙️",
    success: "✅",
    error: "❌",
    pin_error: "⚠️",
    blocked: "🚫",
  };

  return (
    <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${styles[stage]}`}>
      {icons[stage]} {message}
    </div>
  );
}

function getUserIdFromToken(): number {
  const token = localStorage.getItem("token");
  if (!token) return 0;
  try {
    return JSON.parse(atob(token.split(".")[1])).id;
  } catch {
    return 0;
  }
}