import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely access localStorage with environment guards.
 * Checks not just for 'window' presence but also if 'getItem' is a function.
 */
export function getLocalStorage(key: string) {
  if (typeof window === "undefined") return null;
  
  try {
    const storage = window.localStorage;
    // Some SSR environments define localStorage as {} which lacks methods
    if (storage && typeof storage.getItem === 'function') {
      return storage.getItem(key);
    }
  } catch (e) {
    // Handle cases where storage is disabled or restricted
  }
  return null;
}

export function setLocalStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  
  try {
    const storage = window.localStorage;
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(key, value);
    }
  } catch (e) {
    // Silently fail
  }
}

export function removeLocalStorage(key: string) {
  if (typeof window === "undefined") return;
  
  try {
    const storage = window.localStorage;
    if (storage && typeof storage.removeItem === 'function') {
      storage.removeItem(key);
    }
  } catch (e) {
    // Silently fail
  }
}