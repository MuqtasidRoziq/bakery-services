import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { successResponse, errorResponse } from "../../utils/response.js";

// GET /api/v1/admin/users
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, `${users.length} user ditemukan`, { users });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/admin/users/:id/set-admin
export const setAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return errorResponse(res, "User tidak ditemukan", 404);

    const updated = await prisma.user.update({
      where: { id },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    return successResponse(res, `User ${updated.email} berhasil dijadikan admin`, { user: updated });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// DELETE /api/v1/admin/users/:id/set-admin
export const revokeAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return errorResponse(res, "User tidak ditemukan", 404);

    const updated = await prisma.user.update({
      where: { id },
      data: { role: "CUSTOMER" },
      select: { id: true, email: true, role: true },
    });

    return successResponse(res, `Role admin user ${updated.email} berhasil dicabut`, { user: updated });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// PATCH /api/v1/admin/users/:id/deactivate
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });

    return successResponse(res, "User berhasil dinonaktifkan", { user: updated });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};
