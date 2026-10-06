# Apache Unomi Tracker - Project Analysis & Modernization Plan

**Version:** 1.0  
**Date:** 2026  
**Status:** Planning Phase

---

## Executive Summary

This document provides a comprehensive analysis of the Apache Unomi Tracker project, identifies critical bugs, documents all issues, and outlines a modernization strategy for 2026. The plan prioritizes **testing first** to ensure backward compatibility throughout the modernization process, and includes support for **Unomi V4.0 multi-tenancy**.

**Key Findings:**
- 🔴 **2 Critical Bugs** requiring immediate fixes
- ⚠️ **13 Issues** across documentation, code quality, and compatibility
- 🚀 **Modernization Opportunity** to improve maintainability and type safety
- 🔄 **V4.0 Compatibility** needed to support Unomi multi-tenancy alongside V2

**Recommended Approach (8 phases, 8 stacked PRs):**
1. **Phase 0**: Establish comprehensive test suite with server mocks (4 weeks)
2. **Phase 1**: Fix critical bugs + add Unomi V4.0 compatibility (2 weeks)
3. **Phase 2**: Modernize build toolchain + config cleanup (4 weeks)
4. **Phase 3**: TypeScript migration -- extract utilities (2 weeks)
5. **Phase 4**: TypeScript migration -- extract features (2 weeks)
6. **Phase 5**: TypeScript migration -- core class + facade (4 weeks)
7. **Phase 6**: Extension hooks + code quality (4 weeks)
8. **Phase 7**: Documentation + DX + final polish (4 weeks)

**Total Timeline:** 6 months (26 weeks)  
**Risk Level:** Low-Medium (incremental, backward compatible)  
**PR Strategy:** Each phase = 1 stacked PR. Strict linear dependency chain: PR N builds on PR N-1.

---

## Part 1: Current State Analysis

### Codebase Structure
- **Main file**: `src/apache-unomi-tracker.js` (~1,500 lines) - monolithic structure
- **Type definitions**: `src/types.ts` (exists, well-structured)
- **Build system**: Rollup 2.x + Babel 7.x
- **Testing**: Minimal (basic existence check only)
- **Module format**: Supports ESM, CJS, and UMD outputs ✅

### Dependencies Status (2026)
| Package | Current | Latest (2026) | Status | Action |
|---------|---------|---------------|--------|--------|
| Rollup | 2.79.0 | 4.x | ⚠️ Outdated | Upgrade |
| Babel | 7.18.x | 8.x | ⚠️ Outdated | Replace with esbuild |
| TypeScript | 5.8.2 | 5.7.x+ | ✅ Current | Keep |
| ESLint | 8.23.0 | 9.x | ⚠️ Outdated | Upgrade |
| es6-crawler-detect | 3.3.0 | 4.x | ⚠️ Outdated | Upgrade (has types in v4) |

---

## Part 2: Critical Bugs (Must Fix Immediately)

### 🔴 Bug #1: Incorrect Array Splice Operation

**Location:** `src/apache-unomi-tracker.js:448`  
**Severity:** Critical - Logic Bug  
**Status:** Verified ✅

**Current Code:**
```javascript
var eventIndex = wem.eventsPrevented.indexOf(targetId);
if (eventIndex !== -1) {
    wem.eventsPrevented.splice(eventIndex, 0);  // ❌ BUG: Removes 0 elements
}
```

**The Problem:**
- `splice(index, 0)` removes **0 elements** - it does nothing!
- Array element is never removed
- Causes incorrect event handling behavior

**Verification:**
```javascript
const arr = ['a', 'b', 'c'];
arr.splice(1, 0); // Removes 0 elements
console.log(arr); // ['a', 'b', 'c'] - unchanged!
```

**Fix:**
```javascript
if (eventIndex !== -1) {
    wem.eventsPrevented.splice(eventIndex, 1);  // ✅ Remove 1 element
}
```

**Impact:** Event prevention logic doesn't work correctly, potential memory issues.

---

### 🔴 Bug #2: Broken `_resolveId` Function

