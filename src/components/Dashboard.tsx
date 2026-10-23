import React, { useState } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Trash2,
  Sparkles,
  Heart,
  PartyPopper,
  Compass,
  Edit2,
} from 'lucide-react';
import { PlanoraEventData, EventType, EventDetails } from '../types';
import { calculateBudgetSummary, calculateDaysRemaining, calculateTaskSummary, formatCurrency } from '../utils/calculations';
import { IMAGES } from '../constants/assets';
import { EditEventModal } from './EditEventModal';

interface DashboardProps {
  events: PlanoraEventData[];
  onSelectEvent: (eventId: string, targetTab?: string) => void;
  onCreateNewEvent: () => void;
  onEditEvent: (updated: EventDetails) => void;
  onDeleteEvent: (eventId: string) => void;
  onLoadSampleEvent: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  events,
  onSelectEvent,
  onCreateNewEvent,
  onEditEvent,
  onDeleteEvent,
  onLoadSampleEvent,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventDetails | null>(null);

  // Compute aggregate stats across all events
  const totalBudgetCombined = events.reduce((acc, e) => acc + (e.event.totalBudget || 0), 0);
  const totalTasksAll = events.reduce((acc, e) => acc + e.tasks.length, 0);
  const totalCompletedTasksAll = events.reduce(
    (acc, e) => acc + e.tasks.filter((t) => t.status === 'completed').length,
    0
  );
  const totalBookedVendors = events.reduce(
    (acc, e) => acc + e.vendors.filter((v) => v.bookingStatus === 'booked').length,
    0
  );

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.event.type === filterType;
  });

  const getEventImage = (type: EventType) => {
    switch (type) {
      case 'wedding':
        return IMAGES.weddingShowcase;
      case 'birthday':
        return IMAGES.birthdayShowcase;
      case 'community':
        return IMAGES.communityShowcase;
      default:
        return IMAGES.heroBanner;
    }
  };

  const getTypeIcon = (type: EventType) => {
    switch (type) {
      case 'wedding':
        return Heart;
      case 'birthday':
        return PartyPopper;
      case 'community':
        return Compass;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1b4332] text-[#faf8f5] shadow-md">
        <div className="absolute inset-0 opacity-25 mix-blend-overlay">
          <img
            src={IMAGES.heroBanner}
            alt="Planora event decor"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative px-6 py-8 sm:px-10 sm:py-12 max-w-4xl">
          <div className="text-xs uppercase tracking-widest text-[#d8c29d] font-semibold mb-2">
            AI-Powered Productivity Suite
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#faf8f5] mb-3 text-balance">
            Every event, thoughtfully planned.
          </h1>
          <p className="text-sm sm:text-base text-[#e2d9cd] max-w-2xl leading-relaxed mb-6">
            From intimate birthday milestones and community festivals to grand multi-day weddings,
            Planora synchronizes budget mathematics, vendor contracts, timeline dependencies, and
            Gemini-driven intelligence in one calm workspace.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateNewEvent}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#fbf9f5] text-[#1b4332] hover:bg-[#ede7dd] font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>

            {events.length === 0 && (
              <button
                onClick={onLoadSampleEvent}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f]/70 text-[#faf8f5] hover:bg-[#2d6a4f] font-medium text-xs sm:text-sm rounded-lg border border-[#40916c] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                <Sparkles className="w-4 h-4 text-[#e9c46a]" />
                <span>Load Sample Heritage Wedding</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Aggregate Overview Metrics Strip */}
      <section aria-label="Planning Portfolio Metrics" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#716859] mb-1.5">
            <span>Active Events</span>
            <Calendar className="w-4 h-4 text-[#1b4332]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#142d22]">
            {events.length}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">Single-user workspace</div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#716859] mb-1.5">
            <span>Portfolio Budget</span>
            <DollarSign className="w-4 h-4 text-[#1b4332]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#142d22] truncate">
            {formatCurrency(totalBudgetCombined, events[0]?.event.currency || 'INR')}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">Across all planned events</div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#716859] mb-1.5">
            <span>Tasks Progress</span>
            <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#142d22]">
            {totalCompletedTasksAll} / {totalTasksAll}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            {totalTasksAll > 0
              ? `${Math.round((totalCompletedTasksAll / totalTasksAll) * 100)}% overall completion`
              : 'No tasks scheduled'}
          </div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#716859] mb-1.5">
            <span>Booked Vendors</span>
            <Users className="w-4 h-4 text-[#c86d51]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#142d22]">
            {totalBookedVendors}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">Confirmed provider contracts</div>
        </div>
      </section>

      {/* Events Section & Controls */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e7e1d7] pb-3">
          <div>
            <h2 className="text-lg font-bold text-[#142d22]">Your Events</h2>
            <p className="text-xs text-[#716859]">Manage and switch between active planning files</p>
          </div>

          {/* Interactive Filter Tabs (Zero-pill compliant segmented control) */}
          <div className="flex items-center gap-1 p-1 bg-[#ede7dd] rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-[#fbf9f5] text-[#142d22] shadow-2xs'
                  : 'text-[#655c4d] hover:text-[#142d22]'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setFilterType('wedding')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'wedding'
                  ? 'bg-[#fbf9f5] text-[#142d22] shadow-2xs'
                  : 'text-[#655c4d] hover:text-[#142d22]'
              }`}
            >
              Weddings
            </button>
            <button
              onClick={() => setFilterType('birthday')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'birthday'
                  ? 'bg-[#fbf9f5] text-[#142d22] shadow-2xs'
                  : 'text-[#655c4d] hover:text-[#142d22]'
              }`}
            >
              Birthdays
            </button>
            <button
              onClick={() => setFilterType('community')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'community'
                  ? 'bg-[#fbf9f5] text-[#142d22] shadow-2xs'
                  : 'text-[#655c4d] hover:text-[#142d22]'
              }`}
            >
              Community
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 ? (
          <div className="border border-dashed border-[#dcd4c7] rounded-xl p-8 sm:p-12 text-center bg-[#fbf9f5] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#f2ece2] text-[#716859] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#142d22]">No events found</h3>
              <p className="text-xs text-[#716859] max-w-md mx-auto">
                {events.length === 0
                  ? 'You do not have any planned events yet. You can create a new event or inspect the sample Jaipur wedding.'
                  : `No events matching the "${filterType}" category.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onCreateNewEvent}
                className="px-4 py-2 bg-[#1b4332] text-white text-xs font-semibold rounded-md hover:bg-[#2d6a4f] transition-colors"
              >
                Create First Event
              </button>
              {events.length === 0 && (
                <button
                  onClick={onLoadSampleEvent}
                  className="px-4 py-2 border border-[#dcd4c7] text-[#142d22] bg-[#fbf9f5] text-xs font-semibold rounded-md hover:bg-[#ede7dd] transition-colors"
                >
                  Load Sample Event
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Event Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((item) => {
              const { event, categories, expenses, tasks, vendors, aiPlan } = item;
              const daysLeft = calculateDaysRemaining(event.date);
              const budgetStats = calculateBudgetSummary(event.totalBudget, categories, expenses);
              const taskStats = calculateTaskSummary(tasks);
              const TypeIcon = getTypeIcon(event.type);

              return (
                <article
                  key={event.id}
                  className="group bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl overflow-hidden hover:border-[#1b4332]/40 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
                >
                  {/* Card Image Banner */}
                  <div className="relative h-40 overflow-hidden bg-[#e9e3d8]">
                    <img
                      src={getEventImage(event.type)}
                      alt={event.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Top overlay metadata (Zero-pill: clean text with separator) */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-1.5 font-medium drop-shadow-xs">
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{event.type}</span>
                        <span aria-hidden="true">·</span>
                        <span>{event.guestCount} guests</span>
                      </div>

                      <div className="text-[11px] font-mono tabular-nums bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-xs">
                        {daysLeft > 0
                          ? `${daysLeft} days to go`
                          : daysLeft === 0
                          ? 'Today'
                          : `${Math.abs(daysLeft)} days ago`}
                      </div>
                    </div>

                    {/* Bottom Title overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-bold text-white drop-shadow-sm truncate">
                        {event.name}
                      </h3>
                      <div className="text-xs text-[#faf8f5]/90 truncate">
                        {event.location} · {event.date}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                    {/* Key metrics */}
                    <div className="space-y-3">
                      {/* Budget summary */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#716859]">Budget Allocated / Actual</span>
                          <span className="font-mono tabular-nums font-semibold text-[#142d22]">
                            {formatCurrency(budgetStats.totalActual, event.currency)} /{' '}
                            {formatCurrency(event.totalBudget, event.currency)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#ede7dd] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              budgetStats.isOverBudget ? 'bg-[#c86d51]' : 'bg-[#1b4332]'
                            }`}
                            style={{ width: `${Math.min(100, budgetStats.utilizationPercentage)}%` }}
                          />
                        </div>
                        {budgetStats.isOverBudget && (
                          <div className="flex items-center gap-1 text-[11px] text-[#c86d51]">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Over budget by {formatCurrency(budgetStats.overBudgetAmount, event.currency)}</span>
                          </div>
                        )}
                      </div>

                      {/* Tasks & Vendors counts */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#f0eae0] text-xs">
                        <div>
                          <div className="text-[#8c8273]">Tasks Progress</div>
                          <div className="font-mono tabular-nums font-semibold text-[#142d22]">
                            {taskStats.completedCount} / {taskStats.totalCount} ({taskStats.progressPercentage}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-[#8c8273]">Vendors Booked</div>
                          <div className="font-mono tabular-nums font-semibold text-[#142d22]">
                            {vendors.filter((v) => v.bookingStatus === 'booked').length} of {vendors.length}
                          </div>
                        </div>
                      </div>

                      {/* AI Plan status */}
                      <div className="flex items-center gap-1.5 text-xs text-[#2d6a4f] pt-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#e9c46a]" />
                        <span>
                          {aiPlan ? 'AI plan active with trade-offs' : 'Template baseline ready'}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectEvent(event.id, 'overview')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setEditingEvent(event)}
                        title="Edit Event Details"
                        aria-label={`Edit details for ${event.name}`}
                        className="p-2 text-[#716859] hover:text-[#1b4332] hover:bg-[#ede7dd] rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {deleteConfirmId === event.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteEvent(event.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1.5 bg-[#c86d51] hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1.5 bg-[#ede7dd] text-[#4a4237] text-xs font-medium rounded-md hover:bg-[#e0d8cc]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(event.id)}
                          title="Delete Event"
                          aria-label={`Delete event ${event.name}`}
                          className="p-2 text-[#8c8273] hover:text-[#c86d51] hover:bg-[#ede7dd] rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#c86d51]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={Boolean(editingEvent)}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={(updated) => {
          onEditEvent(updated);
          setEditingEvent(null);
        }}
      />
    </div>
  );
};
