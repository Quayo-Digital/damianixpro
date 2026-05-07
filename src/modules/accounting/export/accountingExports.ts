import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type {
  IncomeLine,
  ExpenseRow,
  CommissionRow,
  MonthlyPlRow,
  MaintenanceCostLine,
  PaymentBreakdownLine,
} from '@/modules/accounting/services/accountingDataService';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

export function formatNgn(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function exportPlCsv(rows: MonthlyPlRow[], filename: string): void {
  const header = [
    'Month',
    'Rent income',
    'Service charge',
    'Other income',
    'Expenses (incl. VAT)',
    'Commissions (manual)',
    'Maintenance (actual)',
    'Platform fees (settlements)',
    'Agent commission (settlements)',
    'Tax (settlements)',
    'Owner pool (settlements, info)',
    'Net (NGN)',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.month,
        r.incomeRent,
        r.incomeServiceCharge,
        r.incomeOther,
        r.expenses,
        r.commissions,
        r.maintenanceActual,
        r.platformFeesSettled,
        r.agentCommissionSettled,
        r.taxSettled,
        r.ownerShareSettled,
        r.net,
      ].join(',')
    ),
  ];
  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

export function exportMaintenanceCostsCsv(rows: MaintenanceCostLine[], filename: string): void {
  const header = ['Date', 'Ticket', 'Property', 'Status', 'Actual cost?', 'Amount (NGN)'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.costDate,
        r.ticketNumber,
        (r.propertyName || r.propertyId || '').replace(/,/g, ' '),
        r.status,
        r.isActualCost ? 'yes' : 'estimate',
        r.amount,
      ].join(',')
    ),
  ];
  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

export function exportPaymentSettlementsCsv(rows: PaymentBreakdownLine[], filename: string): void {
  const header = [
    'Payment date',
    'Property',
    'Gross',
    'Platform fee',
    'Agent commission',
    'Tax',
    'Owner amount',
    'Rent payment id',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.paymentDate || '',
        (r.propertyName || r.propertyId || '').replace(/,/g, ' '),
        r.gross,
        r.platformFee,
        r.agentCommission,
        r.taxAmount,
        r.ownerAmount,
        r.rentPaymentId,
      ].join(',')
    ),
  ];
  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

export function exportIncomeCsv(rows: IncomeLine[], filename: string): void {
  const header = ['Date', 'Category', 'Amount (NGN)', 'Property', 'Description', 'Payment id'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.paymentDate || '',
        r.category,
        r.amount,
        (r.propertyName || r.propertyId || '').replace(/,/g, ' '),
        (r.description || '').replace(/,/g, ' '),
        r.id,
      ].join(',')
    ),
  ];
  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

