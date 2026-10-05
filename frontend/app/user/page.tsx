"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  qty: number;
  discount_price?: number;
  approval_status?: string;
};

export default function UserDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "user") {
      router.push("/login");
      return;
    }

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number) => {
    const token = localStorage.getItem('token');

    await fetch('http://localhost:3000/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
      }),
    });

    alert('Added to cart');
  };


  return (
    <div style={{ padding: "30px" }}>
      <h1>User Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "#1e293b",
                color: "white",
              }}
            >
              <h3>{p.name}</h3>

              <p>
                Price: ₹{p.discount_price ?? p.price}
              </p>

              <p>Stock: {p.qty}</p>

              <button onClick={() => addToCart(p.id)} style={{ marginTop: "10px" }}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}