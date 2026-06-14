import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow your Vite dev server
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Perplexity AI Sonar Pro proxy endpoint
app.post('/api/sonar-pro', async (req, res) => {
  try {
    const sonarKey = process.env.SONAR_PRO_API_KEY;
    
    if (!sonarKey) {
      return res.status(500).json({ 
        error: 'API key not configured' 
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sonarKey}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Perplexity API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Gemini AI proxy endpoint (optional, for consistency)
app.post('/api/gemini', async (req, res) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured' 
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Gemini API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Visa requirements endpoint using Perplexity Sonar Pro
app.post('/api/visa-requirements', async (req, res) => {
  try {
    const { fromCountry, toCountry, travelPurpose, stayDuration } = req.body;
    
    if (!fromCountry || !toCountry) {
      return res.status(400).json({ 
        error: 'Both fromCountry and toCountry are required' 
      });
    }

    const sonarKey = process.env.SONAR_PRO_API_KEY;
    
    if (!sonarKey) {
      return res.status(500).json({ 
        error: 'API key not configured' 
      });
    }

    // Create a detailed prompt for visa requirements
    const prompt = `Please provide detailed visa requirements for a citizen of ${fromCountry} traveling to ${toCountry} for ${travelPurpose || 'tourism'} purposes${stayDuration ? ` for ${stayDuration} days` : ''}. 

Include the following information in JSON format:
{
  "country": "${toCountry}",
  "countryCode": "XX",
  "flag": "🏳️",
  "requirement": "visa-free|visa-required|visa-on-arrival|eta-required",
  "maxStay": "X days",
  "processingTime": "X hours/days (if applicable)",
  "cost": "$X USD (if applicable)",
  "documents": ["document1", "document2"],
  "officialLinks": ["https://embassy-url1.gov", "https://immigration-url2.gov"],
  "aiInsights": {
    "difficulty": "easy|moderate|complex",
    "successRate": 95,
    "tips": ["tip1", "tip2"],
    "warnings": ["warning1", "warning2"] (if any)
  },
  "recentChanges": "any recent policy changes (if any)"
}

Please ensure all information is current and accurate as of July 2025. Focus on official government sources, embassy websites, and immigration department websites. Include at least 2-3 official website links for visa applications, embassy information, or immigration departments.`;

    const sonarRequest = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "You are a visa requirements expert with access to the latest immigration policies and official government sources. Always provide accurate, up-to-date visa information in the requested JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      top_p: 0.9,
      return_citations: true,
      search_recency_filter: "month"
    };

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sonarKey}`,
      },
      body: JSON.stringify(sonarRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Perplexity API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // Extract the JSON from the response
    let visaInfo;
    try {
      const content = data.choices[0].message.content;
      
      // Helper function to get country flag emoji
      const getCountryFlag = (countryName) => {
        const flagMap = {
          'united states': '🇺🇸', 'usa': '🇺🇸', 'america': '🇺🇸',
          'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'britain': '🇬🇧', 'england': '🇬🇧',
          'japan': '🇯🇵', 'germany': '🇩🇪', 'australia': '🇦🇺', 'canada': '🇨🇦',
          'france': '🇫🇷', 'singapore': '🇸🇬', 'china': '🇨🇳', 'india': '🇮🇳',
          'brazil': '🇧🇷', 'russia': '🇷🇺', 'south korea': '🇰🇷', 'korea': '🇰🇷',
          'italy': '🇮🇹', 'spain': '🇪🇸', 'netherlands': '🇳🇱', 'thailand': '🇹🇭',
          'vietnam': '🇻🇳', 'malaysia': '🇲🇾', 'indonesia': '🇮🇩', 'philippines': '🇵🇭',
          'turkey': '🇹🇷', 'egypt': '🇪🇬', 'south africa': '🇿🇦', 'mexico': '🇲🇽',
          'uae': '🇦🇪', 'united arab emirates': '🇦🇪', 'saudi arabia': '🇸🇦',
          'new zealand': '🇳🇿', 'switzerland': '🇨🇭', 'sweden': '🇸🇪', 'norway': '🇳🇴'
        };
        return flagMap[countryName.toLowerCase().trim()] || '🏳️';
      };

      const getCountryCode = (countryName) => {
        const codeMap = {
          'united states': 'US', 'usa': 'US', 'america': 'US',
          'united kingdom': 'GB', 'uk': 'GB', 'britain': 'GB', 'england': 'GB',
          'japan': 'JP', 'germany': 'DE', 'australia': 'AU', 'canada': 'CA',
          'france': 'FR', 'singapore': 'SG', 'china': 'CN', 'india': 'IN',
          'brazil': 'BR', 'russia': 'RU', 'south korea': 'KR', 'korea': 'KR',
          'italy': 'IT', 'spain': 'ES', 'netherlands': 'NL', 'thailand': 'TH',
          'vietnam': 'VN', 'malaysia': 'MY', 'indonesia': 'ID', 'philippines': 'PH',
          'turkey': 'TR', 'egypt': 'EG', 'south africa': 'ZA', 'mexico': 'MX',
          'uae': 'AE', 'united arab emirates': 'AE', 'saudi arabia': 'SA',
          'new zealand': 'NZ', 'switzerland': 'CH', 'sweden': 'SE', 'norway': 'NO'
        };
        return codeMap[countryName.toLowerCase().trim()] || 'XX';
      };
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        visaInfo = JSON.parse(jsonMatch[0]);
        
        // Ensure required fields are present and properly formatted
        visaInfo.country = visaInfo.country || toCountry;
        visaInfo.countryCode = visaInfo.countryCode || getCountryCode(toCountry);
        visaInfo.flag = visaInfo.flag || getCountryFlag(toCountry);
        
        // Ensure aiInsights structure
        if (!visaInfo.aiInsights) {
          visaInfo.aiInsights = {
            difficulty: 'moderate',
            successRate: 85,
            tips: [],
            warnings: []
          };
        }
        
        // Ensure arrays are present
        if (!visaInfo.documents) visaInfo.documents = ['Valid passport', 'Check embassy requirements'];
        if (!visaInfo.aiInsights.tips) visaInfo.aiInsights.tips = [];
        if (!visaInfo.aiInsights.warnings) visaInfo.aiInsights.warnings = [];
        
      } else {
        // If no JSON found, create a structured response from the text
        visaInfo = {
          country: toCountry,
          countryCode: getCountryCode(toCountry),
          flag: getCountryFlag(toCountry),
          requirement: content.toLowerCase().includes('visa-free') ? 'visa-free' :
                      content.toLowerCase().includes('visa on arrival') ? 'visa-on-arrival' :
                      content.toLowerCase().includes('eta') || content.toLowerCase().includes('electronic') ? 'eta-required' :
                      'visa-required',
          maxStay: "Check with embassy",
          documents: ["Valid passport", "Check embassy requirements"],
          aiInsights: {
            difficulty: "moderate",
            successRate: 85,
            tips: [content.slice(0, 200) + "..."],
            warnings: []
          }
        };
      }
      
      // Add citations if available
      if (data.citations && data.citations.length > 0) {
        visaInfo.officialLinks = data.citations.map(citation => citation.url).slice(0, 3);
      } else if (!visaInfo.officialLinks || visaInfo.officialLinks.length === 0) {
        // Add default embassy/government links if no citations
        const countryLower = toCountry.toLowerCase();
        const defaultLinks = [];
        
        if (countryLower.includes('united states') || countryLower.includes('usa')) {
          defaultLinks.push('https://travel.state.gov/', 'https://esta.cbp.dhs.gov/');
        } else if (countryLower.includes('united kingdom') || countryLower.includes('uk')) {
          defaultLinks.push('https://www.gov.uk/check-uk-visa', 'https://www.gov.uk/government/organisations/uk-visas-and-immigration');
        } else if (countryLower.includes('canada')) {
          defaultLinks.push('https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html');
        } else if (countryLower.includes('australia')) {
          defaultLinks.push('https://immi.homeaffairs.gov.au/visas');
        } else if (countryLower.includes('germany')) {
          defaultLinks.push('https://www.germany.travel/en/planning/entry-requirements.html');
        } else if (countryLower.includes('japan')) {
          defaultLinks.push('https://www.mofa.go.jp/j_info/visit/visa/index.html');
        } else if (countryLower.includes('singapore')) {
          defaultLinks.push('https://www.ica.gov.sg/enter-depart/entry_requirements');
        }
        
        if (defaultLinks.length > 0) {
          visaInfo.officialLinks = defaultLinks;
        }
      }
      
    } catch (parseError) {
      console.error('Error parsing visa info:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse visa information',
        details: parseError.message 
      });
    }

    res.json({
      success: true,
      data: [visaInfo], // Return as array to match frontend expectation
      citations: data.citations || []
    });

  } catch (error) {
    console.error('Visa API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
