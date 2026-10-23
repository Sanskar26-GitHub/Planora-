import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';
import { PlanoraEventData, ExpenseItem, TaskItem, VendorItem, PlanProposal } from '../src/types';

describe('Storage Service & Persistence Operations', () => {
  beforeEach(() => {
    storage.resetAllData();
  });

  const mockEventData: PlanoraEventData = {
    event: {
      id: 'test-evt-1',
      name: 'Test Birthday Gala',
      type: 'birthday',
      date: '2026-11-15',
      location: 'Goa',
      currency: 'INR',
      guestCount: 80,
      totalBudget: 400000,
      stylePreferences: 'Tropical Sunset',
      dietaryAccessibility: 'Seafood and vegetarian',
      additionalNotes: '',
      specificDetails: {},
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    categories: [
      { id: 'cat-1', name: 'Venue', allocatedPercentage: 40, allocatedAmount: 160000, color: '#111' },
      { id: 'cat-2', name: 'Catering', allocatedPercentage: 60, allocatedAmount: 240000, color: '#222' },
    ],
    expenses: [],
    milestones: [],
    tasks: [],
    vendors: [],
    chatHistory: [],
  };

  it('saves and retrieves event records accurately', () => {
    storage.saveEvent(mockEventData);
    const active = storage.getActiveEvent();
    expect(active).not.toBeNull();
    expect(active?.event.id).toBe('test-evt-1');
    expect(active?.event.name).toBe('Test Birthday Gala');
  });

  it('supports adding, updating, and deleting expenses', () => {
    storage.saveEvent(mockEventData);

    const expense: ExpenseItem = {
      id: 'exp-test-1',
      categoryId: 'cat-1',
      title: 'Beach Lawn Reservation',
      plannedAmount: 100000,
      actualAmount: 95000,
      paidAmount: 50000,
      paymentStatus: 'partial',
      createdAt: new Date().toISOString(),
    };

    storage.addExpense('test-evt-1', expense);
    let event = storage.getActiveEvent();
    expect(event?.expenses.length).toBe(1);
    expect(event?.expenses[0].title).toBe('Beach Lawn Reservation');

    // Update
    storage.updateExpense('test-evt-1', {
      ...expense,
      paidAmount: 95000,
      paymentStatus: 'paid',
    });
    event = storage.getActiveEvent();
    expect(event?.expenses[0].paidAmount).toBe(95000);
    expect(event?.expenses[0].paymentStatus).toBe('paid');

    // Delete
    storage.deleteExpense('test-evt-1', 'exp-test-1');
    event = storage.getActiveEvent();
    expect(event?.expenses.length).toBe(0);
  });

  it('applies an AI plan proposal deterministically with user confirmation', () => {
    storage.saveEvent(mockEventData);

    const proposal: PlanProposal = {
      id: 'prop-test-1',
      summary: 'Add bad weather indoor venue contingency',
      reasoning: 'Prepares for seasonal Goa coastal rain showers.',
      type: 'add_tasks',
      status: 'pending',
      timestamp: new Date().toISOString(),
      changes: [
        {
          entity: 'task',
          action: 'create',
          description: 'Reserve weather-proof marquee canopy with venue lead',
          data: {
            title: 'Reserve weather-proof marquee canopy with venue lead',
            category: 'Venue',
            dueDate: '2026-11-05',
            priority: 'urgent',
          },
        },
      ],
    };

    storage.addChatMessage('test-evt-1', {
      id: 'msg-test-1',
      role: 'assistant',
      content: 'Here is a proposal for your review.',
      timestamp: new Date().toISOString(),
      proposal,
    });

    const applyResult = storage.applyProposal('test-evt-1', 'prop-test-1');
    expect(applyResult.success).toBe(true);

    const event = storage.getActiveEvent();
    // Task should now exist
    expect(event?.tasks.length).toBe(1);
    expect(event?.tasks[0].title).toBe('Reserve weather-proof marquee canopy with venue lead');
    expect(event?.tasks[0].priority).toBe('urgent');

    // Trying to apply the same proposal again must fail
    const reapply = storage.applyProposal('test-evt-1', 'prop-test-1');
    expect(reapply.success).toBe(false);
  });

  it('imports valid backup json and restores state', () => {
    const backupData = {
      version: 1,
      events: {
        'imported-evt': {
          ...mockEventData,
          event: { ...mockEventData.event, id: 'imported-evt', name: 'Restored Festival' },
        },
      },
    };

    const res = storage.importBackup(JSON.stringify(backupData));
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);

    const events = storage.getEvents();
    expect(events.some((e) => e.event.id === 'imported-evt')).toBe(true);
  });
});
