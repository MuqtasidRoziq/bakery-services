import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { supabase } from "../../utils/supabase.js";
import { AuthRequest } from "../../middlewares/authMiddleware.js";

// GET /api/v1/products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { categoryId, isAvailable } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId: String(categoryId) } : {}),
        ...(isAvailable !== undefined ? { isAvailable: isAvailable === "true" } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, `${products.length} produk ditemukan`, { products });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// GET /api/v1/products/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!product) {
      return errorResponse(res, "Produk tidak ditemukan", 404);
    }

    return successResponse(res, "Produk ditemukan", { product });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// GET /api/v1/products/categories
export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return successResponse(res, `${categories.length} kategori ditemukan`, { categories });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/products  [admin]
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, categoryId, imageUrl, images, weight, unit, isAvailable } = req.body;

    if (!name || price === undefined || !categoryId) {
      return errorResponse(res, "Nama, harga, dan kategori wajib diisi", 400);
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    const product = await prisma.product.create({
      data: {
        name,
        description: description ?? "",
        price,
        stock: stock ?? 0,
        categoryId,
        categoryName: category?.name,
        imageUrl,
        images: images ?? [],
        weight: weight ?? 0,
        unit: unit ?? "pcs",
        isAvailable: isAvailable ?? true,
      },
    });

    return successResponse(res, "Produk berhasil dibuat", { product }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// PATCH /api/v1/products/:id  [admin]
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, "Produk tidak ditemukan", 404);

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });

    return successResponse(res, "Produk berhasil diupdate", { product });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// DELETE /api/v1/products/:id  [admin]
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, "Produk tidak ditemukan", 404);

    await prisma.product.delete({ where: { id } });

    return successResponse(res, "Produk berhasil dihapus");
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/products/upload  [admin]
export const uploadProductImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Tidak ada file yang diunggah", 400);
    }

    const file = req.file;
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || "bakery-images")
      .upload(`products/${fileName}`, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return errorResponse(res, "Gagal mengunggah file ke penyimpanan", 500);
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || "bakery-images")
      .getPublicUrl(`products/${fileName}`);

    return successResponse(res, "File berhasil diunggah", { url: publicUrlData.publicUrl }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/products/categories  [admin]
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name) return errorResponse(res, "Nama kategori wajib diisi", 400);

    const category = await prisma.category.create({
      data: { name, description, imageUrl, isActive: true },
    });

    return successResponse(res, "Kategori berhasil dibuat", { category }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};