import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';
import { PlanoraEventData, ExpenseItem, TaskItem, VendorItem, PlanProposal } from '../src/types';

describe('Storage Service & Persistence Operations', () => {
  const getMockEventData = (): PlanoraEventData => ({
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
  });

  let mockEventData: PlanoraEventData;

  beforeEach(() => {
    storage.resetAllData();
    mockEventData = getMockEventData();
  });

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

  it('rejects malformed backup JSON without modifying existing events', () => {
    storage.saveEvent(mockEventData);
    const beforeEvents = storage.getEvents();
    expect(beforeEvents.length).toBe(1);

    // Corrupt JSON string
    const resBadJson = storage.importBackup('{ bad json ');
    expect(resBadJson.success).toBe(false);

    // Malformed schema structure
    const resBadSchema = storage.importBackup(JSON.stringify({ version: 'bad', events: 'not-an-object' }));
    expect(resBadSchema.success).toBe(false);

    // Existing event must remain untouched and intact
    const afterEvents = storage.getEvents();
    expect(afterEvents.length).toBe(1);
    expect(afterEvents[0].event.id).toBe('test-evt-1');
  });

  it('preserves multi-event data isolation across events', () => {
    const secondEventData: PlanoraEventData = {
      ...mockEventData,
      event: {
        ...mockEventData.event,
        id: 'test-evt-2',
        name: 'Neighborhood Spring Carnival',
        type: 'community',
        totalBudget: 150000,
      },
      categories: [{ id: 'cat-2-1', name: 'Permits', allocatedPercentage: 100, allocatedAmount: 150000, color: '#333' }],
      tasks: [],
      vendors: [],
      expenses: [],
      milestones: [],
      chatHistory: [],
    };

    storage.saveEvent(mockEventData);
    storage.saveEvent(secondEventData);

    const all = storage.getEvents();
    expect(all.length).toBe(2);

    // Add task only to event 1
    const task1: TaskItem = {
      id: 'task-evt-1',
      title: 'Order tropical cake',
      category: 'Catering',
      dueDate: '2026-11-10',
      priority: 'high',
      status: 'pending',
      dependencies: [],
      createdAt: '2026-10-01',
    };
    storage.addTask('test-evt-1', task1);

    // Verify task exists only in event 1, not event 2
    storage.setActiveEvent('test-evt-1');
    expect(storage.getActiveEvent()?.tasks.length).toBe(1);

    storage.setActiveEvent('test-evt-2');
    expect(storage.getActiveEvent()?.tasks.length).toBe(0);
  });

  it('updates event core details correctly', () => {
    storage.saveEvent(mockEventData);

    storage.updateEventDetails('test-evt-1', {
      name: 'Updated Sunset Gala',
      guestCount: 120,
      totalBudget: 550000,
      location: 'South Goa Beachfront',
    });

    const active = storage.getActiveEvent();
    expect(active?.event.name).toBe('Updated Sunset Gala');
    expect(active?.event.guestCount).toBe(120);
    expect(active?.event.totalBudget).toBe(550000);
    expect(active?.event.location).toBe('South Goa Beachfront');
  });

  it('manages vendor lifecycle, updates, and deletion', () => {
    storage.saveEvent(mockEventData);

    const vendor: VendorItem = {
      id: 'ven-1',
      name: 'Coastal Beats DJ',
      category: 'Entertainment',
      contactName: 'DJ Rahul',
      phone: '+91 99999 11111',
      email: 'rahul@coastalbeats.example',
      quotedAmount: 45000,
      bookingStatus: 'quoted',
      depositPaid: 15000,
      remainingBalance: 30000,
      paymentStatus: 'deposit_paid',
    };

    storage.addVendor('test-evt-1', vendor);
    let active = storage.getActiveEvent();
    expect(active?.vendors.length).toBe(1);
    expect(active?.vendors[0].name).toBe('Coastal Beats DJ');

    // Update status to booked with full payment
    storage.updateVendor('test-evt-1', {
      ...vendor,
      bookingStatus: 'booked',
      depositPaid: 45000,
      remainingBalance: 0,
      paymentStatus: 'fully_paid',
    });

    active = storage.getActiveEvent();
    expect(active?.vendors[0].bookingStatus).toBe('booked');
    expect(active?.vendors[0].paymentStatus).toBe('fully_paid');

    // Delete vendor
    storage.deleteVendor('test-evt-1', 'ven-1');
    active = storage.getActiveEvent();
    expect(active?.vendors.length).toBe(0);
  });

  it('supports dismissing AI plan proposals', () => {
    storage.saveEvent(mockEventData);

    const proposal: PlanProposal = {
      id: 'prop-dismiss-1',
      summary: 'Hire 3 additional security personnel',
      reasoning: 'Recommended for crowd control at beach access points.',
      type: 'add_tasks',
      status: 'pending',
      timestamp: new Date().toISOString(),
      changes: [
        {
          entity: 'task',
          action: 'create',
          description: 'Contract beach security guards',
          data: { title: 'Contract beach security guards', category: 'Venue' },
        },
      ],
    };

    storage.addChatMessage('test-evt-1', {
      id: 'msg-dismiss-1',
      role: 'assistant',
      content: 'Here is a security proposal.',
      timestamp: new Date().toISOString(),
      proposal,
    });

    // Dismiss
    storage.dismissProposal('test-evt-1', 'prop-dismiss-1');

    const active = storage.getActiveEvent();
    const chatMsg = active?.chatHistory.find((m) => m.proposal?.id === 'prop-dismiss-1');
    expect(chatMsg?.proposal?.status).toBe('dismissed');

    // Attempting to apply a dismissed proposal must fail
    const applyRes = storage.applyProposal('test-evt-1', 'prop-dismiss-1');
    expect(applyRes.success).toBe(false);
  });
});
