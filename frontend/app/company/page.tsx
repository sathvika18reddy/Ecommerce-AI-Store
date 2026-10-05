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
  description:string;
  image_url:string;
};

export default function CompanyDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "company") {
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

  // EDIT PRODUCT
  const editProduct = async (product: Product) => {
    const name = prompt("Name", product.name);
    const price = prompt("Price", String(product.price));
    const qty = prompt("Qty", String(product.qty));
    const description = prompt("Description", String(product.description));
    const image_url = prompt("Image URL", String(product.image_url));
    const discount = prompt(
      "Discount",
      product.discount_price ? String(product.discount_price) : ""
    );
    console.log(localStorage.getItem('role'));

    if (!name || !price || !qty) return;
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/product/${product.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        qty: Number(qty),
        discount_price: discount ? Number(discount) : null,
        description:description,
        image_url:image_url
      }),
    });

    fetchProducts();
  };

  // DELETE PRODUCT
  const deleteProduct = async (id: number) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/product/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchProducts();
  };

  return (
    <div>
      <h1>Company Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products found</p>
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
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              }}
            >
              <h3>{p.name}</h3>
              <p>Price: ₹{p.price}</p>
              <p>Qty: {p.qty}</p>

              {p.discount_price && (
                <p>Discount: ₹{p.discount_price}</p>
              )}

              <p>Status: {p.approval_status || "pending"}</p>

              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <button onClick={() => editProduct(p)}>Edit</button>

                <button onClick={() => deleteProduct(p.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}