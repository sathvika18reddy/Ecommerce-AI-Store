"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProduct() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [discount, setDiscount] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    const token = localStorage.getItem("token"); // ✅ get JWT

    await fetch("http://localhost:3000/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ send token
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        qty: Number(qty),
        discount_price: discount ? Number(discount) : null,
        image_url: image,
        description: description,
      }),
    });

    router.push("/company");
  };

  return (
    <div>
      <h2>Add Product</h2>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
      <input placeholder="Qty" onChange={(e) => setQty(e.target.value)} />
      <input placeholder="Discount" onChange={(e) => setDiscount(e.target.value)} />
      <input placeholder="Image URL" onChange={(e) => setImage(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />

      <button onClick={handleSubmit}>Create</button>
    </div>
  );
}