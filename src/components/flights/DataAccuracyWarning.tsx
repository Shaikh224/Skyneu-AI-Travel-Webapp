import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { FlightDataValidation } from '../../utils/dataValidation';

interface DataAccuracyWarningProps {
  validation: FlightDataValidation;
  flightNumber: string;
  className?: string;
}

export const DataAccuracyWarning: React.FC<DataAccuracyWarningProps> = ({
  validation,
  flightNumber,
  className = ''
}) => {
  if (validation.isValid && validation.confidence === 'high') {
    return null; // No warning needed for high-confidence valid data
  }

  const getWarningStyle = () => {
    switch (validation.confidence) {
      case 'low':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    if (validation.confidence === 'low') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />;
  };

  const getTitle = () => {
    switch (validation.confidence) {
      case 'low':
        return 'Data Accuracy Warning';
      case 'medium':
        return 'Data Quality Notice';
      default:
        return 'Information';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getWarningStyle()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            {getTitle()} - Flight {flightNumber}
          </h3>
          
          {validation.issues.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Issues detected:</p>
              <ul className="text-sm space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.recommendations.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Recommendations:</p>
              <ul className="text-sm space-y-1">
                {validation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs opacity-75">
            Data confidence: {validation.confidence.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAccuracyWarning;
