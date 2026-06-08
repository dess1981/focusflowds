import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CalendarDays, Unplug } from 'lucide-react';

const CONNECTOR_ID = '69d7d8d3b259ef293513995d';

// Returns events indexed by date key 'yyyy-MM-dd'
export function useGoogleCalendarEvents(timeMin, timeMax) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getGoogleCalendarEvents', { timeMin, timeMax });
      setEvents(res.data.events || []);
      setConnected(true);
    } catch {
      setConnected(false);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [timeMin, timeMax]);

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) fetchEvents();
      else setLoading(false);
    });
  }, [fetchEvents]);

  const connect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setLoading(true);
        fetchEvents();
      }
    }, 500);
  };

  const disconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setEvents([]);
  };

  // Build map by date
  const eventsByDate = {};
  events.forEach(ev => {
    const dateStr = ev.start?.date || ev.start?.dateTime?.split('T')[0];
    const endStr = ev.end?.date || ev.end?.dateTime?.split('T')[0];
    if (!dateStr) return;
    // For multi-day events, add to each day
    let cur = new Date(dateStr);
    const end = endStr ? new Date(endStr) : cur;
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      if (!eventsByDate[key]) eventsByDate[key] = [];
      // Avoid duplicates for multi-day
      if (!eventsByDate[key].find(e => e.id === ev.id)) {
        eventsByDate[key].push(ev);
      }
      cur.setDate(cur.getDate() + 1);
    }
  });

  return { eventsByDate, connected, loading, connect, disconnect };
}

export function GoogleCalendarConnectButton({ connected, loading, onConnect, onDisconnect }) {
  if (loading) return null;
  if (connected) {
    return (
      <Button variant="outline" size="sm" onClick={onDisconnect} className="gap-1.5 text-xs">
        <CalendarDays className="w-3.5 h-3.5 text-green-500" />
        Google Calendar
        <Unplug className="w-3 h-3 text-muted-foreground ml-1" />
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={onConnect} className="gap-1.5 text-xs">
      <CalendarDays className="w-3.5 h-3.5" />
      Conectar Google Calendar
    </Button>
  );
}