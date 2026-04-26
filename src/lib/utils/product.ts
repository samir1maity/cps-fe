import { CartItem, Product, ProductColor } from '@/lib/types';

/**
 * Returns the storage key that should represent this product everywhere
 * in listings, thumbnails, cart, orders, and checkout.
 *
 * Rule: if the product uses color variants, the first color's image is
 * the canonical thumbnail. Otherwise fall back to images[0].
 */
export function getProductThumbnailKey(product: Pick<Product, 'images' | 'colors'>): string {
  if (product.colors?.length > 0) return product.colors[0].imageKey;
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
 * (where no explicit color choice was made). Uses the first color's _id
 * so cart always receives a valid colorId for color-variant products.
 */
export function getDefaultColorId(product: Pick<Product, 'colors'>): string | null {
  return product.colors?.[0]?._id ?? null;
}
