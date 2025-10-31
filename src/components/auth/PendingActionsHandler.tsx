// src/components/auth/PendingActionsHandler.tsx
'use client';

import { usePendingActions } from '@/hooks/usePendingActions';

/**
 * Component to handle pending actions after login
 * Should be included in the root layout
 */
export const PendingActionsHandler = () => {
  usePendingActions();
  return null;
};

