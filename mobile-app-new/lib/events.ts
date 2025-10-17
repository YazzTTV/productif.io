// Simple event bus for cross-screen updates (dashboard refresh, etc.)
type Listener = (...args: any[]) => void;

class EventBus {
  private listeners: Record<string, Set<Listener>> = {};

  on(eventName: string, listener: Listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = new Set();
    }
    this.listeners[eventName].add(listener);
    return () => this.off(eventName, listener);
  }

  off(eventName: string, listener: Listener) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].delete(listener);
      if (this.listeners[eventName].size === 0) {
        delete this.listeners[eventName];
      }
    }
  }

  emit(eventName: string, ...args: any[]) {
    const set = this.listeners[eventName];
    if (!set) return;
    for (const listener of Array.from(set)) {
      try {
        listener(...args);
      } catch (err) {
        // Do not block other listeners
        console.error(`[events] listener error for ${eventName}:`, err);
      }
    }
  }
}

export const dashboardEvents = new EventBus();

// Common event names
export const DASHBOARD_DATA_CHANGED = 'dashboard:dataChanged';
export const DASHBOARD_FOCUS_REFRESH = 'dashboard:focusRefresh';


