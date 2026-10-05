"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  discount_price?: number;
  status: string;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [canBuyAgain, setCanBuyAgain] = useState(false);
  const [buyAgainMsg, setBuyAgainMsg] = useState("");
  const router = useRouter();

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  // check if Redis has recent orders (7 days) for Buy Again
  const checkBuyAgain = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/orders/can-buy-again", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCanBuyAgain(data.available);
  };

  useEffect(() => {
    fetchOrders();
    checkBuyAgain();
  }, []);

  const handleBuyAgain = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/cart/buy-again", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setBuyAgainMsg("✅ Added to cart!");
      setTimeout(() => router.push("/user/cart"), 1500);
    } else {
      setBuyAgainMsg(data.message ?? "Failed to add to cart.");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Orders</h1>

        {/* Buy Again — only if Redis has recent order */}
        {canBuyAgain && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleBuyAgain}
              className="bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
            >
              🔁 Buy Again
            </button>
            {buyAgainMsg && (
              <span className="text-sm text-green-600">{buyAgainMsg}</span>
            )}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">No orders yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow p-5 flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-gray-800">{order.name}</h2>
                <p className="text-sm text-gray-500">
                  Qty: {order.quantity} ×{" "}
                  {order.discount_price ? (
                    <>
                      <span className="text-green-600 font-medium">
                        ₹{order.discount_price}
                      </span>
                      <span className="text-gray-400 line-through ml-1">
                        ₹{order.price}
                      </span>
                    </>
                  ) : (
                    <span>₹{order.price}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className="font-bold text-gray-900">
                  ₹{order.price * order.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}