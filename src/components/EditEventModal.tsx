import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { EventDetails } from '../types';
import { validateEventInput } from '../utils/validation';
import { getLocalTodayString } from '../utils/calculations';

interface EditEventModalProps {
  isOpen: boolean;
  event: EventDetails | null;
  onClose: () => void;
  onSave: (updated: EventDetails) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<EventDetails>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({ ...event });
      setErrors({});
    }
  }, [event]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEventInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const updated: EventDetails = {
      ...event,
      name: formData.name!.trim(),
      date: formData.date!,
      endDate: formData.endDate || undefined,
      location: formData.location!.trim(),
      guestCount: Number(formData.guestCount),
      totalBudget: Number(formData.totalBudget),
      currency: formData.currency || event.currency,
      stylePreferences: formData.stylePreferences?.trim() || '',
      dietaryAccessibility: formData.dietaryAccessibility?.trim() || '',
      additionalNotes: formData.additionalNotes?.trim() || '',
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
          <div>
            <h2 id="edit-event-title" className="text-base font-bold text-[#142d22]">
              Edit Event Details
            </h2>
            <p className="text-xs text-[#716859]">Update parameters for {event.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close edit event dialog"
            className="p-1 text-[#716859] hover:text-[#142d22] rounded-md hover:bg-[#ede7dd] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="edit-event-name" className="block font-semibold text-[#2c261e] mb-1">
              Event Name <span className="text-[#c86d51]">*</span>
            </label>
            <input
              id="edit-event-name"
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] focus:ring-1 focus:ring-[#1b4332] outline-hidden text-xs"
            />
            {errors.name && (
              <p className="text-[#c86d51] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-event-date" className="block font-semibold text-[#2c261e] mb-1">
                Start Date <span className="text-[#c86d51]">*</span>
              </label>
              <input
                id="edit-event-date"
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  if (errors.date) setErrors({ ...errors, date: '' });
                }}
                className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
              />
              {errors.date && <p className="text-[#c86d51] mt-1">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="edit-event-end-date" className="block font-semibold text-[#2c261e] mb-1">
                End Date (Optional)
              </label>
              <input
                id="edit-event-end-date"
                type="date"
                min={formData.date || getLocalTodayString()}
                value={formData.endDate || ''}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  if (errors.endDate) setErrors({ ...errors, endDate: '' });
                }}
                className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
              />
              {errors.endDate && <p className="text-[#c86d51] mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="edit-event-location" className="block font-semibold text-[#2c261e] mb-1">
              Location / City <span className="text-[#c86d51]">*</span>
            </label>
            <input
              id="edit-event-location"
              type="text"
              required
              value={formData.location || ''}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                if (errors.location) setErrors({ ...errors, location: '' });
              }}
              className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] focus:ring-1 focus:ring-[#1b4332] outline-hidden text-xs"
            />
            {errors.location && <p className="text-[#c86d51] mt-1">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-event-guests" className="block font-semibold text-[#2c261e] mb-1">
                Guest Count <span className="text-[#c86d51]">*</span>
              </label>
              <input
                id="edit-event-guests"
                type="number"
                min="1"
                required
                value={formData.guestCount || ''}
                onChange={(e) => {
                  setFormData({ ...formData, guestCount: Number(e.target.value) });
                  if (errors.guestCount) setErrors({ ...errors, guestCount: '' });
                }}
                className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
              />
              {errors.guestCount && <p className="text-[#c86d51] mt-1">{errors.guestCount}</p>}
            </div>

            <div>
              <label htmlFor="edit-event-budget" className="block font-semibold text-[#2c261e] mb-1">
                Total Budget ({formData.currency || event.currency}) <span className="text-[#c86d51]">*</span>
              </label>
              <input
                id="edit-event-budget"
                type="number"
                min="1"
                step="1000"
                required
                value={formData.totalBudget || ''}
                onChange={(e) => {
                  setFormData({ ...formData, totalBudget: Number(e.target.value) });
                  if (errors.totalBudget) setErrors({ ...errors, totalBudget: '' });
                }}
                className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
              />
              {errors.totalBudget && <p className="text-[#c86d51] mt-1">{errors.totalBudget}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="edit-event-style" className="block font-semibold text-[#2c261e] mb-1">
              Style & Experience Preferences
            </label>
            <textarea
              id="edit-event-style"
              rows={2}
              value={formData.stylePreferences || ''}
              onChange={(e) => setFormData({ ...formData, stylePreferences: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
            />
          </div>

          <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[#716859] hover:bg-[#ede7dd] rounded-md text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#1b4332] text-white font-semibold rounded-md hover:bg-[#2d6a4f] text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
