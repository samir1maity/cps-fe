# Redirect After Login - Implementation Guide

## Overview

A secure, user-friendly authentication redirect system that preserves user context and automatically completes interrupted actions after login.

## Features

✅ **Secure Redirects** - Only allows internal routes (prevents open redirects)  
✅ **Pending Action Completion** - Automatically completes actions like "Add to Cart" after login  
✅ **Smooth UX** - Loading states and transitions for seamless experience  
✅ **Session Storage** - Preserves state without polluting URL or localStorage  
✅ **Type-Safe** - Full TypeScript support with interfaces  
✅ **Easy Integration** - Simple hooks for consistent implementation  

---

## Architecture

### Core Files

```
src/
├── lib/auth/redirects.ts           # Redirect utilities and security
├── hooks/
│   ├── useRequireAuth.ts           # Auth requirement hook
│   └── usePendingActions.ts        # Action completion hook
├── components/auth/
│   └── PendingActionsHandler.tsx   # Global action handler
└── contexts/AuthContext.tsx        # Updated with action support
```

### Flow Diagram

```
User Action (Not Logged In)
    ↓
Store: redirectUrl + pendingAction
    ↓
Redirect to /login?redirectTo=/product/123
    ↓
User Logs In
    ↓
Retrieve: redirectUrl + pendingAction
    ↓
Redirect to Original Page
    ↓
Auto-Complete Pending Action (e.g., Add to Cart)
    ↓
Show Success Toast
```

---

## Usage Examples

### 1. Basic Auth Requirement

```typescript
import { useRequireAuth } from '@/hooks/useRequireAuth';

function ProductCard({ product }) {
  const { requireAuth } = useRequireAuth();

  const handleAction = () => {
    // Check if user is authenticated
    if (!requireAuth()) {
      return; // User redirected to login
    }
    
    // Continue with action
    performAction();
  };

  return <button onClick={handleAction}>Buy Now</button>;
}
```

### 2. Add to Cart with Auto-Completion

```typescript
import { useRequireAuth } from '@/hooks/useRequireAuth';

function ProductPage({ product }) {
  const { requireAuthForCart } = useRequireAuth();
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    // Will redirect to login if needed, storing productId and quantity
    if (!requireAuthForCart(product.id, quantity)) {
      return;
    }
    
    // User is authenticated, add to cart
    await addToCart(product, quantity);
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

**What happens:**
1. User clicks "Add to Cart" without being logged in
2. Redirects to `/login?redirectTo=/products/123`
3. Stores pending action: `{ type: 'add_to_cart', productId: '123', quantity: 1 }`
4. After login, user returns to `/products/123`
5. `PendingActionsHandler` automatically adds item to cart
6. Success toast shows "Item added to cart! 🛒"

### 3. Wishlist with Redirect

```typescript
const { requireAuthForWishlist } = useRequireAuth();

const handleAddToWishlist = () => {
  if (!requireAuthForWishlist(product.id)) {
    return; // Redirects to login
  }
  
  addToWishlist(product);
};
```

### 4. Checkout Protection

```typescript
const { requireAuthForCheckout } = useRequireAuth();

const handleCheckout = () => {
  if (!requireAuthForCheckout()) {
    return; // Redirects to login, then to checkout
  }
  
  router.push('/checkout');
};
```

---

## API Reference

### useRequireAuth Hook

```typescript
const {
  requireAuth,              // Generic auth check
  requireAuthForCart,       // Cart-specific with pending action
  requireAuthForWishlist,   // Wishlist-specific
  requireAuthForCheckout,   // Checkout-specific
  isAuthenticated,          // Boolean - current auth state
} = useRequireAuth();
```

#### Methods

**`requireAuth(action?, customMessage?)`**
- `action`: Optional pending action to execute after login
- `customMessage`: Optional toast message
- Returns: `boolean` - true if authenticated

**`requireAuthForCart(productId, quantity?)`**
- Stores add-to-cart action
- Returns: `boolean` - true if authenticated

**`requireAuthForWishlist(productId)`**
- Stores add-to-wishlist action
- Returns: `boolean` - true if authenticated

**`requireAuthForCheckout()`**
- Stores checkout intent
- Returns: `boolean` - true if authenticated

### Pending Action Types

```typescript
interface PendingAction {
  type: 'add_to_cart' | 'add_to_wishlist' | 'checkout';
  productId?: string;
  quantity?: number;
  data?: any;
}
```

### Redirect Utilities

```typescript
import {
  setRedirectUrl,          // Store redirect URL
  getAndClearRedirectUrl,  // Retrieve and clear
  setPendingAction,        // Store pending action
  getAndClearPendingAction,// Retrieve and clear
  isValidRedirectUrl,      // Security validation
  createLoginRedirect,     // Create login URL with redirect
} from '@/lib/auth/redirects';
```

---

## Security Features

### 1. Internal Routes Only

```typescript
// ✅ Valid
setRedirectUrl('/products/123')
setRedirectUrl('/checkout')