**Location:** `src/apache-unomi-tracker.js:1420-1428`  
**Severity:** Critical - Multiple Logic Errors  
**Status:** Verified ✅ (marked with `@ts-expect-error` in code)

**Current Code:**
```javascript
_resolveId: function (id) {
    if (wem.digitalData.sourceLocalIdentifierMap) {
        var source = Object.keys(wem.digitalData.sourceLocalIdentifierMap).filter(function (source) {
            return id.indexOf(source) > 0;  // ❌ BUG 1: > 0 misses index 0
        });
        // @ts-expect-error This code is broken, source is an array
        return source ? id.replace(source, wem.digitalData.sourceLocalIdentifierMap[source]) : id;
        // ❌ BUG 2: source is an array, not a string
        // ❌ BUG 3: Can't use array in replace()
    }
    return id;
}
```

**The Problems:**
1. **`filter()` returns array, not string** - but used as string in `replace()`
2. **`indexOf(source) > 0` misses matches at position 0** - should be `!== -1`
3. **Type error** - array used where string expected

**Verification:**
```javascript
// Issue 1: filter returns array
const source = Object.keys(map).filter(...);
console.log(Array.isArray(source)); // true - but used as string!

// Issue 2: > 0 misses index 0
const id = 'prefix-item'; // Match at index 0
id.indexOf('prefix') > 0; // false - should be true!
```

**Fix:**
```javascript
_resolveId: function (id) {
    if (wem.digitalData.sourceLocalIdentifierMap) {
        var sources = Object.keys(wem.digitalData.sourceLocalIdentifierMap);
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            if (id.indexOf(source) !== -1) {  // ✅ Fix: !== -1 finds all matches
                return id.replace(source, wem.digitalData.sourceLocalIdentifierMap[source]);
            }
        }
    }
    return id;
}
```

**Impact:** ID mapping fails, tracker can't find elements on page (forms, videos, clicks).

**Test File:** See `test/bugs/bug-demonstration.test.js` for comprehensive bug verification tests.

---

## Part 3: Issues Found

### 📚 Documentation Issues

#### 1. Minimal README.md (High Priority)
- ❌ No installation instructions
- ❌ No usage examples
- ❌ No API documentation
- ❌ No configuration guide

**Fix:** Expand README with installation, usage, API reference, examples.

---

### ⚠️ Code Quality Issues

#### 2. Excessive Type Suppression (Medium Priority)
- 14 `@ts-expect-error` comments throughout codebase
- Masks potential runtime errors
- Reduces code reliability

**Fix:** Address type issues properly, add type guards, update type definitions.

#### 3. Deprecated Event Creation APIs (Medium Priority)
- Uses `document.createEvent()` and `initCustomEvent()` (deprecated)
- Should use modern `CustomEvent()` and `Event()` constructors

**Fix:** Replace with modern APIs (lines 795-796, 1320-1322).

#### 4. Inconsistent Function Styles (Low Priority)
- Mixes arrow functions and function expressions
- Should standardize on one style

#### 5. Incomplete Null Checking (Low Priority)
- `_isObject` function could be more explicit about null checking

---

### 🔧 Compatibility Issues

#### 6. Deprecated Babel Configuration (High Priority)
- Uses deprecated `browsers` field
- Should use modern `browserslist` format

**Fix:** Add `.browserslistrc` or update `package.json`, remove deprecated field.

#### 7. Incorrect TypeScript Type Definition (High Priority)
- `XDomainRequest` incorrectly typed as `XMLHttpRequest` in `global.d.ts`
- Should have proper interface definition

**Fix:** Define proper `XDomainRequest` interface.

---

### 🧪 Testing Issues

#### 8. Minimal Test Coverage (High Priority)
- Only basic existence check
- No functional tests
- No integration tests
- No edge case coverage

**Fix:** Establish comprehensive test suite (see Phase 0 below).

---

## Part 4: Unomi V4.0 Compatibility

### Context

Apache Unomi V4.0 introduces **multi-tenancy**: all data (profiles, events, segments, rules, schemas) is now tenant-scoped. The main impact on the tracker is a new **authentication model** for API endpoints.

