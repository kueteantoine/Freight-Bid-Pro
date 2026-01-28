import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalStorage(key: string) {
  if (typeof window === "undefined" || !window.localStorage) return null
  try {
    return localStorage.getItem(key)
  } catch (e) {
    return null
  }
}

export function setLocalStorage(key: string, value: string) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      // Silently fail if storage is restricted
    }
  }
}

export function removeLocalStorage(key: string) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      // Silently fail
    }
  }
}