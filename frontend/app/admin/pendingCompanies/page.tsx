"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  id: number;
  name: string;
  email: string;
  approval_status: string;
};

export default function PendingCompaniesPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:3000/companies/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      console.log(data);
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveCompany = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/company/approve/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchPending();
  };

  const rejectCompany = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/company/reject/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchPending();
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Pending Companies</h1>

      {loading ? (
        <p>Loading...</p>
      ) : companies.length === 0 ? (
        <p>No pending companies</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                ID
              </th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                Name
              </th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                Email
              </th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {c.id}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {c.name}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {c.email}
                </td>

                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  <button
                    onClick={() => approveCompany(c.id)}
                    style={{ marginRight: "10px" }}
                  >
                    Approve
                  </button>

                  <button onClick={() => rejectCompany(c.id)}>
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