### What Changed in V4.0

| Aspect | Unomi V2 | Unomi V4.0 |
|--------|----------|------------|
| **Authentication** | Cookies + optional `X-Unomi-Peer` for protected events | `X-Unomi-Api-Key` header (public API key) |
| **Multi-tenancy** | None (single tenant) | Full tenant isolation, per-tenant API keys |
| **Endpoint paths** | `/context.json`, `/eventcollector` | **Same** -- no change |
| **Request/response format** | `ContextRequest` / `ContextResponse` | **Same** -- no change |
| **Protected events** | IP + `X-Unomi-Peer` header | API key scopes (or V2 compat mode) |

### V2 Compatibility Mode (Server-Side)

Unomi V4.0 includes a built-in V2 compatibility mode (`UNOMI-904`) that allows V2 clients to work without changes:
- Public endpoints (`/context.json`) accept requests without authentication
- A default tenant is used for all operations
- Protected events still use IP + `X-Unomi-Peer`
- This is a **transitional feature**, not a permanent solution

### Tracker Compatibility Strategy

**Approach: Configuration-driven authentication** -- the tracker adds API key headers when configured, and works as-is (V2 mode) when not.

#### Configuration Changes

Two new optional fields in `wemInitConfig`:

```typescript
wemInitConfig: {
    contextServerUrl: string;
    // ... existing fields ...

    // NEW: Unomi V4.0 multi-tenancy support
    apiKey?: string;       // Public API key for V4.0 authentication
    tenantId?: string;     // Tenant ID (for admin/private operations, optional)
}
```

#### Implementation Changes

The `ajax()` method conditionally injects the `X-Unomi-Api-Key` header:

```javascript
// In the ajax() function, after existing header setup:
if (wem.apiKey) {
    xhr.setRequestHeader('X-Unomi-Api-Key', wem.apiKey);
}
if (wem.tenantId) {
    xhr.setRequestHeader('X-Unomi-Tenant-Id', wem.tenantId);
}
```

#### CORS Preflight Consideration

The current tracker uses `Content-Type: text/plain;charset=UTF-8` to **avoid CORS preflight**. Adding custom headers like `X-Unomi-Api-Key` **will trigger a CORS preflight** (`OPTIONS` request).

**Impact:** One extra round-trip per unique URL (browser caches preflight via `Access-Control-Max-Age`).

**Why this is acceptable:**
- The Unomi V4.0 server already supports CORS for `X-Unomi-Api-Key`
- Preflight is cached by browsers, so the overhead is minimal
- This only affects V4.0 mode; V2 mode remains unchanged (no preflight)
- The security benefit of proper API key authentication outweighs the minor overhead

#### Compatibility Matrix

| Tracker Config | Unomi V2 Server | V4.0 (V2 compat mode) | V4.0 (native) |
|----------------|-----------------|------------------------|----------------|
| No API key     | Works           | Works                  | 401 Unauthorized |
| With API key   | Header ignored* | Works                  | Works          |

\* V2 servers don't check for `X-Unomi-Api-Key`, so the extra header is silently ignored -- making the tracker safely backward compatible in both directions.

---

## Part 5: Modernization Strategy

### Stacked PR Model

Each phase produces exactly one PR. Each PR depends only on the previous one, forming a strict linear chain suitable for stacked PR workflows.

```
PR 1 (Phase 0): Testing infrastructure
  ↓
PR 2 (Phase 1): Bug fixes + V4.0 support
  ↓
PR 3 (Phase 2): Build modernization + config cleanup
  ↓
PR 4 (Phase 3): Extract utilities → TypeScript
  ↓
PR 5 (Phase 4): Extract features → TypeScript
  ↓
PR 6 (Phase 5): Core TypeScript class + facade
  ↓
PR 7 (Phase 6): Extension hooks + code quality
  ↓
PR 8 (Phase 7): Documentation + DX + final polish
```

---

### Phase 0: Testing Infrastructure (Weeks 1-4) ⭐ START HERE

