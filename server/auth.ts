import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config";
import { ROLES, Role } from "../shared/types";

// Mock login for the demo. In production this is replaced by Entra ID SSO:
// the app trusts an Entra-issued token and maps Entra app roles
// (TSC.SourcingManager, TSC.FinanceApprover) onto these two roles.
export interface User {
  name: string;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

export const loginSchema = z.object({
  name: z.string().trim().min(1).max(64),
  role: z.enum(ROLES),
});

export function issueToken(user: User): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "8h" });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    const payload = jwt.verify(token, config.jwtSecret) as User;
    req.user = { name: payload.name, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Sign in required" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: `Requires role: ${roles.join(" or ")}` });
      return;
    }
    next();
  };
}
