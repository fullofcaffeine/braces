# Maintained braces fork

This fork supplies a temporary repair for deeply nested patterns while an upstream release is unavailable.
It uses the package name `@fullofcaffeine/braces` to distinguish it from an upstream release.
It keeps the upstream license and attribution.

The source starts from [upstream PR 87](https://github.com/micromatch/braces/pull/87),
commit `d44b9b1ee12e7804d4232d5a47a4a0c61d2fbefe`.
The patch addresses [the nesting-depth advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The compiler's `caf/ReleaseDependencyRepair.hx` describes why the dependency is needed and the affected work.
Beads task `haxe.elixir.codex-7xd` owns integration and maintenance work.

The patch rejects nesting above 100 levels. It checks string parsing and recursive syntax-tree traversal.
It also rejects cyclic parent chains during expansion.
The `maxDepth` option can lower the limit but cannot raise the hard limit.
Previously accepted patterns above that limit now throw an error.

This is a depth repair, not a general resource limit.
Expansion can still produce very large results.
Arbitrary JavaScript syntax trees with malformed array-valued text are outside the supported input contract.
The existing short-input path returns literal strings before checking `maxDepth: 0`.

Run the checks on a supported compiler runtime, starting with Node 22.22:

```sh
npm install --ignore-scripts --no-audit --no-fund
npm test
npm run test:depth
```

The depth checks use separate, time-bounded processes with a reduced JavaScript stack.
They check normal patterns, all public string entry points, deep trees, cycles, and attempts to raise the depth limit.
The upstream test suite provides additional compatibility coverage.
The maintained fork does not claim Node 8 qualification.

A scoped package name can make an upstream advisory disappear from an npm audit report.
That is not proof of repair. Consumers must review the exact pinned source and run the depth checks independently.
They must also test their actual use of the dependency and inspect advisories for upstream dependencies.
Do not use an unreviewed branch, mutable tag, local path, or locally packed archive as a durable consumer selection.

The compiler dependency maintainers own this fork's updates.
Return to a supported upstream release after it contains the repair and passes the same checks.
Remove the fork override only after consumer checks pass and the prior source remains recoverable.
