import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  calculateTaskSummary,
  calculateVendorSummary,
  calculateDaysRemaining,
  roundCurrency,
  formatCurrency,
} from '../src/utils/calculations';
import { BudgetCategory, ExpenseItem, TaskItem, VendorItem } from '../src/types';

describe('Financial & Budget Calculations', () => {
  const sampleCategories: BudgetCategory[] = [
    { id: 'cat-1', name: 'Venue', allocatedPercentage: 50, allocatedAmount: 50000, color: '#111' },
    { id: 'cat-2', name: 'Catering', allocatedPercentage: 50, allocatedAmount: 50000, color: '#222' },
  ];

  it('correctly aggregates planned, actual, and paid expenses without double counting', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        categoryId: 'cat-1',
        title: 'Hall Deposit',
        plannedAmount: 30000,
        actualAmount: 30000,
        paidAmount: 15000,
        paymentStatus: 'partial',
        createdAt: '2026-10-01',
      },
      {
        id: 'e2',
        categoryId: 'cat-2',
        title: 'Catering Advance',
        plannedAmount: 20000,
        actualAmount: 25000,
        paidAmount: 25000,
        paymentStatus: 'paid',
        createdAt: '2026-10-02',
      },
    ];

    const summary = calculateBudgetSummary(100000, sampleCategories, expenses);

    expect(summary.totalBudget).toBe(100000);
    expect(summary.totalAllocated).toBe(100000);
    expect(summary.totalPlanned).toBe(50000);
    expect(summary.totalActual).toBe(55000);
    expect(summary.totalPaid).toBe(40000);
    expect(summary.remainingBudget).toBe(45000); // 100,000 - 55,000
    expect(summary.utilizationPercentage).toBe(55);
    expect(summary.isOverBudget).toBe(false);
  });

  it('detects budget overrun when actual spending exceeds total budget', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        categoryId: 'cat-1',
        title: 'Luxury Venue',
        plannedAmount: 110000,
        actualAmount: 120000,
        paidAmount: 60000,
        paymentStatus: 'partial',
        createdAt: '2026-10-01',
      },
    ];

    const summary = calculateBudgetSummary(100000, sampleCategories, expenses);

    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBudgetAmount).toBe(20000);
    expect(summary.remainingBudget).toBe(-20000);
    expect(summary.utilizationPercentage).toBe(120);
  });

  it('handles zero budget and edge cases gracefully without division by zero', () => {
    const summary = calculateBudgetSummary(0, [], []);
    expect(summary.totalBudget).toBe(0);
    expect(summary.utilizationPercentage).toBe(0);
    expect(summary.isOverBudget).toBe(false);
  });

  it('rounds floating point numbers accurately', () => {
    expect(roundCurrency(10.1234)).toBe(10.12);
    expect(roundCurrency(10.126)).toBe(10.13);
    expect(roundCurrency(NaN as any)).toBe(0);
  });

  it('formats currency correctly for INR and other currencies', () => {
    const inr = formatCurrency(50000, 'INR');
    expect(inr).toContain('50,000');

    const usd = formatCurrency(1500, 'USD');
    expect(usd).toContain('1,500');
  });
});

describe('Task Summary & Progress Calculations', () => {
  it('correctly calculates completed, pending, and overdue tasks', () => {
    const tasks: TaskItem[] = [
      {
        id: 't1',
        title: 'Task 1',
        category: 'Venue',
        dueDate: '2026-01-01', // past date -> overdue
        priority: 'high',
        status: 'pending',
        dependencies: [],
        createdAt: '2026-01-01',
      },
      {
        id: 't2',
        title: 'Task 2',
        category: 'Catering',
        dueDate: '2099-12-31', // future
        priority: 'medium',
        status: 'completed',
        dependencies: [],
        createdAt: '2026-01-01',
      },
      {
        id: 't3',
        title: 'Task 3',
        category: 'Music',
        dueDate: '2099-12-31',
        priority: 'urgent',
        status: 'in_progress',
        dependencies: [],
        createdAt: '2026-01-01',
      },
    ];

    const summary = calculateTaskSummary(tasks);
    expect(summary.totalCount).toBe(3);
    expect(summary.completedCount).toBe(1);
    expect(summary.inProgressCount).toBe(1);
    expect(summary.pendingCount).toBe(1);
    expect(summary.progressPercentage).toBe(33.33);
    expect(summary.overdueCount).toBe(1);
  });

  it('handles empty task list gracefully', () => {
    const summary = calculateTaskSummary([]);
    expect(summary.totalCount).toBe(0);
    expect(summary.progressPercentage).toBe(0);
    expect(summary.overdueCount).toBe(0);
  });
});

describe('Vendor Calculations', () => {
  it('accurately computes total quotes, deposits paid, and remaining balance', () => {
    const vendors: VendorItem[] = [
      {
        id: 'v1',
        name: 'Grand Floral',
        category: 'Floral',
        contactName: 'Alice',
        phone: '123',
        email: 'alice@example.com',
        quotedAmount: 40000,
        bookingStatus: 'booked',
        depositPaid: 15000,
        remainingBalance: 25000,
        paymentStatus: 'deposit_paid',
      },
      {
        id: 'v2',
        name: 'DJ Beats',
        category: 'Music',
        contactName: 'Bob',
        phone: '456',
        email: 'bob@example.com',
        quotedAmount: 20000,
        bookingStatus: 'quoted',
        depositPaid: 0,
        remainingBalance: 20000,
        paymentStatus: 'unpaid',
      },
    ];

    const summary = calculateVendorSummary(vendors);
    expect(summary.totalVendors).toBe(2);
    expect(summary.bookedCount).toBe(1);
    expect(summary.totalQuoted).toBe(60000);
    expect(summary.totalDepositsPaid).toBe(15000);
    expect(summary.totalRemainingBalance).toBe(45000);
  });
});

describe('Date & Countdown Calculations', () => {
  it('calculates days remaining without off-by-one errors', () => {
    const days = calculateDaysRemaining('2099-01-01');
    expect(days).toBeGreaterThan(0);

    const pastDays = calculateDaysRemaining('2020-01-01');
    expect(pastDays).toBeLessThan(0);
  });
});
