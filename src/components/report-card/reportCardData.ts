export interface ReportCardIssue {
  title: string;
  detail: string;
}

export interface ReportCardData {
  subject: string;
  auditId: string;
  environmentLabel: string;
  healthScore: number;
  alert: string;
  issues: ReportCardIssue[];
}