// ❌ Blocked (prevents open redirects)
setRedirectUrl('//evil.com')
setRedirectUrl('https://evil.com')
setRedirectUrl('javascript:alert(1)')
```

### 2. URL Sanitization

All redirect URLs are sanitized before storage and use:

```typescript
const sanitized = sanitizeRedirectUrl(unsafeUrl);
// Returns '/' if invalid
```

### 3. Session Storage

Uses `sessionStorage` (not `localStorage`) for security:
- Clears on tab close
- Not shared across origins
- Doesn't persist long-term

---

## Implementation Checklist

- [x] Core redirect utilities (`redirects.ts`)
- [x] Auth requirement hook (`useRequireAuth`)
- [x] Pending actions hook (`usePendingActions`)
- [x] Updated AuthContext with action support
- [x] Updated login page with redirect handling
- [x] Global PendingActionsHandler in layout
- [x] Security validations (prevent open redirects)
- [x] Loading states and UX transitions
- [x] TypeScript interfaces and types
- [x] Example implementation (product page)

---

## Testing Scenarios

### Scenario 1: Add to Cart (Not Logged In)
1. Visit product page: `/products/123`
2. Click "Add to Cart" button
3. **Expected:** Redirect to `/login?redirectTo=/products/123`
4. Login successfully
5. **Expected:** Return to `/products/123`
6. **Expected:** Item automatically added to cart
7. **Expected:** Toast shows "Item added to cart! 🛒"

### Scenario 2: Multiple Redirects
1. Visit product page while not logged in
2. Click "Add to Cart"
3. On login page, click "Create Account" link
4. **Expected:** Register page includes redirect parameter
5. Complete registration
6. **Expected:** Return to product page with item added

### Scenario 3: Security Test
1. Manually craft URL: `/login?redirectTo=https://evil.com`
2. Login successfully
3. **Expected:** Redirect to `/` (home), not evil.com

---

## Customization

### Add New Action Types

1. Add type to interface:

```typescript
// src/lib/auth/redirects.ts
export interface PendingAction {
  type: 'add_to_cart' | 'add_to_wishlist' | 'checkout' | 'subscribe'; // New type
  // ...
}
```

2. Add handler in `usePendingActions`:

```typescript
case 'subscribe':
  if (pendingAction.data?.email) {
    await subscribeNewsletter(pendingAction.data.email);
    toast.success('Subscribed to newsletter!');
  }
  break;
```

3. Add convenience method:

```typescript
// useRequireAuth.ts
const requireAuthForSubscribe = (email: string): boolean => {
  return requireAuth(
    { type: 'subscribe', data: { email } },
    'Please login to subscribe'
  );
};
```

---

## Best Practices

1. **Always use hooks for auth checks** - Don't manually redirect
2. **Clear messages** - Tell users why they need to login
3. **Complete actions silently** - Don't require user to click again
4. **Test security** - Verify open redirect prevention
5. **Handle errors gracefully** - Failed actions shouldn't break UX
6. **Use appropriate action types** - Makes debugging easier

---

## Troubleshooting

**Q: Actions not completing after login?**  
A: Ensure `PendingActionsHandler` is in your layout

**Q: Getting redirected to home instead of intended page?**  
A: Check that redirect URL is properly encoded in query param

**Q: Action completed but user sees no feedback?**  
A: Check toast notifications are working (Toaster component)

**Q: Security errors in console?**  
A: Verify all redirect URLs start with `/` (internal only)

---

## Performance Considerations

- Session storage operations are synchronous but fast
- Small delay (300ms) after login for smooth UX
- Pending action processing happens once per login
- No network calls for redirect logic itself

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires `sessionStorage` support (all modern browsers)
- Works with both client and server routing

---

## Contributing

When adding new auth-required features:

1. Use `useRequireAuth` hook
2. Add appropriate pending action type
3. Handle action in `usePendingActions`
4. Test redirect flow
5. Update this documentation

---

**Implementation Date:** 2025-10-31  
**Version:** 1.0  
**Status:** ✅ Production Ready

