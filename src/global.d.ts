declare namespace globalThis {
  // Help TypeScript with this object only available in IE 8-11
  let XDomainRequest = XMLHttpRequest;

  // Node's Buffer, which browsers do not have unless a bundler adds a polyfill
  var Buffer: { byteLength: (value: string, encoding?: string) => number } | undefined;

  interface Window {
    optimizedContentAreas: Record<string, { selectedVariant: string }>;
  }
}
