// Source of truth for report types on the server side.
// Copied verbatim from src/agents/reportTypes.ts (React tree).
// A future PR may unify these via a shared package.

export interface ReportTypeDef {
  id: ReportType;
  title: string;
  blurb: string;
  focus: string;
  dimensions: readonly string[];
}

export const REPORT_TYPES = [
  {
    id: 'security',
    title: 'Security Vulnerability Report',
    blurb: 'Unsafe functions, buffer overflows, input handling.',
    focus:
      'Identify security vulnerabilities: unsafe C library calls (strcpy, gets, sprintf, system), buffer overflows, integer overflows, format-string bugs, command/SQL injection vectors, untrusted input handling, time-of-check/time-of-use races, and unsafe deserialization. Cite the CWE id for each finding when applicable.',
    dimensions: [
      'Input validation',
      'Memory safety',
      'Integer & arithmetic',
      'Crypto & secrets',
      'Error handling',
    ],
  },
  {
    id: 'memory',
    title: 'Memory Safety Audit',
    blurb: 'Raw pointers, leaks, RAII, new/delete misuse.',
    focus:
      'Audit memory management: raw owning pointers, missing RAII, leaks, double-free, use-after-free, dangling references, manual new/delete that should be smart pointers (unique_ptr/shared_ptr), container element ownership issues, and exception-unsafe allocation patterns.',
    dimensions: [
      'Resource management',
      'Ownership semantics',
      'Lifetime safety',
      'Exception safety',
      'Type safety',
    ],
  },
  {
    id: 'quality',
    title: 'Code Quality Scorecard',
    blurb: 'Naming, complexity, readability, duplication.',
    focus:
      'Score code quality across naming, cyclomatic complexity, readability, function length, duplication, comments-vs-code ratio, and cohesion. Produce a 1–10 score per dimension and call out the worst offenders by line.',
    dimensions: [
      'Naming & clarity',
      'Complexity',
      'Readability',
      'Duplication',
      'Cohesion',
    ],
  },
  {
    id: 'standards',
    title: 'Standards Compliance Report',
    blurb: 'MISRA/CERT rule violations, line by line.',
    focus:
      'Flag violations of MISRA C++ and CERT C++ rules line by line. Cite the rule id (e.g., MISRA-C++ 5-0-15, CERT MEM30-CPP) for every finding and explain the violation concisely.',
    dimensions: [
      'MISRA C++',
      'CERT C++',
      'Core Guidelines',
      'Undefined behavior',
      'Portability',
    ],
  },
  {
    id: 'performance',
    title: 'Performance Hotspot Report',
    blurb: 'Loop inefficiencies, bad allocations, algorithmic issues.',
    focus:
      'Find performance hotspots: nested-loop blowups, unnecessary heap allocations, std::endl flush abuse, copies that should be moves, suboptimal algorithmic complexity, cache-unfriendly access patterns, and missing reserve()/emplace_back. Estimate Big-O for each hotspot.',
    dimensions: [
      'Algorithmic cost',
      'Allocation pressure',
      'Copy & move discipline',
      'Cache locality',
      'Branch behavior',
    ],
  },
  {
    id: 'exceptions',
    title: 'Exception Safety Report',
    blurb: 'throw/catch misuse, RAII in exception paths, noexcept usage.',
    focus:
      'Evaluate exception safety: leaks on the throw path, missing RAII, catch-by-value, swallowed exceptions, wrong noexcept annotations, exception-unsafe constructors, and basic/strong/nothrow guarantee analysis per function.',
    dimensions: [
      'Basic guarantee',
      'Strong guarantee',
      'noexcept correctness',
      'RAII coverage',
      'Throw/catch hygiene',
    ],
  },
  {
    id: 'antipatterns',
    title: 'Anti-Pattern Detection',
    blurb: 'God classes, deep inheritance, magic numbers, naked loops.',
    focus:
      'Detect anti-patterns: god classes/functions, deep inheritance hierarchies, magic numbers, naked loops where STL algorithms apply, primitive obsession, feature envy, switch-on-type, and singleton abuse.',
    dimensions: [
      'Class design',
      'Inheritance use',
      'Abstraction level',
      'STL idioms',
      'Coupling & cohesion',
    ],
  },
  {
    id: 'deadcode',
    title: 'Dead Code & Redundancy Report',
    blurb: 'Unused variables, unreachable code, redundant logic.',
    focus:
      'Find dead code and redundancy: unused variables/parameters/functions, unreachable branches, redundant conditions, duplicated logic, and computations whose result is discarded.',
    dimensions: [
      'Unused symbols',
      'Unreachable code',
      'Redundant logic',
      'Duplicated logic',
      'Discarded results',
    ],
  },
] as const satisfies readonly ReportTypeDef[];

export type ReportType =
  | 'security'
  | 'memory'
  | 'quality'
  | 'standards'
  | 'performance'
  | 'exceptions'
  | 'antipatterns'
  | 'deadcode';

export function getReportTypeDef(id: ReportType): ReportTypeDef {
  const def = REPORT_TYPES.find((rt) => rt.id === id);
  if (!def) throw new Error(`Unknown report type: ${id}`);
  return def;
}

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && REPORT_TYPES.some((rt) => rt.id === value);
}