**PR 1** | Depends on: nothing | Ticket: UNOMI-TRACKER-001

**Critical:** Must be completed before any code changes.

#### Goals
- Establish comprehensive test suite with server mocks
- Achieve 80%+ code coverage
- Create bug verification tests
- Ensure backward compatibility tests

#### Implementation

**1. Set up Vitest + MSW**
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "msw": "^2.0.0",
    "jsdom": "^25.0.0"
  }
}
```

**2. Mock Unomi Server Endpoints**
- `/context.json` (POST) - context loading
- `/eventcollector` (POST) - event collection
- Support success, error, timeout, network failure scenarios
- Both V2 (no auth) and V4.0 (API key) mock handlers

**3. Test Coverage**
- Unit tests: utilities, core logic
- Integration tests: tracker initialization, context loading, event collection
- Backward compatibility: 100% API coverage
- Bug verification: prove bugs exist

**Deliverables:**
- ✅ Vitest configured
- ✅ MSW with Unomi mocks (V2 + V4.0)
- ✅ 80%+ code coverage
- ✅ Bug verification tests
- ✅ All tests passing

---

### Phase 1: Fix Critical Bugs + Unomi V4.0 Compatibility (Weeks 5-6)

**PR 2** | Depends on: PR 1 (Phase 0) | Ticket: UNOMI-TRACKER-002

1. Fix Bug #1: Change `splice(eventIndex, 0)` to `splice(eventIndex, 1)`
2. Fix Bug #2: Rewrite `_resolveId` function with correct logic
3. Add Unomi V4.0 multi-tenancy support:
   - Add optional `apiKey` and `tenantId` to `wemInitConfig` and types
   - Modify `ajax()` to inject `X-Unomi-Api-Key` / `X-Unomi-Tenant-Id` headers when configured
   - Add tests for both V2 (no API key) and V4.0 (with API key) modes

**Verification:** Bug verification tests now pass. V4.0 authentication tests pass.

**Deliverables:**
- ✅ Both critical bugs fixed
- ✅ V4.0 API key support added (~20-30 lines, additive only)
- ✅ All tests passing

---

### Phase 2: Modernize Build Toolchain + Config Cleanup (Weeks 7-10)

**PR 3** | Depends on: PR 2 (Phase 1) | Ticket: UNOMI-TRACKER-003

#### 2.1 Upgrade Rollup to 4.x
- Better performance, improved TypeScript support, better tree-shaking

#### 2.2 Replace Babel with esbuild
- 10-100x faster builds, native TypeScript support, smaller bundles
- Remove `babel.config.json` entirely

#### 2.3 Upgrade Dependencies
- `es6-crawler-detect`: 3.3.0 → 4.0.0 (has TypeScript types)
- `eslint`: 8.23.0 → 9.0.0
- Add TypeScript ESLint plugins

#### 2.4 Fix Configuration Issues
- Add modern `browserslist` format (replaces deprecated Babel `browsers` field)
- Fix `XDomainRequest` type definition in `global.d.ts`
- Configure TypeScript with `allowJs` and `checkJs` for incremental migration

**Deliverables:**
- ✅ Rollup 4.x + esbuild (Babel removed)
- ✅ All dependencies upgraded
- ✅ Config issues fixed (browserslist, XDomainRequest type)
- ✅ Build produces same output, faster

---

### Phase 3: TypeScript Migration -- Utilities (Weeks 11-12)

**PR 4** | Depends on: PR 3 (Phase 2) | Ticket: UNOMI-TRACKER-004

First step of the incremental "edge → trunk" migration strategy. Extract leaf-level utility functions that have no dependencies on other tracker code.

- Create `src/utils/` directory
- Extract cookie utilities (`setCookie`, `getCookie`, `removeCookie`) → `src/utils/cookies.ts`
- Extract event builders (`buildEvent`, `buildTarget`, `buildSource`, etc.) → `src/utils/events.ts`
- Extract AJAX utility → `src/utils/ajax.ts`
- Extract form utilities (`_extractFormData`) → `src/utils/form.ts`
- Extract URL utilities (`getUrlParameter`, `convertUrlParametersToObj`) → `src/utils/url.ts`
- Update main file to import from new modules

**Deliverables:**
- ✅ All utility functions extracted and converted to TypeScript
- ✅ Unit tests for all utilities
- ✅ Main file imports from new modules
- ✅ All tests passing

---

### Phase 4: TypeScript Migration -- Features (Weeks 13-14)

**PR 5** | Depends on: PR 4 (Phase 3) | Ticket: UNOMI-TRACKER-005

Extract higher-level feature modules. These depend on the utility modules extracted in Phase 3.

- Create `src/features/` directory
- Extract personalization logic → `src/features/personalization.ts`
- Extract optimization/A/B testing logic → `src/features/optimization.ts`
- Extract event tracking logic → `src/features/tracking.ts`
- Feature modules import from `src/utils/` (established in Phase 3)
- Update main file to import from new modules

**Deliverables:**
- ✅ All feature modules extracted and converted to TypeScript
- ✅ Integration tests for all features
- ✅ All tests passing

---

### Phase 5: TypeScript Migration -- Core Class + Facade (Weeks 15-18)

**PR 6** | Depends on: PR 5 (Phase 4) | Ticket: UNOMI-TRACKER-006

Convert the now-slimmed-down main tracker to a TypeScript class. Build the facade layer for backward compatibility. This requires both utilities (Phase 3) and features (Phase 4) to be extracted first so the core only contains orchestration logic.

- Convert tracker object to `UnomiTracker` TypeScript class
- Build facade: `useTracker()` returns plain `wem` object that delegates to the class
- Facade exposes same public methods, same state access (via getters/setters), same mutability
- Add deprecation warnings on `_` prefixed methods (not removed until v2.0)
- Define formal public API contract as TypeScript interface
- Remove `@ts-expect-error` comments (target: 50% reduction)

**Deliverables:**
- ✅ Core tracker in TypeScript with clean encapsulation
- ✅ Facade preserves exact `wem` object shape
- ✅ Public API contract defined and tested
- ✅ 80%+ TypeScript coverage
- ✅ All tests passing

---

### Phase 6: Extension Hooks + Code Quality (Weeks 19-22)

**PR 7** | Depends on: PR 6 (Phase 5) | Ticket: UNOMI-TRACKER-007

Requires the facade/class architecture from Phase 5 to be in place so hooks can be wired into the tracker internals.

#### 6.1 Extension Hooks API
- Implement official hooks system (`beforeRequest`, `afterRequest`, `onContextLoaded`, `beforeEvent`, `afterEvent`)
- Provides clean alternative to monkey-patching
- Follows Open/Closed Principle

#### 6.2 Code Quality
- Replace deprecated `document.createEvent()` APIs with `CustomEvent()` and `Event()` constructors
- Address remaining `@ts-expect-error` comments
- Implement lazy loading for optional features (personalization, optimization)

#### 6.3 Final Directory Structure
```
src/
  ├── index.ts                    # Main entry point (useTracker facade)
  ├── core/
  │   ├── tracker.ts              # UnomiTracker class (internal)
  │   ├── context.ts              # Context loading
  │   ├── callbacks.ts            # Callback management
  │   └── hooks.ts                # Extension hooks system
  ├── facade/
  │   └── wem.ts                  # Facade builder (plain object wrapping class)
  ├── utils/                      # Utilities (converted in Phase 3)
  ├── features/                   # Features (converted in Phase 4)
  └── types/
      ├── index.ts                # Type exports
      └── public-api.ts           # Public API contract (interface)
