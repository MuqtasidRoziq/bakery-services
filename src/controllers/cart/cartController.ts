import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { AuthRequest } from "../../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../../utils/response.js";

// Helper function to get or create a cart for the user
const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: 'asc' }
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: { product: true },
        }
      },
    });
  }

  return cart;
};

// GET /api/v1/cart
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await getOrCreateCart(userId);

    return successResponse(res, "Cart fetched successfully", { cart });
  } catch (error: any) {
    console.error(error);
    return errorResponse(res, error.message || "Terjadi kesalahan pada server", 500);
  }
};

// POST /api/v1/cart
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return errorResponse(res, "Product ID is required", 400);
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    if (!product.isAvailable || product.stock < quantity) {
      return errorResponse(res, "Product is out of stock or unavailable", 400);
    }

    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return errorResponse(res, "Not enough stock available", 400);
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true }
      });
      return successResponse(res, "Cart item updated", { item: updatedItem });
    }

    // Add new item to cart
    const newItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
      include: { product: true }
    });

    return successResponse(res, "Item added to cart", { item: newItem }, 201);
  } catch (error: any) {
    console.error(error);
    return errorResponse(res, error.message || "Terjadi kesalahan pada server", 500);
  }
};

// PUT /api/v1/cart/:itemId
export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params as { itemId: string };
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return errorResponse(res, "Invalid quantity", 400);
    }

    // Verify the item belongs to the user's cart
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find(i => i.id === itemId);

    if (!item) {
      return errorResponse(res, "Cart item not found", 404);
    }

    if (item.product.stock < quantity) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true }
    });

    return successResponse(res, "Cart item updated", { item: updatedItem });
  } catch (error: any) {
    console.error(error);
    return errorResponse(res, error.message || "Terjadi kesalahan pada server", 500);
  }
};

// DELETE /api/v1/cart/:itemId
export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params as { itemId: string };

    // Verify the item belongs to the user's cart
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find(i => i.id === itemId);

    if (!item) {
      return errorResponse(res, "Cart item not found", 404);
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return successResponse(res, "Item removed from cart", null);
  } catch (error: any) {
    console.error(error);
    return errorResponse(res, error.message || "Terjadi kesalahan pada server", 500);
  }
};

// DELETE /api/v1/cart
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return successResponse(res, "Cart cleared successfully", null);
  } catch (error: any) {
    console.error(error);
    return errorResponse(res, error.message || "Terjadi kesalahan pada server", 500);
  }
};
