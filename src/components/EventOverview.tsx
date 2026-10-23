import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { PlanoraEventData } from '../types';
import {
  calculateBudgetSummary,
  calculateDaysRemaining,
  calculateTaskSummary,
  calculateVendorSummary,
  formatCurrency,
} from '../utils/calculations';
import { requestAiPlan } from '../services/aiClient';
import { storage } from '../services/storage';

interface EventOverviewProps {
  eventData: PlanoraEventData;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
}

export const EventOverview: React.FC<EventOverviewProps> = ({
  eventData,
  setActiveTab,
  onRefresh,
}) => {
  const { event, categories, expenses, tasks, vendors, aiPlan } = eventData;
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const daysRemaining = calculateDaysRemaining(event.date);
  const budgetStats = calculateBudgetSummary(event.totalBudget, categories, expenses);
  const taskStats = calculateTaskSummary(tasks);
  const vendorStats = calculateVendorSummary(vendors);

  const handleGenerateOrRefreshAiPlan = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const result = await requestAiPlan(event);
      if (result.success && result.plan) {
        storage.saveAiPlan(event.id, result.plan);
        onRefresh();
      } else {
        setAiError(result.message || 'Failed to generate AI plan. Please check server settings.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error communicating with Gemini service.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Event Header Banner */}
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#716859]">
              <span className="capitalize font-semibold text-[#1b4332]">{event.type}</span>
              <span aria-hidden="true">·</span>
              <span>{event.guestCount} Guests</span>
              <span aria-hidden="true">·</span>
              <span>{event.location}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142d22]">
              {event.name}
            </h1>
            <div className="text-xs sm:text-sm text-[#5c5344]">
              {event.date} {event.endDate ? `— ${event.endDate}` : ''}
            </div>
          </div>

          {/* Quick jump tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              onClick={() => setActiveTab('budget')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#ede7dd] text-[#2c261e] hover:bg-[#e1d9cc] rounded-md transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Budget</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#ede7dd] text-[#2c261e] hover:bg-[#e1d9cc] rounded-md transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#ede7dd] text-[#2c261e] hover:bg-[#e1d9cc] rounded-md transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Vendors</span>
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1b4332] text-white hover:bg-[#2d6a4f] rounded-md transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Overdue Tasks Banner (if any) */}
      {taskStats.overdueCount > 0 && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-[#991b1b]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span>
              <strong>{taskStats.overdueCount} task(s)</strong> are overdue according to your target schedule.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('timeline')}
            className="font-semibold underline hover:text-[#7f1d1d] whitespace-nowrap"
          >
            Review Tasks
          </button>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Countdown */}
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#716859]">
            <span>Countdown</span>
            <Clock className="w-4 h-4 text-[#1b4332]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#142d22]">
            {daysRemaining > 0 ? `${daysRemaining} Days` : daysRemaining === 0 ? 'Today!' : 'Completed'}
          </div>
          <div className="text-[11px] text-[#8c8273]">
            {daysRemaining > 30
              ? 'Early planning phase'
              : daysRemaining > 7
              ? 'Final preparation phase'
              : daysRemaining >= 0
              ? 'Event execution week'
              : 'Post-event archive'}
          </div>
        </div>

        {/* Total Budget vs Actual */}
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#716859]">
            <span>Budget Utilized</span>
            <DollarSign className="w-4 h-4 text-[#1b4332]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#142d22] truncate">
            {formatCurrency(budgetStats.totalActual, event.currency)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#716859] pt-1">
            <span>of {formatCurrency(event.totalBudget, event.currency)}</span>
            <span
              className={`font-semibold font-mono ${
                budgetStats.isOverBudget ? 'text-[#c86d51]' : 'text-[#2d6a4f]'
              }`}
            >
              {budgetStats.utilizationPercentage}%
            </span>
          </div>
        </div>

        {/* Task Progress */}
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#716859]">
            <span>Task Progress</span>
            <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#142d22]">
            {taskStats.completedCount} / {taskStats.totalCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#716859] pt-1">
            <span>{taskStats.pendingCount} pending</span>
            <span className="font-semibold font-mono text-[#2d6a4f]">
              {taskStats.progressPercentage}%
            </span>
          </div>
        </div>

        {/* Vendors Booked */}
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#716859]">
            <span>Vendors Booked</span>
            <Users className="w-4 h-4 text-[#c86d51]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#142d22]">
            {vendorStats.bookedCount} / {vendorStats.totalVendors}
          </div>
          <div className="text-[11px] text-[#8c8273] truncate">
            {formatCurrency(vendorStats.totalQuoted, event.currency)} quoted
          </div>
        </div>
      </div>

      {/* AI Strategy & Recommendations Section */}
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d7] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f2eee6] text-[#1b4332] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#d97706]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#142d22]">Gemini Planning Intelligence</h2>
              <p className="text-xs text-[#716859]">
                Structured recommendations, risk contingencies, and creative concepts
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateOrRefreshAiPlan}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#f2eee6] text-[#1b4332] border border-[#dcd4c7] hover:bg-[#ede7dd] rounded-lg transition-colors self-start sm:self-auto"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Consulting Gemini...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{aiPlan ? 'Regenerate Plan' : 'Generate Full AI Plan'}</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="p-3 bg-[#fdf2e9] border border-[#f0c29d] rounded-lg text-xs text-[#9c4125]">
            {aiError}
          </div>
        )}

        {aiPlan ? (
          <div className="space-y-6">
            {/* Overview */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-[#8c8273]">
                Event Concept & Vision
              </div>
              <p className="text-sm text-[#2c261e] leading-relaxed bg-[#f8f6f0] p-4 rounded-xl border border-[#ece4d8]">
                {aiPlan.eventOverview}
              </p>
            </div>

            {/* Assumptions & Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#8c8273] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Planning Assumptions</span>
                </div>
                <ul className="space-y-2 text-xs text-[#4a4237]">
                  {aiPlan.planningAssumptions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#f8f6f0] p-2.5 rounded-lg border border-[#f0eae0]">
                      <span className="text-[#1b4332] font-bold">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#8c8273] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Curated Aesthetic Themes</span>
                </div>
                <ul className="space-y-2 text-xs text-[#4a4237]">
                  {aiPlan.themeRecommendations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#f8f6f0] p-2.5 rounded-lg border border-[#f0eae0]">
                      <span className="text-[#2d6a4f] font-bold">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Creative Experiences & Trade-offs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#8c8273]">
                  Signature Guest Experiences
                </div>
                <div className="space-y-2">
                  {aiPlan.creativeExperiences.map((exp, idx) => (
                    <div key={idx} className="text-xs text-[#2c261e] p-2.5 bg-[#f8f6f0] rounded-lg border border-[#f0eae0]">
                      {exp}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#8c8273]">
                  Budget Trade-Offs & Optimizations
                </div>
                <div className="space-y-2">
                  {aiPlan.budgetTradeoffs.map((to, idx) => (
                    <div key={idx} className="text-xs text-[#2c261e] p-2.5 bg-[#f8f6f0] rounded-lg border border-[#f0eae0]">
                      {to}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Contingency Table */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-[#8c8273] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#c86d51]" />
                <span>Risk Mitigation & Contingencies</span>
              </div>
              <div className="overflow-x-auto border border-[#e7e1d7] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f2ece2] text-[#716859] border-b border-[#e7e1d7]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Identified Risk</th>
                      <th className="py-2.5 px-3 font-semibold w-24">Impact</th>
                      <th className="py-2.5 px-3 font-semibold">Contingency Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eae0]">
                    {aiPlan.risksAndContingencies.map((rc, idx) => (
                      <tr key={idx} className="hover:bg-[#faf8f5]">
                        <td className="py-2.5 px-3 text-[#142d22] font-medium">{rc.risk}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold uppercase text-[10px] ${
                              rc.impact === 'high'
                                ? 'text-[#c86d51]'
                                : rc.impact === 'medium'
                                ? 'text-[#d97706]'
                                : 'text-[#2d6a4f]'
                            }`}
                          >
                            {rc.impact}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#4a4237]">{rc.contingencyPlan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#f8f6f0] rounded-xl border border-dashed border-[#dcd4c7] space-y-3">
            <Sparkles className="w-8 h-8 text-[#d97706] mx-auto" />
            <h3 className="text-sm font-bold text-[#142d22]">
              Generate a Personalized AI Event Strategy
            </h3>
            <p className="text-xs text-[#716859] max-w-md mx-auto">
              Planora uses Gemini 3.8 Flash to analyze your {formatCurrency(event.totalBudget, event.currency)} budget, {event.guestCount} guests, and {event.location} location to recommend tailored creative ideas, risk mitigations, and budget trade-offs.
            </p>
            <button
              onClick={handleGenerateOrRefreshAiPlan}
              disabled={isGeneratingAi}
              className="px-4 py-2 bg-[#1b4332] text-white text-xs font-semibold rounded-md hover:bg-[#2d6a4f] transition-colors"
            >
              {isGeneratingAi ? 'Connecting with Gemini...' : 'Generate AI Plan Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
