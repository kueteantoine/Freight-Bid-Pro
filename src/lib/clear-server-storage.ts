// This file runs on the server ONLY
if (typeof window === "undefined") {
  try {
    // Dyad / sandbox sometimes defines localStorage incorrectly
    if (
      typeof (globalThis as any).localStorage !== "undefined" &&
      typeof (globalThis as any).localStorage.getItem !== "function"
    ) {
      delete (globalThis as any).localStorage;
    }
  } catch (e) {
    console.error("Failed to clear invalid localStorage:", e);
  }
}