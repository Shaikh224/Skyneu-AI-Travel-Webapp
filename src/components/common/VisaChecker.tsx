import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, AlertTriangle, CheckCircle, Clock, FileText, Globe, Brain, Sparkles, Info, Camera, Upload, AlertCircle, ClipboardList, Download, MessageCircle, TrendingUp, DollarSign, Route, Bell } from 'lucide-react';
import jsPDF from 'jspdf';
import { visaAIService, VisaRequirement, TravelerProfile, VisaContext, RiskAssessment, CostBreakdown, SmartAlert, VisaAlternative } from '@/services/visaAIService';

interface DocumentChecklistItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  notes?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

// Utility function to format chat messages with basic markdown-like formatting
const formatChatMessage = (message: string): React.ReactNode => {
  // Split by lines and process each line
  const lines = message.split('\n');
  
  return lines.map((line, index) => {
    // Handle bold text (**text**)
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return (
        <div key={index} className="flex items-start gap-2 my-1">
          <span className="text-skyneu-blue mt-1">•</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•-]\s*/, '') }} />
        </div>
      );
    }
    
    // Handle numbered lists
    if (line.trim().match(/^\d+\./)) {
      return (
        <div key={index} className="flex items-start gap-2 my-1">
          <span className="text-skyneu-blue font-medium">{line.match(/^\d+\./)![0]}</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s*/, '') }} />
        </div>
      );
    }
    
    // Handle headers (lines with emojis at start)
    if (line.trim().match(/^[📋🔄📄💰⚠️🔗💡]/)) {
      return (
        <div key={index} className="font-semibold text-skyneu-dark dark:text-dark-text my-2">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </div>
      );
    }
    
    // Regular lines
    if (line.trim()) {
      return (
        <div key={index} className="my-1">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </div>
      );
    }
    
    // Empty lines for spacing
    return <div key={index} className="h-2" />;
  });
};

