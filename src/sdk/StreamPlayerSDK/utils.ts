let debugEnabled = false;

export const setDebug = (enabled: boolean) => {
  debugEnabled = enabled;
};

export const log = (...args: unknown[]) => {
  if (debugEnabled) {
    console.log("[StreamPlayerSDK]", ...args);
  }
};

export const warn = (...args: unknown[]) => {
  if (debugEnabled) {
    console.warn("[StreamPlayerSDK]", ...args);
  }
};

export const error = (...args: unknown[]) => {
  console.error("[StreamPlayerSDK]", ...args);
};

export const resolveContainer = (container: HTMLElement | string): HTMLElement | null => {
  if (typeof container === "string") {
    return document.querySelector(container);
  }
  return container;
};
