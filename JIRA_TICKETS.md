# JIRA Tickets - Apache Unomi Tracker

**Project:** UNOMI-TRACKER  
**Version:** 1.5.0 → 2.0.0 (Modernization)  
**Timeline:** 6 months (26 weeks, phased approach)  
**Server Compatibility:** Unomi V2 + Unomi V4.0 (multi-tenancy)

**PR Strategy:** Each ticket = 1 phase = 1 stacked PR. Strict linear dependency chain.

```
PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 → PR 7 → PR 8
```

---

## UNOMI-TRACKER-001: Phase 0 - Testing infrastructure ⭐ START HERE

**PR 1** | **Depends on:** nothing  
**Issue Type:** Epic  
**Priority:** High (P1)  
**Component:** Testing Infrastructure  
**Labels:** testing, vitest, msw, quality-assurance

**Description:**
Establish comprehensive testing infrastructure with server mocks before any code changes begin. This is the foundation that guarantees backward compatibility and quality throughout the entire modernization process.

**What will be done:**
Set up Vitest test framework with jsdom, configure MSW for mocking Unomi server endpoints (both V2 and V4.0 modes), create bug verification tests proving the two critical bugs exist, create unit tests for all utility functions, create integration tests for all tracker flows, and create backward compatibility tests covering 100% of the public API. Achieve 80%+ code coverage.

**Acceptance Criteria:**
- [ ] Vitest configured with jsdom and coverage reporting
- [ ] MSW set up with Unomi server mocks (V2 + V4.0 modes)
- [ ] Bug verification tests created (proving bugs exist)
- [ ] 80%+ code coverage achieved
- [ ] All utility functions tested
- [ ] All integration scenarios tested
- [ ] 100% backward compatibility test coverage
- [ ] CI/CD pipeline updated
- [ ] Coverage reports generated

**Technical Details:**
- **Files:** `vitest.config.ts`, `test/setup.ts`, `test/mocks/`, test files
- **Dependencies:** `vitest`, `@vitest/ui`, `@vitest/coverage-v8`, `msw`, `jsdom`
- **Estimated Effort:** 40-60 hours

---

## UNOMI-TRACKER-002: Phase 1 - Fix critical bugs and add Unomi V4.0 compatibility

**PR 2** | **Depends on:** PR 1 (UNOMI-TRACKER-001)  
**Issue Type:** Epic  
**Priority:** Critical (P0)  
**Component:** Core Functionality  
**Labels:** bug, critical, event-tracking, id-resolution, v3-compatibility

**Description:**
Fix two critical bugs and add Unomi V4.0 multi-tenancy support. These are all targeted changes to the existing codebase that should be completed before larger refactoring begins.

**Problem (Bugs):**
1. **Bug #1 (Line 448)**: `splice(eventIndex, 0)` doesn't actually remove elements from the `eventsPrevented` array. The code removes 0 elements instead of 1, causing incorrect event handling behavior.

2. **Bug #2 (Lines 1420-1428)**: The `_resolveId` function has multiple logic errors:
   - Uses array result from `filter()` as a string in `replace()` operation
   - Incorrect index check (`> 0` instead of `!== -1`) misses matches at position 0
   - Function is marked with `@ts-expect-error` acknowledging it's broken

**What will be done:**
Fix both bugs: correct the splice operation and rewrite `_resolveId`. Add Unomi V4.0 support: introduce optional `apiKey`/`tenantId` config fields and inject `X-Unomi-Api-Key`/`X-Unomi-Tenant-Id` headers in the `ajax()` method when configured. The tracker will work with both V2 (no API key) and V4.0 (with API key) servers, maintaining full backward compatibility.

