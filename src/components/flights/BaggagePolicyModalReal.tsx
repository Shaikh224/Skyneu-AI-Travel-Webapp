import React, { useState, useEffect } from 'react';
import { X, Briefcase, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { getFlightRouteType, getAirlineCode } from '../../utils/flightRouteUtils';
import { getAirlineInfo } from '../../utils/airlineMapping';

interface BaggagePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: any;
}

interface BaggagePolicy {
  airline: string;
  airlineName: string;
  routeType: string;
  carryOn: string;
  economy: string;
  premium: string;
  business: string;
  first: string;
  notes: string;
  source: string;
}

const BaggagePolicyModalReal: React.FC<BaggagePolicyModalProps> = ({
  isOpen,
  onClose,
  flight
}) => {
  const [policy, setPolicy] = useState<BaggagePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBaggagePolicy = async () => {
    if (!flight) return;

    setIsLoading(true);
    setError(null);

    try {
      const airlineCode = getAirlineCode(flight);
      const airlineInfo = getAirlineInfo(airlineCode);
      const airlineName = airlineInfo?.name || airlineCode;
      const airlineDomain = airlineInfo?.domain || `${airlineCode.toLowerCase()}.com`;
      const routeType = getFlightRouteType(flight);
      
      const from = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || '';
      const to = flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode || '';

      const apiKey = import.meta.env.VITE_SONAR_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      console.log(`🔍 Fetching baggage policy for ${airlineCode} (${airlineName}) - ${routeType} flight ${from} to ${to}`);

      const prompt = `Find the current baggage policy for ${airlineName} (${airlineCode}) ${routeType} flights from ${from} to ${to}.

Search the official ${airlineName} website (${airlineDomain}) and provide a detailed, well-formatted response including:

**Carry-On Baggage:**
- Weight limits and dimensions
- Number of pieces allowed
- Personal item allowances

**Checked Baggage by Class:**
- Economy class allowances
- Premium Economy class allowances  
- Business class allowances
- First class allowances

**Important Details:**
- Weight limits per piece
- Maximum dimensions
- Fees for excess baggage
- Special restrictions or notes

Please format the response clearly with proper headings and bullet points for easy reading.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides accurate airline baggage policy information. Use official airline sources only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          web_search: true,
          return_citations: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);

      const content = data.choices?.[0]?.message?.content || '';
      const citations = data.citations || [];

      if (!content) {
        throw new Error('No response from API');
      }

      // Display the full response as-is since it's already well-formatted
      const baggagePolicy: BaggagePolicy = {
        airline: airlineCode,
        airlineName: airlineName,
        routeType: routeType,
        carryOn: 'See full policy below',
        economy: 'See full policy below',
        premium: 'See full policy below',
        business: 'See full policy below',
        first: 'See full policy below',
        notes: content,
        source: citations.length > 0 ? citations[0] : `${airlineDomain}`
      };

      setPolicy(baggagePolicy);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch baggage policy');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !policy && flight) {
      fetchBaggagePolicy();
    }
  }, [isOpen, flight]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {policy?.airlineName || 'Loading...'}
              </h2>
              <p className="text-blue-100 text-sm">Real-time Baggage Policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Fetching real-time baggage policy from official sources...</p>
            </div>
          ) : error ? (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 text-lg mb-2">Unable to Load Policy</h3>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-4">{error}</p>
                  <button
                    onClick={fetchBaggagePolicy}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : policy ? (
            <>
              {/* Status Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm ${
                  policy.routeType === 'domestic' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                }`}>
                  <span className="text-lg">{policy.routeType === 'domestic' ? '🏠' : '✈️'}</span>
                  <span className="text-sm">{policy.routeType === 'domestic' ? 'Domestic Flight' : 'International Flight'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium shadow-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Real-Time Data</span>
                </div>
              </div>

              {/* Full Policy Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    Official Baggage Policy
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-inner">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto"
                    style={{ 
                      fontSize: '14px',
                      lineHeight: '1.8'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: policy.notes
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
                        .replace(/^###? (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3">$1</h3>')
                        .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-700 dark:text-gray-300">$1</li>')
                        .replace(/\n\n/g, '<br/><br/>')
                        .replace(/\|/g, '')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>

              {/* Source */}
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="flex items-center justify-center gap-2">
                  Source: 
                  <a 
                    href={policy.source.startsWith('http') ? policy.source : `https://${policy.source}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    {policy.source}
                  </a>
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaggagePolicyModalReal;

