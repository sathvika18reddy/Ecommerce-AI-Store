'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // PIN state
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinError, setPinError] = useState(false);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchProfile = async () => {
    const res = await fetch('http://localhost:3000/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUser(data);
    setName(data.name);
    setEmail(data.email);
  };

  useEffect(() => { fetchProfile(); }, []);

  const updateProfile = async () => {
    await fetch('http://localhost:3000/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email }),
    });
    setEdit(false);
    fetchProfile();
  };

  const setPaymentPin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setPinError(true);
      setPinMsg('PIN must be exactly 4 digits.');
      return;
    }

    const res = await fetch('http://localhost:3000/user/set-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();

    if (res.ok) {
      setPinError(false);
      setPinMsg('✅ PIN set successfully!');
      setPin('');
    } else {
      setPinError(true);
      setPinMsg(data.message ?? 'Failed to set PIN.');
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>User Profile</h1>

      {/* ── profile edit ── */}
      {edit ? (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <br />
          <button onClick={updateProfile}>Save</button>
        </>
      ) : (
        <>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <button onClick={() => setEdit(true)}>Edit</button>
        </>
      )}

      {/* ── payment PIN ── */}
      <hr style={{ margin: '24px 0' }} />
      <h2>Payment PIN</h2>
      <p style={{ color: '#666', fontSize: 14 }}>
        Set a 4-digit PIN used to confirm payments at checkout.
      </p>

      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        placeholder="Enter 4-digit PIN"
        value={pin}
        onChange={(e) => {
          setPin(e.target.value.replace(/\D/g, ''));
          setPinMsg('');
          setPinError(false);
        }}
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 20,
          letterSpacing: 8,
          width: 140,
          textAlign: 'center',
        }}
      />
      <br />
      <button
        onClick={setPaymentPin}
        disabled={pin.length !== 4}
        style={{ marginTop: 10, opacity: pin.length !== 4 ? 0.4 : 1 }}
      >
        Set PIN
      </button>

      {pinMsg && (
        <p style={{ marginTop: 8, color: pinError ? 'red' : 'green', fontSize: 14 }}>
          {pinMsg}
        </p>
      )}
    </div>
  );
}