'use client';

import { useEffect, useState } from 'react';

export default function CompanyProfile() {
  const [company, setCompany] = useState<any>(null);
  const [edit, setEdit] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState<number | ''>('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchCompany = async () => {
    const res = await fetch('http://localhost:3000/company/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setCompany(data);

    setName(data.name || '');
    setLocation(data.location || '');
    setType(data.type || '');
    setYear(data.established_year || '');
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const updateCompany = async () => {
    await fetch('http://localhost:3000/company/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        location,
        type,
        established_year: Number(year),
      }),
    });

    setEdit(false);
    fetchCompany();
  };

  if (!company) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Company Profile</h1>

      {edit ? (
        <>
          <input
            placeholder="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br />

          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <br />

          <input
            placeholder="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <br />

          <input
            type="number"
            placeholder="Established Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <br />

          <button onClick={updateCompany}>Save</button>
        </>
      ) : (
        <>
          <p>Name: {company.name}</p>
          <p>Location: {company.location}</p>
          <p>Type: {company.type}</p>
          <p>Established: {company.established_year}</p>
          <p>Status: {company.approval_status}</p>

          <button onClick={() => setEdit(true)}>Edit</button>
        </>
      )}
    </div>
  );
}