**Acceptance Criteria:**
- [ ] Bug #1 fixed: `splice` correctly removes elements
- [ ] Bug #2 fixed: `_resolveId` function rewritten with correct logic
- [ ] Bug verification tests pass
- [ ] V4.0 support: `apiKey` and `tenantId` optional config fields added
- [ ] V4.0 support: `X-Unomi-Api-Key` header injected when `apiKey` is set
- [ ] Tests for V2 mode (no API key) and V4.0 mode (with API key)
- [ ] Tracker works against V2 servers with API key configured (header ignored)
- [ ] Types updated in `types.ts`
- [ ] No regression in existing functionality

**Technical Details:**
- **Files:** `src/apache-unomi-tracker.js`, `src/types.ts`
- **V4.0 change scope:** ~20-30 lines of implementation code (additive only)
- **Estimated Effort:** 8-12 hours

---

## UNOMI-TRACKER-003: Phase 2 - Modernize build toolchain and config cleanup

**PR 3** | **Depends on:** PR 2 (UNOMI-TRACKER-002)  
**Issue Type:** Epic  
**Priority:** Medium (P2)  
**Component:** Build System, Dependencies, Configuration  
**Labels:** modernization, build, dependencies, configuration

**Description:**
Modernize the build toolchain and upgrade all dependencies to 2026 standards. Also fix configuration issues (browserslist, XDomainRequest type) that are prerequisites for TypeScript migration.

**What will be done:**
Upgrade Rollup to 4.x, replace Babel with esbuild (removing `babel.config.json` entirely), upgrade runtime and dev dependencies, add modern `browserslist` configuration, fix incorrect `XDomainRequest` type definition, and configure TypeScript for incremental migration (`allowJs`, `checkJs`).

**Acceptance Criteria:**
- [ ] Rollup 4.x installed and configured
- [ ] Babel removed, esbuild integrated
- [ ] All dependencies upgraded (`es6-crawler-detect` v4, ESLint v9, TS ESLint plugins)
- [ ] `browserslist` configuration added (deprecated Babel `browsers` field removed)
- [ ] `XDomainRequest` type definition fixed in `global.d.ts`
- [ ] TypeScript configured for incremental migration
- [ ] All builds (CJS, ESM, UMD) produce correct output
- [ ] Build time improved (target: 50% faster)
- [ ] All tests passing

**Technical Details:**
- **Files:** `package.json`, `rollup.config.js`, `babel.config.json` (removed), `tsconfig.json`, `.eslintrc.json`, `src/global.d.ts`, `.browserslistrc`
- **Estimated Effort:** 12-20 hours

---

## UNOMI-TRACKER-004: Phase 3 - Extract and convert utility functions to TypeScript

**PR 4** | **Depends on:** PR 3 (UNOMI-TRACKER-003)  
**Issue Type:** Epic  
**Priority:** Medium (P2)  
**Component:** TypeScript Migration  
**Labels:** modernization, typescript, utilities

**Description:**
Extract leaf-level utility functions from the monolithic main file and convert them to TypeScript modules. First step of the "edge → trunk" migration. Requires the build system from Phase 2 to support TypeScript compilation.

**What will be done:**
Extract and convert all utility functions to TypeScript modules: cookie utilities, event builders, AJAX utility, form utilities, and URL utilities. Update main file to import from new modules.

**Acceptance Criteria:**
- [ ] All utility functions extracted to `src/utils/*.ts`
- [ ] All utilities converted to TypeScript with proper types
- [ ] Unit tests pass for all utilities
- [ ] Main file updated to import from new modules
- [ ] Functionality verified unchanged
- [ ] All tests passing

**Technical Details:**
- **Files:** `src/utils/cookies.ts`, `src/utils/events.ts`, `src/utils/ajax.ts`, `src/utils/form.ts`, `src/utils/url.ts`, `src/apache-unomi-tracker.js`
- **Estimated Effort:** 15-21 hours

---

## UNOMI-TRACKER-005: Phase 4 - Extract and convert feature modules to TypeScript

**PR 5** | **Depends on:** PR 4 (UNOMI-TRACKER-004)  
**Issue Type:** Epic  
**Priority:** Medium (P2)  
**Component:** TypeScript Migration  
**Labels:** modernization, typescript, features

