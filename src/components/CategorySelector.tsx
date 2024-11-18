import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: (category: string) => void;
  disabled?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  disabled = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-lg font-medium text-white">
        Video Category
      </label>
      
      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="
              flex-1 px-4 py-3 
              bg-gray-800/50 
              border border-gray-600 
              text-gray-100 text-base
              rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-gray-400
              hover:bg-gray-800/70 transition-colors
            "
            placeholder="Enter new category"
            disabled={disabled}
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled || !newCategory.trim()}
          >
            Add
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="
              flex-1 px-4 py-3 
              bg-gray-800/50 
              border border-gray-600 
              text-gray-100 text-base
              rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              disabled:opacity-50 disabled:cursor-not-allowed
              appearance-none
              bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQgNmw0IDQgNC00IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] 
              bg-no-repeat bg-right-1 bg-[length:20px] bg-[center_right_1rem]
              hover:bg-gray-800/70 transition-colors
            "
            disabled={disabled}
          >
            <option value="" className="bg-gray-800 text-gray-400">Select a category</option>
            {categories.map((category) => (
              <option 
                key={category} 
                value={category}
                className="bg-gray-800 text-gray-100 py-2"
              >
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAdding(true)}
            className="w-[46px] h-[46px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            title="Add new category"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;