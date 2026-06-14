import React, { useState } from 'react';
import { Calendar, Check, X } from 'lucide-react';

interface InlineDatePickerProps {
  onDateSelect: (startDate: string, endDate: string) => void;
  onCancel: () => void;
  destination?: string;
}

const InlineDatePicker: React.FC<InlineDatePickerProps> = ({ onDateSelect, onCancel, destination }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (startDate && endDate) {
      onDateSelect(startDate, endDate);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h4 className="font-semibold text-blue-800 dark:text-blue-300">
          📅 Select your travel dates{destination ? ` to ${destination}` : ''}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>

      {startDate && endDate && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Selected:</strong> {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!startDate || !endDate}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
        >
          <Check className="h-4 w-4" />
          Confirm Dates
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

export default InlineDatePicker;
