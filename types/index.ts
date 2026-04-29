export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  googleAccessToken?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  rrule?: string;
  googleEventId?: string | null;
  syncToGoogle: boolean;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  color: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  originalEvent: Event;
  isSyncedToGoogle: boolean;
}
