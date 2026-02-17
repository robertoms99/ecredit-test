import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert, AlertType } from '../components/Alert';

interface Notification {
  id: string;
  type: AlertType;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: AlertType, message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: AlertType, message: string, duration: number = 5000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const notification: Notification = { id, type, message };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification('error', message, duration);
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification('success', message, duration);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification('warning', message, duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification('info', message, duration);
    },
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{ showNotification, showError, showSuccess, showWarning, showInfo }}
    >
      {children}
      {/* Notification Container - Fixed at top-right */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="animate-slide-in-right shadow-lg"
            style={{
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <Alert
              type={notification.type}
              message={notification.message}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
