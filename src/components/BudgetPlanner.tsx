import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Sliders,
  Filter,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { BudgetCategory, ExpenseItem, PlanoraEventData, ExpensePaymentStatus } from '../types';
import { calculateBudgetSummary, formatCurrency, roundCurrency } from '../utils/calculations';
import { validateExpenseInput } from '../utils/validation';
import { storage } from '../services/storage';

interface BudgetPlannerProps {
  eventData: PlanoraEventData;
  onRefresh: () => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ eventData, onRefresh }) => {
  const { event, categories, expenses, vendors } = eventData;
  const budgetSummary = calculateBudgetSummary(event.totalBudget, categories, expenses);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // New Expense Form State
  const [expenseForm, setExpenseForm] = useState<Partial<ExpenseItem>>({
    title: '',
    categoryId: categories[0]?.id || '',
    plannedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    dueDate: '',
    notes: '',
  });
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});

  // Category Edit State
  const [editableCategories, setEditableCategories] = useState<BudgetCategory[]>(
    JSON.parse(JSON.stringify(categories))
  );

  const totalCategoryPercentage = editableCategories.reduce(
    (acc, c) => acc + (c.allocatedPercentage || 0),
    0
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddExpenseModal) setShowAddExpenseModal(false);
        if (showCategoryModal) setShowCategoryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddExpenseModal, showCategoryModal]);

  const handleOpenAddExpense = () => {
    setExpenseForm({
      title: '',
      categoryId: categories[0]?.id || '',
      plannedAmount: 0,
      actualAmount: 0,
      paidAmount: 0,
      paymentStatus: 'unpaid',
      dueDate: '',
      notes: '',
    });
    setExpenseErrors({});
    setShowAddExpenseModal(true);
  };

  const handleOpenEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseForm({ ...expense });
    setExpenseErrors({});
    setShowAddExpenseModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateExpenseInput(expenseForm);
    if (!validation.isValid) {
      setExpenseErrors(validation.errors);
      return;
    }

    const planned = Number(expenseForm.plannedAmount || 0);
    const actual = Number(expenseForm.actualAmount || 0);
    const paid = Number(expenseForm.paidAmount || 0);

    // Auto calculate status if not manually set
    let status: ExpensePaymentStatus = expenseForm.paymentStatus || 'unpaid';
    if (paid >= actual && actual > 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partial';
    }

    if (editingExpense) {
      const updated: ExpenseItem = {
        ...editingExpense,
        title: expenseForm.title!.trim(),
        categoryId: expenseForm.categoryId!,
        plannedAmount: planned,
        actualAmount: actual,
        paidAmount: paid,
        paymentStatus: status,
        vendorId: expenseForm.vendorId || undefined,
        dueDate: expenseForm.dueDate || undefined,
        notes: expenseForm.notes?.trim() || undefined,
      };
      storage.updateExpense(event.id, updated);
    } else {
      const created: ExpenseItem = {
        id: `exp-${Date.now()}`,
        title: expenseForm.title!.trim(),
        categoryId: expenseForm.categoryId!,
        plannedAmount: planned,
        actualAmount: actual,
        paidAmount: paid,
        paymentStatus: status,
        vendorId: expenseForm.vendorId || undefined,
        dueDate: expenseForm.dueDate || undefined,
        notes: expenseForm.notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      storage.addExpense(event.id, created);
    }

    setShowAddExpenseModal(false);
    setEditingExpense(null);
    onRefresh();
  };

  const handleDeleteExpense = (expenseId: string) => {
    storage.deleteExpense(event.id, expenseId);
    onRefresh();
  };

  const handleSaveCategories = () => {
    // Recalculate allocatedAmount deterministically based on percentage
    const updated = editableCategories.map((c) => ({
      ...c,
      allocatedAmount: Math.round((event.totalBudget * c.allocatedPercentage) / 100),
    }));
    storage.updateCategories(event.id, updated);
    setShowCategoryModal(false);
    onRefresh();
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((item) => {
    if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false;
    if (filterStatus !== 'all' && item.paymentStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e1d7] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#142d22]">
            Budget Planner & Expense Ledger
          </h1>
          <p className="text-xs text-[#716859]">
            Deterministic arithmetic for category allocations, quotes, and payment milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditableCategories(JSON.parse(JSON.stringify(categories)));
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#f2ece2] text-[#2c261e] border border-[#dcd4c7] hover:bg-[#eae3d7] rounded-md transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Allocations</span>
          </button>

          <button
            onClick={handleOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#1b4332] text-white hover:bg-[#2d6a4f] rounded-md transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Over-Budget Alert Banner */}
      {budgetSummary.isOverBudget && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-start gap-3 text-xs text-[#991b1b]">
          <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Budget Warning: Expenses Exceed Total Budget</div>
            <p>
              Your actual or planned spending exceeds the configured {formatCurrency(event.totalBudget, event.currency)} budget by{' '}
              <strong>{formatCurrency(budgetSummary.overBudgetAmount, event.currency)}</strong>. Consider using the AI Assistant to identify practical trade-offs.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Total Event Budget</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#142d22] truncate">
            {formatCurrency(budgetSummary.totalBudget, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1 font-mono">
            {formatCurrency(budgetSummary.totalAllocated, event.currency)} allocated
          </div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Actual Committed</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#142d22] truncate">
            {formatCurrency(budgetSummary.totalActual, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            {budgetSummary.utilizationPercentage}% of total budget
          </div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Remaining Balance</div>
          <div
            className={`text-xl font-bold font-mono tabular-nums truncate ${
              budgetSummary.remainingBudget < 0 ? 'text-[#c86d51]' : 'text-[#2d6a4f]'
            }`}
          >
            {formatCurrency(budgetSummary.remainingBudget, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            {budgetSummary.remainingBudget < 0 ? 'Over budget' : 'Available buffer'}
          </div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Payments Cleared</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#142d22] truncate">
            {formatCurrency(budgetSummary.totalPaid, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            {formatCurrency(Math.max(0, budgetSummary.totalActual - budgetSummary.totalPaid), event.currency)} pending
          </div>
        </div>
      </div>

      {/* Category Allocation Progress Grid */}
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#142d22]">Category Allocations vs Actual</h2>
          <span className="text-xs text-[#716859] font-mono">
            {categories.length} categories tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {budgetSummary.categoryBreakdown.map((item) => (
            <div
              key={item.category.id}
              className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                item.isOverCategoryBudget
                  ? 'border-[#fca5a5] bg-[#fff5f5]'
                  : 'border-[#e7e1d7] bg-[#f8f6f0]'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-[#142d22]">
                <span className="truncate">{item.category.name}</span>
                <span className="font-mono">{item.category.allocatedPercentage}%</span>
              </div>

              <div className="w-full h-1.5 bg-[#ede7dd] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.isOverCategoryBudget ? 'bg-[#c86d51]' : 'bg-[#1b4332]'
                  }`}
                  style={{ width: `${Math.min(100, item.utilization)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#716859] font-mono tabular-nums">
                <span>Spent: {formatCurrency(item.actual, event.currency)}</span>
                <span>Cap: {formatCurrency(item.category.allocatedAmount, event.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Ledger Section */}
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-2xs overflow-hidden">
        {/* Table Filters and Search */}
        <div className="p-4 border-b border-[#e7e1d7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8f6f0]">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#716859]" />
            <span className="text-xs font-bold text-[#142d22]">Expense Records</span>
            <span className="text-xs text-[#8c8273] font-mono">({filteredExpenses.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e] focus:ring-1 focus:ring-[#1b4332] outline-hidden"
            >
              <option value="all">All Payment Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>
        </div>

        {/* Expenses Data Table */}
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#716859]">
            No expenses found. Click <strong>Add Expense</strong> to record planned or actual vendor payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f2ece2] text-[#716859] border-b border-[#e7e1d7]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Expense Item</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Planned</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actual</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Paid</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Due Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae0]">
                {filteredExpenses.map((exp) => {
                  const cat = categories.find((c) => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-[#f6f3eb] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#142d22]">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-[#716859] truncate max-w-xs">{exp.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#4a4237]">
                        {cat?.name || 'General'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#5c5344]">
                        {formatCurrency(exp.plannedAmount, event.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#142d22]">
                        {formatCurrency(exp.actualAmount, event.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#2d6a4f]">
                        {formatCurrency(exp.paidAmount, event.currency)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm font-semibold uppercase text-[10px] ${
                            exp.paymentStatus === 'paid'
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : exp.paymentStatus === 'partial'
                              ? 'bg-[#fef3c7] text-[#92400e]'
                              : 'bg-[#f3f4f6] text-[#4b5563]'
                          }`}
                        >
                          {exp.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#716859]">
                        {exp.dueDate || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            title="Edit Expense"
                            aria-label={`Edit ${exp.title}`}
                            className="p-1.5 text-[#716859] hover:text-[#1b4332] hover:bg-[#ede7dd] rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="Delete Expense"
                            aria-label={`Delete ${exp.title}`}
                            className="p-1.5 text-[#716859] hover:text-[#c86d51] hover:bg-[#ede7dd] rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showAddExpenseModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4"
        >
          <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
              <h3 id="expense-modal-title" className="text-base font-bold text-[#142d22]">
                {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                aria-label="Close expense modal"
                className="text-xs text-[#716859] hover:text-[#142d22] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">
                  Expense Description <span className="text-[#c86d51]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.title || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Sangeet Stage Decor Deposit or Sound Tech Fee"
                  className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] focus:ring-1 focus:ring-[#1b4332] outline-hidden text-xs"
                />
                {expenseErrors.title && (
                  <p className="text-[#c86d51] mt-1">{expenseErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">
                    Category <span className="text-[#c86d51]">*</span>
                  </label>
                  <select
                    value={expenseForm.categoryId || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Link to Vendor</label>
                  <select
                    value={expenseForm.vendorId || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendorId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] text-xs"
                  >
                    <option value="">None / Direct</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Planned ({event.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={expenseForm.plannedAmount || 0}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, plannedAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Actual ({event.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={expenseForm.actualAmount || 0}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, actualAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Paid ({event.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={expenseForm.paidAmount || 0}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, paidAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Payment Status</label>
                  <select
                    value={expenseForm.paymentStatus || 'unpaid'}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        paymentStatus: e.target.value as ExpensePaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partially Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={expenseForm.dueDate || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="e.g. 50% advance cleared via bank transfer, receipt #892"
                  className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3 py-1.5 text-[#716859] hover:bg-[#ede7dd] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1b4332] text-white font-semibold rounded-md hover:bg-[#2d6a4f]"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY ALLOCATIONS */}
      {showCategoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-allocations-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4"
        >
          <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
              <div>
                <h3 id="category-allocations-title" className="text-base font-bold text-[#142d22]">
                  Edit Budget Allocations
                </h3>
                <p className="text-xs text-[#716859]">
                  Total Budget: {formatCurrency(event.totalBudget, event.currency)}
                </p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                aria-label="Close allocations modal"
                className="text-xs text-[#716859] hover:text-[#142d22] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {editableCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 p-2.5 bg-[#f8f6f0] rounded-lg border border-[#e7e1d7] text-xs"
                >
                  <div className="flex-1 font-semibold text-[#142d22]">{cat.name}</div>
                  <div className="w-20">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cat.allocatedPercentage}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value)));
                          const next = [...editableCategories];
                          next[idx].allocatedPercentage = val;
                          setEditableCategories(next);
                        }}
                        className="w-14 px-2 py-1 bg-white border border-[#dcd4c7] rounded text-right font-mono"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="w-28 text-right font-mono text-[#5c5344]">
                    {formatCurrency((event.totalBudget * cat.allocatedPercentage) / 100, event.currency)}
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                totalCategoryPercentage === 100
                  ? 'bg-[#dcfce7] text-[#166534]'
                  : 'bg-[#fef3c7] text-[#92400e]'
              }`}
            >
              <span>Allocated Sum:</span>
              <span className="font-mono font-bold">
                {totalCategoryPercentage}% {totalCategoryPercentage === 100 ? '✓ Balanced' : '(Target: 100%)'}
              </span>
            </div>

            <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-3 py-1.5 text-[#716859] hover:bg-[#ede7dd] rounded-md text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategories}
                className="px-4 py-1.5 bg-[#1b4332] text-white font-semibold rounded-md hover:bg-[#2d6a4f] text-xs"
              >
                Apply Allocations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
