import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { safeGetItem, safeSetItem, safeRemoveItem } from "./safe-local-storage"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Project-wide storage wrappers.
 * Now strictly delegated to safe-local-storage logic.
 */
export function getLocalStorage(key: string) {
  return safeGetItem(key);
}

export function setLocalStorage(key: string, value: string) {
  safeSetItem(key, value);
}

export function removeLocalStorage(key: string) {
  safeRemoveItem(key);
}