**Description:**
Extract higher-level feature modules from the main file and convert to TypeScript. These modules depend on the utility modules extracted in Phase 3, so they import from `src/utils/`.

**What will be done:**
Extract and convert all feature logic to TypeScript modules: personalization, optimization/A/B testing, and event tracking. Feature modules import from `src/utils/` established in the previous phase. Update main file to import from new modules.

**Acceptance Criteria:**
- [ ] All feature modules extracted to `src/features/*.ts`
- [ ] All features converted to TypeScript with proper types
- [ ] Features import from `src/utils/` (no duplication)
- [ ] Integration tests pass
- [ ] Main file updated to import from new modules
- [ ] All tests passing

**Technical Details:**
- **Files:** `src/features/personalization.ts`, `src/features/optimization.ts`, `src/features/tracking.ts`, `src/apache-unomi-tracker.js`
- **Estimated Effort:** 16-22 hours

---

## UNOMI-TRACKER-006: Phase 5 - Convert core tracker to TypeScript class with facade layer

**PR 6** | **Depends on:** PR 5 (UNOMI-TRACKER-005)  
**Issue Type:** Epic  
**Priority:** Medium (P2)  
**Component:** TypeScript Migration, Extensibility  
**Labels:** modernization, typescript, core, backward-compatibility, facade

**Description:**
Convert the now-slimmed-down main tracker to a TypeScript class with the facade layer for backward compatibility. Requires both utilities (Phase 3) and features (Phase 4) to be extracted first so the core only contains orchestration logic.

**What will be done:**
Create `UnomiTracker` class with proper encapsulation. Build a facade layer so `useTracker()` still returns a plain mutable `wem` object with the exact same shape -- delegating to the internal class. This ensures consumers who override methods, access state directly, or add custom properties are not broken. Add deprecation warnings on `_` prefixed methods. Define formal public API contract.

**Acceptance Criteria:**
- [ ] Core tracker converted to TypeScript class
- [ ] Facade returns `wem` object with exact same shape as current API
- [ ] Monkey-patching still works (e.g., `wem.ajax = customFn`)
- [ ] Direct state access still works (e.g., `wem.cxs`, `wem.sessionID`)
- [ ] `_` prefixed methods log deprecation warnings
- [ ] Public API contract defined as TypeScript interface
- [ ] `@ts-expect-error` comments reduced by 50%+
- [ ] 80%+ TypeScript coverage achieved
- [ ] All tests passing

**Technical Details:**
- **Files:** `src/core/tracker.ts`, `src/facade/wem.ts`, `src/types/public-api.ts`, `src/index.ts`
- **Estimated Effort:** 16-22 hours

---

## UNOMI-TRACKER-007: Phase 6 - Extension hooks + code quality

**PR 7** | **Depends on:** PR 6 (UNOMI-TRACKER-006)  
**Issue Type:** Epic  
**Priority:** Medium (P2)  
**Component:** Code Quality, Extensibility  
**Labels:** modernization, refactoring, architecture, code-quality, extensibility

**Description:**
Implement the extension hooks API and address remaining code quality issues. Requires the facade/class architecture from Phase 5 so hooks can be wired into the tracker internals.

**What will be done:**
Build the extension hooks system (`beforeRequest`, `afterRequest`, `onContextLoaded`, `beforeEvent`, `afterEvent`) providing a clean alternative to monkey-patching. Replace deprecated event creation APIs with modern alternatives. Address remaining `@ts-expect-error` comments. Implement code splitting and lazy loading for optional features.

**Acceptance Criteria:**
- [ ] Extension hooks API implemented and documented
- [ ] Hooks provide clean alternative for all common monkey-patching patterns
- [ ] All deprecated event APIs replaced (`CustomEvent()`, `Event()` constructors)
- [ ] Remaining `@ts-expect-error` comments addressed
- [ ] Code splitting implemented for optional features
- [ ] Final modular directory structure in place
- [ ] All tests passing

