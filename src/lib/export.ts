import { AuditReport } from '../types/audit';

function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function exportReportToCsv(report: AuditReport): void {
  const headers = [
    'Category',
    'Severity',
    'Title',
    'Description',
    'Recommendation',
    'Context',
    'Selector',
    'Score Impact',
  ];

  const rows = report.issues.map(issue => [
    escapeCsvCell(issue.category.toUpperCase()),
    escapeCsvCell(issue.severity.toUpperCase()),
    escapeCsvCell(issue.title),
    escapeCsvCell(issue.description),
    escapeCsvCell(issue.recommendation),
    escapeCsvCell(issue.context || ''),
    escapeCsvCell(issue.selector || ''),
    escapeCsvCell(issue.scoreImpact),
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeDomain = report.domain.replace(/[^a-z0-9.-]/gi, '_');
  const filename = `sitecheck_${safeDomain}_${new Date(report.timestamp).toISOString().slice(0, 10)}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportReportToJson(report: AuditReport): void {
  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeDomain = report.domain.replace(/[^a-z0-9.-]/gi, '_');
  const filename = `sitecheck_${safeDomain}_${new Date(report.timestamp).toISOString().slice(0, 10)}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrintReport(): void {
  window.print();
}
