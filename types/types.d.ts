export {};

declare global {
  interface GlobalThis {
    __exportedGlobals__?: string[];
  }
}
