import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { AuthRequest } from "../../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { generateOrderNumber, calculateShippingCost } from "../../utils/helpers.js";
import { PaymentMethod } from "@prisma/client";
import { supabase } from "../../utils/supabase.js";

// POST /api/v1/orders  [customer]
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { 
      customerName, 
      customerPhone, 
      items, 
      shippingAddress, 
      notes,
      paymentMethod,
      proofImageUrl,
      referenceNumber 
    } = req.body;

    if (!customerName || !customerPhone || !items?.length || !shippingAddress) {
      return errorResponse(res, "Data order tidak lengkap", 400);
    }

    // Validasi dan kumpulkan item
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items as Array<{ productId: string; quantity: number }>) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });

      if (!product) return errorResponse(res, `Produk "${item.productId}" tidak ditemukan`, 404);
      if (!product.isAvailable) return errorResponse(res, `Produk "${product.name}" tidak tersedia`, 400);
      if (product.stock < item.quantity) return errorResponse(res, `Stok "${product.name}" tidak cukup`, 400);

      const unitPrice = Number(product.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const shippingCost = calculateShippingCost(subtotal);
    const totalPrice = subtotal + shippingCost;

    let paymentStatus: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
    if (paymentMethod) {
      if (proofImageUrl) {
        paymentStatus = "PAID";
      }
    }

    const orderData: any = {
      orderNumber: generateOrderNumber(),
      userId,
      customerName,
      customerPhone,
      shippingAddress,
      subtotal,
      shippingCost,
      discount: 0,
      totalPrice,
      paymentStatus,
      notes,
      items: {
        create: orderItemsData,
      },
    };

    if (paymentMethod) {
      orderData.payment = {
        create: {
          userId,
          amount: totalPrice,
          method: paymentMethod as PaymentMethod,
          status: paymentStatus,
          referenceNumber: referenceNumber || null,
          proofImageUrl: proofImageUrl || null,
          paidAt: paymentStatus === "PAID" ? new Date() : null,
        }
      };
    }

    const stockUpdates = (items as Array<{ productId: string; quantity: number }>).map((item) => 
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    );

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: orderData,
        include: { items: true, payment: true },
      }),
      ...stockUpdates
    ]);

    return successResponse(res, "Order berhasil dibuat", { order }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/orders/upload  [customer]
export const uploadPaymentProof = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Tidak ada file yang diunggah", 400);
    }

    const file = req.file;
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || "bakery-images")
      .upload(`payments/${fileName}`, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return errorResponse(res, "Gagal mengunggah file ke penyimpanan", 500);
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || "bakery-images")
      .getPublicUrl(`payments/${fileName}`);

    return successResponse(res, "File berhasil diunggah", { url: publicUrlData.publicUrl }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// GET /api/v1/orders/my  [customer]
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: true, payment: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, `${orders.length} order ditemukan`, { orders });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// GET /api/v1/orders/:id
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!order) return errorResponse(res, "Order tidak ditemukan", 404);
    if (!isAdmin && order.userId !== userId) return errorResponse(res, "Akses ditolak", 403);

    return successResponse(res, "Order ditemukan", { order });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// GET /api/v1/orders  [admin]
export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, payment: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, `${orders.length} order ditemukan`, { orders });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// PATCH /api/v1/orders/:id/status  [admin]
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return successResponse(res, "Status order berhasil diupdate", { order });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// PATCH /api/v1/orders/:id/cancel  [customer]
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.id;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return errorResponse(res, "Order tidak ditemukan", 404);
    if (order.userId !== userId) return errorResponse(res, "Akses ditolak", 403);
    if (order.status !== "PENDING") return errorResponse(res, "Hanya order PENDING yang bisa dibatalkan", 400);

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return successResponse(res, "Order berhasil dibatalkan", { order: updated });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/orders/:id/payment  [customer]
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id: orderId } = req.params as { id: string };
    const userId = req.user!.id;
    const { method, referenceNumber, proofImageUrl } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return errorResponse(res, "Order tidak ditemukan", 404);
    if (order.userId !== userId) return errorResponse(res, "Akses ditolak", 403);
    if (order.paymentStatus === "PAID") return errorResponse(res, "Order ini sudah dibayar", 400);

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId,
          userId,
          amount: order.totalPrice,
          method: method as PaymentMethod,
          status: "PAID", // Otomatis PAID jika user upload bukti
          referenceNumber,
          proofImageUrl,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID" },
      }),
    ]);

    return successResponse(res, "Pembayaran berhasil diajukan", { payment }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};

// PATCH /api/v1/orders/payments/:paymentId/confirm  [admin]
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params as { paymentId: string };

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return errorResponse(res, "Data pembayaran tidak ditemukan", 404);

    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "PAID", paidAt: new Date() },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      }),
    ]);

    return successResponse(res, "Pembayaran berhasil dikonfirmasi", { payment: updatedPayment });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Terjadi kesalahan pada server", 500);
  }
};