```

**Deliverables:**
- ✅ Extension hooks API implemented and tested
- ✅ Deprecated APIs replaced
- ✅ Code splitting implemented
- ✅ Final modular structure in place
- ✅ All tests passing

---

### Phase 7: Documentation + DX + Final Polish (Weeks 23-26)

**PR 8** | Depends on: PR 7 (Phase 6) | Ticket: UNOMI-TRACKER-008

Done last so documentation reflects the final API surface, including hooks, facade, and V4.0 support.

#### 7.1 Documentation
- Expand README with installation, usage, API reference, examples
- Document V4.0 configuration (`apiKey`, `tenantId`)
- Document extension hooks API with migration examples
- Document public API contract and migration guide for consumers

#### 7.2 Code Cleanup
- Refactor duplicated code patterns (DRY)
- Standardize function declaration styles (KISS)
- Improve `_isObject` and other utility functions

#### 7.3 Developer Experience
- ESLint + Prettier with pre-commit hooks (Husky, lint-staged)
- CI/CD pipeline with type checking, linting, coverage reporting

**Deliverables:**
- ✅ Comprehensive documentation (including V4.0 + hooks)
- ✅ Duplicated code refactored
- ✅ ESLint + Prettier + pre-commit hooks configured
- ✅ CI/CD pipeline updated
- ✅ All checks passing

---

## Part 6: Implementation Guidelines

### Engineering Principles

All implementation work must follow these principles:

**DRY (Don't Repeat Yourself)**
- Extract shared logic into reusable utilities and functions
- Eliminate duplicated patterns (e.g., duplicated context loading checks, repeated null guards)
- Use parameterized functions instead of copy-paste variants
- Single source of truth for configuration, constants, and type definitions

**KISS (Keep It Simple, Stupid)**
- Prefer simple, readable solutions over clever abstractions
- Don't over-engineer the plugin/extension system -- start minimal, expand as needed
- Each function should do one thing and be easy to understand
- Avoid premature optimization -- measure first, optimize second

**SOLID Principles**
- **Single Responsibility**: Each module/file handles one concern (e.g., `cookies.ts` only manages cookies, `ajax.ts` only handles HTTP)
- **Open/Closed**: The tracker is open for extension (hooks, plugins, overrides) but closed for modification (stable public API contract)
- **Liskov Substitution**: Any wrapped or extended tracker instance must work wherever the base tracker is expected
- **Interface Segregation**: Consumers import only what they need; modular exports prevent forced dependency on unused features
- **Dependency Inversion**: Internal modules depend on abstractions (interfaces/types), not concrete implementations; the `ajax` function should be injectable/overridable

### Testing First Approach

**Critical Principle:** All code changes must have tests first.

1. Write tests demonstrating current behavior (including bugs)
2. Write tests for desired behavior
3. Make code changes
4. Verify tests pass
5. Ensure no regressions

### Backward Compatibility & Extensibility

#### The Problem

The current library exports a factory function `useTracker()` that returns a **plain mutable object** (`wem`) with ~50 methods and directly accessible state. There is no encapsulation -- all methods and properties (including those prefixed with `_`) are publicly accessible and mutable.

Consumers who embed/extend the library may rely on any of these patterns:

| Extension Pattern | Example | Risk Level |
|-------------------|---------|------------|
| **Monkey-patching methods** | `wem.ajax = myCustomAjax` | High |
| **Adding custom methods** | `wem.myCustomTrack = function() {...}` | Medium |
| **Direct state access** | `wem.cxs`, `wem.sessionID`, `wem.digitalData` | High |
| **Overriding internals** | `wem._onSuccess = myHandler` | High |
| **Wrapping the factory** | `const wem = useTracker(); wem.extra = ...` | Medium |
| **DOM event listeners** | `document.addEventListener('wem.event', ...)` | Low |
| **Callback system** | `digitalData.loadCallbacks`, `personalizationCallback` | Low |

If we convert to a TypeScript class with private members and split code into modules, **all high-risk patterns break**.

#### The Solution: Facade + Hooks Architecture

The cleanest approach follows the **Open/Closed Principle**: keep the existing API surface stable while building clean internals underneath.

**Layer 1: Internal Modules (new, clean)**
```
src/core/        → Clean TypeScript classes and functions
src/utils/       → Pure utility functions
src/features/    → Feature modules
src/types/       → Type definitions and interfaces
```

**Layer 2: Facade Object (backward compatible)**
```typescript
// src/index.ts
export const useTracker = () => {
    const tracker = new UnomiTracker();  // Clean internal implementation

    // The wem facade: a plain object that delegates to the internal tracker
    // This preserves the exact same shape consumers expect
    const wem = {
        // --- Public state (directly accessible, as before) ---
        get cxs() { return tracker.cxs; },
        set cxs(v) { tracker.cxs = v; },
        get digitalData() { return tracker.digitalData; },
        get sessionID() { return tracker.sessionID; },
        // ...

        // --- Public methods (same signatures as before) ---
        initTracker: (d) => tracker.initTracker(d),
        startTracker: (o) => tracker.startTracker(o),
        loadContext: (...args) => tracker.loadContext(...args),
        collectEvent: (...args) => tracker.collectEvent(...args),
        buildEvent: (...args) => tracker.buildEvent(...args),
        ajax: (opts) => tracker.ajax(opts),
        // ... all ~25 public methods ...

        // --- "Private" methods (deprecated, with warnings) ---
        _onSuccess: (...args) => {
            console.warn('[WEM] _onSuccess is internal and may change. Use loadCallbacks instead.');
            return tracker._onSuccess(...args);
        },
        // ... other _ methods with deprecation warnings ...
    };

    return wem;
};
```

**Key properties of this approach:**
- The returned `wem` object has the **exact same shape** as today
- Methods can still be monkey-patched (the object is mutable)
- State is still directly accessible via getters/setters
- Internal implementation is clean TypeScript with proper encapsulation
- `_` prefixed methods log deprecation warnings, guiding consumers to official APIs
- Follows **Liskov Substitution**: the facade is a drop-in replacement

**Layer 3: Extension Hooks (new, opt-in)**

For consumers who need to extend behavior, provide official hooks instead of requiring monkey-patching:

```typescript
// Official extension points (Open/Closed Principle)
wem.hooks = {
    // Middleware for ajax requests (replaces monkey-patching wem.ajax)
    beforeRequest: (callback) => tracker.addHook('beforeRequest', callback),
    afterRequest: (callback) => tracker.addHook('afterRequest', callback),

    // Context lifecycle hooks (replaces overriding _onSuccess)
    onContextLoaded: (callback) => tracker.addHook('contextLoaded', callback),
    onContextError: (callback) => tracker.addHook('contextError', callback),

    // Event hooks (replaces overriding collectEvent)
    beforeEvent: (callback) => tracker.addHook('beforeEvent', callback),
    afterEvent: (callback) => tracker.addHook('afterEvent', callback),
};
```

**Usage example for consumers who currently monkey-patch:**
```javascript
// BEFORE (fragile monkey-patching):
const { wem } = useTracker();
const originalAjax = wem.ajax;
wem.ajax = function(options) {
    options.headers = { ...options.headers, 'X-Custom': 'value' };
    return originalAjax.call(this, options);
};

