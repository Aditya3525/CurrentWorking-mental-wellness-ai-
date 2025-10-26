/**
 * Notification Store
 * 
 * Manages toast notifications and alerts throughout the application.
 */

import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
  timestamp: number;
}

interface NotificationState {
  // State
  notifications: Notification[];

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Compatibility with ToastContext API
  push: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  remove: (id: string) => void;
  clear: () => void;
  toasts: Notification[]; // Alias for notifications
  
  // Convenience methods
  success: (title: string, description?: string, duration?: number) => void;
  error: (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info: (title: string, description?: string, duration?: number) => void;
}

const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],

  // Actions
  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () =>
    set({ notifications: [] }),

  // Compatibility aliases for ToastContext API
  push: (notification) => get().addNotification(notification),
  remove: (id) => get().removeNotification(id),
  clear: () => get().clearAll(),
  get toasts() {
    return get().notifications;
  },

  // Convenience methods
  success: (title, description, duration) =>
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      description,
      duration,
    }),

  error: (title, description, duration = 7000) =>
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      description,
      duration,
    }),

  warning: (title, description, duration) =>
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      description,
      duration,
    }),

  info: (title, description, duration) =>
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      description,
      duration,
    }),
}));

/**
 * Selectors
 */
export const selectNotifications = (state: NotificationState) => state.notifications;
export const selectLatestNotification = (state: NotificationState) =>
  state.notifications[state.notifications.length - 1];
