import React, { useState } from 'react';
import { Users, Plus, Minus, Check, X } from 'lucide-react';

interface InlineTravelerPickerProps {
  onTravelerSelect: (count: number) => void;
  onCancel: () => void;
  destination?: string;
}

const InlineTravelerPicker: React.FC<InlineTravelerPickerProps> = ({ onTravelerSelect, onCancel, destination }) => {
  const [travelerCount, setTravelerCount] = useState(1);

  const handleSubmit = () => {
    onTravelerSelect(travelerCount);
  };

  const getTravelerLabel = (count: number) => {
    if (count === 1) return 'Solo traveler';
    if (count === 2) return 'Couple';
    if (count <= 4) return `${count} people`;
    return `${count} travelers`;
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="font-semibold text-green-800 dark:text-green-300">
          👥 How many people{destination ? ` traveling to ${destination}` : ''}?
        </h4>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setTravelerCount(Math.max(1, travelerCount - 1))}
          disabled={travelerCount <= 1}
          className="p-2 rounded-full bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-800 dark:text-green-300">
            {travelerCount}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            {getTravelerLabel(travelerCount)}
          </div>
        </div>
        
        <button
          onClick={() => setTravelerCount(Math.min(20, travelerCount + 1))}
          disabled={travelerCount >= 20}
          className="p-2 rounded-full bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-medium"
        >
          <Check className="h-4 w-4" />
          Confirm Travelers
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InlineTravelerPicker;
