import {jwtDecode} from "jwt-decode";

type DecodedToken = {
  id: number;
  email: string;
  role: string;
  exp: number;
};


export const saveToken = (token: string) => {
  document.cookie = `token=${token}; path=/`;
};

export const getToken = (): string | null => {
  const match = document.cookie.match(/(^| )token=([^;]+)/);
  return match ? match[2] : null;
};

export const getUserFromToken = (): DecodedToken | null => {
  const token = getToken();
  if (!token) return null;

  try {
    console.log(jwtDecode<DecodedToken>(token));
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
};

export const logout = () => {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};