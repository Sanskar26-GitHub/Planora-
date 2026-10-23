import { describe, it, expect } from 'vitest';
import {
  validateEventInput,
  validateExpenseInput,
  validateTaskInput,
  validateVendorInput,
  validateImportPayload,
} from '../src/utils/validation';

describe('Validation Utilities', () => {
  describe('validateEventInput', () => {
    it('accepts valid wedding event inputs', () => {
      const res = validateEventInput({
        name: 'Sara & Neil Wedding',
        type: 'wedding',
        date: '2026-12-15',
        location: 'Jaipur',
        guestCount: 200,
        totalBudget: 2000000,
        currency: 'INR',
      });
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('rejects missing or empty name', () => {
      const res = validateEventInput({
        name: '   ',
        type: 'wedding',
        date: '2026-12-15',
        location: 'Jaipur',
        guestCount: 200,
        totalBudget: 2000000,
        currency: 'INR',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBeDefined();
    });

    it('rejects negative guest count or budget', () => {
      const res = validateEventInput({
        name: 'Birthday Party',
        type: 'birthday',
        date: '2026-12-15',
        location: 'Delhi',
        guestCount: -5,
        totalBudget: -50000,
        currency: 'INR',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.guestCount).toBeDefined();
      expect(res.errors.totalBudget).toBeDefined();
    });

    it('rejects end date earlier than start date', () => {
      const res = validateEventInput({
        name: 'Community Fest',
        type: 'community',
        date: '2026-11-20',
        endDate: '2026-11-18', // Earlier!
        location: 'Bengaluru',
        guestCount: 500,
        totalBudget: 100000,
        currency: 'INR',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.endDate).toBeDefined();
    });
  });

  describe('validateExpenseInput', () => {
    it('rejects negative amounts', () => {
      const res = validateExpenseInput({
        title: 'Flowers',
        categoryId: 'cat-1',
        plannedAmount: -100,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.plannedAmount).toBeDefined();
    });

    it('requires a category and title', () => {
      const res = validateExpenseInput({
        title: '',
        categoryId: '',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.title).toBeDefined();
      expect(res.errors.categoryId).toBeDefined();
    });
  });

  describe('validateVendorInput', () => {
    it('validates email format properly', () => {
      const invalid = validateVendorInput({
        name: 'Audio Pros',
        category: 'Sound',
        email: 'invalid-email-string',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.email).toBeDefined();

      const valid = validateVendorInput({
        name: 'Audio Pros',
        category: 'Sound',
        email: 'support@audiopros.example',
      });
      expect(valid.isValid).toBe(true);
    });
  });

  describe('validateImportPayload', () => {
    it('accepts well-formed backup payload', () => {
      const payload = {
        version: 1,
        events: {
          'evt-1': {
            event: { id: 'evt-1', name: 'Valid Event' },
            categories: [],
            expenses: [],
            tasks: [],
            vendors: [],
          },
        },
      };
      const res = validateImportPayload(payload);
      expect(res.isValid).toBe(true);
    });

    it('rejects malformed or corrupted objects', () => {
      expect(validateImportPayload(null).isValid).toBe(false);
      expect(validateImportPayload('string').isValid).toBe(false);
      expect(validateImportPayload({}).isValid).toBe(false);
      expect(
        validateImportPayload({
          events: {
            'evt-corrupted': {
              event: null,
            },
          },
        }).isValid
      ).toBe(false);
    });
  });
});
