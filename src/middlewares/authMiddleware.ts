import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Middleware: verifikasi JWT dari header Authorization: Bearer <token> */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Token tidak ditemukan. Silakan login terlebih dahulu.", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return errorResponse(res, "Token tidak valid", 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return errorResponse(res, "Token tidak valid atau sudah expired", 401);
  }
};

/** Middleware: hanya admin yang boleh akses */
export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return errorResponse(res, "Akses ditolak. Fitur ini hanya untuk admin.", 403);
  }
  next();
};

/** Middleware: hanya customer yang boleh akses */
export const customerMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "CUSTOMER") {
    return errorResponse(res, "Akses ditolak. Fitur ini hanya untuk pelanggan.", 403);
  }
  next();
};
