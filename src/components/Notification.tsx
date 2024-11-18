import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

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
    <div 
      className={`
        absolute top-4 right-4 
        bg-green-500/20 backdrop-blur-md
        border border-green-500/50
        text-green-100
        px-4 py-2 rounded-lg shadow-xl
        flex items-center gap-2
        w-[300px]
        transform transition-all duration-300 ease-out
        ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        z-50
      `}
    >
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onHide}
        className="ml-auto p-1 hover:bg-green-500/20 rounded-full transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default Notification;
