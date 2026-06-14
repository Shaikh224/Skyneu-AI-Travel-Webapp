// src/lib/gemini.ts
// Enhanced Gemini API integration for AI-powered features

interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
}

interface SmartSuggestion {
  id: string;
  type: 'activity' | 'optimization' | 'budget' | 'timing' | 'safety' | 'weather';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  estimatedSavings?: number;
  timeImpact?: string;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Helper function to make Gemini API calls
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024, // Reduced for shorter responses
    }
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Generate checklist items (existing function)
export async function generateChecklistWithGemini(prompt: string, apiKey: string): Promise<string[]> {
  try {
    const text = await callGeminiAPI(prompt, apiKey);
    return text.split(/\n|,/).map((item: string) => item.trim()).filter(Boolean);
  } catch (error) {
    console.error('Error generating checklist:', error);
    return [];
  }
}

// Generate smart trip suggestions
export async function generateSmartSuggestions(
  destination: string,
  startDate: string,
  endDate: string,
  budget: number,
  memberCount: number,
  activities: any[],
  apiKey: string
): Promise<SmartSuggestion[]> {
  try {
    const activitiesInfo = activities.map(a => ({
      title: a.title,
      category: a.category,
      date: a.date,
      cost: a.cost,
      weatherDependent: a.weatherDependent
    }));

    const prompt = `
    As a smart travel AI, provide comprehensive suggestions for this ${destination} trip.
    
    Trip: ${destination} (${startDate} to ${endDate})
    Budget: $${budget} | Group: ${memberCount} people
    Current Activities: ${JSON.stringify(activitiesInfo)}
    
    JSON format:
    {
      "suggestions": [
        {
          "id": "unique-id",
          "type": "activity|optimization|budget|timing|safety|weather|transport|accommodation|food",
          "title": "Brief title (max 5 words)",
          "description": "One short sentence only",
          "priority": "high|medium|low",
          "action": "Quick action (optional)",
          "estimatedSavings": 0,
          "timeImpact": "Brief note (optional)"
        }
      ]
    }
    
    Focus areas - suggest specific places and options:
    - Must-visit places in ${destination} (museums, landmarks, neighborhoods)
    - Best transport options (local transit, ride-sharing, walking routes)
    - Recommended restaurants and local food spots
    - Accommodation upgrades or alternatives
    - Budget optimization strategies
    - Weather-appropriate activities
    - Safety and local customs
    - Hidden gems and local experiences
    
    Max 6 diverse suggestions. Include specific place names and transport options for ${destination}.
    Keep descriptions under 8 words each.`;

    const response = await callGeminiAPI(prompt, apiKey);
    
    // Try to parse JSON response with improved error handling
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Try to find and extract valid JSON
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suggestions || [];
      } else {
        // If no JSON found, try parsing the whole response
        const parsed = JSON.parse(cleanResponse);
        return parsed.suggestions || [];
      }
    } catch (parseError) {
      console.log('JSON parse failed, trying text extraction:', parseError);
      // Fallback: extract suggestions from text
      return parseTextSuggestions(response);
    }
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    return [];
  }
}

// Get weather insights for destination
export async function getWeatherInsights(
  destination: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<{ forecast: WeatherData[]; recommendations: string[] }> {
  try {
    const prompt = `
    Comprehensive weather analysis for ${destination} trip (${startDate} to ${endDate}).
    
    Calculate trip duration and provide detailed forecast. JSON format:
    {
      "forecast": [
        {
          "date": "YYYY-MM-DD",
          "condition": "sunny|cloudy|rainy|snowy|partly-cloudy|stormy",
          "temperature": 25,
          "humidity": 60,
          "windSpeed": 10,
          "description": "Weather summary for the day"
        }
      ],
      "recommendations": [
        "Smart packing advice based on weather patterns",
        "Activity timing suggestions",
        "Weather-specific travel tips",
        "Climate considerations for ${destination}"
      ]
    }
    
    Analyze typical weather patterns for ${destination} during this period.
    Cover the entire trip duration with daily forecasts.
    Provide 4-6 actionable recommendations based on expected conditions.
    `;

    const response = await callGeminiAPI(prompt, apiKey);
    
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return {
        forecast: parsed.forecast || [],
        recommendations: parsed.recommendations || []
      };
    } catch {
      return {
        forecast: [],
        recommendations: ['Check local weather before departure', 'Pack for variable conditions']
      };
    }
  } catch (error) {
    console.error('Error getting weather insights:', error);
    return {
      forecast: [],
      recommendations: ['Check local weather before departure']
    };
  }
}

