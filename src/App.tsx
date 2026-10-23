import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CreateEventWizard } from './components/CreateEventWizard';
import { EventOverview } from './components/EventOverview';
import { BudgetPlanner } from './components/BudgetPlanner';
import { TimelineAndTasks } from './components/TimelineAndTasks';
import { VendorManager } from './components/VendorManager';
import { AiAssistant } from './components/AiAssistant';
import { EventBriefExport } from './components/EventBriefExport';
import { SettingsDataModal } from './components/SettingsDataModal';
import { storage } from './services/storage';
import { PlanoraEventData } from './types';

export default function App() {
  const [events, setEvents] = useState<PlanoraEventData[]>([]);
  const [activeEvent, setActiveEvent] = useState<PlanoraEventData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync state from storage
  const syncFromStorage = () => {
    const all = storage.getEvents();
    setEvents(all);
    const active = storage.getActiveEvent();
    setActiveEvent(active);
  };

  useEffect(() => {
    syncFromStorage();
  }, []);

  const handleSelectEvent = (eventId: string, targetTab: string = 'overview') => {
    storage.setActiveEvent(eventId);
    syncFromStorage();
    setIsCreatingEvent(false);
    setActiveTab(targetTab);
  };

  const handleCreateNewEvent = () => {
    setIsCreatingEvent(true);
  };

  const handleEventCreated = (newEventData: PlanoraEventData) => {
    storage.saveEvent(newEventData);
    storage.setActiveEvent(newEventData.event.id);
    syncFromStorage();
    setIsCreatingEvent(false);
    setActiveTab('overview');
  };

  const handleDeleteEvent = (eventId: string) => {
    storage.deleteEvent(eventId);
    syncFromStorage();
  };

  const handleLoadSampleEvent = () => {
    storage.loadSampleEvent();
    syncFromStorage();
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1f2937] flex flex-col font-sans selection:bg-[#1b4332] selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={isCreatingEvent ? 'create' : activeTab}
        setActiveTab={(tab) => {
          setIsCreatingEvent(false);
          setActiveTab(tab);
        }}
        events={events}
        activeEvent={activeEvent}
        onSelectEvent={(id) => handleSelectEvent(id, activeTab === 'dashboard' ? 'overview' : activeTab)}
        onCreateNewEvent={handleCreateNewEvent}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Viewport Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isCreatingEvent ? (
          <CreateEventWizard
            onEventCreated={handleEventCreated}
            onCancel={() => setIsCreatingEvent(false)}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            events={events}
            onSelectEvent={handleSelectEvent}
            onCreateNewEvent={handleCreateNewEvent}
            onDeleteEvent={handleDeleteEvent}
            onLoadSampleEvent={handleLoadSampleEvent}
          />
        ) : !activeEvent ? (
          <Dashboard
            events={events}
            onSelectEvent={handleSelectEvent}
            onCreateNewEvent={handleCreateNewEvent}
            onDeleteEvent={handleDeleteEvent}
            onLoadSampleEvent={handleLoadSampleEvent}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <EventOverview
                eventData={activeEvent}
                setActiveTab={setActiveTab}
                onRefresh={syncFromStorage}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetPlanner
                eventData={activeEvent}
                onRefresh={syncFromStorage}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineAndTasks
                eventData={activeEvent}
                onRefresh={syncFromStorage}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorManager
                eventData={activeEvent}
                onRefresh={syncFromStorage}
              />
            )}

            {activeTab === 'assistant' && (
              <AiAssistant
                eventData={activeEvent}
                onRefresh={syncFromStorage}
              />
            )}

            {activeTab === 'brief' && (
              <EventBriefExport eventData={activeEvent} />
            )}
          </>
        )}
      </main>

      {/* Settings & Persistence Management Modal */}
      <SettingsDataModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={syncFromStorage}
      />
    </div>
  );
}