export function exportExpensesCsv(rows: ExpenseRow[], filename: string): void {
  const header = ['Date', 'Type', 'Amount', 'VAT', 'Property id', 'Ticket', 'Description'];
  const lines = [
    header.join(','),
    ...rows.map((e) =>
      [
        e.expense_date,
        e.expense_type,
        e.amount_ngn,
        e.vat_amount_ngn,
        e.property_id || '',
        (e.maintenance_ticket_number || '').replace(/,/g, ' '),
        (e.description || '').replace(/,/g, ' '),
      ].join(',')
    ),
  ];
  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

export function exportCommissionsCsv(rows: CommissionRow[], filename: string): void {
  const header = ['Period', 'Property', 'Agent', 'Basis', 'Pct', 'Commission', 'Status'];
  const lines = [
    header.join(','),
    ...rows.map((c) =>
      [
        c.period_month,
        c.property_id,
        c.agent_id,
        c.basis_amount_ngn,
        c.commission_pct,
        c.commission_amount_ngn,
        c.status,
      ].join(',')
    ),
  ];
  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportOwnerStatementPdf(params: {
  ownerName: string;
  periodLabel: string;
  income: IncomeLine[];
  expenses: ExpenseRow[];
  commissions: CommissionRow[];
  maintenance?: MaintenanceCostLine[];
  settlements?: PaymentBreakdownLine[];
}): void {
  const {
    ownerName,
    periodLabel,
    income,
    expenses,
    commissions,
    maintenance = [],
    settlements = [],
  } = params;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('DamianixPro — Owner statement (NGN)', 14, 18);
  doc.setFontSize(10);
  doc.text(`Owner / portfolio: ${ownerName}`, 14, 28);
  doc.text(`Period: ${periodLabel}`, 14, 34);
  doc.text(`Generated: ${new Date().toLocaleString('en-NG')}`, 14, 40);
  doc.text(
    'Figures in Nigerian Naira (NGN). Service charge & rent are classified from payment category.',
    14,
    48
  );

  const incomeBody = income.map((r) => [
    r.paymentDate || '—',
    r.category,
    formatNgn(r.amount),
    (r.propertyName || r.propertyId || '—').slice(0, 40),
  ]);
  doc.autoTable({
    startY: 54,
    head: [['Date', 'Category', 'Amount', 'Property']],
    body: incomeBody.length ? incomeBody : [['—', 'No rows', '—', '—']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 139, 34] },
  });

  const yAfter =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 60;
  doc.setFontSize(11);
  doc.text('Operating expenses (manual ledger)', 14, yAfter + 10);

  const expBody = expenses.map((e) => [
    e.expense_date,
    e.expense_type,
    formatNgn(Number(e.amount_ngn) + Number(e.vat_amount_ngn || 0)),
    (e.description || '—').slice(0, 36),
  ]);
  doc.autoTable({
    startY: yAfter + 14,
    head: [['Date', 'Type', 'Total (incl. VAT)', 'Notes']],
    body: expBody.length ? expBody : [['—', 'No rows', '—', '—']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [180, 80, 30] },
  });

  let y2 =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ??
    yAfter + 40;
  doc.text('Maintenance (tickets — actual or estimate in period)', 14, y2 + 10);
  const maintBody = maintenance.map((m) => [
    m.costDate,
    m.ticketNumber,
    formatNgn(m.amount),
    m.isActualCost ? 'actual' : 'estimate',
    (m.propertyName || m.propertyId || '—').slice(0, 28),
  ]);
  doc.autoTable({
    startY: y2 + 14,
    head: [['Date', 'Ticket', 'Amount', 'Type', 'Property']],
    body: maintBody.length ? maintBody : [['—', '—', '—', '—', '—']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [120, 53, 15] },
  });

  y2 = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y2 + 40;
  doc.text('Rent settlements (payment breakdowns)', 14, y2 + 10);
  const setBody = settlements.map((s) => [
    s.paymentDate || '—',
    formatNgn(s.gross),
    formatNgn(s.platformFee + s.agentCommission + s.taxAmount),
    formatNgn(s.ownerAmount),
  ]);
  doc.autoTable({
    startY: y2 + 14,
    head: [['Paid', 'Gross', 'Fees (platform+agent+tax)', 'Owner pool']],
    body: setBody.length ? setBody : [['—', '—', '—', '—']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [67, 56, 202] },
  });

  y2 = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y2 + 40;
  doc.text('Agent commissions (manual accruals)', 14, y2 + 10);
  const comBody = commissions.map((c) => [
    c.period_month,
    formatNgn(c.commission_amount_ngn),
    `${c.commission_pct}%`,
    c.status,
  ]);
  doc.autoTable({
    startY: y2 + 14,
    head: [['Period', 'Commission', 'Rate', 'Status']],
    body: comBody.length ? comBody : [['—', '—', '—', '—']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  doc.save(`owner-statement-${periodLabel.replace(/\s+/g, '-')}.pdf`);
}

export function exportMonthlyReportPdf(rows: MonthlyPlRow[], title: string): void {
  const doc = new jsPDF();
  doc.setFontSize(15);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text('Monthly P & L summary (NGN) — rent, service charge, expenses, commissions', 14, 24);

  const body = rows.map((r) => [
    r.month,
    formatNgn(r.incomeRent + r.incomeServiceCharge + r.incomeOther),
    formatNgn(r.expenses + r.maintenanceActual),
    formatNgn(r.commissions + r.platformFeesSettled + r.agentCommissionSettled + r.taxSettled),
    formatNgn(r.net),
  ]);

  doc.autoTable({
    startY: 30,
    head: [['Month', 'Total income', 'Outflows (exp+Maint)', 'Fees & commissions', 'Net']],
    body: body.length ? body : [['—', '—', '—', '—', '—']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  doc.save(`monthly-financial-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