// AFTER (official hooks API):
const { wem } = useTracker();
wem.hooks.beforeRequest((options) => {
    options.headers = { ...options.headers, 'X-Custom': 'value' };
    return options;
});
```

#### Migration Path for Consumers

| Version | What Changes | Consumer Impact |
|---------|-------------|-----------------|
| **v1.5.x** (current) | Bug fixes + V4.0 support | None -- additive only |
| **v1.6.x** | Internal refactoring behind facade | None -- same API shape |
| **v1.7.x** | `_` methods log deprecation warnings | Warnings in console for internal method usage |
| **v1.8.x** | Hooks API available | Consumers can migrate off monkey-patching |
| **v2.0.0** | `_` methods removed, class-only export option | Breaking for consumers using `_` methods |

This gives consumers **at least 3 minor versions** of warning before anything breaks.

#### Formal Public API Contract

To make this explicit, the public API surface is defined as:

**Stable (guaranteed across v1.x):**
- `useTracker()` factory function
- All methods without `_` prefix (~25 methods)
- State properties: `cxs`, `digitalData`, `sessionID`, `fallback`, `DOMLoaded`
- `wemInitConfig` shape (additive changes only)
- DOM events dispatched by `dispatchJSEvent`
- Callback system: `loadCallbacks`, `personalizationCallback`

**Internal (may change with deprecation notice):**
- All `_` prefixed methods (~15 methods)
- Internal state: `contextLoaded`, `eventsPrevented`, `formNamesToWatch`

### Versioning Strategy

- **v1.5.x**: Current version + bug fixes + V4.0 support
- **v1.6.x-v1.8.x**: Internal modernization behind facade, hooks API
- **v2.0.0**: Future major version (can remove deprecated `_` methods, class-only export)

---

## Part 7: Success Metrics

### Code Quality
- [ ] All code follows DRY, KISS, and SOLID principles
- [ ] 80%+ TypeScript coverage
- [ ] 0 `@ts-expect-error` comments (or documented)
- [ ] 80%+ test coverage
- [ ] All ESLint rules passing
- [ ] No duplicated logic patterns

### Performance
- [ ] Bundle size maintained or reduced
- [ ] Build time improved (target: 50% faster)
- [ ] Runtime performance maintained

### Compatibility
- [ ] All existing tests pass
- [ ] No breaking changes in public API
- [ ] All output formats work (CJS, ESM, UMD)
- [ ] Tracker works with Unomi V2 (no API key configured)
- [ ] Tracker works with Unomi V4.0 (API key configured)
- [ ] Tracker works with Unomi V4.0 in V2 compatibility mode

### Extensibility
- [ ] Facade preserves exact `wem` object shape for consumers who extend/embed
- [ ] Monkey-patching still works on the facade object
- [ ] Direct state access (`wem.cxs`, `wem.sessionID`) still works
- [ ] Hooks API available for clean extensibility
- [ ] `_` prefixed methods log deprecation warnings (not removed until v2.0)
- [ ] Public API contract documented and tested

---

## Part 8: Quick Wins (Can Start Immediately)

1. **Set up Vitest and MSW** ⭐ START HERE
2. **Create bug verification tests**
3. **Fix critical bugs** (after tests are in place)
4. **Upgrade es6-crawler-detect to v4** (has types)
5. **Set up ESLint for TypeScript**

---

## Appendix: Test Examples

### Bug Verification Test
See `test/bugs/bug-demonstration.test.js` for comprehensive bug verification.

### Server Mock Examples

#### V2 Mode (no authentication)
```typescript
// test/mocks/handlers-v2.ts
import { http, HttpResponse } from 'msw';

