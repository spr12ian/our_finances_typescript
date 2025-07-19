if (typeof globalThis === 'undefined') {
  (function () {
    let globalRef;
    if (typeof self !== 'undefined') {
      globalRef = self;
    } else if (typeof window !== 'undefined') {
      globalRef = window;
    } else if (typeof global !== 'undefined') {
      globalRef = global;
    } else {
      globalRef = Function('return this')();
    }
    globalRef.globalThis = globalRef;
  })();
}
