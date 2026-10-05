"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "../utils/socket";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  active?: boolean;
};

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchData();

    socket.on("userDeleted", fetchData);
    socket.on("userBlocked", fetchData);
    socket.on("userUnblocked", fetchData);

    socket.on("companyDeleted", fetchData);
    socket.on("companyBlocked", fetchData);
    socket.on("companyUnblocked", fetchData);

    return () => {
      socket.off("userDeleted");
      socket.off("userBlocked");
      socket.off("userUnblocked");

      socket.off("companyDeleted");
      socket.off("companyBlocked");
      socket.off("companyUnblocked");
    };
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [usersRes, companiesRes] = await Promise.all([
        fetch("http://localhost:3000/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3000/companies", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const companiesData = await companiesRes.json();

      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // USERS
  const deleteUser = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const toggleUserBlock = async (id: number, active?: boolean) => {
    const token = localStorage.getItem("token");

    await fetch(
      `http://localhost:3000/user/${active ? "block" : "unblock"}/${id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  // COMPANIES
  const deleteCompany = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/company/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const toggleCompanyBlock = async (id: number, active?: boolean) => {
    const token = localStorage.getItem("token");

    await fetch(
      `http://localhost:3000/company/${active ? "block" : "unblock"}/${id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  const logout = () => {
    localStorage.setItem("token", "");
    localStorage.setItem("role", "");
    router.push("/login");
  };

  const tableStyle: any = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "40px",
    background: "#fff",
  };

  const thtd: any = {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: 'center',
  };

  return (
    <div style={{ padding: "30px", background: "#f5f7fb" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Admin Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* USERS */}
          <h2>Users</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>ID</th>
                <th style={thtd}>Name</th>
                <th style={thtd}>Email</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={thtd}>{u.id}</td>
                  <td style={thtd}>{u.name}</td>
                  <td style={thtd}>{u.email}</td>
                  <td style={thtd}>
                    <button onClick={() => deleteUser(u.id)}>Delete</button><br></br>
                    <button
                      onClick={() => toggleUserBlock(u.id, u.active)}
                    >
                      {u.active ? "Block" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* COMPANIES */}
          <h2>Companies</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>ID</th>
                <th style={thtd}>Company Name</th>
                <th style={thtd}>Email</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td style={thtd}>{c.id}</td>
                  <td style={thtd}>{c.name}</td>
                  <td style={thtd}>{c.email}</td>
                  <td style={thtd}>
                    <button onClick={() => deleteCompany(c.id)}>
                      Delete
                    </button><br></br>
                    <button
                      onClick={() => toggleCompanyBlock(c.id, c.active)}
                    >
                      {c.active ? "Block" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}