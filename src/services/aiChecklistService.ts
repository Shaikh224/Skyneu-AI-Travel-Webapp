import { ChecklistItem } from '../types/trip';

export interface ChecklistGenerationRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  tripType: string;
  activities: string[];
  accommodation: string;
  budget: number;
  currency: string;
}

export interface ChecklistGenerationResponse {
  success: boolean;
  items?: ChecklistItem[];
  error?: string;
}

class AIChecklistService {
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  private sonarApiKey: string;

  constructor() {
    this.sonarApiKey = import.meta.env.VITE_SONAR_API_KEY || '';
  }

  private getSystemPrompt(): string {
    return `You are an expert travel planner specializing in creating comprehensive, practical checklists for travelers. 

Your task is to generate a detailed, categorized checklist for a specific trip based on the provided information. The checklist should be practical, actionable, and tailored to the destination, trip duration, and traveler profile.

IMPORTANT GUIDELINES:
1. Generate ONLY a valid JSON array of checklist items
2. Each item must have: title, description, category, priority, dueDate
3. Categories: preparation, packing, travel, accommodation, activities, documents, health, other
4. Priorities: low, medium, high
5. Due dates should be relative to trip start (e.g., "2 weeks before", "1 day before", "day of")
6. Be specific and practical - avoid generic items
7. Consider destination-specific requirements (visas, vaccinations, cultural norms)
8. Include both pre-trip and during-trip items
9. Consider the number of travelers and trip type
10. Include safety and emergency items

JSON FORMAT:
[
  {
    "title": "Item title",
    "description": "Detailed description of what needs to be done",
    "category": "preparation|packing|travel|accommodation|activities|documents|health|other",
    "priority": "low|medium|high",
    "dueDate": "2 weeks before|1 week before|3 days before|1 day before|day of|during trip"
  }
]

Generate 15-25 practical, actionable checklist items that cover all aspects of the trip.`;
  }

  async generateChecklist(request: ChecklistGenerationRequest): Promise<ChecklistGenerationResponse> {
    if (!this.sonarApiKey) {
      return {
        success: false,
        error: 'API key not configured. Please check your environment variables.'
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sonarApiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt()
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          top_p: 0.9,
          return_citations: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sonar API Error:', response.status, errorText);
        return {
          success: false,
          error: `API error: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      const parsedItems = this.parseChecklistResponse(content);
      
      if (parsedItems.length === 0) {
        return {
          success: false,
          error: 'No valid checklist items could be generated from the AI response'
        };
      }

      return {
        success: true,
        items: parsedItems
      };

    } catch (error) {
      console.error('Checklist generation error:', error);
      return {
        success: false,
        error: `Failed to generate checklist: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildPrompt(request: ChecklistGenerationRequest): string {
    const duration = this.calculateDuration(request.startDate, request.endDate);
    
    return `Generate a comprehensive travel checklist for the following trip:

DESTINATION: ${request.destination}
DURATION: ${duration} days (${request.startDate} to ${request.endDate})
TRAVELERS: ${request.travelers} ${request.travelers === 1 ? 'person' : 'people'}
TRIP TYPE: ${request.tripType}
ACCOMMODATION: ${request.accommodation}
BUDGET: ${request.currency} ${request.budget.toLocaleString()}
PLANNED ACTIVITIES: ${request.activities.join(', ')}

Please generate a practical, comprehensive checklist that covers:
- Pre-trip preparation (documents, bookings, research)
- Packing essentials (clothing, gear, electronics)
- Travel logistics (transportation, accommodation)
- Activities and experiences
- Health and safety considerations
- Destination-specific requirements

Focus on practical, actionable items that travelers actually need to remember. Consider the destination, duration, and trip type when generating items.`;
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private parseChecklistResponse(content: string): ChecklistItem[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const items = JSON.parse(jsonStr);
        
        // Validate and transform items
        return items
          .filter((item: any) => 
            item.title && 
            item.description && 
            item.category && 
            item.priority && 
            item.dueDate
          )
          .map((item: any) => ({
            title: item.title.trim(),
            description: item.description.trim(),
            category: item.category.toLowerCase(),
            priority: item.priority.toLowerCase(),
            dueDate: item.dueDate.trim(),
            completed: false,
            id: '', // Will be set when saving to database
            tripId: '', // Will be set when saving to database
            addedBy: '', // Will be set when saving to database
            createdAt: new Date().toISOString()
          }));
      }
      
      // Fallback: try to parse the entire content as JSON
      const items = JSON.parse(content);
      return Array.isArray(items) ? items : [];
      
    } catch (error) {
      console.error('Failed to parse checklist response:', error);
      console.log('Raw content:', content);
      return [];
    }
  }
}

export const aiChecklistService = new AIChecklistService();
