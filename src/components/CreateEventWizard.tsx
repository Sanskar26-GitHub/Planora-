import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Heart,
  PartyPopper,
  Compass,
} from 'lucide-react';
import { EventDetails, EventType, PlanoraEventData } from '../types';
import { validateEventInput } from '../utils/validation';
import { createInitialCategories } from '../constants/initialData';
import { requestAiPlan } from '../services/aiClient';
import { formatCurrency, getLocalTodayString } from '../utils/calculations';

interface CreateEventWizardProps {
  onEventCreated: (eventData: PlanoraEventData) => void;
  onCancel: () => void;
}

export const CreateEventWizard: React.FC<CreateEventWizardProps> = ({
  onEventCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EventDetails>>({
    name: '',
    type: 'wedding',
    date: '',
    endDate: '',
    location: '',
    currency: 'INR',
    guestCount: 150,
    totalBudget: 1500000,
    stylePreferences: '',
    dietaryAccessibility: '',
    additionalNotes: '',
    specificDetails: {
      wedding: {
        ceremonyType: 'traditional',
        isMultiDay: false,
        receptionStyle: 'buffet',
        traditions: '',
      },
      birthday: {
        ageGroup: 'adults',
        theme: '',
        keyActivities: '',
        entertainment: '',
      },
      community: {
        volunteerCount: 15,
        equipmentNeeds: '',
        publicAttendance: true,
        permitsNeeded: true,
        organizingCommittee: '',
      },
    },
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const currencies = [
    { code: 'INR', label: 'INR (₹) — Indian Rupee' },
    { code: 'USD', label: 'USD ($) — US Dollar' },
    { code: 'EUR', label: 'EUR (€) — Euro' },
    { code: 'GBP', label: 'GBP (£) — British Pound' },
    { code: 'AUD', label: 'AUD (A$) — Australian Dollar' },
    { code: 'CAD', label: 'CAD (C$) — Canadian Dollar' },
  ];

  const updateField = (field: keyof EventDetails, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateSpecificField = (
    typeKey: 'wedding' | 'birthday' | 'community',
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      specificDetails: {
        ...prev.specificDetails,
        [typeKey]: {
          ...(prev.specificDetails?.[typeKey] as any),
          [field]: value,
        },
      },
    }));
  };

  const handleNextStep = () => {
    // Validate current step
    const validation = validateEventInput(formData);
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (validation.errors.name) stepErrors.name = validation.errors.name;
      if (validation.errors.type) stepErrors.type = validation.errors.type;
      if (validation.errors.date) stepErrors.date = validation.errors.date;
      if (validation.errors.endDate) stepErrors.endDate = validation.errors.endDate;
      if (validation.errors.location) stepErrors.location = validation.errors.location;
      if (validation.errors.currency) stepErrors.currency = validation.errors.currency;
    } else if (currentStep === 2) {
      if (validation.errors.guestCount) stepErrors.guestCount = validation.errors.guestCount;
      if (validation.errors.totalBudget) stepErrors.totalBudget = validation.errors.totalBudget;
    }

    if (Object.keys(stepErrors).length > 0) {
      setValidationErrors(stepErrors);
      return;
    }

    setValidationErrors({});
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const finalizeCreation = async (withAi: boolean) => {
    const validation = validateEventInput(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setGenerationError(null);

    const eventId = `event-${Date.now()}`;
    const newEvent: EventDetails = {
      id: eventId,
      name: formData.name!.trim(),
      type: formData.type as EventType,
      date: formData.date!,
      endDate: formData.endDate || undefined,
      location: formData.location!.trim(),
      currency: formData.currency || 'INR',
      guestCount: Number(formData.guestCount),
      totalBudget: Number(formData.totalBudget),
      stylePreferences: formData.stylePreferences?.trim() || '',
      dietaryAccessibility: formData.dietaryAccessibility?.trim() || '',
      additionalNotes: formData.additionalNotes?.trim() || '',
      specificDetails: formData.specificDetails || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialCategories = createInitialCategories(newEvent.type, newEvent.totalBudget);

    let aiPlanResult = undefined;

    if (withAi) {
      setAiLoading(true);
      try {
        const response = await requestAiPlan(newEvent);
        if (response.success && response.plan) {
          aiPlanResult = response.plan;
        } else {
          setGenerationError(
            response.message || 'AI plan generation encountered an issue. Initializing with default template.'
          );
        }
      } catch (err: any) {
        setGenerationError('Failed to generate AI plan. Proceeding with structured template.');
      } finally {
        setAiLoading(false);
      }
    }

    // Build initial task list from AI milestones or defaults
    const initialTasks = [];
    if (aiPlanResult && Array.isArray(aiPlanResult.milestones)) {
      for (const m of aiPlanResult.milestones) {
        if (Array.isArray(m.tasks)) {
          for (const t of m.tasks) {
            initialTasks.push({
              id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: t.title,
              category: t.category || 'General',
              dueDate: m.dueDate || newEvent.date,
              priority: (t.priority as any) || 'medium',
              status: 'pending' as const,
              dependencies: [],
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } else {
      // Default initial tasks
      initialTasks.push(
        {
          id: `task-${Date.now()}-1`,
          title: 'Finalize core venue reservation and contract terms',
          category: initialCategories[0]?.name || 'Venue',
          dueDate: newEvent.date,
          priority: 'urgent' as const,
          status: 'pending' as const,
          dependencies: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: `task-${Date.now()}-2`,
          title: 'Confirm menu tastings and dietary preferences',
          category: initialCategories[1]?.name || 'Catering',
          dueDate: newEvent.date,
          priority: 'high' as const,
          status: 'pending' as const,
          dependencies: [],
          createdAt: new Date().toISOString(),
        }
      );
    }

    const initialEventData: PlanoraEventData = {
      event: newEvent,
      categories: initialCategories,
      expenses: [],
      milestones: [],
      tasks: initialTasks,
      vendors: [],
      aiPlan: aiPlanResult,
      chatHistory: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: 'assistant',
          content: `Welcome to ${newEvent.name}! I am your Planora AI strategist. I've initialized your ${formatCurrency(
            newEvent.totalBudget,
            newEvent.currency
          )} budget allocations and ${initialTasks.length} timeline milestones. What area would you like to review first?`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setIsSubmitting(false);
    onEventCreated(initialEventData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-[#fbf9f5] border border-[#e7e1d7] rounded-2xl shadow-sm p-6 sm:p-10">
      {/* Wizard Header */}
      <div className="border-b border-[#e7e1d7] pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1b4332]">
              Event Setup Wizard
            </span>
            <h1 className="text-2xl font-bold text-[#142d22] mt-1">Create a New Event</h1>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-[#716859] hover:text-[#142d22] px-3 py-1.5 rounded-md hover:bg-[#ede7dd] transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Budget & Scale' },
            { num: 3, label: 'Personalization' },
            { num: 4, label: 'Review & Plan' },
          ].map((s) => (
            <div key={s.num} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  currentStep >= s.num ? 'bg-[#1b4332]' : 'bg-[#e7e1d7]'
                }`}
              />
              <div className="text-[11px] font-medium text-[#716859] truncate">
                {s.num}. {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* STEP 1: BASICS */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#142d22]">1. Event Fundamentals</h2>

            {/* Event Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#2c261e] mb-2">
                Event Type <span className="text-[#c86d51]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'wedding', label: 'Wedding', icon: Heart, desc: 'Ceremony, reception, multiday' },
                  { id: 'birthday', label: 'Birthday', icon: PartyPopper, desc: 'Milestone, theme, party' },
                  { id: 'community', label: 'Community', icon: Compass, desc: 'Festivals, permits, public' },
                ].map((t) => {
                  const Icon = t.icon;
                  const selected = formData.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateField('type', t.id)}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        selected
                          ? 'border-[#1b4332] bg-[#f2eee6] text-[#142d22] ring-1 ring-[#1b4332]'
                          : 'border-[#dcd4c7] bg-[#fbf9f5] text-[#554c3e] hover:border-[#1b4332]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${selected ? 'text-[#1b4332]' : 'text-[#716859]'}`} />
                        <span className="font-semibold text-xs sm:text-sm">{t.label}</span>
                      </div>
                      <div className="text-[11px] text-[#716859]">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Name */}
            <div>
              <label htmlFor="event-name" className="block text-xs font-semibold text-[#2c261e] mb-1">
                Event Name <span className="text-[#c86d51]">*</span>
              </label>
              <input
                id="event-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Maya's 30th Birthday Soirée or Summer Lantern Gala"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
              />
              {validationErrors.name && (
                <p className="text-xs text-[#c86d51] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors.name}</span>
                </p>
              )}
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-date" className="block text-xs font-semibold text-[#2c261e] mb-1">
                  Event Start Date <span className="text-[#c86d51]">*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
                  min={getLocalTodayString()}
                  value={formData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden font-mono"
                />
                {validationErrors.date && (
                  <p className="text-xs text-[#c86d51] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{validationErrors.date}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="event-end-date" className="block text-xs font-semibold text-[#2c261e] mb-1">
                  Optional End Date <span className="text-[#8c8273] font-normal">(for multiday)</span>
                </label>
                <input
                  id="event-end-date"
                  type="date"
                  min={formData.date || getLocalTodayString()}
                  value={formData.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden font-mono"
                />
                {validationErrors.endDate && (
                  <p className="text-xs text-[#c86d51] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{validationErrors.endDate}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Location & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="event-location" className="block text-xs font-semibold text-[#2c261e] mb-1">
                  Location / City <span className="text-[#c86d51]">*</span>
                </label>
                <input
                  id="event-location"
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Mumbai, New Delhi, San Francisco, London"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
                />
                {validationErrors.location && (
                  <p className="text-xs text-[#c86d51] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{validationErrors.location}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="event-currency" className="block text-xs font-semibold text-[#2c261e] mb-1">
                  Currency <span className="text-[#c86d51]">*</span>
                </label>
                <select
                  id="event-currency"
                  value={formData.currency || 'INR'}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUDGET & SCALE */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#142d22]">2. Scale & Financial Scope</h2>

            {/* Guest Count */}
            <div>
              <label htmlFor="guest-count" className="block text-xs font-semibold text-[#2c261e] mb-1">
                Estimated Guest Count <span className="text-[#c86d51]">*</span>
              </label>
              <input
                id="guest-count"
                type="number"
                min="1"
                max="50000"
                value={formData.guestCount || ''}
                onChange={(e) => updateField('guestCount', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden font-mono"
              />
              <span className="text-[11px] text-[#716859] mt-1 block">
                Directly impacts catering allocations, seating, and per-head vendor quotes.
              </span>
              {validationErrors.guestCount && (
                <p className="text-xs text-[#c86d51] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors.guestCount}</span>
                </p>
              )}
            </div>

            {/* Total Budget */}
            <div>
              <label htmlFor="total-budget" className="block text-xs font-semibold text-[#2c261e] mb-1">
                Total Budget ({formData.currency || 'INR'}) <span className="text-[#c86d51]">*</span>
              </label>
              <input
                id="total-budget"
                type="number"
                min="1"
                step="1000"
                value={formData.totalBudget || ''}
                onChange={(e) => updateField('totalBudget', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden font-mono"
              />
              <div className="text-[11px] text-[#716859] mt-1 flex items-center justify-between">
                <span>Formatted: {formatCurrency(formData.totalBudget || 0, formData.currency || 'INR')}</span>
                <span>
                  Estimated per guest:{' '}
                  {formData.guestCount && formData.totalBudget
                    ? formatCurrency(formData.totalBudget / formData.guestCount, formData.currency || 'INR')
                    : '—'}
                </span>
              </div>
              {validationErrors.totalBudget && (
                <p className="text-xs text-[#c86d51] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors.totalBudget}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PERSONALIZATION & CONDITIONAL FIELDS */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#142d22]">3. Style, Experience & Customization</h2>

            {/* Style Preferences */}
            <div>
              <label htmlFor="style-preferences" className="block text-xs font-semibold text-[#2c261e] mb-1">
                Aesthetic & Style Preferences
              </label>
              <textarea
                id="style-preferences"
                rows={2}
                value={formData.stylePreferences || ''}
                onChange={(e) => updateField('stylePreferences', e.target.value)}
                placeholder="e.g. Earthy botanical greenery, warm brass lanterns, minimal rustic, acoustic jazz music"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
              />
            </div>

            {/* Dietary & Accessibility */}
            <div>
              <label htmlFor="dietary-needs" className="block text-xs font-semibold text-[#2c261e] mb-1">
                Dietary & Accessibility Requirements
              </label>
              <textarea
                id="dietary-needs"
                rows={2}
                value={formData.dietaryAccessibility || ''}
                onChange={(e) => updateField('dietaryAccessibility', e.target.value)}
                placeholder="e.g. Vegan and pure Jain culinary sections, wheelchair ramp to main stage, sensory quiet corner"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#dcd4c7] rounded-lg text-[#142d22] focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
              />
            </div>

            {/* Conditional Type Fields */}
            {formData.type === 'wedding' && (
              <div className="p-4 bg-[#f2eee6] rounded-xl border border-[#e1d9cc] space-y-3">
                <div className="text-xs font-bold text-[#1b4332] uppercase tracking-wide">
                  Wedding Specifics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2c261e] mb-1">
                      Ceremony Structure
                    </label>
                    <select
                      value={formData.specificDetails?.wedding?.ceremonyType || 'traditional'}
                      onChange={(e) =>
                        updateSpecificField('wedding', 'ceremonyType', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c7] rounded-md text-[#142d22]"
                    >
                      <option value="traditional">Traditional Rituals</option>
                      <option value="contemporary">Contemporary / Fusion</option>
                      <option value="interfaith">Interfaith Celebration</option>
                      <option value="civil">Civil Ceremony</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#2c261e] mb-1">
                      Dining Style
                    </label>
                    <select
                      value={formData.specificDetails?.wedding?.receptionStyle || 'buffet'}
                      onChange={(e) =>
                        updateSpecificField('wedding', 'receptionStyle', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c7] rounded-md text-[#142d22]"
                    >
                      <option value="buffet">Grand Buffet & Live Counters</option>
                      <option value="family_style">Family-Style Table Service</option>
                      <option value="plated_dinner">Multi-Course Plated Dinner</option>
                      <option value="cocktail_reception">Cocktail & Heavy Hors d'Oeuvres</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2c261e] mb-1">
                    Specific Rituals or Cultural Traditions
                  </label>
                  <input
                    type="text"
                    value={formData.specificDetails?.wedding?.traditions || ''}
                    onChange={(e) => updateSpecificField('wedding', 'traditions', e.target.value)}
                    placeholder="e.g. Sangeet choreography, sunset Pheras, Baraat horse procession"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c7] rounded-md text-[#142d22]"
                  />
                </div>
              </div>
            )}

            {formData.type === 'birthday' && (
              <div className="p-4 bg-[#f2eee6] rounded-xl border border-[#e1d9cc] space-y-3">
                <div className="text-xs font-bold text-[#1b4332] uppercase tracking-wide">
                  Birthday Specifics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2c261e] mb-1">
                      Age Bracket
                    </label>
                    <select
                      value={formData.specificDetails?.birthday?.ageGroup || 'adults'}
                      onChange={(e) => updateSpecificField('birthday', 'ageGroup', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c7] rounded-md text-[#142d22]"
                    >
                      <option value="kids">Kids (1-12)</option>
                      <option value="teens">Teens (13-19)</option>
                      <option value="adults">Adults (20-49)</option>
                      <option value="milestone">Milestone Jubilees (50+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#2c261e] mb-1">
                      Party Theme
                    </label>
                    <input
                      type="text"
                      value={formData.specificDetails?.birthday?.theme || ''}
                      onChange={(e) => updateSpecificField('birthday', 'theme', e.target.value)}
                      placeholder="e.g. Tuscan Vineyard Sunset, Retro 80s Arcade"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c7] rounded-md text-[#142d22]"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'community' && (
              <div className="p-4 bg-[#f2eee6] rounded-xl border border-[#e1d9cc] space-y-3">
                <div className="text-xs font-bold text-[#1b4332] uppercase tracking-wide">
                  Community Gathering Specifics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2c261e] mb-1">
                      Target Volunteers Needed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.specificDetails?.community?.volunteerCount || 10}
                      onChange={(e) =>
                        updateSpecificField('community', 'volunteerCount', Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c7] rounded-md text-[#142d22] font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-1.5 text-xs text-[#2c261e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.specificDetails?.community?.permitsNeeded ?? true}
                        onChange={(e) =>
                          updateSpecificField('community', 'permitsNeeded', e.target.checked)
                        }
                        className="rounded-sm text-[#1b4332] focus:ring-[#1b4332]"
                      />
                      <span>City Permits Required</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#142d22]">4. Review & Launch Plan</h2>

            {/* Summary Card */}
            <div className="bg-[#f2ece2] border border-[#dcd4c7] rounded-xl p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#e1d8cb] pb-2">
                <span className="font-bold text-[#142d22] text-sm">{formData.name}</span>
                <span className="capitalize font-medium text-[#1b4332]">{formData.type}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#4a4237]">
                <div>
                  <div className="text-[#8c8273]">Date</div>
                  <div className="font-semibold text-[#142d22]">{formData.date}</div>
                </div>
                <div>
                  <div className="text-[#8c8273]">Location</div>
                  <div className="font-semibold text-[#142d22] truncate">{formData.location}</div>
                </div>
                <div>
                  <div className="text-[#8c8273]">Guest Count</div>
                  <div className="font-semibold text-[#142d22]">{formData.guestCount} guests</div>
                </div>
                <div>
                  <div className="text-[#8c8273]">Budget</div>
                  <div className="font-semibold text-[#142d22] font-mono">
                    {formatCurrency(formData.totalBudget || 0, formData.currency || 'INR')}
                  </div>
                </div>
              </div>

              {formData.stylePreferences && (
                <div className="pt-2 border-t border-[#e1d8cb]">
                  <span className="text-[#8c8273]">Style notes: </span>
                  <span className="text-[#2c261e]">{formData.stylePreferences}</span>
                </div>
              )}
            </div>

            {generationError && (
              <div className="p-3 bg-[#fdf2e9] border border-[#f0c29d] rounded-lg text-xs text-[#9c4125] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generationError}</span>
              </div>
            )}

            {/* Choice to generate with Gemini or use standard template */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#2c261e]">
                Choose Planning Generation Engine:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => finalizeCreation(true)}
                  className="p-4 text-left rounded-xl border-2 border-[#1b4332] bg-[#f7f5f0] hover:bg-[#efece4] transition-all group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-[#1b4332] font-bold text-sm">
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#d97706]" />
                    )}
                    <span>Personalized Gemini Plan</span>
                  </div>
                  <p className="text-xs text-[#5c5344] leading-relaxed">
                    Calls Gemini 3.8 Flash to analyze your date, budget, and guest count. Generates
                    personalized budget trade-offs, custom vendor criteria, and risk contingencies.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => finalizeCreation(false)}
                  className="p-4 text-left rounded-xl border border-[#dcd4c7] bg-[#fbf9f5] hover:bg-[#f2ece2] transition-all group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-[#2c261e] font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
                    <span>Recommended Standard Baseline</span>
                  </div>
                  <p className="text-xs text-[#5c5344] leading-relaxed">
                    Instantly creates your event with industry-standard budget category allocations
                    and baseline milestone tasks. You can still prompt Gemini anytime later.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="border-t border-[#e7e1d7] pt-6 mt-8 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePrevStep}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#4a4237] bg-[#ede7dd] hover:bg-[#e0d8cc] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#1b4332] hover:bg-[#2d6a4f] rounded-lg transition-colors shadow-xs"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
};
