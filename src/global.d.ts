declare namespace globalThis {
  // Help TypeScript with this object only available in IE 8-11
  let XDomainRequest = XMLHttpRequest;

  interface Window {
    optimizedContentAreas: Record<string, { selectedVariant: string }>;
  }
}
