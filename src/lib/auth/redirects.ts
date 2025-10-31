// src/lib/auth/redirects.ts
/**
 * Secure redirect handling for authentication flows
 * Prevents open redirects by only allowing internal paths
 */

const REDIRECT_KEY = 'auth_redirect';
const PENDING_ACTION_KEY = 'pending_action';

export interface PendingAction {
  type: 'add_to_cart' | 'add_to_wishlist' | 'checkout';
  productId?: string;
  quantity?: number;
  data?: any;
}

/**
 * Validates that a redirect URL is safe (internal only)
 */
export const isValidRedirectUrl = (url: string): boolean => {
  try {
    // Allow relative paths starting with /
    if (url.startsWith('/')) {
      // Block any URLs that could be used for open redirects
      if (url.startsWith('//') || url.includes('://')) {
        return false;
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Sanitizes a redirect URL to ensure it's safe
 */
export const sanitizeRedirectUrl = (url: string): string => {
  if (!url || !isValidRedirectUrl(url)) {
    return '/';
  }
  return url;
};

/**
 * Stores the redirect URL for after login
 */
export const setRedirectUrl = (url: string): void => {
  const sanitized = sanitizeRedirectUrl(url);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(REDIRECT_KEY, sanitized);
  }
};

/**
 * Retrieves and clears the redirect URL
 */
export const getAndClearRedirectUrl = (): string => {
  if (typeof window === 'undefined') {
    return '/';
  }
  
  const url = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  
  return sanitizeRedirectUrl(url || '/');
};

/**
 * Stores a pending action to be completed after login
 */
export const setPendingAction = (action: PendingAction): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
  }
};

/**
 * Retrieves and clears the pending action
 */
export const getAndClearPendingAction = (): PendingAction | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const actionStr = sessionStorage.getItem(PENDING_ACTION_KEY);
  sessionStorage.removeItem(PENDING_ACTION_KEY);
  
  if (!actionStr) {
    return null;
  }
  
  try {
    return JSON.parse(actionStr);
  } catch {
    return null;
  }
};

/**
 * Clears all redirect data
 */
export const clearRedirectData = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(REDIRECT_KEY);
    sessionStorage.removeItem(PENDING_ACTION_KEY);
  }
};

/**
 * Creates a login redirect URL with the current path
 */
export const createLoginRedirect = (currentPath: string): string => {
  const sanitized = sanitizeRedirectUrl(currentPath);
  return `/login?redirectTo=${encodeURIComponent(sanitized)}`;
};

