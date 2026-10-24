export interface DigitalData {
  scope: string;
  site: {
    siteInfo: {
      siteID: string;
    };
  };
  page: {
    pageInfo: PageInfo;
    /** Sent with the page properties. The default Unomi page schema does not allow it. */
    attributes?: Record<string, unknown>;
    consentTypes: string[];
  };
  events?: UnomiEvent[];
  interests?: unknown;
  contextServerPublicUrl?: string;
  sourceLocalIdentifierMap?: unknown;
  wemInitConfig: {
    contextServerUrl: string;
    isPreview?: boolean;
    timeoutInMilliseconds: number;
    dxUsername?: string;
    contextServerCookieName: string;
    activateWem: boolean;
    enableWemActionUrl?: string;
    requiredProfileProperties?: string[];
    requiredSessionProperties?: string[];
    requireSegments?: boolean;
    requireScores?: boolean;
    trackerProfileIdCookieName?: string;
    trackerSessionIdCookieName?: string;
    browserGeneratedSessionSuffix?: string;
    disableTrackedConditionsListeners?: boolean;
    /**
     * When false, tracker requests are sent without cookies. Default true.
     * The server profile cookie is then not sent: Unomi 2.x and 3.x find the
     * profile through the session only, and Unomi 4 creates a new anonymous
     * profile on every request.
     */
    sendCredentials?: boolean;
    /**
     * Public API key of the Unomi 4 tenant, sent as the X-Unomi-Api-Key header.
     * Leave unset for Unomi 2.x, Unomi 3.x, or Unomi 4 in single-tenant compatibility mode.
     * Never use a private key here: the tracker configuration is visible to visitors.
     * Setting it makes browsers send a CORS preflight before each request.
     */
    apiKey?: string;
  };
  personalizationCallback?: Array<{
    personalization: Personalization;
    callback: PersonalizationCallback;
  }>;
  loadCallbacks?: Array<{
    name?: string;
    priority: number;
    execute: (...args: unknown[]) => void;
  }>;
  displayedVariants?: unknown[];
}

export interface PageInfo {
  pageID: string;
  nodeType?: string;
  pageName: string;
  pagePath: string;
  templateName?: string;
  destinationURL: string;
  destinationSearch?: string;
  referringURL?: string;
  language: string;
  categories: string[];
  tags: string[];
  referrerHost?: string;
  referrerQuery?: string;
  sameDomainReferrer?: boolean;
}

export interface UnomiEvent {
  eventType: string;
  type?: string;
  scope: string;
  target?: UnomiObject;
  source?: UnomiObject;
  flattenedProperties?: Record<string, unknown>;
  properties?: Record<string, unknown>;
}

export interface UnomiObject {
  itemId: string;
  itemType: string;
  scope: string;
  properties?: UnomiProperties;
}

export interface UnomiProperties {
  type?: string;
  action?: string;
  systemName?: string;
  displayableName?: string;
  path?: string;
  tags?: string[];
  nodeType?: string;
  inControlGroup?: boolean;
  variants?: Variant[];
  pageInfo?: PageInfo;
}

export interface Variant {
  id: string;
  systemName: string;
  displayableName: string;
  path: string;
  tags: string[];
  nodeType: string;
  content: string;
  position: number;
  event?: UnomiEvent;
  inControlGroup?: boolean;
}

export interface Personalization {
  id: string;
  strategyOptions: {
    fallback: string;
  };
}

export type PersonalizationCallback = (
  result: string[],
  additionalResultInfos?: AdditionalResultInfos
) => void;

export interface AdditionalResultInfos {
  inControlGroup?: boolean;
}

export interface AjaxOptions {
  type: string;
  url: string;
  async: boolean;
  contentType?: string;
  dataType?: string;
  responseType?: XMLHttpRequestResponseType;
  error?: (xhr: XMLHttpRequest) => void;
  success?: (xhr: XMLHttpRequest) => void;
  jsonData?: unknown;
  data?: Document | XMLHttpRequestBodyInit | null;
}
