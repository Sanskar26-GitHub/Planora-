export type EventType = 'wedding' | 'birthday' | 'community';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type VendorBookingStatus = 'prospective' | 'contacted' | 'quoted' | 'booked' | 'cancelled';

export type VendorPaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';

export type ExpensePaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface WeddingDetails {
  ceremonyType: 'traditional' | 'contemporary' | 'interfaith' | 'civil';
  isMultiDay: boolean;
  eventDaysCount?: number;
  traditions?: string;
  receptionStyle: 'plated_dinner' | 'buffet' | 'cocktail_reception' | 'family_style';
}

export interface BirthdayDetails {
  ageGroup: 'kids' | 'teens' | 'adults' | 'milestone';
  milestoneAge?: number;
  theme: string;
  keyActivities: string;
  entertainment: string;
}

export interface CommunityDetails {
  volunteerCount: number;
  equipmentNeeds: string;
  publicAttendance: boolean;
  permitsNeeded: boolean;
  organizingCommittee?: string;
}

export interface EventDetails {
  id: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  location: string;
  currency: string; // INR, USD, EUR, GBP, etc.
  guestCount: number;
  totalBudget: number;
  stylePreferences: string;
  dietaryAccessibility: string;
  additionalNotes: string;
  specificDetails: {
    wedding?: WeddingDetails;
    birthday?: BirthdayDetails;
    community?: CommunityDetails;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedPercentage: number;
  allocatedAmount: number;
  color: string;
}

export interface ExpenseItem {
  id: string;
  categoryId: string;
  title: string;
  plannedAmount: number;
  actualAmount: number;
  vendorId?: string;
  paidAmount: number;
  paymentStatus: ExpensePaymentStatus;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  phase: 'initial_planning' | 'vendor_selection' | 'execution_prep' | 'event_week' | 'wrap_up';
  description?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  assignedTo?: string;
  dependencies: string[]; // Task IDs that must be completed first
  milestoneId?: string;
  completedAt?: string;
  createdAt: string;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  quotedAmount: number;
  bookingStatus: VendorBookingStatus;
  depositPaid: number;
  remainingBalance: number;
  paymentStatus: VendorPaymentStatus;
  deadline?: string;
  notes?: string;
  isAiSuggested?: boolean;
  rating?: number;
}

export interface RiskContingency {
  risk: string;
  impact: 'high' | 'medium' | 'low';
  contingencyPlan: string;
}

export interface AiPlanRecommendation {
  eventOverview: string;
  planningAssumptions: string[];
  themeRecommendations: string[];
  budgetRecommendations: {
    category: string;
    suggestedPercentage: number;
    suggestedAmount: number;
    rationale: string;
  }[];
  milestones: {
    title: string;
    timeframe: string;
    dueDate: string;
    tasks: {
      title: string;
      category: string;
      priority: Priority;
      dueOffsetDays: number;
    }[];
  }[];
  vendorChecklist: {
    category: string;
    selectionCriteria: string[];
    estimatedCostRange: string;
  }[];
  creativeExperiences: string[];
  risksAndContingencies: RiskContingency[];
  budgetTradeoffs: string[];
  generatedAt: string;
}

export type ProposalType =
  | 'adjust_budget_category'
  | 'add_tasks'
  | 'reschedule_dates'
  | 'add_contingency_task'
  | 'update_vendor_estimate';

export interface PlanProposal {
  id: string;
  summary: string;
  reasoning: string;
  type: ProposalType;
  status: 'pending' | 'applied' | 'dismissed';
  timestamp: string;
  changes: {
    entity: 'budget' | 'task' | 'vendor' | 'event';
    action: 'update' | 'create' | 'delete';
    description: string;
    data: any;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposal?: PlanProposal;
}

export interface PlanoraEventData {
  event: EventDetails;
  categories: BudgetCategory[];
  expenses: ExpenseItem[];
  milestones: Milestone[];
  tasks: TaskItem[];
  vendors: VendorItem[];
  aiPlan?: AiPlanRecommendation;
  chatHistory: ChatMessage[];
}

export interface AppState {
  events: Record<string, PlanoraEventData>;
  activeEventId: string | null;
  version: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalPlanned: number;
  totalActual: number;
  totalPaid: number;
  remainingBudget: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  unallocatedBudget: number;
  categoryBreakdown: {
    category: BudgetCategory;
    planned: number;
    actual: number;
    paid: number;
    variance: number; // allocated - actual
    utilization: number;
    isOverCategoryBudget: boolean;
  }[];
}

export interface TaskProgressSummary {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  progressPercentage: number;
  overdueCount: number;
  upcomingCount: number; // due in next 7 days
}

export interface VendorSummary {
  totalVendors: number;
  bookedCount: number;
  totalQuoted: number;
  totalDepositsPaid: number;
  totalRemainingBalance: number;
}
