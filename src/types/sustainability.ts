export interface CO2Data {
  co2Kg: number;
  source: 'sonar' | 'calculated' | 'api';
  efficiency: 'low' | 'medium' | 'high';
  routeAverage: number;
  isSustainable: boolean;
  lastUpdated: string;
  comparison?: string;
  aircraftType?: string;
}

export interface SustainabilityRating {
  airlineCode: string;
  score: number; // 0-100
  safUsage: number; // percentage
  fleetAge: number;
  certifications: string[];
  initiatives: string[];
  carbonNeutralTarget?: string;
  lastUpdated: string;
  source: string;
}

export interface OffsetOption {
  provider: string;
  costPerTon: number;
  cost: number;
  currency: string;
  impact: string;
  purchaseUrl: string;
  verified: boolean;
  description: string;
  co2Offset: number; // kg CO2 offset
}

export interface SustainabilityData {
  co2: CO2Data;
  airlineRating: SustainabilityRating;
  offsetOptions: OffsetOption[];
  alternatives?: {
    moreEfficientFlights: any[];
    betterAirlines: string[];
  };
}
