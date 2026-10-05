"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const logout = () => {
    localStorage.setItem("token", "");
    localStorage.setItem("role", "");
    router.push("/login");
  };

  return (
    <div>
      {/* NAVBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "15px 30px",
          background: "#0f172a",
          color: "white",
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/user">Home</Link>
          <Link href="/user/cart">Cart</Link>
          <Link href="/user/profile">Profile</Link>
          <Link href="/user/orders">Orders</Link>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}