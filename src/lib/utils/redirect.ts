/**
 * Post-Auth Redirect Utility
 * 
 * Manages the intended redirect URL through the authentication flow.
 * Used when unauthenticated users land on protected pages (e.g., onboarding links,
 * invitation accepts) and need to be redirected back after completing auth.
 * 
 * Storage key: 'post_auth_redirect'
 * 
 * Priority order for post-auth redirect:
 *   1. Stored redirect URL (from this utility)
 *   2. Default redirect (getPostLoginRedirect — overview/latest event)
 * 
 * Whitelisted paths prevent open-redirect attacks.
 */

import { browser } from '$app/environment';

const STORAGE_KEY = 'post_auth_redirect';

/** Paths that are allowed as post-auth redirect targets */
const ALLOWED_PATH_PREFIXES = [
  '/speaker/',
  '/exhibitor/',
  '/vendor/',
  '/events/',
  '/overview',
  '/collections/',
  '/create-event',
];

/**
 * Validates that a redirect path is safe and internal.
 * Prevents open-redirect vulnerabilities.
 */
function isAllowedRedirect(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  // Must be a relative path (starts with /)
  if (!path.startsWith('/')) return false;
  // Must not contain protocol indicators (prevent //evil.com)
  if (path.startsWith('//')) return false;
  // Must match one of the allowed prefixes
  return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Saves the intended redirect URL to localStorage.
 * Call this before redirecting to /auth from a protected page.
 */
export function setPostAuthRedirect(path: string): void {
  if (!browser) return;
  if (!isAllowedRedirect(path)) return;
  localStorage.setItem(STORAGE_KEY, path);
}

/**
 * Retrieves and clears the stored redirect URL.
 * Call this after successful authentication to get the redirect target.
 * Returns null if no redirect is stored or if the stored path is invalid.
 */
export function consumePostAuthRedirect(): string | null {
  if (!browser) return null;
  const path = localStorage.getItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  if (path && isAllowedRedirect(path)) return path;
  return null;
}

/**
 * Clears any stored redirect without consuming it.
 * Useful for cleanup on logout.
 */
export function clearPostAuthRedirect(): void {
  if (!browser) return;
  localStorage.removeItem(STORAGE_KEY);
}
