import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  show: boolean;
  onHide: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, show, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-xs">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
};

export default Notification;
