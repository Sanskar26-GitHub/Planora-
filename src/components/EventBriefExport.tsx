import React from 'react';
import {
  Printer,
  Calendar,
  DollarSign,
  Users,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  FileText,
} from 'lucide-react';
import { PlanoraEventData } from '../types';
import { calculateBudgetSummary, calculateTaskSummary, formatCurrency } from '../utils/calculations';

interface EventBriefExportProps {
  eventData: PlanoraEventData;
}

export const EventBriefExport: React.FC<EventBriefExportProps> = ({ eventData }) => {
  const { event, categories, expenses, tasks, vendors, aiPlan } = eventData;
  const budgetSummary = calculateBudgetSummary(event.totalBudget, categories, expenses);
  const taskSummary = calculateTaskSummary(tasks);
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e1d7] pb-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#142d22]">
            Executive Event Brief & Export
          </h1>
          <p className="text-xs text-[#716859]">
            A complete, publication-ready summary of your event strategy, budget ledger, timeline, and vendor contracts.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1b4332] text-white hover:bg-[#2d6a4f] text-xs font-semibold rounded-md transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Document Sheet */}
      <div className="bg-white border border-[#e7e1d7] rounded-xl p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto space-y-8 text-[#1f2937]">
        {/* Document Header */}
        <div className="border-b-2 border-[#1b4332] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-widest font-bold text-[#1b4332]">
              Planora · Master Event Brief
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">{event.name}</h2>
            <div className="text-xs text-[#6b7280]">
              {event.location} · {event.date} {event.endDate ? `to ${event.endDate}` : ''}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#6b7280] space-y-1">
            <div>
              Generated on: <strong>{generatedDate}</strong>
            </div>
            <div>
              Guest Target: <strong>{event.guestCount} guests</strong>
            </div>
            <div>
              Currency Standard: <strong>{event.currency}</strong>
            </div>
          </div>
        </div>

        {/* 1. Executive Summary & Concept */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#1b4332] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>1. Executive Concept & Objectives</span>
          </h3>
          <p className="text-xs leading-relaxed text-[#374151] bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb]">
            {aiPlan?.eventOverview ||
              event.stylePreferences ||
              `${event.name} is planned as a ${event.type} for approximately ${event.guestCount} guests with an allocated budget of ${formatCurrency(
                event.totalBudget,
                event.currency
              )}.`}
          </p>

          {aiPlan?.planningAssumptions && (
            <div className="pt-2 text-xs text-[#4b5563]">
              <div className="font-semibold text-[#111827] mb-1">Key Planning Assumptions:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {aiPlan.planningAssumptions.map((assump, idx) => (
                  <li key={idx}>{assump}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 2. Financial Summary & Categories */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#1b4332] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span>2. Financial Allocation & Expenditure Ledger</span>
          </h3>

          <div className="grid grid-cols-4 gap-3 bg-[#f9fafb] p-3 rounded-lg border border-[#e5e7eb] text-xs">
            <div>
              <div className="text-[#6b7280]">Total Budget</div>
              <div className="font-mono font-bold text-[#111827]">
                {formatCurrency(budgetSummary.totalBudget, event.currency)}
              </div>
            </div>
            <div>
              <div className="text-[#6b7280]">Committed Expenses</div>
              <div className="font-mono font-bold text-[#111827]">
                {formatCurrency(budgetSummary.totalActual, event.currency)}
              </div>
            </div>
            <div>
              <div className="text-[#6b7280]">Remaining Budget</div>
              <div className="font-mono font-bold text-[#166534]">
                {formatCurrency(budgetSummary.remainingBudget, event.currency)}
              </div>
            </div>
            <div>
              <div className="text-[#6b7280]">Utilization</div>
              <div className="font-mono font-bold text-[#111827]">
                {budgetSummary.utilizationPercentage}%
              </div>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-[#e5e7eb] rounded-lg overflow-hidden">
            <thead className="bg-[#f3f4f6] text-[#4b5563] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2 px-3 font-semibold">Budget Category</th>
                <th className="py-2 px-3 font-semibold text-right">Share (%)</th>
                <th className="py-2 px-3 font-semibold text-right">Allocated Target</th>
                <th className="py-2 px-3 font-semibold text-right">Actual Spent</th>
                <th className="py-2 px-3 font-semibold text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {budgetSummary.categoryBreakdown.map((row) => (
                <tr key={row.category.id}>
                  <td className="py-2 px-3 font-medium text-[#111827]">{row.category.name}</td>
                  <td className="py-2 px-3 text-right font-mono">{row.category.allocatedPercentage}%</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatCurrency(row.category.allocatedAmount, event.currency)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">
                    {formatCurrency(row.actual, event.currency)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-mono ${
                      row.variance < 0 ? 'text-[#b91c1c] font-bold' : 'text-[#166534]'
                    }`}
                  >
                    {formatCurrency(row.variance, event.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3. Action Items & Milestones */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#1b4332] uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            <span>3. Actionable Tasks & Critical Deadlines</span>
          </h3>

          <div className="text-xs text-[#6b7280]">
            Tracking {taskSummary.totalCount} items: {taskSummary.completedCount} completed,{' '}
            {taskSummary.pendingCount} pending, {taskSummary.overdueCount} overdue.
          </div>

          <table className="w-full text-left text-xs border border-[#e5e7eb] rounded-lg overflow-hidden">
            <thead className="bg-[#f3f4f6] text-[#4b5563] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2 px-3 font-semibold">Action Item</th>
                <th className="py-2 px-3 font-semibold">Category</th>
                <th className="py-2 px-3 font-semibold">Priority</th>
                <th className="py-2 px-3 font-semibold">Due Date</th>
                <th className="py-2 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {tasks.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td className="py-2 px-3 font-medium text-[#111827]">{t.title}</td>
                  <td className="py-2 px-3 text-[#4b5563]">{t.category}</td>
                  <td className="py-2 px-3 uppercase text-[10px] font-semibold">{t.priority}</td>
                  <td className="py-2 px-3 font-mono">{t.dueDate || '—'}</td>
                  <td className="py-2 px-3 text-center uppercase text-[10px] font-semibold">
                    {t.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 4. Confirmed Vendors Directory */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#1b4332] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>4. Vendor Roster & Booking Status</span>
          </h3>

          <table className="w-full text-left text-xs border border-[#e5e7eb] rounded-lg overflow-hidden">
            <thead className="bg-[#f3f4f6] text-[#4b5563] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2 px-3 font-semibold">Vendor Partner</th>
                <th className="py-2 px-3 font-semibold">Category</th>
                <th className="py-2 px-3 font-semibold">Contact / Phone</th>
                <th className="py-2 px-3 font-semibold text-right">Quoted</th>
                <th className="py-2 px-3 font-semibold text-right">Balance Due</th>
                <th className="py-2 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="py-2 px-3 font-medium text-[#111827]">{v.name}</td>
                  <td className="py-2 px-3 text-[#4b5563]">{v.category}</td>
                  <td className="py-2 px-3 text-[#4b5563]">
                    {v.contactName ? `${v.contactName} (${v.phone || v.email || '—'})` : v.phone || v.email || '—'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatCurrency(v.quotedAmount, event.currency)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">
                    {formatCurrency(v.remainingBalance, event.currency)}
                  </td>
                  <td className="py-2 px-3 text-center uppercase text-[10px] font-semibold">
                    {v.bookingStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 5. Contingency & Risk Mitigation */}
        {aiPlan?.risksAndContingencies && aiPlan.risksAndContingencies.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[#1b4332] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>5. Risk Mitigation Protocols</span>
            </h3>

            <div className="space-y-2 text-xs">
              {aiPlan.risksAndContingencies.map((rc, idx) => (
                <div key={idx} className="p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                  <div className="font-semibold text-[#111827] mb-1">
                    Risk: {rc.risk} ({rc.impact.toUpperCase()} impact)
                  </div>
                  <div className="text-[#4b5563]">Protocol: {rc.contingencyPlan}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-[#e5e7eb] text-center text-xs text-[#9ca3af]">
          Planora · Every event, thoughtfully planned.
        </div>
      </div>
    </div>
  );
};
