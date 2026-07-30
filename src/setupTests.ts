// jest-dom adds custom matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// jsdom lacks matchMedia (Ionic + theme logic probe it) — provide a no-op stub.
window.matchMedia =
  window.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
