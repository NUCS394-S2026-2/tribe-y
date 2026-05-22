import {
  CircleCheck,
  ClipboardCheck,
  GitMerge,
  HeartPulse,
  HelpCircle,
  LayoutTemplate,
  MessageCircle,
  Rocket,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface ReportTypeData {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  tag: string | null;
  tagStyle: 'default' | 'success' | null;
  plain: string;
  recFor: string | null;
  tip: string;
}

const REPORT_TYPES: ReportTypeData[] = [
  {
    id: 'security',
    icon: ShieldAlert,
    label: 'Security & memory audit',
    tag: 'Most popular',
    tagStyle: 'default',
    plain:
      'Checks your code for problems that could let attackers in, or cause your program to crash with bad data.',
    recFor: null,
    tip: 'A Security & Memory Audit catches the most common and serious C++ problems — things like unchecked input, memory leaks, and crashes. A good starting point for almost everyone.',
  },
  {
    id: 'performance',
    icon: Zap,
    label: 'Performance review',
    tag: null,
    tagStyle: null,
    plain:
      "Finds code that's slower than it needs to be — wasted work, unnecessary memory use, or bottlenecks under load.",
    recFor: 'finance, gaming, high-traffic systems',
    tip: "A Performance Review looks at how efficiently your code uses memory and CPU time. Useful if you're hitting slowdowns, handling large data sets, or building something that needs to run fast.",
  },
  {
    id: 'concurrency',
    icon: GitMerge,
    label: 'Concurrency & threads',
    tag: null,
    tagStyle: null,
    plain:
      'Looks for bugs that only show up when multiple things run at the same time — crashes and data corruption that are hard to reproduce.',
    recFor: 'finance, embedded systems, servers',
    tip: 'Concurrency bugs are among the hardest to find by hand — they only appear under certain timing conditions. If your code uses threads or parallel processing, this review is important.',
  },
  {
    id: 'compliance',
    icon: ClipboardCheck,
    label: 'Compliance review',
    tag: null,
    tagStyle: null,
    plain:
      'Checks your code against official safety standards required in regulated industries — like medical devices, cars, or aviation.',
    recFor: 'aerospace, automotive, medical devices',
    tip: "Compliance reviews check your code against formal standards like MISRA, CERT, or ISO 26262. These are legally or contractually required in some industries. If you're not sure whether this applies to you, it probably doesn't.",
  },
  {
    id: 'code_health',
    icon: HeartPulse,
    label: 'Code health',
    tag: null,
    tagStyle: null,
    plain:
      'Looks at how easy your code is to understand, change, and build on — before small problems become big ones.',
    recFor: 'growing teams, legacy codebases',
    tip: 'Code health reviews focus on the long-term quality of your codebase — naming, structure, complexity, and patterns that will slow your team down over time. Not a crisis fix, but good housekeeping.',
  },
  {
    id: 'architecture',
    icon: LayoutTemplate,
    label: 'Architecture review',
    tag: null,
    tagStyle: null,
    plain:
      "Looks at the big picture of how your code is organised — whether it's structured in a way that will scale and stay manageable.",
    recFor: 'large projects, pre-refactor',
    tip: 'An architecture review looks at how components fit together, whether responsibilities are clearly separated, and whether the design will hold up as the codebase grows. More about structure than individual bugs.',
  },
  {
    id: 'pre_release',
    icon: Rocket,
    label: 'Pre-ship check',
    tag: 'Fast',
    tagStyle: 'default',
    plain:
      'A quick scan for critical problems only — designed for when you need to ship soon and want a final safety net.',
    recFor: null,
    tip: 'The pre-ship check is a focused, fast report. It only surfaces critical and high-severity issues — no style notes, no long-term suggestions. Just the things that could break production.',
  },
  {
    id: 'general',
    icon: MessageCircle,
    label: 'General feedback',
    tag: 'Beginner friendly',
    tagStyle: 'success',
    plain:
      "A plain-language walkthrough of your code — what's working, what could be better, and why. No jargon.",
    recFor: 'students, junior devs, indie projects',
    tip: "General feedback is written for developers at any level. The reviewer explains every finding in plain English — not just what's wrong, but why it matters and how to think about it.",
  },
];

const NOT_SURE: ReportTypeData = {
  id: 'not_sure',
  icon: HelpCircle,
  label: 'Not sure',
  tag: null,
  tagStyle: null,
  plain: "Tell us what you're working on and we'll recommend the right type.",
  recFor: null,
  tip: "Just describe your project — what it does, what industry it's for, and what's worrying you. The reviewer will suggest the best report type.",
};

export interface ReportTypeSelectorProps {
  onSelect: (reportTypeId: string) => void;
  onSelectNotSure: () => void;
  defaultSelected?: string;
}

export default function ReportTypeSelector({
  onSelect,
  onSelectNotSure,
  defaultSelected = 'security',
}: ReportTypeSelectorProps) {
  const [selected, setSelected] = useState(defaultSelected);

  const allCards = [...REPORT_TYPES, NOT_SURE];
  const selectedCard = allCards.find((r) => r.id === selected) ?? REPORT_TYPES[0];
  const isNotSureSelected = selected === 'not_sure';

  const handleConfirm = () => {
    if (isNotSureSelected) {
      onSelectNotSure();
    } else {
      onSelect(selected);
    }
  };

  return (
    <div>
      {/* Tip box */}
      <div
        className={`rounded-lg px-4 py-3 mb-4 transition-colors ${
          isNotSureSelected ? 'bg-amber-50' : 'bg-gray-50'
        }`}
      >
        <div className="text-xs font-medium text-gray-400 mb-1">Why this report?</div>
        <div className="text-sm text-gray-700 leading-relaxed">{selectedCard.tip}</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {allCards.map((report) => {
          const isSelected = report.id === selected;
          const isNotSure = report.id === 'not_sure';
          const Icon = report.icon;

          return (
            <div
              key={report.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => setSelected(report.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelected(report.id);
              }}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all bg-white ${
                isSelected
                  ? 'border-2 border-blue-500'
                  : isNotSure
                    ? 'border border-dashed border-gray-200 hover:border-gray-300'
                    : 'border border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Top-right: checkmark when selected, tag badge otherwise */}
              <div className="absolute top-3 right-3">
                {isSelected ? (
                  <CircleCheck size={16} className="text-blue-500" />
                ) : report.tag ? (
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      report.tagStyle === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {report.tag}
                  </span>
                ) : null}
              </div>

              <Icon
                size={22}
                className={
                  isSelected
                    ? 'text-blue-500'
                    : isNotSure
                      ? 'text-gray-300'
                      : 'text-gray-400'
                }
              />
              <div className="text-sm font-medium text-gray-900 mt-2 mb-1 pr-6">
                {report.label}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed mb-2">
                {report.plain}
              </div>
              {report.recFor && (
                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Users size={12} />
                  {report.recFor}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm row */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isNotSureSelected ? 'Help me choose →' : `Get ${selectedCard.label} report →`}
        </button>
        <span className="text-sm text-gray-400">
          Selected:{' '}
          <span className="font-medium text-gray-700">{selectedCard.label}</span>
        </span>
      </div>
    </div>
  );
}
