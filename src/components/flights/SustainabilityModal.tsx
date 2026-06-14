import React, { useState, useEffect } from 'react';
import { X, Leaf, TrendingUp, Award, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { SustainabilityData, OffsetOption } from '../../types/sustainability';
import { getSustainabilityBadge, formatCO2Emissions, getCarbonOffsetCost } from '../../utils/carbonCalculator';

interface SustainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: any;
  sustainabilityData: SustainabilityData | null;
  currency: string;
}

const SustainabilityModal: React.FC<SustainabilityModalProps> = ({
  isOpen,
  onClose,
  flight,
  sustainabilityData,
  currency = 'USD'
}) => {
  const [selectedOffset, setSelectedOffset] = useState<OffsetOption | null>(null);

  if (!isOpen || !sustainabilityData) return null;

  const { co2, airlineRating, offsetOptions } = sustainabilityData;
  const badge = getSustainabilityBadge(co2.efficiency);

  const formatPrice = (amount: number, showCurrency: boolean = true): string => {
    if (showCurrency) {
      if (currency === 'INR') {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      } else if (currency === 'USD') {
        return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      } else if (currency === 'EUR') {
        return `€${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      } else if (currency === 'GBP') {
        return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      } else if (currency === 'JPY' || currency === 'KRW') {
        return `${currency} ${Math.round(amount).toLocaleString()}`;
      } else {
        return `${currency} ${amount.toFixed(2)}`;
      }
    }
    return amount.toFixed(2);
  };

  const getEfficiencyPercentage = (efficiency: string): number => {
    switch (efficiency) {
      case 'high': return 85;
      case 'medium': return 60;
      case 'low': return 25;
      default: return 50;
    }
  };

  const getEfficiencyColor = (efficiency: string): string => {
    switch (efficiency) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${badge.bgColor}`}>
                <Leaf className={`h-6 w-6 ${badge.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CO₂ Emissions: {co2.co2Kg}kg
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color}`}>
                    {badge.icon} {badge.text}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {co2.source === 'sonar' ? 'Live data' : 'Estimated'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* CO2 Emissions Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Your Carbon Footprint
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{co2.co2Kg}kg</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">CO₂ Emissions</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getEfficiencyColor(co2.efficiency)}`}>
                  {getEfficiencyPercentage(co2.efficiency)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {co2.routeAverage}kg
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Route Average</div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Environmental Impact Comparison</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">This Flight</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (co2.co2Kg / 200) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{co2.co2Kg}kg</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Car (same distance)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (co2.co2Kg * 0.21 / 200) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(co2.co2Kg * 0.21)}kg
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Route Average</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (co2.routeAverage / 200) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{co2.routeAverage}kg</span>
                  </div>
                </div>
              </div>
            </div>

            {co2.comparison && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <Info className="h-4 w-4 inline mr-1" />
                  {co2.comparison}
                </p>
              </div>
            )}
          </div>

          {/* Carbon Offset Options */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Offset This Flight
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {offsetOptions.map((option, index) => (
                <div 
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                    selectedOffset?.provider === option.provider 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                  onClick={() => setSelectedOffset(option)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{option.provider}</h4>
                    {option.verified && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{option.description}</p>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {formatPrice(option.cost)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{option.impact}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Contact provider for purchase
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Airline Sustainability */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Airline Sustainability Rating
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</span>
                  <span className="text-2xl font-bold text-purple-600">{airlineRating.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${airlineRating.score}%` }}
                  ></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">SAF Usage</span>
                    <span className="font-medium text-gray-900 dark:text-white">{airlineRating.safUsage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Fleet Age</span>
                    <span className="font-medium text-gray-900 dark:text-white">{airlineRating.fleetAge} years</span>
                  </div>
                  {airlineRating.carbonNeutralTarget && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Carbon Neutral Target</span>
                      <span className="font-medium text-gray-900 dark:text-white">{airlineRating.carbonNeutralTarget}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Certifications</h4>
                {airlineRating.certifications.length > 0 ? (
                  <div className="space-y-2">
                    {airlineRating.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No certifications available</p>
                )}
                
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 mt-4">Initiatives</h4>
                {airlineRating.initiatives.length > 0 ? (
                  <div className="space-y-2">
                    {airlineRating.initiatives.map((initiative, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{initiative}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No initiatives available</p>
                )}
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Info className="h-4 w-4" />
              <span>Data source: {co2.source === 'sonar' ? 'Real-time airline data' : 'Calculated estimate'} • Last updated: {new Date(co2.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityModal;
