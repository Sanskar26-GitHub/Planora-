import {
  AppState,
  PlanoraEventData,
  EventDetails,
  ExpenseItem,
  TaskItem,
  VendorItem,
  BudgetCategory,
  ChatMessage,
  PlanProposal,
  AiPlanRecommendation,
} from '../types';
import { SAMPLE_EVENT_DATA } from '../constants/initialData';
import { validateImportPayload } from '../utils/validation';

const STORAGE_KEY = 'planora_event_planner_state_v1';
const CURRENT_VERSION = 1;

/**
 * Storage service providing robust isolated persistence, schema migration, and backup export/import.
 */
class StorageService {
  private memoryCache: AppState | null = null;

  private getDefaultState(): AppState {
    return {
      events: {
        [SAMPLE_EVENT_DATA.event.id]: JSON.parse(JSON.stringify(SAMPLE_EVENT_DATA)),
      },
      activeEventId: SAMPLE_EVENT_DATA.event.id,
      version: CURRENT_VERSION,
    };
  }

  public loadState(): AppState {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.memoryCache = this.getDefaultState();
        return this.memoryCache;
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // First-time visit: initialize with sample event
        const initialState = this.getDefaultState();
        this.saveState(initialState);
        this.memoryCache = initialState;
        return initialState;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.events) {
        this.memoryCache = parsed as AppState;
        return this.memoryCache;
      } else {
        console.warn('Storage structure invalid, reinitializing default state.');
        const fallback = this.getDefaultState();
        this.saveState(fallback);
        this.memoryCache = fallback;
        return fallback;
      }
    } catch (err) {
      console.error('Failed to load local storage state:', err);
      const fallback = this.getDefaultState();
      this.memoryCache = fallback;
      return fallback;
    }
  }

  public saveState(state: AppState): boolean {
    this.memoryCache = state;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      }
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
    return false;
  }

  public getEvents(): PlanoraEventData[] {
    const state = this.loadState();
    return Object.values(state.events);
  }

  public getActiveEvent(): PlanoraEventData | null {
    const state = this.loadState();
    if (!state.activeEventId) {
      const all = Object.values(state.events);
      return all.length > 0 ? all[0] : null;
    }
    return state.events[state.activeEventId] || null;
  }

  public setActiveEvent(eventId: string): void {
    const state = this.loadState();
    if (state.events[eventId]) {
      state.activeEventId = eventId;
      this.saveState(state);
    }
  }

  public saveEvent(eventData: PlanoraEventData): void {
    const state = this.loadState();
    const cloned = JSON.parse(JSON.stringify(eventData));
    cloned.event.updatedAt = new Date().toISOString();
    state.events[cloned.event.id] = cloned;
    if (!state.activeEventId) {
      state.activeEventId = cloned.event.id;
    }
    this.saveState(state);
  }

  public deleteEvent(eventId: string): void {
    const state = this.loadState();
    delete state.events[eventId];
    if (state.activeEventId === eventId) {
      const remaining = Object.keys(state.events);
      state.activeEventId = remaining.length > 0 ? remaining[0] : null;
    }
    this.saveState(state);
  }

  public loadSampleEvent(): void {
    const state = this.loadState();
    const sample = JSON.parse(JSON.stringify(SAMPLE_EVENT_DATA));
    // Assign a fresh ID if already exists to allow multiple or reset
    sample.event.id = `sample-${Date.now()}`;
    sample.event.createdAt = new Date().toISOString();
    sample.event.updatedAt = new Date().toISOString();
    state.events[sample.event.id] = sample;
    state.activeEventId = sample.event.id;
    this.saveState(state);
  }

  public resetAllData(): void {
    const state: AppState = {
      events: {},
      activeEventId: null,
      version: CURRENT_VERSION,
    };
    this.saveState(state);
  }

  public exportBackup(): void {
    const state = this.loadState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `planora_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public importBackup(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = validateImportPayload(parsed);
      if (!validation.isValid || !validation.data) {
        return { success: false, message: validation.message };
      }

      const state = this.loadState();
      let importedCount = 0;
      for (const [id, eventData] of Object.entries(validation.data)) {
        state.events[id] = eventData;
        importedCount++;
      }

      if (!state.activeEventId && importedCount > 0) {
        state.activeEventId = Object.keys(state.events)[0];
      }

      this.saveState(state);
      return {
        success: true,
        message: `Successfully imported ${importedCount} event plan(s).`,
        count: importedCount,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Failed to parse backup JSON: ${err instanceof Error ? err.message : 'Invalid syntax'}`,
      };
    }
  }

  // --- Granular Event Mutators ---

  public updateEventDetails(eventId: string, details: Partial<EventDetails>): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.event = { ...eventData.event, ...details, updatedAt: new Date().toISOString() };
    this.saveState(state);
  }

  public updateCategories(eventId: string, categories: BudgetCategory[]): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.categories = categories;
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public addExpense(eventId: string, expense: ExpenseItem): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.expenses.unshift(expense);
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public updateExpense(eventId: string, expense: ExpenseItem): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    const idx = eventData.expenses.findIndex((e) => e.id === expense.id);
    if (idx !== -1) {
      eventData.expenses[idx] = expense;
      eventData.event.updatedAt = new Date().toISOString();
      this.saveState(state);
    }
  }

  public deleteExpense(eventId: string, expenseId: string): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.expenses = eventData.expenses.filter((e) => e.id !== expenseId);
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public addTask(eventId: string, task: TaskItem): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.tasks.unshift(task);
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public updateTask(eventId: string, task: TaskItem): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    const idx = eventData.tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      eventData.tasks[idx] = task;
      eventData.event.updatedAt = new Date().toISOString();
      this.saveState(state);
    }
  }

  public deleteTask(eventId: string, taskId: string): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.tasks = eventData.tasks.filter((t) => t.id !== taskId);
    // Remove from other tasks' dependencies
    eventData.tasks.forEach((t) => {
      t.dependencies = t.dependencies.filter((d) => d !== taskId);
    });
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public addVendor(eventId: string, vendor: VendorItem): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.vendors.unshift(vendor);
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public updateVendor(eventId: string, vendor: VendorItem): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    const idx = eventData.vendors.findIndex((v) => v.id === vendor.id);
    if (idx !== -1) {
      eventData.vendors[idx] = vendor;
      eventData.event.updatedAt = new Date().toISOString();
      this.saveState(state);
    }
  }

  public deleteVendor(eventId: string, vendorId: string): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.vendors = eventData.vendors.filter((v) => v.id !== vendorId);
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public saveAiPlan(eventId: string, plan: AiPlanRecommendation): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.aiPlan = plan;
    eventData.event.updatedAt = new Date().toISOString();
    this.saveState(state);
  }

  public addChatMessage(eventId: string, message: ChatMessage): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    eventData.chatHistory.push(message);
    this.saveState(state);
  }

  public applyProposal(eventId: string, proposalId: string): { success: boolean; message: string } {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return { success: false, message: 'Event not found.' };

    // Locate proposal in chat messages
    let proposal: PlanProposal | undefined;
    for (const msg of eventData.chatHistory) {
      if (msg.proposal && msg.proposal.id === proposalId) {
        proposal = msg.proposal;
        break;
      }
    }

    if (!proposal) {
      return { success: false, message: 'Proposal not found in conversation history.' };
    }

    if (proposal.status === 'applied') {
      return { success: false, message: 'This proposal has already been applied.' };
    }

    if (proposal.status === 'dismissed') {
      return { success: false, message: 'This proposal was dismissed.' };
    }

    // Apply each planned change deterministically
    try {
      for (const change of proposal.changes) {
        if (change.entity === 'task' && change.action === 'create') {
          const newTask: TaskItem = {
            id: `task-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: change.data.title || 'AI Suggested Task',
            description: change.data.description || '',
            category: change.data.category || 'General',
            dueDate: change.data.dueDate || eventData.event.date,
            priority: change.data.priority || 'medium',
            status: 'pending',
            dependencies: change.data.dependencies || [],
            createdAt: new Date().toISOString(),
          };
          eventData.tasks.unshift(newTask);
        } else if (change.entity === 'budget' && change.action === 'update') {
          // Adjust budget category allocation
          const { categoryName, newPercentage, newAmount } = change.data;
          const cat = eventData.categories.find(
            (c) => c.name.toLowerCase() === categoryName.toLowerCase()
          );
          if (cat) {
            if (newPercentage !== undefined) cat.allocatedPercentage = Number(newPercentage);
            if (newAmount !== undefined) cat.allocatedAmount = Math.max(0, Number(newAmount));
          }
        } else if (change.entity === 'vendor' && change.action === 'create') {
          const newVendor: VendorItem = {
            id: `ven-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: change.data.name || 'Recommended Vendor',
            category: change.data.category || 'General',
            contactName: change.data.contactName || '',
            phone: change.data.phone || '',
            email: change.data.email || '',
            quotedAmount: Number(change.data.quotedAmount || 0),
            bookingStatus: 'prospective',
            depositPaid: 0,
            remainingBalance: Number(change.data.quotedAmount || 0),
            paymentStatus: 'unpaid',
            notes: change.data.notes || 'Suggested by AI Planning Assistant',
            isAiSuggested: true,
          };
          eventData.vendors.unshift(newVendor);
        } else if (change.entity === 'event' && change.action === 'update') {
          eventData.event = { ...eventData.event, ...change.data };
        }
      }

      proposal.status = 'applied';
      eventData.event.updatedAt = new Date().toISOString();
      this.saveState(state);
      return { success: true, message: `Successfully applied: ${proposal.summary}` };
    } catch (err: unknown) {
      return { success: false, message: `Failed to apply changes: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
  }

  public dismissProposal(eventId: string, proposalId: string): void {
    const state = this.loadState();
    const eventData = state.events[eventId];
    if (!eventData) return;

    for (const msg of eventData.chatHistory) {
      if (msg.proposal && msg.proposal.id === proposalId) {
        msg.proposal.status = 'dismissed';
        break;
      }
    }
    this.saveState(state);
  }
}

export const storage = new StorageService();
