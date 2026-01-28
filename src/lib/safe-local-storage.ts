/**
 * A highly defensive utility for accessing localStorage.
 * It verifies environment, availability, and API functional integrity.
 */

export const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const storage = window.localStorage;
    if (storage && typeof storage.getItem === 'function') {
      return storage.getItem(key);
    }
  } catch (error) {
    // Failsafe for restricted environments (e.g., incognito or disabled cookies)
  }
  return null;
};

export const safeSetItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;

  try {
    const storage = window.localStorage;
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(key, value);
    }
  } catch (error) {
    // Failsafe
  }
};

export const safeRemoveItem = (key: string): void => {
  if (typeof window === "undefined") return;

  try {
    const storage = window.localStorage;
    if (storage && typeof storage.removeItem === 'function') {
      storage.removeItem(key);
    }
  } catch (error) {
    // Failsafe
  }
};