---
name: test-workflow
description: Use this skill when deciding what tests to write in this repository. It defines when to use package checks, unit tests, or browser-based SVG/rendering tests, with public contract as the default boundary.
---

# Test Workflow

## When To Use
Use this skill when:
- deciding what kind of test should be written for a change;
- explaining why a package check, unit test, or browser rendering test was chosen;
- avoiding tests that lock implementation details instead of public behavior.

## Goal
Choose the cheapest test type that is still trustworthy:
- metadata/config changes: validate syntax and run the relevant Yarn script;
- pure transformations: use unit tests when a test runner exists;
- SVG visual or geometry behavior: use browser-based checks;
- avoid tests that depend on private implementation details.

## Public Contract First
Test only consumer-visible behavior.

Public contract sources include:
- `package.json` (`name`, `exports`, `files`, dependencies, peer dependencies);
- generated or source icon entrypoints;
- `README.md` and documented usage;
- icon names, import paths, SVG `viewBox`, dimensions, fill/stroke behavior, and accessibility-relevant attributes when documented.

Not public contract:
- private helper function internals;
- temporary build files;
- implementation-only directory layout unless exported or documented;
- arbitrary SVG node ordering when rendered output and documented semantics are unchanged.

## Test Choice Rules
1. Define the regression risk in public-contract terms.
2. If a syntax/package check is enough, run the relevant Yarn command.
3. If the change is pure data or transformation logic, write a unit test when the project has a test runner.
4. If risk depends on real SVG rendering, layout, screenshots, browser APIs, or computed styles, use browser-based validation.
5. If no test infrastructure exists yet, add only the smallest useful infrastructure for the current risk.

## Browser Triggers
Use browser-based validation when assertions depend on:
- SVG paint output;
- actual icon dimensions or bounding boxes;
- computed styles;
- screenshots or visual regression;
- accessible names/roles as exposed by a browser.

## Test Hygiene
- Write tests as realistic consumer scenarios.
- Prefer semantic assertions over internal selectors.
- Keep setup local to the test unless it is reused.
- Reset mocks and side effects in cleanup hooks.
- Do not create one-off helpers that hide important scenario details.

## Refusal Policy
If a request asks to test private implementation details, refuse briefly and offer a public-contract alternative.

Template:
`I cannot add that test because it checks implementation details instead of the package contract. I can cover the consumer-visible behavior instead: <option>.`
