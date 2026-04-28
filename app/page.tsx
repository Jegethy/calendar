'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Event } from '@/types';
import Header from '@/components/Header';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchUser(), fetchEvents()]).finally(() => setLoading(false));
  }, [fetchUser, fetchEvents]);

  const handleDayClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Event>) => {
    if (selectedEvent) {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchEvents();
      }
    } else {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchEvents();
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    const res = await fetch(`/api/events/${selectedEvent.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await fetchEvents();
    }
  };

  const handleColorChange = (color: string) => {
    if (user) {
      setUser({ ...user, color });
      fetchEvents();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onColorChange={handleColorChange} />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {Array.from(new Map(events.map(e => [e.creator.id, e.creator])).values()).map(creator => (
                <div key={creator.id} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: creator.color }} />
                  <span className="text-xs text-gray-600">{creator.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setSelectedEvent(null); setSelectedDate(new Date()); setModalOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Event
            </button>
          </div>
          <Calendar
            events={events}
            currentUser={user}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        </div>
      </main>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={selectedEvent?.creatorId === user.id ? handleDelete : undefined}
        event={selectedEvent}
        selectedDate={selectedDate}
        currentUser={user}
      />
    </div>
  );
}
