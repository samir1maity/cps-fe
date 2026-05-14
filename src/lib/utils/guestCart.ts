// Guest cart persisted in localStorage for unauthenticated users.
// Items are merged into the server cart on login.

const KEY = 'guest_cart';

export interface GuestCartItem {
  productId: string;
  quantity: number;
  colorId: string | null;
  // Snapshot for display — kept in sync on every add/update
  product: {
    id: string;
    name: string;
    price: number;
    brand: string;
    images: string[];
    colors: { _id: string; name: string; imageKey: string; stock: number }[];
    inStock: boolean;
  };
}

const read = (): GuestCartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

const write = (items: GuestCartItem[]): void => {
  localStorage.setItem(KEY, JSON.stringify(items));
};

export const getGuestCart = (): GuestCartItem[] => read();

export const addGuestItem = (
  productId: string,
  quantity: number,
  colorId: string | null,
  product: GuestCartItem['product']
): GuestCartItem[] => {
  const items = read();
  const idx = items.findIndex(
    (i) => i.productId === productId && i.colorId === colorId
  );
  if (idx >= 0) {
    items[idx].quantity += quantity;
  } else {
    items.push({ productId, quantity, colorId, product });
  }
  write(items);
  return items;
};

export const removeGuestItem = (productId: string, colorId: string | null): GuestCartItem[] => {
  const items = read().filter(
    (i) => !(i.productId === productId && i.colorId === colorId)
  );
  write(items);
  return items;
};

export const updateGuestItemQuantity = (
  productId: string,
  colorId: string | null,
  quantity: number
): GuestCartItem[] => {
  const items = read();
  const idx = items.findIndex(
    (i) => i.productId === productId && i.colorId === colorId
  );
  if (idx >= 0) {
    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = quantity;
    }
  }
  write(items);
  return items;
};

export const clearGuestCart = (): void => {
  localStorage.removeItem(KEY);
};
