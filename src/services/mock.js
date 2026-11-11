// src/services/mock.js
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const mockDelay = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));