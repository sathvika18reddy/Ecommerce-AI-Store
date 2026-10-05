"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        alert(response.message || "Login failed");
        return;
      }
      console.log(response);
      const token = response.token;
      const role = response.role;
      console.log(role);

      // ✅ STORE TOKEN
      localStorage.setItem("token", token);
      console.log(token);
      localStorage.setItem("role", role);
      console.log(role);
      if (role === "admin") {
        router.push("/admin");
      } else if(role==="user") {
        router.push("/user");
      } else if(role==="company") {
        router.push("/company");
      } else {
        alert("login failed");
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div >
      <center>
      <fieldset style={{border:'2px solid black', marginLeft:'100px', marginRight:'100px', marginTop:'50px'}}>
      <h1>Login</h1>
      <br></br>
        <input style={{border:'2px solid black'}}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br></br>
        <input style={{border:'2px solid black'}}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br></br>
        <br></br>
        <button onClick={handleLogin}>Login</button>
        </fieldset>
      </center>
    </div>
  );
}