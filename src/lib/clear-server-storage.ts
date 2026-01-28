// This file runs on the server ONLY
if (typeof window === "undefined") {
  // Dyad / sandbox sometimes defines localStorage incorrectly
  if (
    typeof (globalThis as any).localStorage !== "undefined" &&
    typeof (globalThis as any).localStorage.getItem !== "function"
  ) {
    delete (globalThis as any).localStorage;
  }
}