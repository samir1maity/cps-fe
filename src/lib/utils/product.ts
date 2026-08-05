import { CartItem, Product, ProductColor } from '@/lib/types';

/**
 * Returns the first color that has stock > 0.
 * Falls back to the first color if every variant is out of stock.
 * Returns null if the product has no colors at all.
 */
export function getFirstAvailableColor(
  product: Pick<Product, 'colors'>,
): ProductColor | null {
  if (!product.colors?.length) return null;
  return (
    product.colors.find((c) => c.stock > 0) ??
    product.colors[0]  // all OOS — still return first so UI can show "Out of stock"
  );
}

/**
 * Returns the storage key that should represent this product everywhere
 * in listings, thumbnails, cart, orders, and checkout.
 *
 * Rule: prefer the first IN-STOCK color's image so the listing card
 * doesn't show a greyed-out / unavailable variant by default.
 * Falls back to images[0] for non-color products.
 */
export function getProductThumbnailKey(product: Pick<Product, 'images' | 'colors'>): string {
  if (product.colors?.length > 0) {
    const available = getFirstAvailableColor(product);
    return available?.imageKey ?? product.colors[0].imageKey;
  }
  return product.images?.[0] ?? '';
}

/**
 * Returns the storage key for a specific color variant, falling back to
 * the canonical thumbnail if the color has no image (defensive).
 */
export function getColorImageKey(
  product: Pick<Product, 'images' | 'colors'>,
  color: ProductColor,
): string {
  return color.imageKey || getProductThumbnailKey(product);
}

/**
 * Returns true when the product uses color-variant images instead of a
 * plain image list. Use this to decide whether to render a color picker.
 */
export function hasColorVariants(product: Pick<Product, 'colors'>): boolean {
  return Array.isArray(product.colors) && product.colors.length > 0;
}

/**
 * Returns the correct image key for a cart item, respecting the chosen colorId.
 * Falls back to images[0] for standard (non-color) products.
 */
export function getCartItemImageKey(item: CartItem): string | undefined {
  if (item.colorId && item.product.colors?.length) {
    const match = item.product.colors.find((c) => String(c._id) === String(item.colorId));
    if (match) return match.imageKey;
  }
  return item.product.images?.[0];
}

/**
 * Returns the colorId to send when adding to cart from a listing page
 * (where no explicit color choice was made).
 *
 * Picks the first IN-STOCK color so the cart always receives a variant
 * that can actually be ordered. Falls back to colors[0] only when every
 * variant is sold out (the cart will still add, and the order will fail
 * at checkout — which is the correct behavior since stock can change).
 */
export function getDefaultColorId(product: Pick<Product, 'colors'>): string | null {
  const color = getFirstAvailableColor(product);
  return color?._id ?? null;
}

/**
 * Returns true if the product has at least one in-stock color variant,
 * OR is a plain product with stockQuantity > 0.
 * Use this instead of product.inStock on listing cards to get a per-color-aware answer.
 */
export function isProductAvailable(product: Pick<Product, 'colors' | 'inStock' | 'stockQuantity'>): boolean {
  if (product.colors?.length) {
    return product.colors.some((c) => c.stock > 0);
  }
  return product.inStock && product.stockQuantity > 0;
}