// Generate budget analysis
export async function analyzeBudget(
  budget: number,
  activities: any[],
  expenses: any[],
  destination: string,
  apiKey: string
): Promise<{ utilizationPercentage: number; categoryBreakdown: Record<string, number>; recommendations: string[] }> {
  try {
    const activitySpent = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
    const expenseSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSpent = activitySpent + expenseSpent;
    const utilizationPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

    // Combine activities and expenses for category breakdown
    const categoryBreakdown = activities.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + (a.cost || 0);
      return acc;
    }, {} as Record<string, number>);

    // Add expenses to breakdown
    expenses.forEach(e => {
      const category = e.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (e.amount || 0);
    });

    const prompt = `
    Smart budget analysis for ${destination} trip:
    
    Total Budget: $${budget}
    Activities Cost: $${activitySpent} 
    Other Expenses: $${expenseSpent}
    Total Spent: $${totalSpent}
    Budget Usage: ${utilizationPercentage.toFixed(1)}%
    
    Category Breakdown: ${Object.entries(categoryBreakdown).map(([cat, amount]) => `${cat}: $${amount}`).join(', ')}
    
    Provide 4 SMART budget insights for ${destination}:
    1. Spending pattern analysis
    2. Cost optimization tip
    3. Local pricing insight for ${destination}
    4. Budget management advice
    
    Each tip should be one sentence, specific and actionable.
    `;

    const response = await callGeminiAPI(prompt, apiKey);
    const recommendations = response.split('\n')
      .map(r => r.trim().replace(/^\d+\.?\s*/, '').replace(/^-\s*/, ''))
      .filter(r => r.length > 15 && r.length < 100)
      .slice(0, 4);

    return {
      utilizationPercentage,
      categoryBreakdown,
      recommendations
    };
  } catch (error) {
    console.error('Error analyzing budget:', error);
    return {
      utilizationPercentage: 0,
      categoryBreakdown: {},
      recommendations: ['Track your expenses regularly', 'Compare prices before booking']
    };
  }
}

// Fallback function to parse text suggestions
function parseTextSuggestions(text: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  
  // Try to extract JSON objects from the text first
  const jsonObjectRegex = /\{\s*"id":\s*"[^"]+",[\s\S]*?\}/g;
  const jsonMatches = text.match(jsonObjectRegex);
  
  if (jsonMatches) {
    jsonMatches.forEach((match) => {
      try {
        const suggestion = JSON.parse(match);
        if (suggestion.id && suggestion.title) {
          suggestions.push({
            id: suggestion.id,
            type: suggestion.type || 'activity',
            title: suggestion.title,
            description: suggestion.description || '',
            priority: suggestion.priority || 'medium',
            action: suggestion.action,
            estimatedSavings: suggestion.estimatedSavings || 0,
            timeImpact: suggestion.timeImpact
          });
        }
      } catch (e) {
        console.log('Failed to parse suggestion JSON:', match);
      }
    });
    
    if (suggestions.length > 0) {
      return suggestions.slice(0, 6); // Limit to 6 suggestions
    }
  }
  
  // Fallback to line-by-line parsing if JSON extraction fails
  const lines = text.split('\n').filter(line => line.trim());
  let currentSuggestion: Partial<SmartSuggestion> = {};
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('suggestion') || trimmed.includes('1.') || trimmed.includes('2.')) {
      if (currentSuggestion.title) {
        suggestions.push(currentSuggestion as SmartSuggestion);
      }
      currentSuggestion = {
        id: `suggestion-${index}`,
        type: 'optimization',
        title: trimmed.replace(/^\d+\./, '').replace(/suggestion/i, '').trim(),
        description: '',
        priority: 'medium'
      };
    } else if (trimmed && currentSuggestion.title) {
      currentSuggestion.description = (currentSuggestion.description || '') + ' ' + trimmed;
    }
  });
  
  if (currentSuggestion.title) {
    suggestions.push(currentSuggestion as SmartSuggestion);
  }
  
  return suggestions;
}
