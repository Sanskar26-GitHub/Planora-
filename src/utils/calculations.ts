import {
  BudgetCategory,
  ExpenseItem,
  BudgetSummary,
  TaskItem,
  TaskProgressSummary,
  VendorItem,
  VendorSummary,
} from '../types';

/**
 * Rounds a number strictly to two decimal places to prevent floating point inaccuracies.
 */
export function roundCurrency(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a monetary amount given a currency code.
 * Defaults to INR (₹) with Indian numbering format, or international format for other currencies.
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const rounded = roundCurrency(amount);
  try {
    const locale = currency.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${currency} ${rounded.toLocaleString()}`;
  }
}

/**
 * Deterministically computes comprehensive budget metrics.
 * Ensures planned, actual, and paid expenses are aggregated correctly without double counting.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  categories: BudgetCategory[],
  expenses: ExpenseItem[]
): BudgetSummary {
  const safeTotalBudget = Math.max(0, roundCurrency(totalBudget));

  // Compute total allocated across categories
  const totalAllocated = roundCurrency(
    categories.reduce((acc, cat) => acc + (cat.allocatedAmount || 0), 0)
  );

  let totalPlanned = 0;
  let totalActual = 0;
  let totalPaid = 0;

  // Map category metrics
  const categoryMap = new Map<
    string,
    { planned: number; actual: number; paid: number }
  >();

  for (const cat of categories) {
    categoryMap.set(cat.id, { planned: 0, actual: 0, paid: 0 });
  }

  for (const exp of expenses) {
    const planned = Math.max(0, roundCurrency(exp.plannedAmount || 0));
    const actual = Math.max(0, roundCurrency(exp.actualAmount || 0));
    const paid = Math.max(0, roundCurrency(exp.paidAmount || 0));

    totalPlanned += planned;
    totalActual += actual;
    totalPaid += paid;

    const current = categoryMap.get(exp.categoryId) || { planned: 0, actual: 0, paid: 0 };
    current.planned += planned;
    current.actual += actual;
    current.paid += paid;
    categoryMap.set(exp.categoryId, current);
  }

  totalPlanned = roundCurrency(totalPlanned);
  totalActual = roundCurrency(totalActual);
  totalPaid = roundCurrency(totalPaid);

  const remainingBudget = roundCurrency(safeTotalBudget - totalActual);
  const utilizationPercentage =
    safeTotalBudget > 0 ? roundCurrency((totalActual / safeTotalBudget) * 100) : 0;
  const isOverBudget = totalActual > safeTotalBudget || totalPlanned > safeTotalBudget;
  const overBudgetAmount = isOverBudget
    ? roundCurrency(Math.max(totalActual, totalPlanned) - safeTotalBudget)
    : 0;
  const unallocatedBudget = roundCurrency(Math.max(0, safeTotalBudget - totalAllocated));

  const categoryBreakdown = categories.map((cat) => {
    const stats = categoryMap.get(cat.id) || { planned: 0, actual: 0, paid: 0 };
    const p = roundCurrency(stats.planned);
    const a = roundCurrency(stats.actual);
    const pd = roundCurrency(stats.paid);
    const allocated = roundCurrency(cat.allocatedAmount || 0);
    const variance = roundCurrency(allocated - a);
    const utilization = allocated > 0 ? roundCurrency((a / allocated) * 100) : 0;
    const isOverCategoryBudget = a > allocated || (allocated > 0 && p > allocated);

    return {
      category: cat,
      planned: p,
      actual: a,
      paid: pd,
      variance,
      utilization,
      isOverCategoryBudget,
    };
  });

  return {
    totalBudget: safeTotalBudget,
    totalAllocated,
    totalPlanned,
    totalActual,
    totalPaid,
    remainingBudget,
    utilizationPercentage,
    isOverBudget,
    overBudgetAmount,
    unallocatedBudget,
    categoryBreakdown,
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time to avoid UTC day shift errors.
 */
export function getLocalTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates countdown in days between today and the target date in local time.
 */
export function calculateDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(tYear, tMonth - 1, tDay);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes task progress, overdue status, and upcoming deadlines.
 */
export function calculateTaskSummary(tasks: TaskItem[]): TaskProgressSummary {
  const totalCount = tasks.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      completedCount: 0,
      inProgressCount: 0,
      pendingCount: 0,
      progressPercentage: 0,
      overdueCount: 0,
      upcomingCount: 0,
    };
  }

  const todayStr = getLocalTodayString();
  const now = new Date();
  const sevenDaysLater = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const sevenDaysStr = `${sevenDaysLater.getFullYear()}-${String(
    sevenDaysLater.getMonth() + 1
  ).padStart(2, '0')}-${String(sevenDaysLater.getDate()).padStart(2, '0')}`;

  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  for (const t of tasks) {
    if (t.status === 'completed') {
      completedCount++;
    } else {
      if (t.status === 'in_progress') {
        inProgressCount++;
      } else {
        pendingCount++;
      }

      if (t.dueDate) {
        if (t.dueDate < todayStr) {
          overdueCount++;
        } else if (t.dueDate <= sevenDaysStr) {
          upcomingCount++;
        }
      }
    }
  }

  const progressPercentage = roundCurrency((completedCount / totalCount) * 100);

  return {
    totalCount,
    completedCount,
    inProgressCount,
    pendingCount,
    progressPercentage,
    overdueCount,
    upcomingCount,
  };
}

/**
 * Computes vendor financial summaries (total quoted, total booked, deposit paid, remaining balances).
 */
export function calculateVendorSummary(vendors: VendorItem[]): VendorSummary {
  let bookedCount = 0;
  let totalQuoted = 0;
  let totalDepositsPaid = 0;
  let totalRemainingBalance = 0;

  for (const v of vendors) {
    if (v.bookingStatus === 'booked') {
      bookedCount++;
    }
    const quoted = Math.max(0, roundCurrency(v.quotedAmount || 0));
    const deposit = Math.max(0, roundCurrency(v.depositPaid || 0));
    const balance = Math.max(0, roundCurrency(v.remainingBalance || Math.max(0, quoted - deposit)));

    totalQuoted += quoted;
    totalDepositsPaid += deposit;
    totalRemainingBalance += balance;
  }

  return {
    totalVendors: vendors.length,
    bookedCount,
    totalQuoted: roundCurrency(totalQuoted),
    totalDepositsPaid: roundCurrency(totalDepositsPaid),
    totalRemainingBalance: roundCurrency(totalRemainingBalance),
  };
}
