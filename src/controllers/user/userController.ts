import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { AuthRequest } from "../../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../../utils/response.js";

// GET /api/v1/users/profile
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        photoUrl: true,
        address: true,
        role: true,
        addresses: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return errorResponse(res, "User tidak ditemukan", 404);

    return successResponse(res, "Profil berhasil diambil", { user });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// PUT /api/v1/users/profile
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, phoneNumber, photoUrl, address } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(displayName ? { displayName } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(photoUrl ? { photoUrl } : {}),
        ...(address !== undefined ? { address } : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        photoUrl: true,
        address: true,
        role: true,
      },
    });

    return successResponse(res, "Profil berhasil diupdate", { user });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/users/addresses
export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { label, street, city, province, postalCode } = req.body;

    if (!label || !street || !city || !province || !postalCode) {
      return errorResponse(res, "Semua field alamat wajib diisi", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!existing) return errorResponse(res, "User tidak ditemukan", 404);

    const addresses = Array.isArray(existing.addresses) ? existing.addresses as object[] : [];
    addresses.push({ label, street, city, province, postalCode });

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { addresses },
      select: { id: true, addresses: true },
    });

    return successResponse(res, "Alamat berhasil ditambahkan", { user }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// DELETE /api/v1/users/addresses/:index
export const removeAddress = async (req: AuthRequest, res: Response) => {
  try {
    const index = parseInt(req.params.index as string, 10);

    const existing = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!existing) return errorResponse(res, "User tidak ditemukan", 404);

    const addresses = Array.isArray(existing.addresses) ? existing.addresses as object[] : [];

    if (index < 0 || index >= addresses.length) {
      return errorResponse(res, "Index alamat tidak valid", 400);
    }

    addresses.splice(index, 1);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { addresses },
      select: { id: true, addresses: true },
    });

    return successResponse(res, "Alamat berhasil dihapus", { user });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};
