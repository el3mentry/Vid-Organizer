import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import '../types/electron';

interface DirectorySelectorProps {
  label: string;
  icon: LucideIcon;
  onSelect: (path: string) => void;
  selectedPath: string;
  error?: string;
  disabled?: boolean;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  label,
  icon: Icon,
  onSelect,
  selectedPath,
  error,
  disabled = false,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = async () => {
    if (isSelecting) return; // Prevent multiple clicks

    setIsSelecting(true);
    try {
      const directory = await window.electron.selectDirectory();
      if (directory) {
        onSelect(directory);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      // Clear the current value if there's an error
      onSelect('');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-lg font-medium text-white">{label}</label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-gray-800/30 border border-gray-700 text-gray-300 rounded-lg truncate">
            {selectedPath || 'No directory selected'}
          </div>
          <button
            onClick={handleSelect}
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