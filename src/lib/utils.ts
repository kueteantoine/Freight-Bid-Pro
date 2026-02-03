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

/**
 * Formats time remaining in milliseconds into a human-readable string.
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: string | Date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB'); // DD/MM/YYYY
}