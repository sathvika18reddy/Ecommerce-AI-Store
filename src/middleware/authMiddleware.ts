import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secret_key") as any;

    // attach user info
    (req as any).user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};


export interface AuthRequest extends Request {
  user?: {
    id: number;
    email?: string;
    role?: string;
  };
}