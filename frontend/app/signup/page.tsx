"use client";

import { useState } from "react";

export default function Signup() {
  const [role, setRole] = useState<"user" | "company">("user");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // company fields
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          companyName,
          location,
          type,
          establishedYear: establishedYear ? Number(establishedYear) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          role === "company"
            ? "Company signup submitted for approval"
            : "Signup successful!"
        );
      } else {
        alert(data?.message || "Signup failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🛒 Store</div>
          <h1>Signup</h1>
        </div>

        <div className="auth-form">
          {/* ROLE SELECTOR */}
          <div className="field">
            <label>Signup As</label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "user" | "company")
              }
            >
              <option value="user">User</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div className="field">
            <label>Name</label>
            <input
              placeholder="Enter name"
              onChange={(e) => {
                setName(e.target.value);
                setCompanyName(e.target.value)
              }
              }
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              placeholder="Enter email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* COMPANY FIELDS */}
          {role === "company" && (
            <>

              <div className="field">
                <label>Location</label>
                <input
                  placeholder="Location"
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Type</label>
                <input
                  placeholder="Industry type"
                  onChange={(e) => setType(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Established Year</label>
                <input
                  placeholder="Year"
                  type="number"
                  onChange={(e) =>
                    setEstablishedYear(e.target.value)
                  }
                />
              </div>
            </>
          )}

          <button className="auth-btn" onClick={handleSignup}>
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}