**Technical Details:**
- **Files:** `src/core/hooks.ts`, `src/core/tracker.ts`, `src/facade/wem.ts`, `src/types/`, `src/index.ts`
- **Estimated Effort:** 20-28 hours

---

## UNOMI-TRACKER-008: Phase 7 - Documentation + DX + final polish

**PR 8** | **Depends on:** PR 7 (UNOMI-TRACKER-007)  
**Issue Type:** Epic  
**Priority:** Low (P3)  
**Component:** Documentation, Developer Experience  
**Labels:** documentation, dx, tooling, refactoring

**Description:**
Final improvements to documentation, code quality, and developer experience. Done last so docs reflect the final API surface including hooks, facade, V4.0 support, and public API contract.

**What will be done:**
Expand README with comprehensive documentation (installation, usage, API reference, V4.0 config, hooks API, migration guide for consumers). Refactor duplicated code patterns, standardize function styles. Set up ESLint + Prettier with pre-commit hooks (Husky, lint-staged). Update CI/CD pipeline.

**Acceptance Criteria:**
- [ ] README expanded with comprehensive documentation
- [ ] V4.0 configuration documented with examples
- [ ] Extension hooks API documented with migration examples
- [ ] Public API contract documented
- [ ] Duplicated code refactored (DRY)
- [ ] Function styles standardized (KISS)
- [ ] ESLint + Prettier configured with pre-commit hooks
- [ ] CI/CD pipeline updated with type checking, linting, coverage
- [ ] All checks passing

**Technical Details:**
- **Files:** `README.md`, `.eslintrc.json`, `.prettierrc`, `.husky/`, `.github/workflows/ci.yml`, source files
- **Estimated Effort:** 12-20 hours

---

## 📊 Summary

### Dependency Chain (Stacked PRs)

```
PR 1  UNOMI-TRACKER-001  Phase 0: Testing Infrastructure         ⭐ START
 ↓
PR 2  UNOMI-TRACKER-002  Phase 1: Bug Fixes + V4.0 Compatibility
 ↓
PR 3  UNOMI-TRACKER-003  Phase 2: Build Modernization + Config
 ↓
PR 4  UNOMI-TRACKER-004  Phase 3: TypeScript - Utilities
 ↓
PR 5  UNOMI-TRACKER-005  Phase 4: TypeScript - Features
 ↓
PR 6  UNOMI-TRACKER-006  Phase 5: TypeScript - Core + Facade
 ↓
PR 7  UNOMI-TRACKER-007  Phase 6: Extension Hooks + Code Quality
 ↓
PR 8  UNOMI-TRACKER-008  Phase 7: Documentation + DX + Polish
```

### Ticket Statistics
- **Total Tickets:** 8
- **Critical (P0):** 1 (Bug fixes + V4.0)
- **High (P1):** 1 (Testing infrastructure)
- **Medium (P2):** 5 (Build, TypeScript phases, Code Quality)
- **Low (P3):** 1 (Documentation + Polish)

### Estimated Effort
- **Total:** 139-205 hours (~18-26 working days)
- **Timeline:** 26 weeks (phased approach)

### Key Principles

- ✅ **DRY / KISS / SOLID**: All implementations follow these engineering principles
- ✅ **Testing First**: Complete testing infrastructure before any code changes
- ✅ **Backward Compatible**: Facade preserves exact API shape for consumers who extend/embed
- ✅ **Extensible**: Official hooks API replaces need for monkey-patching
- ✅ **Dual Server Support**: Works with both Unomi V2 and V4.0 (multi-tenancy)
- ✅ **Incremental**: Gradual migration with deprecation warnings, not big bang
- ✅ **Stacked PRs**: Each phase = 1 PR in a strict linear chain; every PR is reviewable and mergeable independently

---

*Note: Ticket numbers (UNOMI-TRACKER-XXX) should be replaced with actual JIRA ticket numbers when creating tickets.*
