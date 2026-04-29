'use client';

import { useState, useMemo } from 'react';
import { Event, CalendarDay } from '@/types';
import { getEventOccurrences } from '@/lib/rrule-utils';
import { isSameDay } from '@/lib/date-utils';

interface CalendarProps {
  events: Event[];
  currentUser: { id: string; name: string; color: string };
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  selectedDate?: Date | null;
  onClearSelection?: () => void;
}

function getCalendarDays(year: number, month: number, events: Event[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: CalendarDay[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false, events: [] });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({ date, isCurrentMonth: true, events: [] });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({ date, isCurrentMonth: false, events: [] });
  }

  const calendarStart = days[0].date;
  const calendarEnd = days[days.length - 1].date;

  for (const event of events) {
    const startTime = new Date(event.startTime);
    const occurrences = getEventOccurrences(event.rrule, startTime, calendarStart, calendarEnd);
    
    for (const occ of occurrences) {
      const dayIndex = days.findIndex((d) => isSameDay(d.date, occ));
      
      if (dayIndex !== -1) {
        const endTime = new Date(event.endTime);
        const duration = endTime.getTime() - startTime.getTime();
        const occEnd = new Date(occ.getTime() + duration);

        days[dayIndex].events.push({
          id: `${event.id}-${occ.getTime()}`,
          title: event.title,
          color: event.creator.color,
          startTime: occ,
          endTime: occEnd,
          isRecurring: !!event.rrule,
          originalEvent: event,
          isSyncedToGoogle: event.syncToGoogle,
        });
      }
    }
  }

  for (const day of days) {
    day.events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  return days;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ events, onDayClick, onEventClick, selectedDate, currentUser }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth, events),
    [viewYear, viewMonth, events]
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={goToday}
            className="text-xs px-2.5 py-1 border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition text-gray-600 dark:text-zinc-400"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition">
            <svg className="w-4 h-4 text-gray-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition">
            <svg className="w-4 h-4 text-gray-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-zinc-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 border-t border-l border-gray-200 dark:border-zinc-800">
        {calendarDays.map((day, idx) => {
          const isToday = isSameDay(day.date, today);
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const maxVisible = 3;
          const visibleEvents = day.events.slice(0, maxVisible);
          const hiddenCount = day.events.length - maxVisible;
          const cellBackgroundStyle = isSelected ? { backgroundColor: currentUser.color + '1A' } : undefined;
          const dateNumberStyle = isSelected && !isToday ? { color: currentUser.color } : undefined;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day.date)}
              className={`border-b border-r border-gray-200 dark:border-zinc-800 p-1 min-h-[100px] cursor-pointer transition-colors ${
                day.isCurrentMonth
                  ? 'bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900'
                  : 'bg-gray-50 dark:bg-zinc-950 dark:bg-opacity-50'
              }`}
              style={cellBackgroundStyle}
            >
              <div 
                className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-indigo-600 text-white'
                    : day.isCurrentMonth
                    ? 'text-gray-900 dark:text-zinc-300'
                    : 'text-gray-400 dark:text-zinc-600'
                }`}
                style={dateNumberStyle}
              >
                {day.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {visibleEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev.originalEvent);
                    }}
                    className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate text-white font-medium block relative hover:opacity-90 transition"
                    style={{ backgroundColor: ev.color }}
                    title={ev.title}
                  >
                    {/* Green sync indicator dot */}
                    {ev.isSyncedToGoogle && (
                      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-400 rounded-full" />
                    )}
                    <span className={ev.isSyncedToGoogle ? 'pl-2.5' : ''}>
                      {ev.isRecurring && '↻ '}
                      {ev.title}
                    </span>
                  </button>
                ))}
                {hiddenCount > 0 && (
                  <div className="text-xs text-gray-500 dark:text-zinc-500 pl-1">+{hiddenCount} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
