import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import '../types/electron';

interface DirectorySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  disabled?: boolean;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  label,
  value,
  onChange,
  icon: Icon,
  disabled = false,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBrowse = async () => {
    if (isSelecting) return; // Prevent multiple clicks
    
    setIsSelecting(true);
    setError(null);
    
    try {
      const directory = await window.electron.selectDirectory();
      if (directory) {
        onChange(directory);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError(error instanceof Error ? error.message : 'Failed to select directory');
      // Clear the current value if there's an error
      onChange('');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-lg font-medium text-white">{label}</label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-800/30 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter directory path"
            disabled={disabled || isSelecting}
          />
          <button
            onClick={handleBrowse}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled || isSelecting}
          >
            <Icon className={`w-5 h-5 ${isSelecting ? 'animate-spin' : ''}`} />
            {isSelecting ? 'Selecting...' : 'Browse'}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};

export default DirectorySelector;