const VisaChecker: React.FC = () => {
  // Basic form state
  const [fromCountry, setFromCountry] = useState('');
  const [toCountry, setToCountry] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [stayDuration, setStayDuration] = useState('');
  const [travelPurpose, setTravelPurpose] = useState('tourism');
  
  // User location and preferences
  const [userLocation, setUserLocation] = useState<{country: string; currency: string; countryCode: string} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Enhanced traveler profile
  const [travelerProfile] = useState<Partial<TravelerProfile>>({
    nationality: '',
    currentLocation: '',
    travelPurpose: 'tourism',
    visaHistory: [],
    hasSchengenHistory: false,
    isStudent: false,
    employmentStatus: 'employed',
    financialStatus: 'stable'
  });

  // UI state
  const [showResults, setShowResults] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);
  const [showDocumentChecklist, setShowDocumentChecklist] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'costs' | 'alternatives' | 'chat'>('overview');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results state
  const [visaResult, setVisaResult] = useState<VisaRequirement | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [alternatives, setAlternatives] = useState<VisaAlternative[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklistItem[]>([]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Initialize user location and mobile detection
  useEffect(() => {
    const initializeUserContext = async () => {
      try {
        // Detect user location
        const locationInfo = await visaAIService.getUserLocationInfo();
        setUserLocation(locationInfo);
        
        // Set default from country to user's location
        if (!fromCountry && locationInfo.country) {
          setFromCountry(locationInfo.country);
        }
      } catch (error) {
        console.warn('Could not detect user location:', error);
      }
    };

    const detectMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    initializeUserContext();
    detectMobile();

    // Listen for window resize
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, [fromCountry]);

  const popularCountries = [
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Singapore', code: 'SG', flag: '🇸🇬' }
  ];

  const getRequirementColor = (requirement: string) => {
    switch (requirement) {
      case 'visa-free':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-400';
      case 'eta-required':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-400';
      case 'visa-on-arrival':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-400';
      case 'visa-required':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800/50 text-gray-800 dark:text-gray-400';
    }
  };

  const getRequirementIcon = (requirement: string) => {
    switch (requirement) {
      case 'visa-free':
        return <CheckCircle className="h-4 w-4" />;
      case 'eta-required':
        return <FileText className="h-4 w-4" />;
      case 'visa-on-arrival':
        return <Clock className="h-4 w-4" />;
      case 'visa-required':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 dark:text-green-400';
      case 'moderate':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'complex':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleSearch = async () => {
    if (!fromCountry || !toCountry) return;
    
    setLoading(true);
    setError(null);
    setShowResults(true);
    
    try {
      // Build traveler context
      const context: VisaContext = {
        traveler: {
          nationality: fromCountry,
          currentLocation: fromCountry,
          travelPurpose,
          passportExpiry: travelerProfile.passportExpiry,
          visaHistory: travelerProfile.visaHistory || [],
          previousRefusals: travelerProfile.previousRefusals || [],
          hasSchengenHistory: travelerProfile.hasSchengenHistory || false,
          isStudent: travelPurpose === 'study' || travelerProfile.isStudent || false,
          employmentStatus: travelerProfile.employmentStatus || 'employed',
          financialStatus: travelerProfile.financialStatus || 'stable'
        },
        destination: toCountry,
        travelDate,
        stayDuration,
        tripType: travelerProfile.visaHistory && travelerProfile.visaHistory.length > 0 ? 'return' : 'first-time'
      };

      // Get comprehensive visa information
      const visa = await visaAIService.getComprehensiveVisaInfo(context);
      setVisaResult(visa);

      // Get additional insights in parallel
      const [
        riskData,
        costData,
        alternativeData,
        alertData,
        dynamicDocs
      ] = await Promise.all([
        visaAIService.assessVisaRisk(context),
        visaAIService.getPersonalizedCostBreakdown(context),
        visaAIService.getVisaAlternatives(context),
        visaAIService.generateSmartAlerts(context, visa),
        visaAIService.getDynamicDocumentChecklist(context, visa)
      ]);

      setRiskAssessment(riskData);
      setCostBreakdown(costData);
      setAlternatives(alternativeData);
      setSmartAlerts(alertData);
      
      // Create dynamic document checklist
      const checklist = dynamicDocs.map((doc, index) => ({
        id: `doc-${index}`,
        name: doc,
        description: `Required for ${context.traveler.nationality} citizens traveling to ${context.destination} for ${travelPurpose}`,
        required: true,
        completed: false,
        notes: ''
      }));
      setDocumentChecklist(checklist);

      // Add welcome chat message
      setChatMessages([{
        id: 'welcome',
        type: 'ai',
        message: `👋 Hi! I'm your AI visa assistant. I can help answer specific questions about your ${toCountry} visa application. What would you like to know?`,
        timestamp: new Date()
      }]);
      
    } catch (err) {
      console.error('Visa search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch visa requirements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Chat functionality
  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !visaResult) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const context: VisaContext = {
        traveler: {
          nationality: fromCountry,
          currentLocation: fromCountry,
          travelPurpose,
          passportExpiry: travelerProfile.passportExpiry,
          visaHistory: travelerProfile.visaHistory || [],
          previousRefusals: travelerProfile.previousRefusals || [],
          hasSchengenHistory: travelerProfile.hasSchengenHistory || false,
          isStudent: travelPurpose === 'study' || travelerProfile.isStudent || false,
          employmentStatus: travelerProfile.employmentStatus || 'employed',
          financialStatus: travelerProfile.financialStatus || 'stable'
        },
        destination: toCountry,
        travelDate,
        stayDuration,
        tripType: 'first-time'
      };

      const aiResponse = await visaAIService.chatWithVisaAI(chatInput, context);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        message: "I'm sorry, I couldn't process your question right now. Please try again or check official embassy websites.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Document checklist functions

  const toggleChecklistItem = (id: string) => {
    setDocumentChecklist(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const updateChecklistNotes = (id: string, notes: string) => {
    setDocumentChecklist(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, notes }
          : item
      )
    );
  };

  const downloadChecklist = () => {
    const completedItems = documentChecklist.filter(item => item.completed).length;
    const totalItems = documentChecklist.length;
    
    // Create PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };
    
    // Add header with gradient effect simulation
    pdf.setFillColor(31, 81, 255); // Skyneu blue
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Add white text on blue background
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VISA DOCUMENT CHECKLIST', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.text(toCountry.toUpperCase(), pageWidth / 2, 30, { align: 'center' });
    
    yPosition = 55;
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Add generation info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 8;
    
    // Add progress bar
    const progressWidth = 100;
    const progressHeight = 8;
    const progressX = 20;
    const progressY = yPosition;
    
    // Progress bar background
    pdf.setFillColor(230, 230, 230);
    pdf.rect(progressX, progressY, progressWidth, progressHeight, 'F');
    
    // Progress bar fill
    const fillWidth = (completedItems / totalItems) * progressWidth;
    pdf.setFillColor(34, 197, 94); // Green
    pdf.rect(progressX, progressY, fillWidth, progressHeight, 'F');
    
    // Progress text
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Progress: ${completedItems}/${totalItems} items completed (${Math.round((completedItems / totalItems) * 100)}%)`, progressX + progressWidth + 10, progressY + 6);
    
    yPosition += 25;
    
    // Add flag emoji simulation (replace with country name)
    pdf.setFillColor(240, 248, 255);
    pdf.rect(15, yPosition, pageWidth - 30, 15, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 81, 255);
    pdf.text(`📋 Destination: ${toCountry}`, 20, yPosition + 10);
    
    yPosition += 30;
    
    // Add checklist items
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Document Checklist:', 20, yPosition);
    yPosition += 15;
    
    documentChecklist.forEach((item) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Item checkbox
      const checkboxSize = 6;
      const checkboxX = 20;
      const checkboxY = yPosition - 4;
      
      if (item.completed) {
        // Filled checkbox
        pdf.setFillColor(34, 197, 94); // Green
        pdf.rect(checkboxX, checkboxY, checkboxSize, checkboxSize, 'F');
        // Checkmark
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('✓', checkboxX + 1.5, checkboxY + 4.5);
      } else {
        // Empty checkbox
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(150, 150, 150);
        pdf.rect(checkboxX, checkboxY, checkboxSize, checkboxSize);
      }
      
      // Item name and required badge
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const itemNameY = yPosition;
      pdf.text(item.name, checkboxX + checkboxSize + 8, itemNameY);
      
      // Required badge
      if (item.required) {
        const badgeX = checkboxX + checkboxSize + 8 + pdf.getTextWidth(item.name) + 5;
        pdf.setFillColor(239, 68, 68); // Red
        pdf.roundedRect(badgeX, itemNameY - 8, 20, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.text('REQUIRED', badgeX + 1, itemNameY - 3);
      }
      
      yPosition += 8;
      
      // Item description
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(item.description, checkboxX + checkboxSize + 8, yPosition, pageWidth - 50, 10);
      
      // Notes if any
      if (item.notes && item.notes.trim()) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        yPosition = addText(`Notes: ${item.notes}`, checkboxX + checkboxSize + 8, yPosition + 3, pageWidth - 50, 9);
      }
      
      yPosition += 12;
    });
    
    // Add official links section
    if (visaResult?.officialLinks && visaResult.officialLinks.length > 0) {
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Official links header
      pdf.setFillColor(240, 248, 255);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 15, 'F');
      pdf.setTextColor(31, 81, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🔗 Official Sources & Links:', 20, yPosition + 5);
      yPosition += 20;
      
      visaResult.officialLinks
        .filter((link: any) => link && typeof link === 'string')
        .forEach((link: string) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setTextColor(31, 81, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          // Add bullet point
          pdf.text('•', 20, yPosition);
          
          // Add link (make it look clickable)
          const linkText = link.replace('https://', '').replace('http://', '');
          yPosition = addText(linkText, 30, yPosition, pageWidth - 50, 10);
          yPosition += 2;
        });
    }
    
    // Add footer
    const footerY = pageHeight - 20;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, footerY - 5, pageWidth, 25, 'F');
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated by Skynfull AI Visa Checker', pageWidth / 2, footerY, { align: 'center' });
    pdf.text(`© ${new Date().getFullYear()} Skynfull - Your Intelligent Travel Companion`, pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Save the PDF
    pdf.save(`visa-checklist-${toCountry.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className={`space-y-4 ${isMobile ? 'px-2' : 'space-y-8'}`}>
      {/* AI Disclaimer Warning */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700/50 rounded-xl p-4 shadow-md">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm mb-1">
              ⚠️ Important: Verify All Information
            </h3>
            <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
              This tool uses AI to provide visa information and may occasionally make mistakes. Always verify requirements with official government sources, embassies, or consulates before making travel plans or applying for a visa.
            </p>
          </div>
        </div>
      </div>

      {/* User Location Banner */}
      {userLocation && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3 text-center">
          <div className="text-sm text-green-800 dark:text-green-300">
            📍 Detected location: <span className="font-semibold">{userLocation.country}</span>
            {userLocation.currency && (
              <span className="ml-2">💰 Currency: <span className="font-semibold">{userLocation.currency}</span></span>
            )}
          </div>
        </div>
      )}
      
      {/* Search Form */}
      {!showResults && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-skyneu-light/20 to-skyneu-blue/5 dark:from-dark-surface dark:via-dark-surface/80 dark:to-dark-bg rounded-3xl"></div>
          <div className={`relative bg-white/90 dark:bg-dark-surface/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 dark:border-dark-border ${isMobile ? 'p-4' : 'p-4 sm:p-6 lg:p-8'}`}>
            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center'} justify-between mb-6 gap-4`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-sm font-medium border border-skyneu-blue/20 dark:border-skyneu-blue/30">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI-Powered Visa Intelligence</span>
                <span className="sm:hidden">AI Visa Check</span>
              </div>
              <div className={`text-xs text-skyneu-text dark:text-dark-text-secondary ${isMobile ? 'text-center' : 'text-center sm:text-right'}`}>
                <div className="font-medium">Real-time visa requirements</div>
                <div className="text-skyneu-green">✓ Updated daily from official sources</div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Country Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Your Nationality</label>
                  <div className="relative group">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                    <input
                      type="text"
                      value={fromCountry}
                      onChange={(e) => setFromCountry(e.target.value)}
                      placeholder="Select your country"
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-skyneu-dark dark:text-dark-text placeholder-skyneu-text dark:placeholder-dark-text-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Destination Country</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                    <input
                      type="text"
                      value={toCountry}
                      onChange={(e) => setToCountry(e.target.value)}
                      placeholder="Where are you traveling?"
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-skyneu-dark dark:text-dark-text placeholder-skyneu-text dark:placeholder-dark-text-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Travel Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Travel Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-skyneu-dark dark:text-dark-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Stay Duration</label>
                  <select
                    value={stayDuration}
                    onChange={(e) => setStayDuration(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-skyneu-dark dark:text-dark-text"
                  >
                    <option value="">Select duration</option>
                    <option value="1-7">1-7 days</option>
                    <option value="8-30">8-30 days</option>
                    <option value="31-90">31-90 days</option>
                    <option value="90+">More than 90 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Purpose of Travel</label>
                  <select
                    value={travelPurpose}
                    onChange={(e) => setTravelPurpose(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-skyneu-dark dark:text-dark-text"
                  >
                    <option value="tourism">Tourism</option>
                    <option value="business">Business</option>
                    <option value="transit">Transit</option>
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading || !fromCountry || !toCountry}
                className={`w-full bg-gradient-to-r from-skyneu-blue to-skyneu-blue/80 hover:from-skyneu-blue/90 hover:to-skyneu-blue/70 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${(!fromCountry || !toCountry) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Search className="h-6 w-6" />
                <span>Check Visa Requirements</span>
                <Brain className="h-5 w-5" />
              </button>
            </div>

            {/* Popular Destinations */}
            <div className="mt-8">
              <h3 className="font-bold text-skyneu-dark dark:text-dark-text mb-4 flex items-center gap-2">
                <span>🌍</span>
                Popular Destinations
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {popularCountries.map((country, index) => (
                  <button
                    key={index}
                    onClick={() => setToCountry(country.name)}
                    className="flex flex-col items-center p-3 border border-gray-200 dark:border-dark-border rounded-xl hover:border-skyneu-blue hover:bg-skyneu-blue/5 dark:hover:bg-skyneu-blue/10 transition-all duration-300 group bg-white dark:bg-dark-surface"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{country.flag}</span>
                    <span className="text-xs font-medium text-skyneu-dark dark:text-dark-text text-center">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Results Section */}
      {showResults && (
        <div className="space-y-6">
          {/* Results Header + New Search Button */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-dark-border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-6 w-6 text-skyneu-blue" />
                <h2 className="text-2xl font-bold text-skyneu-dark dark:text-dark-text">AI-Powered Visa Analysis</h2>
              </div>
              <p className="text-skyneu-text dark:text-dark-text-secondary">
                Comprehensive analysis with personalized insights, risk assessment, and smart recommendations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { 
                  setShowResults(false); 
                  setError(null); 
                  setVisaResult(null);
                  setChatMessages([]);
                }}
                className="px-5 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl font-semibold shadow hover:from-skyneu-blue/90 hover:to-skyneu-green/80 transition-all"
              >
                New Search
              </button>
            </div>
          </div>

          {/* Smart Alerts Banner */}
          {smartAlerts.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-800 dark:text-orange-300">Smart Alerts</span>
              </div>
              <div className="space-y-2">
                {smartAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-2 p-2 rounded-lg ${
                    alert.urgency === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                    alert.urgency === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation - Mobile Responsive */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-100 dark:border-dark-border overflow-hidden">
            <div className="border-b border-gray-100 dark:border-dark-border">
              <div className={`flex ${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}`}>
                {[
                  { id: 'overview', label: isMobile ? 'Info' : 'Overview', icon: Info },
                  { id: 'documents', label: isMobile ? 'Docs' : 'Documents', icon: FileText },
                  { id: 'costs', label: 'Costs', icon: DollarSign },
                  { id: 'alternatives', label: isMobile ? 'Alt' : 'Alternatives', icon: Route },
                  { id: 'chat', label: isMobile ? 'Chat' : 'AI Chat', icon: MessageCircle }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-skyneu-blue text-skyneu-blue bg-skyneu-blue/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {isMobile ? '' : tab.label}
                    {isMobile && <span className="text-xs">{tab.label}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <Brain className="h-8 w-8 text-skyneu-blue animate-spin mr-3" />
                  <span className="text-lg font-medium text-skyneu-dark dark:text-dark-text">Analyzing visa requirements...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-10">
                  <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                  <span className="text-lg font-medium text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === 'overview' && visaResult && (
                <div className="space-y-6">
                  {/* Main Visa Info Card */}
                  <div className="border border-gray-200 dark:border-dark-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{visaResult.flag}</span>
                      <div>
                        <h3 className="font-bold text-lg text-skyneu-dark dark:text-dark-text">{visaResult.country}</h3>
                        <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">Max stay: {visaResult.maxStay}</p>
                      </div>
                    </div>

                    {/* Requirement Status */}
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium mb-4 ${getRequirementColor(visaResult.requirement)}`}>
                      {getRequirementIcon(visaResult.requirement)}
                      <span className="capitalize">{visaResult.requirement.replace('-', ' ')}</span>
                    </div>

                    {/* Processing Info */}
                    {(visaResult.processingTime || visaResult.cost) && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {visaResult.processingTime && (
                          <div>
                            <div className="text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1">Processing Time</div>
                            <div className="text-sm text-skyneu-text dark:text-dark-text-secondary">{visaResult.processingTime}</div>
                          </div>
                        )}
                        {visaResult.cost && (
                          <div>
                            <div className="text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1">Cost</div>
                            <div className="text-sm text-skyneu-text dark:text-dark-text-secondary">{visaResult.cost}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk Assessment */}
                    {riskAssessment && (
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-blue-800 dark:text-blue-300">Approval Assessment</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Success Probability</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{riskAssessment.approvalChance}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Recommended Approach</div>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">{riskAssessment.recommendedApproach}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Insights */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-skyneu-blue" />
                        <span className="font-semibold text-skyneu-dark dark:text-dark-text">AI Insights</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-skyneu-text dark:text-dark-text-secondary">Difficulty Level</span>
                          <span className={`text-sm font-medium capitalize ${getDifficultyColor(visaResult.aiInsights.difficulty)}`}>{visaResult.aiInsights.difficulty}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-skyneu-text dark:text-dark-text-secondary">Success Rate</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">{visaResult.aiInsights.successRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Tips */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-skyneu-dark dark:text-dark-text mb-3">Personalized Tips</h4>
                      <div className="space-y-2">
                        {visaResult.aiInsights.tips.slice(0, 3).map((tip, tipIndex) => (
                          <div key={tipIndex} className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-skyneu-blue flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-skyneu-text dark:text-dark-text-secondary">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Embassy Info */}
                    {visaResult.embassyInfo && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-skyneu-dark dark:text-dark-text mb-3">Embassy Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Location:</span> {visaResult.embassyInfo.location}
                          </div>
                          <div>
                            <span className="font-medium">Wait Time:</span> {visaResult.embassyInfo.appointments?.waitTime || 'Contact embassy'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && visaResult && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text">Document Checklist</h3>
                    <button
                      onClick={downloadChecklist}
                      className="px-4 py-2 bg-skyneu-green text-white rounded-lg hover:bg-skyneu-green/90 transition-colors flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {documentChecklist.map((item) => (
                      <div key={item.id} className="border border-gray-200 dark:border-dark-border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleChecklistItem(item.id)}
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-skyneu-blue'
                            }`}
                          >
                            {item.completed && <CheckCircle className="h-3 w-3" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-skyneu-dark dark:text-dark-text'}`}>
                                {item.name}
                              </h4>
                              {item.required && (
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mb-3">
                              {item.description}
                            </p>
                            <textarea
                              placeholder="Add notes..."
                              value={item.notes || ''}
                              onChange={(e) => updateChecklistNotes(item.id, e.target.value)}
                              className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm resize-none bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text placeholder-skyneu-text dark:placeholder-dark-text-secondary"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Costs Tab */}
              {activeTab === 'costs' && costBreakdown && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text">Complete Cost Breakdown</h3>
                    {userLocation && costBreakdown.convertedTotal && (
                      <div className="text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                        💰 Converted to {userLocation.currency}
                      </div>
                    )}
                  </div>
                  
                  <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-skyneu-dark dark:text-dark-text">Official Fees</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Visa Fee</span>
                          <div className="text-right">
                            <span className="font-medium">{costBreakdown.currency} {costBreakdown.visaFee}</span>
                            {userLocation && costBreakdown.convertedFees && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                ~{userLocation.currency} {costBreakdown.convertedFees.visaFee}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Biometric Fee</span>
                          <div className="text-right">
                            <span className="font-medium">{costBreakdown.currency} {costBreakdown.biometrics}</span>
                            {userLocation && costBreakdown.convertedFees && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                ~{userLocation.currency} {costBreakdown.convertedFees.biometrics}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Courier/Service</span>
                          <div className="text-right">
                            <span className="font-medium">{costBreakdown.currency} {costBreakdown.courier}</span>
                            {userLocation && costBreakdown.convertedFees && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                ~{userLocation.currency} {costBreakdown.convertedFees.courier}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Photos</span>
                          <div className="text-right">
                            <span className="font-medium">{costBreakdown.currency} {costBreakdown.photos}</span>
                            {userLocation && costBreakdown.convertedFees && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                ~{userLocation.currency} {costBreakdown.convertedFees.photos}
                              </div>
                            )}
                          </div>
                        </div>
                        {costBreakdown.healthInsurance && costBreakdown.healthInsurance > 0 && (
                          <div className="flex justify-between">
                            <span>Health Insurance</span>
                            <div className="text-right">
                              <span className="font-medium">{costBreakdown.currency} {costBreakdown.healthInsurance}</span>
                              {userLocation && costBreakdown.convertedFees?.healthInsurance && (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  ~{userLocation.currency} {costBreakdown.convertedFees.healthInsurance}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {costBreakdown.translation && costBreakdown.translation > 0 && (
                          <div className="flex justify-between">
                            <span>Translation</span>
                            <div className="text-right">
                              <span className="font-medium">{costBreakdown.currency} {costBreakdown.translation}</span>
                              {userLocation && costBreakdown.convertedFees?.translation && (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  ~{userLocation.currency} {costBreakdown.convertedFees.translation}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Other Fees</span>
                          <span className="font-medium">{costBreakdown.currency} {costBreakdown.otherFees}</span>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Cost</span>
                          <div className="text-right">
                            <span className="text-skyneu-blue">{costBreakdown.currency} {costBreakdown.total}</span>
                            {userLocation && costBreakdown.convertedTotal && costBreakdown.currency !== userLocation.currency && (
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                ≈ {userLocation.currency} {costBreakdown.convertedTotal}
                              </div>
                            )}
                            {costBreakdown.exchangeNote && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {costBreakdown.exchangeNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-skyneu-dark dark:text-dark-text">Hidden Costs to Watch</h4>
                      <div className="space-y-2">
                        {costBreakdown.hiddenCosts.map((cost, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-300">{cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternatives Tab */}
              {activeTab === 'alternatives' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text">Visa Alternatives & Workarounds</h3>
                  
                  {alternatives.length > 0 ? (
                    <div className="space-y-4">
                      {alternatives.map((alt, index) => (
                        <div key={index} className="border border-gray-200 dark:border-dark-border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              alt.type === 'visa-free-country' ? 'bg-green-100 dark:bg-green-900/30' :
                              alt.type === 'transit-route' ? 'bg-blue-100 dark:bg-blue-900/30' :
                              'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                              {alt.type === 'visa-free-country' ? <Globe className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                               alt.type === 'transit-route' ? <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" /> :
                               <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-skyneu-dark dark:text-dark-text mb-2">{alt.title}</h4>
                              <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mb-3">{alt.description}</p>
                              
                              {alt.countries && alt.countries.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Countries: </span>
                                  <span className="text-xs text-skyneu-text dark:text-dark-text-secondary">{alt.countries.join(', ')}</span>
                                </div>
                              )}
                              
                              {alt.savings && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Benefits: </span>
                                  <span className="text-xs text-green-700 dark:text-green-300">{alt.savings}</span>
                                </div>
                              )}
                              
                              {alt.requirements && alt.requirements.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Requirements:</span>
                                  {alt.requirements.map((req, reqIndex) => (
                                    <div key={reqIndex} className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      <span className="text-xs text-skyneu-text dark:text-dark-text-secondary">{req}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No alternatives found for this destination.</p>
                      <p className="text-sm">Consider checking with travel agents for specialized routing options.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text">Chat with Visa AI</h3>
                  
                  <div className="border border-gray-200 dark:border-dark-border rounded-lg h-96 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`${isMobile ? 'max-w-xs' : 'max-w-xs lg:max-w-md'} px-4 py-2 rounded-lg ${
                            msg.type === 'user' 
                              ? 'bg-skyneu-blue text-white' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap">
                              {formatChatMessage(msg.message)}
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 animate-spin" />
                              <span className="text-sm">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-dark-border p-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                          placeholder="Ask about visa requirements, documents, processes..."
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text"
                        />
                        <button
                          onClick={handleChatSubmit}
                          disabled={!chatInput.trim() || chatLoading}
                          className="px-4 py-2 bg-skyneu-blue text-white rounded-lg hover:bg-skyneu-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Checklist Modal */}
      {showDocumentChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDocumentChecklist(false)}></div>
          
          <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-dark-border max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-6 w-6 text-skyneu-blue" />
                  <h3 className="text-xl font-bold text-skyneu-dark dark:text-dark-text">Document Checklist</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadChecklist}
                    className="px-4 py-2 bg-skyneu-green text-white rounded-lg hover:bg-skyneu-green/90 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button 
                    onClick={() => setShowDocumentChecklist(false)}
                    className="text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-dark dark:hover:text-dark-text"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mt-2">
                Track your visa application progress. Check off items as you complete them.
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {documentChecklist.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-dark-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-skyneu-blue'
                        }`}
                      >
                        {item.completed && <CheckCircle className="h-3 w-3" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-skyneu-dark dark:text-dark-text'}`}>
                            {item.name}
                          </h4>
                          {item.required && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mb-3">
                          {item.description}
                        </p>
                        <textarea
                          placeholder="Add notes..."
                          value={item.notes || ''}
                          onChange={(e) => updateChecklistNotes(item.id, e.target.value)}
                          className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm resize-none bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text placeholder-skyneu-text dark:placeholder-dark-text-secondary"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Scanner Modal */}
      {showDocumentScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDocumentScanner(false)}></div>
          
          <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-dark-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-skyneu-dark dark:text-dark-text">Passport Scanner</h3>
                <button 
                  onClick={() => setShowDocumentScanner(false)}
                  className="text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-dark dark:hover:text-dark-text"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-12 w-12 text-skyneu-blue" />
                </div>
                <h4 className="font-semibold text-skyneu-dark dark:text-dark-text mb-2">Scan Your Passport</h4>
                <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mb-6">
                  Our AI will extract your nationality and passport details automatically
                </p>
                
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-skyneu-blue to-skyneu-blue/80 text-white py-3 rounded-xl hover:from-skyneu-blue/90 hover:to-skyneu-blue/70 transition-all duration-300 font-semibold">
                    Take Photo
                  </button>
                  
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaChecker;
