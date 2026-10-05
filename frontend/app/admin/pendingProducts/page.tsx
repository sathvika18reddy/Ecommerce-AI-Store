"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  qty: number;
  approval_status: string;
};

export default function PendingProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:3000/products/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/product/approve/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchProducts();
  };

  const rejectProduct = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/product/reject/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchProducts();
  };

  const tableStyle: any = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  };

  const thtd: any = {
    border: "1px solid #ddd",
    padding: "10px",
  };

  return (
    <div style={{ padding: "30px", background: "#f5f7fb" }}>
      <h1>Pending Products</h1>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No pending products</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>ID</th>
              <th style={thtd}>Name</th>
              <th style={thtd}>Price</th>
              <th style={thtd}>Qty</th>
              <th style={thtd}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={thtd}>{p.id}</td>
                <td style={thtd}>{p.name}</td>
                <td style={thtd}>{p.price}</td>
                <td style={thtd}>{p.qty}</td>

                <td style={thtd}>
                  <button onClick={() => approveProduct(p.id)}>
                    Approve
                  </button>

                  <button onClick={() => rejectProduct(p.id)}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}