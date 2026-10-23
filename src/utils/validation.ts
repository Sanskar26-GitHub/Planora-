import { EventDetails, ExpenseItem, TaskItem, VendorItem, PlanoraEventData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates event creation and update payloads.
 */
export function validateEventInput(input: Partial<EventDetails>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Event name is required.';
  } else if (input.name.trim().length > 100) {
    errors.name = 'Event name cannot exceed 100 characters.';
  }

  if (!input.type || !['wedding', 'birthday', 'community'].includes(input.type)) {
    errors.type = 'Please select a valid event type.';
  }

  if (!input.date) {
    errors.date = 'Event date is required.';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.date) || isNaN(Date.parse(input.date))) {
      errors.date = 'Invalid date format (must be YYYY-MM-DD).';
    }
  }

  if (input.endDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.endDate) || isNaN(Date.parse(input.endDate))) {
      errors.endDate = 'Invalid end date format (must be YYYY-MM-DD).';
    } else if (input.date && input.endDate < input.date) {
      errors.endDate = 'End date cannot be earlier than the event start date.';
    }
  }

  if (!input.location || input.location.trim().length === 0) {
    errors.location = 'Location or city is required.';
  }

  if (input.guestCount === undefined || input.guestCount === null) {
    errors.guestCount = 'Guest count is required.';
  } else if (!Number.isInteger(Number(input.guestCount)) || Number(input.guestCount) <= 0) {
    errors.guestCount = 'Guest count must be a positive whole number.';
  } else if (Number(input.guestCount) > 100000) {
    errors.guestCount = 'Guest count cannot exceed 100,000.';
  }

  if (input.totalBudget === undefined || input.totalBudget === null) {
    errors.totalBudget = 'Total budget is required.';
  } else if (isNaN(Number(input.totalBudget)) || Number(input.totalBudget) <= 0) {
    errors.totalBudget = 'Total budget must be a positive number greater than 0.';
  }

  if (!input.currency || input.currency.trim().length === 0) {
    errors.currency = 'Currency is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates expense item payload.
 */
export function validateExpenseInput(input: Partial<ExpenseItem>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length === 0) {
    errors.title = 'Expense title is required.';
  }

  if (!input.categoryId) {
    errors.categoryId = 'Category is required.';
  }

  if (input.plannedAmount !== undefined && (isNaN(Number(input.plannedAmount)) || Number(input.plannedAmount) < 0)) {
    errors.plannedAmount = 'Planned amount cannot be negative.';
  }

  if (input.actualAmount !== undefined && (isNaN(Number(input.actualAmount)) || Number(input.actualAmount) < 0)) {
    errors.actualAmount = 'Actual amount cannot be negative.';
  }

  if (input.paidAmount !== undefined && (isNaN(Number(input.paidAmount)) || Number(input.paidAmount) < 0)) {
    errors.paidAmount = 'Paid amount cannot be negative.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates task item payload.
 */
export function validateTaskInput(input: Partial<TaskItem>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length === 0) {
    errors.title = 'Task title is required.';
  }

  if (!input.dueDate) {
    errors.dueDate = 'Due date is required.';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.dueDate) || isNaN(Date.parse(input.dueDate))) {
      errors.dueDate = 'Invalid date format (must be YYYY-MM-DD).';
    }
  }

  if (input.priority && !['urgent', 'high', 'medium', 'low'].includes(input.priority)) {
    errors.priority = 'Invalid priority level.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates vendor item payload.
 */
export function validateVendorInput(input: Partial<VendorItem>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Vendor name is required.';
  }

  if (!input.category || input.category.trim().length === 0) {
    errors.category = 'Vendor category is required.';
  }

  if (input.quotedAmount !== undefined && (isNaN(Number(input.quotedAmount)) || Number(input.quotedAmount) < 0)) {
    errors.quotedAmount = 'Quoted amount cannot be negative.';
  }

  if (input.depositPaid !== undefined && (isNaN(Number(input.depositPaid)) || Number(input.depositPaid) < 0)) {
    errors.depositPaid = 'Deposit paid cannot be negative.';
  }

  if (input.email && input.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates full imported JSON backup payload for data integrity.
 */
export function validateImportPayload(payload: any): { isValid: boolean; message: string; data?: Record<string, PlanoraEventData> } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, message: 'Invalid file format: JSON root must be an object.' };
  }

  if (!payload.events || typeof payload.events !== 'object') {
    return { isValid: false, message: 'Missing "events" collection in backup file.' };
  }

  const events = payload.events as Record<string, PlanoraEventData>;
  for (const [id, eventData] of Object.entries(events)) {
    if (!eventData || !eventData.event || !eventData.event.id || !eventData.event.name) {
      return { isValid: false, message: `Corrupted event structure for record ID: ${id}` };
    }
    if (!Array.isArray(eventData.categories)) {
      return { isValid: false, message: `Event "${eventData.event.name}" is missing categories list.` };
    }
    if (!Array.isArray(eventData.expenses)) {
      return { isValid: false, message: `Event "${eventData.event.name}" is missing expenses list.` };
    }
    if (!Array.isArray(eventData.tasks)) {
      return { isValid: false, message: `Event "${eventData.event.name}" is missing tasks list.` };
    }
    if (!Array.isArray(eventData.vendors)) {
      return { isValid: false, message: `Event "${eventData.event.name}" is missing vendors list.` };
    }
  }

  return { isValid: true, message: 'Backup payload is valid.', data: events };
}
