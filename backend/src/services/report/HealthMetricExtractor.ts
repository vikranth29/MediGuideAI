import { HealthMetric, ReportAnalysisResponse } from '../../types';

const METRIC_RE =
  /([A-Za-z][A-Za-z0-9 /()\-]+?)\s*[:=–—]\s*([\d,]+\.?\d*)\s*([a-zA-Z/%µμ][a-zA-Z/%µμ·\d]*(?:\/[a-zA-Z/%µμ·\d]+)?)?/g;

const EXCLUDED_NAMES = new Set(['normal', 'range', 'age', 'date', 'patient', 'report']);

function findingText(response: ReportAnalysisResponse): string[] {
  const structuredFindings = response.structuredFindings.map(
    (finding) => `${finding.metric}: ${finding.value}`
  );

  return [...response.keyFindings, ...response.riskFlags, ...structuredFindings];
}

export function extractHealthMetrics(response: ReportAnalysisResponse): HealthMetric[] {
  const riskTexts = new Set(response.riskFlags || []);
  const metrics: HealthMetric[] = [];
  const seen = new Set<string>();

  for (const text of findingText(response)) {
    METRIC_RE.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = METRIC_RE.exec(text)) !== null) {
      const name = match[1].trim().replace(/[:=–—\s]+$/, '');
      if (EXCLUDED_NAMES.has(name.toLowerCase())) {
        continue;
      }

      const value = Number.parseFloat(match[2].replace(/,/g, ''));
      if (!Number.isFinite(value)) {
        continue;
      }

      const key = name.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const structuredFinding = response.structuredFindings.find(
        (finding) => finding.metric.toLowerCase() === key
      );

      metrics.push({
        name,
        value,
        unit: (match[3] || '').trim(),
        flagged:
          riskTexts.has(text) ||
          structuredFinding?.status === 'abnormal' ||
          structuredFinding?.status === 'concerning',
      });
    }
  }

  return metrics;
}
