import "dotenv/config";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body;

    if (!email || !password || !displayName) {
      return errorResponse(res, "Email, password, dan nama wajib diisi", 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse(res, "Email sudah terdaftar", 400);
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(String(password), saltRounds);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        displayName: String(displayName),
        phoneNumber: phoneNumber ? String(phoneNumber) : null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    return successResponse(
      res,
      "Registrasi berhasil! Silakan login.",
      { user },
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};
