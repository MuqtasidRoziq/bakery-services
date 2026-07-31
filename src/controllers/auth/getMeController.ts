import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { AuthRequest } from "../../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        photoUrl: true,
        role: true,
        addresses: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    return successResponse(res, "Profil berhasil diambil", { user });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};
