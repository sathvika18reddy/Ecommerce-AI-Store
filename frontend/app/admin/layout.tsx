"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLayout({
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

  const navStyle: any = {
    display: "flex",
    gap: "20px",
    padding: "15px 30px",
    background: "#111827",
    color: "white",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const linkStyle: any = {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  };

  return (
    <div>
      {/* NAVBAR */}
      <div style={navStyle}>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/admin" style={linkStyle}>
            Dashboard
          </Link>

          <Link href="/admin/pendingCompanies" style={linkStyle}>
            Pending Companies
          </Link>

          <Link href="/admin/pendingProducts" style={linkStyle}>
            Pending Products
          </Link>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      {/* PAGE CONTENT */}
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}