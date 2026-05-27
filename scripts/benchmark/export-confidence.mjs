import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TOOL = 'tribe-y-code-review';

function parseArgs(argv) {
  const args = {
    evaluations: path.resolve(
      'resources/code-review-benchmark/offline/results/openai_gpt-4o-mini/evaluations.json',
    ),
    output: path.resolve('src/agents/benchmarkConfidence.generated.json'),
    tool: DEFAULT_TOOL,
    source: 'offline-code-review-benchmark',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--evaluations') args.evaluations = path.resolve(argv[i + 1] ?? args.evaluations);
    if (token === '--output') args.output = path.resolve(argv[i + 1] ?? args.output);
    if (token === '--tool') args.tool = argv[i + 1] ?? args.tool;
    if (token === '--source') args.source = argv[i + 1] ?? args.source;
  }

  return args;
}

function safeDivide(num, den) {
  if (!den) return 0;
  return num / den;
}

function f1(precision, recall) {
  if (!precision && !recall) return 0;
  return (2 * precision * recall) / (precision + recall);
}

function readEvaluations(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Evaluations file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function aggregateToolMetrics(evaluations, tool) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let sampleSize = 0;

  for (const perPr of Object.values(evaluations)) {
    if (!perPr || typeof perPr !== 'object') continue;
    const toolEntry = perPr[tool];
    if (!toolEntry || typeof toolEntry !== 'object') continue;

    tp += Number(toolEntry.tp ?? toolEntry.true_positives ?? 0);
    fp += Number(toolEntry.fp ?? toolEntry.false_positives ?? 0);
    fn += Number(toolEntry.fn ?? toolEntry.false_negatives ?? 0);
    sampleSize += 1;
  }

  const precision = safeDivide(tp, tp + fp);
  const recall = safeDivide(tp, tp + fn);
  const overallScore = Number(f1(precision, recall).toFixed(4));

  return {
    overallScore,
    sampleSize,
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    tp,
    fp,
    fn,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const evaluations = readEvaluations(args.evaluations);
  const metrics = aggregateToolMetrics(evaluations, args.tool);

  const artifact = {
    overallScore: metrics.overallScore,
    sampleSize: metrics.sampleSize,
    source: `${args.source}:${args.tool}`,
    updatedAt: new Date().toISOString(),
    byReportType: {},
    details: {
      precision: metrics.precision,
      recall: metrics.recall,
      tp: metrics.tp,
      fp: metrics.fp,
      fn: metrics.fn,
    },
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(artifact, null, 2)}\n`);

  console.log(`Wrote confidence artifact: ${args.output}`);
  console.log(`Tool: ${args.tool}`);
  console.log(`Score (F1): ${artifact.overallScore}`);
  console.log(`Sample size: ${artifact.sampleSize}`);
}

main();
