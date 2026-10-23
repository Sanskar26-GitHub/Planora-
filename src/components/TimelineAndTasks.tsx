import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  ArrowUpDown,
  Link as LinkIcon,
  User,
} from 'lucide-react';
import { TaskItem, PlanoraEventData, Priority, TaskStatus } from '../types';
import {
  calculateDaysRemaining,
  calculateTaskSummary,
  getLocalTodayString,
} from '../utils/calculations';
import { validateTaskInput } from '../utils/validation';
import { storage } from '../services/storage';

interface TimelineAndTasksProps {
  eventData: PlanoraEventData;
  onRefresh: () => void;
}

export const TimelineAndTasks: React.FC<TimelineAndTasksProps> = ({ eventData, onRefresh }) => {
  const { event, categories, tasks, milestones } = eventData;
  const taskStats = calculateTaskSummary(tasks);
  const todayStr = getLocalTodayString();
  const daysUntilEvent = calculateDaysRemaining(event.date);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');

  // Modal State
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<TaskItem>>({
    title: '',
    description: '',
    category: categories[0]?.name || 'General',
    dueDate: event.date,
    priority: 'medium',
    status: 'pending',
    assignedTo: '',
    dependencies: [],
  });
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});

  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      category: categories[0]?.name || 'General',
      dueDate: event.date,
      priority: 'medium',
      status: 'pending',
      assignedTo: '',
      dependencies: [],
    });
    setTaskErrors({});
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setTaskForm({ ...task });
    setTaskErrors({});
    setShowTaskModal(true);
  };

  const handleToggleTaskStatus = (task: TaskItem) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated: TaskItem = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    };
    storage.updateTask(event.id, updated);
    onRefresh();
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTaskInput(taskForm);
    if (!validation.isValid) {
      setTaskErrors(validation.errors);
      return;
    }

    if (editingTask) {
      const updated: TaskItem = {
        ...editingTask,
        title: taskForm.title!.trim(),
        description: taskForm.description?.trim() || undefined,
        category: taskForm.category || 'General',
        dueDate: taskForm.dueDate!,
        priority: (taskForm.priority as Priority) || 'medium',
        status: (taskForm.status as TaskStatus) || 'pending',
        assignedTo: taskForm.assignedTo?.trim() || undefined,
        dependencies: taskForm.dependencies || [],
      };
      storage.updateTask(event.id, updated);
    } else {
      const created: TaskItem = {
        id: `task-${Date.now()}`,
        title: taskForm.title!.trim(),
        description: taskForm.description?.trim() || undefined,
        category: taskForm.category || 'General',
        dueDate: taskForm.dueDate!,
        priority: (taskForm.priority as Priority) || 'medium',
        status: (taskForm.status as TaskStatus) || 'pending',
        assignedTo: taskForm.assignedTo?.trim() || undefined,
        dependencies: taskForm.dependencies || [],
        createdAt: new Date().toISOString(),
      };
      storage.addTask(event.id, created);
    }

    setShowTaskModal(false);
    setEditingTask(null);
    onRefresh();
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(event.id, taskId);
    onRefresh();
  };

  // Filter & Sort Tasks
  const filteredTasks = tasks
    .filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      } else {
        const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      }
    });

  const getPriorityStyle = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return 'text-[#c86d51] bg-[#fdf2e9] border-[#f0c29d]';
      case 'high':
        return 'text-[#d97706] bg-[#fef3c7] border-[#fde68a]';
      case 'medium':
        return 'text-[#2d6a4f] bg-[#eaf4ed] border-[#c7e2cd]';
      case 'low':
        return 'text-[#6b7280] bg-[#f3f4f6] border-[#e5e7eb]';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e1d7] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#142d22]">
            Timeline & Actionable Tasks
          </h1>
          <p className="text-xs text-[#716859]">
            Event countdown: {daysUntilEvent > 0 ? `${daysUntilEvent} days remaining` : 'Target date reached'}
          </p>
        </div>

        <button
          onClick={handleOpenAddTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#1b4332] text-white hover:bg-[#2d6a4f] rounded-md transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task Summary Banner */}
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#142d22]">Overall Progress</span>
            <span className="text-[#716859]">
              {taskStats.completedCount} of {taskStats.totalCount} completed
            </span>
          </div>
          <span className="font-mono font-bold text-[#1b4332]">{taskStats.progressPercentage}%</span>
        </div>

        <div className="w-full h-2 bg-[#ede7dd] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1b4332] rounded-full transition-all"
            style={{ width: `${taskStats.progressPercentage}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#716859] pt-1">
          <span>{taskStats.pendingCount} pending</span>
          <span aria-hidden="true">·</span>
          <span>{taskStats.inProgressCount} in progress</span>
          {taskStats.overdueCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#c86d51] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{taskStats.overdueCount} overdue</span>
              </span>
            </>
          )}
          {taskStats.upcomingCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#d97706] font-medium">
                {taskStats.upcomingCount} due in next 7 days
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#f8f6f0] border border-[#e7e1d7] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#716859]">Sort by:</span>
          <button
            onClick={() => setSortBy(sortBy === 'dueDate' ? 'priority' : 'dueDate')}
            className="flex items-center gap-1 font-semibold text-[#1b4332] bg-white px-2.5 py-1 border border-[#dcd4c7] rounded-md hover:bg-[#ede7dd]"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>{sortBy === 'dueDate' ? 'Due Date' : 'Priority'}</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#716859] bg-[#fbf9f5] border border-dashed border-[#dcd4c7] rounded-xl">
            No tasks match the active filters.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === 'completed';
            const isOverdue = !isCompleted && t.dueDate && t.dueDate < todayStr;
            const hasIncompleteDependencies =
              t.dependencies &&
              t.dependencies.length > 0 &&
              t.dependencies.some((depId) => {
                const dep = tasks.find((item) => item.id === depId);
                return dep && dep.status !== 'completed';
              });

            return (
              <div
                key={t.id}
                className={`p-3.5 bg-[#fbf9f5] border rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'border-[#e7e1d7] opacity-70 bg-[#f9f8f4]'
                    : isOverdue
                    ? 'border-[#fecaca] bg-[#fffaf9]'
                    : 'border-[#e7e1d7] hover:border-[#1b4332]/40'
                }`}
              >
                {/* Left: Checkbox & Title */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleTaskStatus(t)}
                    aria-label={`Mark task ${t.title} as ${isCompleted ? 'pending' : 'completed'}`}
                    className="mt-0.5 text-[#1b4332] hover:text-[#2d6a4f] transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-[#2d6a4f]" />
                    ) : (
                      <Square className="w-5 h-5 text-[#8c8273]" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div
                      className={`text-xs sm:text-sm font-semibold text-[#142d22] ${
                        isCompleted ? 'line-through text-[#8c8273]' : ''
                      }`}
                    >
                      {t.title}
                    </div>

                    {t.description && (
                      <p className="text-[11px] text-[#5c5344] leading-relaxed max-w-xl">
                        {t.description}
                      </p>
                    )}

                    {/* Metadata strip (Zero-pill compliant) */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#716859] pt-0.5">
                      <span>{t.category}</span>
                      {t.assignedTo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{t.assignedTo}</span>
                          </span>
                        </>
                      )}
                      {hasIncompleteDependencies && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#c86d51] flex items-center gap-1 font-medium">
                            <LinkIcon className="w-3 h-3" />
                            <span>Pending prerequisite</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Priority, Due Date & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0eae0]">
                  {/* Priority Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-sm font-semibold uppercase text-[10px] border ${getPriorityStyle(
                      t.priority
                    )}`}
                  >
                    {t.priority}
                  </span>

                  {/* Due Date Indicator */}
                  <div
                    className={`flex items-center gap-1 text-xs font-mono tabular-nums ${
                      isOverdue ? 'text-[#c86d51] font-bold' : 'text-[#716859]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.dueDate || 'No date'}</span>
                    {isOverdue && <span className="text-[10px] uppercase font-sans">(Overdue)</span>}
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTask(t)}
                      title="Edit Task"
                      aria-label={`Edit task ${t.title}`}
                      className="p-1.5 text-[#716859] hover:text-[#1b4332] hover:bg-[#ede7dd] rounded-md transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      title="Delete Task"
                      aria-label={`Delete task ${t.title}`}
                      className="p-1.5 text-[#716859] hover:text-[#c86d51] hover:bg-[#ede7dd] rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD / EDIT TASK */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
              <h3 className="text-base font-bold text-[#142d22]">
                {editingTask ? 'Edit Action Item' : 'Create New Action Item'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-xs text-[#716859] hover:text-[#142d22]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">
                  Task Title <span className="text-[#c86d51]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Schedule final floral walkthrough with venue"
                  className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] focus:ring-1 focus:ring-[#1b4332] outline-hidden text-xs"
                />
                {taskErrors.title && <p className="text-[#c86d51] mt-1">{taskErrors.title}</p>}
              </div>

              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={taskForm.description || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Additional context, links, or contact instructions"
                  className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Category</label>
                  <select
                    value={taskForm.category || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="General">General / Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">
                    Due Date <span className="text-[#c86d51]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                  {taskErrors.dueDate && <p className="text-[#c86d51] mt-1">{taskErrors.dueDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Priority</label>
                  <select
                    value={taskForm.priority || 'medium'}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value as Priority })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskForm.assignedTo || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    placeholder="e.g. Lead Planner or Bride"
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 text-[#716859] hover:bg-[#ede7dd] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1b4332] text-white font-semibold rounded-md hover:bg-[#2d6a4f]"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
