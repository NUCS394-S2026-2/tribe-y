# Report types

Calling `listReportTypes` returns an array of `ReportTypeDef` records. Each record describes one of the 8 canonical reports the agent can produce. The `id` field is what you pass as `params.reportType` to `reviewSample` and `reviewFull`.

```ts
interface ReportTypeDef {
  id: ReportType;
  title: string;
  blurb: string;
  focus: string;
  dimensions: readonly string[]; // exactly 5
}

type ReportType =
  | 'security'
  | 'memory'
  | 'quality'
  | 'standards'
  | 'performance'
  | 'exceptions'
  | 'antipatterns'
  | 'deadcode';
```

## Catalog

| id             | Title                         | What it looks for                                                                                                                             | Dimensions                                                                                     |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `security`     | Security Vulnerability Report | Unsafe C library calls, buffer/integer overflows, format-string bugs, injection vectors, TOCTOU, unsafe deserialization. Cites CWE ids.       | Input validation; Memory safety; Integer & arithmetic; Crypto & secrets; Error handling        |
| `memory`       | Memory Safety Audit           | Raw owning pointers, missing RAII, leaks, double-free, UAF, dangling refs, exception-unsafe allocations.                                      | Resource management; Ownership semantics; Lifetime safety; Exception safety; Type safety       |
| `quality`      | Code Quality Scorecard        | Naming, cyclomatic complexity, readability, function length, duplication, comments-vs-code, cohesion. 1–10 per dimension.                     | Naming & clarity; Complexity; Readability; Duplication; Cohesion                               |
| `standards`    | Standards Compliance Report   | MISRA C++ and CERT C++ rule violations, line-by-line, with rule ids.                                                                          | MISRA C++; CERT C++; Core Guidelines; Undefined behavior; Portability                          |
| `performance`  | Performance Hotspot Report    | Nested loops, allocations, `std::endl` abuse, missing moves, complexity, cache locality, missing `reserve()`/`emplace_back`. Big-O estimates. | Algorithmic cost; Allocation pressure; Copy & move discipline; Cache locality; Branch behavior |
| `exceptions`   | Exception Safety Report       | Throw-path leaks, missing RAII, catch-by-value, swallowed exceptions, wrong `noexcept`, basic/strong/nothrow analysis.                        | Basic guarantee; Strong guarantee; noexcept correctness; RAII coverage; Throw/catch hygiene    |
| `antipatterns` | Anti-Pattern Detection        | God classes/functions, deep inheritance, magic numbers, naked loops, primitive obsession, feature envy, singletons.                           | Class design; Inheritance use; Abstraction level; STL idioms; Coupling & cohesion              |
| `deadcode`     | Dead Code & Redundancy Report | Unused variables/params/functions, unreachable branches, redundant conditions, duplicated logic, discarded results.                           | Unused symbols; Unreachable code; Redundant logic; Duplicated logic; Discarded results         |

## Source of truth

The canonical list lives in `functions/src/reviewer/reportTypes.ts`. The dimensions in the table above match the `dimensions` array on each record exactly, and the `SampleReportData.scores.dimensions[].label` field on every response is drawn from the same array — so you can join a response's scorecard back to the catalog by index.

## Picking a report type

- If you have a single concern (e.g. "I think we're leaking memory"), pick the report type that names it. The agent's prompt is tuned per-type, so a narrower report gives sharper findings than a generic pass.
- If you want a broad pass, run multiple report types. The 8 types are designed to overlap minimally — `security`, `memory`, and `standards` will each surface different issues for the same code.
- Server-picked slices vary between report types in `reviewSample`. The slice picker tries to find a region of the code that exercises the report's focus (e.g. a function with manual `new`/`delete` for a `memory` review).
