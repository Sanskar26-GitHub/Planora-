import React from 'react';
import {
  Calendar,
  Sparkles,
  DollarSign,
  CheckSquare,
  Users,
  FileText,
  Settings,
  Plus,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { PlanoraEventData } from '../types';
import { IMAGES } from '../constants/assets';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  events: PlanoraEventData[];
  activeEvent: PlanoraEventData | null;
  onSelectEvent: (eventId: string) => void;
  onCreateNewEvent: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  events,
  activeEvent,
  onSelectEvent,
  onCreateNewEvent,
  onOpenSettings,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'timeline', label: 'Timeline & Tasks', icon: CheckSquare },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'assistant', label: 'AI Planner', icon: Sparkles },
    { id: 'brief', label: 'Event Brief', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f5] border-b border-[#e7e1d7] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group flex items-center gap-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2d6a4f] rounded-md px-1 py-0.5"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1b4332] text-[#fbf9f5] flex items-center justify-center font-bold text-lg tracking-wider shadow-xs">
                P
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#142d22] group-hover:text-[#2d6a4f] transition-colors">
                  Planora
                </span>
                <span className="text-[10px] text-[#716859] tracking-wider uppercase font-medium hidden sm:block">
                  Thoughtful Event Planning
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2 overflow-x-auto py-1 scrollbar-none"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2d6a4f] ${
                    isActive
                      ? 'bg-[#1b4332] text-[#fbf9f5] shadow-xs'
                      : 'text-[#4a4237] hover:text-[#142d22] hover:bg-[#ede7dd]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Event Switcher & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Event Switcher Dropdown */}
            {events.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 max-w-[160px] sm:max-w-[210px] px-2.5 py-1.5 text-xs font-medium bg-[#f2ece2] text-[#2c261e] border border-[#dcd4c7] rounded-md hover:bg-[#eae3d7] transition-colors focus-visible:ring-2 focus-visible:ring-[#2d6a4f] focus-visible:outline-hidden"
                >
                  <span className="truncate text-left">
                    {activeEvent ? activeEvent.event.name : 'Select Event'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7c7160] shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-[#fbf9f5] border border-[#dcd4c7] rounded-lg shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8b7e6b] uppercase tracking-wider border-b border-[#e7e1d7]">
                      Switch Event ({events.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {events.map((e) => (
                        <button
                          key={e.event.id}
                          onClick={() => {
                            onSelectEvent(e.event.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex flex-col hover:bg-[#ede7dd] transition-colors ${
                            activeEvent?.event.id === e.event.id ? 'bg-[#e4ddcf] font-medium' : ''
                          }`}
                        >
                          <span className="text-[#2c261e] truncate">{e.event.name}</span>
                          <span className="text-[10px] text-[#716859]">
                            {e.event.type.toUpperCase()} · {e.event.date}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-[#e7e1d7] pt-1 px-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onCreateNewEvent();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-[#1b4332] font-semibold hover:bg-[#ede7dd] rounded-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Another Event</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={onCreateNewEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1b4332] hover:bg-[#2d6a4f] rounded-md transition-colors shadow-xs whitespace-nowrap shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1b4332]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* Settings & Backup */}
            <button
              onClick={onOpenSettings}
              title="Settings & Data Management"
              aria-label="Settings and Data Management"
              className="p-1.5 text-[#5c5344] hover:text-[#1b4332] hover:bg-[#ede7dd] rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2d6a4f]"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Avatar */}
            <div className="hidden lg:flex items-center pl-1 border-l border-[#e7e1d7]">
              <img
                src={IMAGES.avatarPlanner}
                alt="Planner profile"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-[#c8beaf]"
              />
            </div>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-[#e7e1d7] scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#1b4332] text-[#fbf9f5]'
                    : 'text-[#4a4237] hover:bg-[#ede7dd]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