export const v2Handlers = [
  http.post('*/context.json', () => {
    return HttpResponse.json({
      profileId: 'test-profile-123',
      sessionId: 'test-session-456',
    });
  }),
  http.post('*/eventcollector', () => {
    return HttpResponse.json({ eventsProcessed: 1 });
  })
];
```

#### V4.0 Mode (API key authentication)
```typescript
// test/mocks/handlers-v3.ts
import { http, HttpResponse } from 'msw';

const VALID_API_KEY = 'test-public-api-key-123';

export const v3Handlers = [
  http.post('*/context.json', ({ request }) => {
    const apiKey = request.headers.get('X-Unomi-Api-Key');
    if (!apiKey || apiKey !== VALID_API_KEY) {
      return new HttpResponse('Unauthorized', { status: 401 });
    }
    return HttpResponse.json({
      profileId: 'test-profile-123',
      sessionId: 'test-session-456',
    });
  }),
  http.post('*/eventcollector', ({ request }) => {
    const apiKey = request.headers.get('X-Unomi-Api-Key');
    if (!apiKey || apiKey !== VALID_API_KEY) {
      return new HttpResponse('Unauthorized', { status: 401 });
    }
    return HttpResponse.json({ eventsProcessed: 1 });
  })
];
```

---

**Document Version:** 1.3  
**Last Updated:** January 2026  
**Changelog:**
- v1.3 - Restructured into 8 linear phases for stacked PR workflow; aligned phase/ticket numbering
- v1.2 - Added extensibility/compatibility layer strategy (facade + hooks), DRY/KISS/SOLID principles, public API contract
- v1.1 - Added Unomi V4.0 multi-tenancy compatibility analysis and plan
