// Airline Tax and Fee Calculator
// Calculates realistic government taxes, airport fees, and mandatory charges
// Based on country, route type, and base fare

export interface TaxBreakdown {
  airportTax: number;
  passengerServiceCharge: number;
  securityFee: number;
  fuelSurcharge: number;
  gst: number;
  other: number;
  total: number;
  breakdown: string;
}

export interface SurchargeBreakdown {
  carrierSurcharge: number;
  bookingFee: number;
  paymentFee: number;
  total: number;
}

export interface CompleteFareBreakdown {
  baseFare: number;
  taxes: TaxBreakdown;
  surcharges: SurchargeBreakdown;
  totalBeforeAddons: number;
}

interface CountryTaxRules {
  country: string;
  currency: string;
  domestic: {
    airportTax: { min: number; max: number; percentage?: number };
    psc: { min: number; max: number };
    securityFee: { fixed: number };
    fuelSurcharge: { percentage: number };
    gst: { percentage: number };
    other: { fixed: number };
  };
  international: {
    airportTax: { min: number; max: number; percentage?: number };
    psc: { min: number; max: number };
    securityFee: { fixed: number };
    fuelSurcharge: { percentage: number };
    gst: { percentage: number };
    other: { fixed: number };
  };
}

// Comprehensive tax rules by country
const taxRulesByCountry: Record<string, CountryTaxRules> = {
  // India
  IN: {
    country: 'India',
    currency: 'INR',
    domestic: {
      airportTax: { min: 150, max: 500, percentage: 0 },
      psc: { min: 100, max: 300 },
      securityFee: { fixed: 130 },
      fuelSurcharge: { percentage: 3.5 },
      gst: { percentage: 5 }, // 5% GST on domestic flights
      other: { fixed: 50 }
    },
    international: {
      airportTax: { min: 600, max: 2000, percentage: 0 },
      psc: { min: 1300, max: 2000 }, // User Development Fee
      securityFee: { fixed: 160 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 }, // No GST on international
      other: { fixed: 100 }
    }
  },

  // United States
  US: {
    country: 'United States',
    currency: 'USD',
    domestic: {
      airportTax: { min: 4.5, max: 10, percentage: 7.5 }, // 7.5% Federal Excise Tax + PFC
      psc: { min: 4.5, max: 4.5 }, // Fixed PFC
      securityFee: { fixed: 5.6 }, // September 11 Security Fee
      fuelSurcharge: { percentage: 0 },
      gst: { percentage: 0 },
      other: { fixed: 4.3 } // Segment Fee
    },
    international: {
      airportTax: { min: 18.9, max: 40, percentage: 0 },
      psc: { min: 18.9, max: 18.9 }, // Customs, Immigration, APHIS
      securityFee: { fixed: 5.6 },
      fuelSurcharge: { percentage: 0 },
      gst: { percentage: 0 },
      other: { fixed: 4.3 }
    }
  },

  // United Kingdom
  GB: {
    country: 'United Kingdom',
    currency: 'GBP',
    domestic: {
      airportTax: { min: 13, max: 13, percentage: 0 }, // APD Band A
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 20 }, // VAT on domestic
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 26, max: 200, percentage: 0 }, // APD varies by distance
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 }, // No VAT on international
      other: { fixed: 0 }
    }
  },

  // European Union (General)
  EU: {
    country: 'European Union',
    currency: 'EUR',
    domestic: {
      airportTax: { min: 5, max: 30, percentage: 0 },
      psc: { min: 3, max: 15 },
      securityFee: { fixed: 8 },
      fuelSurcharge: { percentage: 2.5 },
      gst: { percentage: 0 }, // VAT varies by country
      other: { fixed: 2 }
    },
    international: {
      airportTax: { min: 10, max: 60, percentage: 0 },
      psc: { min: 5, max: 20 },
      securityFee: { fixed: 10 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 3 }
    }
  },

  // UAE
  AE: {
    country: 'United Arab Emirates',
    currency: 'AED',
    domestic: {
      airportTax: { min: 20, max: 35, percentage: 0 },
      psc: { min: 15, max: 25 },
      securityFee: { fixed: 5 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 5 }, // 5% VAT
      other: { fixed: 10 }
    },
    international: {
      airportTax: { min: 50, max: 150, percentage: 0 },
      psc: { min: 30, max: 50 },
      securityFee: { fixed: 10 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 }, // No VAT on international flights
      other: { fixed: 15 }
    }
  },

  // Saudi Arabia
  SA: {
    country: 'Saudi Arabia',
    currency: 'SAR',
    domestic: {
      airportTax: { min: 20, max: 40, percentage: 0 },
      psc: { min: 15, max: 25 },
      securityFee: { fixed: 10 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 15 }, // 15% VAT
      other: { fixed: 10 }
    },
    international: {
      airportTax: { min: 50, max: 150, percentage: 0 },
      psc: { min: 30, max: 50 },
      securityFee: { fixed: 15 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 },
      other: { fixed: 20 }
    }
  },

  // Qatar
  QA: {
    country: 'Qatar',
    currency: 'QAR',
    domestic: {
      airportTax: { min: 20, max: 35, percentage: 0 },
      psc: { min: 15, max: 25 },
      securityFee: { fixed: 10 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 }, // No VAT in Qatar
      other: { fixed: 10 }
    },
    international: {
      airportTax: { min: 50, max: 150, percentage: 0 },
      psc: { min: 30, max: 50 },
      securityFee: { fixed: 15 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 },
      other: { fixed: 15 }
    }
  },

  // Kuwait
  KW: {
    country: 'Kuwait',
    currency: 'KWD',
    domestic: {
      airportTax: { min: 2, max: 5, percentage: 0 },
      psc: { min: 1, max: 3 },
      securityFee: { fixed: 1 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 1 }
    },
    international: {
      airportTax: { min: 5, max: 15, percentage: 0 },
      psc: { min: 3, max: 8 },
      securityFee: { fixed: 2 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 },
      other: { fixed: 2 }
    }
  },

  // Bahrain
  BH: {
    country: 'Bahrain',
    currency: 'BHD',
    domestic: {
      airportTax: { min: 2, max: 5, percentage: 0 },
      psc: { min: 1, max: 3 },
      securityFee: { fixed: 1 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 10 }, // 10% VAT
      other: { fixed: 1 }
    },
    international: {
      airportTax: { min: 5, max: 15, percentage: 0 },
      psc: { min: 3, max: 8 },
      securityFee: { fixed: 2 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 },
      other: { fixed: 2 }
    }
  },

  // Oman
  OM: {
    country: 'Oman',
    currency: 'OMR',
    domestic: {
      airportTax: { min: 2, max: 5, percentage: 0 },
      psc: { min: 1, max: 3 },
      securityFee: { fixed: 1 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 5 }, // 5% VAT
      other: { fixed: 1 }
    },
    international: {
      airportTax: { min: 5, max: 15, percentage: 0 },
      psc: { min: 3, max: 8 },
      securityFee: { fixed: 2 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 },
      other: { fixed: 2 }
    }
  },

  // Hong Kong
  HK: {
    country: 'Hong Kong',
    currency: 'HKD',
    domestic: {
      airportTax: { min: 50, max: 100, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 120, max: 120, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // China
  CN: {
    country: 'China',
    currency: 'CNY',
    domestic: {
      airportTax: { min: 50, max: 50, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 90, max: 90, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // South Korea
  KR: {
    country: 'South Korea',
    currency: 'KRW',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 10 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 28000, max: 28000, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Thailand
  TH: {
    country: 'Thailand',
    currency: 'THB',
    domestic: {
      airportTax: { min: 100, max: 200, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 7 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 700, max: 700, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Malaysia
  MY: {
    country: 'Malaysia',
    currency: 'MYR',
    domestic: {
      airportTax: { min: 6, max: 35, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 73, max: 73, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Indonesia
  ID: {
    country: 'Indonesia',
    currency: 'IDR',
    domestic: {
      airportTax: { min: 30000, max: 80000, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 11 }, // PPN (VAT)
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 150000, max: 200000, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Philippines
  PH: {
    country: 'Philippines',
    currency: 'PHP',
    domestic: {
      airportTax: { min: 200, max: 200, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 12 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 550, max: 750, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Mexico
  MX: {
    country: 'Mexico',
    currency: 'MXN',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 16 }, // IVA (VAT)
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 650, max: 650, percentage: 0 }, // TUA
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Brazil
  BR: {
    country: 'Brazil',
    currency: 'BRL',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // New Zealand
  NZ: {
    country: 'New Zealand',
    currency: 'NZD',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 15 }, // GST
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 29, max: 29, percentage: 0 }, // Border Clearance Levy
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Sweden
  SE: {
    country: 'Sweden',
    currency: 'SEK',
    domestic: {
      airportTax: { min: 60, max: 60, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 25 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 300, max: 400, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Norway
  NO: {
    country: 'Norway',
    currency: 'NOK',
    domestic: {
      airportTax: { min: 75, max: 75, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 25 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 250, max: 350, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Denmark
  DK: {
    country: 'Denmark',
    currency: 'DKK',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 25 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Switzerland
  CH: {
    country: 'Switzerland',
    currency: 'CHF',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 7.7 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Turkey
  TR: {
    country: 'Turkey',
    currency: 'TRY',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 20 }, // KDV (VAT)
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Egypt
  EG: {
    country: 'Egypt',
    currency: 'EGP',
    domestic: {
      airportTax: { min: 100, max: 200, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 14 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 300, max: 400, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // South Africa
  ZA: {
    country: 'South Africa',
    currency: 'ZAR',
    domestic: {
      airportTax: { min: 50, max: 100, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 15 }, // VAT
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 190, max: 190, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Singapore
  SG: {
    country: 'Singapore',
    currency: 'SGD',
    domestic: {
      airportTax: { min: 10, max: 15, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 8 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 9 }, // 9% GST
      other: { fixed: 3 }
    },
    international: {
      airportTax: { min: 44, max: 44, percentage: 0 }, // Fixed PSC
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 12 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 5 }
    }
  },

  // Australia
  AU: {
    country: 'Australia',
    currency: 'AUD',
    domestic: {
      airportTax: { min: 5, max: 20, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 2.5 },
      gst: { percentage: 10 }, // 10% GST
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 60, max: 60, percentage: 0 }, // Passenger Movement Charge
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Canada
  CA: {
    country: 'Canada',
    currency: 'CAD',
    domestic: {
      airportTax: { min: 25, max: 35, percentage: 0 }, // Airport Improvement Fee
      psc: { min: 7.12, max: 7.12 }, // Air Travellers Security Charge
      securityFee: { fixed: 7.12 },
      fuelSurcharge: { percentage: 2 },
      gst: { percentage: 5 }, // Federal GST
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 25, max: 35, percentage: 0 },
      psc: { min: 25.91, max: 25.91 }, // ATSC for international
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  },

  // Japan
  JP: {
    country: 'Japan',
    currency: 'JPY',
    domestic: {
      airportTax: { min: 0, max: 0, percentage: 0 },
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 3 },
      gst: { percentage: 10 }, // Consumption tax
      other: { fixed: 0 }
    },
    international: {
      airportTax: { min: 1000, max: 1000, percentage: 0 }, // International Tourist Tax
      psc: { min: 0, max: 0 },
      securityFee: { fixed: 0 },
      fuelSurcharge: { percentage: 4 },
      gst: { percentage: 0 },
      other: { fixed: 0 }
    }
  }
};

/**
 * Detect country from airport code or flight data
 */
export function detectCountryFromRoute(departureCode: string, arrivalCode: string): {
  departureCountry: string;
  arrivalCountry: string;
  isInternational: boolean;
  isDomestic: boolean;
} {
  // Airport code to country mapping (comprehensive global coverage)
  const airportToCountry: Record<string, string> = {
    // India
    DEL: 'IN', BOM: 'IN', BLR: 'IN', MAA: 'IN', CCU: 'IN', HYD: 'IN', 
    GOI: 'IN', COK: 'IN', AMD: 'IN', PNQ: 'IN', JAI: 'IN', GAU: 'IN',
    IXC: 'IN', IXB: 'IN', VNS: 'IN', IXR: 'IN', IXJ: 'IN', IXU: 'IN',
    
    // USA
    JFK: 'US', LAX: 'US', ORD: 'US', ATL: 'US', DFW: 'US', SFO: 'US',
    MIA: 'US', SEA: 'US', LAS: 'US', BOS: 'US', DEN: 'US', PHX: 'US',
    IAH: 'US', MCO: 'US', EWR: 'US', MSP: 'US', DTW: 'US', PHL: 'US',
    CLT: 'US', LGA: 'US', SAN: 'US', TPA: 'US', PDX: 'US', STL: 'US',
    
    // UK
    LHR: 'GB', LGW: 'GB', MAN: 'GB', STN: 'GB', EDI: 'GB', BHX: 'GB',
    LTN: 'GB', GLA: 'GB', BRS: 'GB', NCL: 'GB',
    
    // UAE (Gulf)
    DXB: 'AE', AUH: 'AE', SHJ: 'AE', DWC: 'AE', AAN: 'AE',
    
    // Saudi Arabia (Gulf)
    RUH: 'SA', JED: 'SA', DMM: 'SA', MED: 'SA', TUU: 'SA',
    
    // Qatar (Gulf)
    DOH: 'QA',
    
    // Kuwait (Gulf)
    KWI: 'KW',
    
    // Bahrain (Gulf)
    BAH: 'BH',
    
    // Oman (Gulf)
    MCT: 'OM', SLL: 'OM',
    
    // Singapore
    SIN: 'SG',
    
    // Hong Kong
    HKG: 'HK',
    
    // Australia
    SYD: 'AU', MEL: 'AU', BNE: 'AU', PER: 'AU', ADL: 'AU', CNS: 'AU',
    
    // Canada
    YYZ: 'CA', YVR: 'CA', YUL: 'CA', YYC: 'CA', YEG: 'CA', YOW: 'CA',
    
    // Japan
    NRT: 'JP', HND: 'JP', KIX: 'JP', NGO: 'JP', FUK: 'JP', CTS: 'JP',
    
    // China
    PEK: 'CN', PVG: 'CN', CAN: 'CN', CTU: 'CN', SZX: 'CN', HGH: 'CN',
    
    // South Korea
    ICN: 'KR', GMP: 'KR', PUS: 'KR',
    
    // Thailand
    BKK: 'TH', DMK: 'TH', HKT: 'TH', CNX: 'TH',
    
    // Malaysia
    KUL: 'MY', PEN: 'MY', JHB: 'MY', KCH: 'MY',
    
    // Indonesia
    CGK: 'ID', DPS: 'ID', SUB: 'ID',
    
    // Philippines
    MNL: 'PH', CEB: 'PH', DVO: 'PH',
    
    // France (EU)
    CDG: 'EU', ORY: 'EU', NCE: 'EU', LYS: 'EU', MRS: 'EU',
    
    // Germany (EU)
    FRA: 'EU', MUC: 'EU', TXL: 'EU', DUS: 'EU', HAM: 'EU', CGN: 'EU',
    
    // Netherlands (EU)
    AMS: 'EU',
    
    // Spain (EU)
    MAD: 'EU', BCN: 'EU', PMI: 'EU', AGP: 'EU', VLC: 'EU',
    
    // Italy (EU)
    FCO: 'EU', MXP: 'EU', VCE: 'EU', NAP: 'EU', BLQ: 'EU',
    
    // Switzerland
    ZRH: 'CH', GVA: 'CH',
    
    // Turkey
    IST: 'TR', SAW: 'TR', AYT: 'TR', ADB: 'TR',
    
    // Egypt
    CAI: 'EG', HRG: 'EG', SSH: 'EG',
    
    // South Africa
    JNB: 'ZA', CPT: 'ZA', DUR: 'ZA',
    
    // Mexico
    MEX: 'MX', CUN: 'MX', GDL: 'MX', MTY: 'MX',
    
    // Brazil
    GRU: 'BR', GIG: 'BR', BSB: 'BR', CGH: 'BR',
    
    // New Zealand
    AKL: 'NZ', CHC: 'NZ', WLG: 'NZ',
    
    // Sweden
    ARN: 'SE', GOT: 'SE',
    
    // Norway
    OSL: 'NO', BGO: 'NO',
    
    // Denmark
    CPH: 'DK'
  };

  const depCountry = airportToCountry[departureCode] || 'US';
  const arrCountry = airportToCountry[arrivalCode] || 'US';
  
  console.log(`Route detection: ${departureCode} (${depCountry}) → ${arrivalCode} (${arrCountry})`);
  
  return {
    departureCountry: depCountry,
    arrivalCountry: arrCountry,
    isInternational: depCountry !== arrCountry,
    isDomestic: depCountry === arrCountry
  };
}

/**
 * Create generic tax rules for any country/currency combination
 * This ensures the system never fails even for unrecognized countries
 */
function createGenericTaxRules(currency: string, countryCode: string): CountryTaxRules {
  // Determine if it's likely a high-value currency
  const highValueCurrencies = ['KWD', 'BHD', 'OMR', 'GBP', 'EUR', 'CHF', 'JOD'];
  const lowValueCurrencies = ['IDR', 'VND', 'KRW', 'COP', 'UGX', 'GNF'];
  
  let multiplier = 1;
  if (highValueCurrencies.includes(currency)) {
    multiplier = 0.03; // High value currencies need lower numbers
  } else if (lowValueCurrencies.includes(currency)) {
    multiplier = 15000; // Low value currencies need higher numbers
  } else if (currency === 'JPY' || currency === 'KRW') {
    multiplier = 5000;
  } else if (currency === 'INR') {
    multiplier = 150;
  } else {
    multiplier = 3; // Default for USD-like currencies
  }
  
  return {
    country: countryCode || 'Unknown',
    currency: currency,
    domestic: {
      airportTax: { min: 5 * multiplier, max: 15 * multiplier, percentage: 0 },
      psc: { min: 3 * multiplier, max: 8 * multiplier },
      securityFee: { fixed: 2 * multiplier },
      fuelSurcharge: { percentage: 2.5 },
      gst: { percentage: 5 }, // Generic 5% VAT/GST
      other: { fixed: 1 * multiplier }
    },
    international: {
      airportTax: { min: 15 * multiplier, max: 40 * multiplier, percentage: 0 },
      psc: { min: 8 * multiplier, max: 20 * multiplier },
      securityFee: { fixed: 5 * multiplier },
      fuelSurcharge: { percentage: 3.5 },
      gst: { percentage: 0 }, // Usually no VAT on international
      other: { fixed: 3 * multiplier }
    }
  };
}

/**
 * Calculate complete fare breakdown including all taxes and fees
 */
export function calculateCompleteFareBreakdown(
  baseFare: number,
  departureCode: string,
  arrivalCode: string,
  currency: string = 'USD'
): CompleteFareBreakdown {
  try {
    const routeInfo = detectCountryFromRoute(departureCode, arrivalCode);
    const countryCode = routeInfo.departureCountry;
    const isInternational = routeInfo.isInternational;
    
    console.log(`Tax calculation: ${departureCode} → ${arrivalCode} | Country: ${countryCode} | International: ${isInternational}`);
    
    // Get tax rules for the departure country with comprehensive fallback
    let taxRules = taxRulesByCountry[countryCode];
    
    // If no specific rules found, create generic rules based on currency
    if (!taxRules) {
      console.warn(`No tax rules found for country ${countryCode}, using generic fallback`);
      taxRules = createGenericTaxRules(currency, countryCode);
    }
    
    const rules = isInternational ? taxRules.international : taxRules.domestic;
  
    // Calculate each tax component with safe defaults
    const airportTax = rules.airportTax.percentage 
      ? (baseFare * rules.airportTax.percentage / 100) + rules.airportTax.min
      : (rules.airportTax.min + rules.airportTax.max) / 2;
    
    const psc = (rules.psc.min + rules.psc.max) / 2;
    const securityFee = rules.securityFee.fixed;
    const fuelSurcharge = baseFare * (rules.fuelSurcharge.percentage / 100);
    const gst = (baseFare + airportTax + psc + securityFee + fuelSurcharge) * (rules.gst.percentage / 100);
    const other = rules.other.fixed;
    
    const totalTaxes = airportTax + psc + securityFee + fuelSurcharge + gst + other;
    
    // Calculate airline surcharges (typical industry rates)
    const carrierSurcharge = baseFare * 0.02; // 2% carrier surcharge
    const bookingFee = isInternational ? 15 : 10; // Flat booking fee
    const paymentFee = baseFare * 0.015; // 1.5% payment processing
    
    const totalSurcharges = carrierSurcharge + bookingFee + paymentFee;
    
    // Create breakdown description
    const breakdownDesc = isInternational 
      ? `International flight ${departureCode} → ${arrivalCode}: Includes airport charges, customs/immigration fees, security charges, and fuel surcharge.`
      : `Domestic flight ${departureCode} → ${arrivalCode}: Includes airport taxes, passenger service charges, security fees${rules.gst.percentage > 0 ? `, and ${rules.gst.percentage}% GST/VAT` : ''}.`;
    
    const result = {
      baseFare: Math.round(baseFare * 100) / 100,
      taxes: {
        airportTax: Math.round(airportTax * 100) / 100,
        passengerServiceCharge: Math.round(psc * 100) / 100,
        securityFee: Math.round(securityFee * 100) / 100,
        fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        other: Math.round(other * 100) / 100,
        total: Math.round(totalTaxes * 100) / 100,
        breakdown: breakdownDesc
      },
      surcharges: {
        carrierSurcharge: Math.round(carrierSurcharge * 100) / 100,
        bookingFee: Math.round(bookingFee * 100) / 100,
        paymentFee: Math.round(paymentFee * 100) / 100,
        total: Math.round(totalSurcharges * 100) / 100
      },
      totalBeforeAddons: Math.round((baseFare + totalTaxes + totalSurcharges) * 100) / 100
    };
    
    console.log('✅ Fare breakdown calculated successfully:', result);
    return result;
    
  } catch (error) {
    console.error('Error calculating fare breakdown:', error);
    
    // Return a safe fallback breakdown that always works
    const fallbackTotal = baseFare * 1.3; // Assume 30% in taxes/fees
    return {
      baseFare: Math.round(baseFare * 100) / 100,
      taxes: {
        airportTax: Math.round(baseFare * 0.08 * 100) / 100,
        passengerServiceCharge: Math.round(baseFare * 0.05 * 100) / 100,
        securityFee: Math.round(baseFare * 0.02 * 100) / 100,
        fuelSurcharge: Math.round(baseFare * 0.03 * 100) / 100,
        gst: Math.round(baseFare * 0.05 * 100) / 100,
        other: Math.round(baseFare * 0.02 * 100) / 100,
        total: Math.round(baseFare * 0.25 * 100) / 100,
        breakdown: `Estimated breakdown for ${departureCode} → ${arrivalCode}. Includes standard aviation taxes and fees.`
      },
      surcharges: {
        carrierSurcharge: Math.round(baseFare * 0.02 * 100) / 100,
        bookingFee: 10,
        paymentFee: Math.round(baseFare * 0.015 * 100) / 100,
        total: Math.round((baseFare * 0.035 + 10) * 100) / 100
      },
      totalBeforeAddons: Math.round(fallbackTotal * 100) / 100
    };
  }
}

/**
 * Get a user-friendly explanation of taxes for a specific country
 */
export function getTaxExplanation(countryCode: string, isInternational: boolean): string {
  const taxRules = taxRulesByCountry[countryCode] || taxRulesByCountry['US'];
  const country = taxRules.country;
  
  if (countryCode === 'IN') {
    return isInternational
      ? `International flights from India include: Airport Tax (₹600-2000), User Development Fee (₹1300-2000), Security Fee (₹160), and Fuel Surcharge (~4% of base fare). International flights are exempt from GST.`
      : `Domestic flights in India include: Airport Tax (₹150-500), Passenger Service Charge (₹100-300), Security Fee (₹130), Fuel Surcharge (~3.5%), and 5% GST on the total.`;
  } else if (countryCode === 'US') {
    return isInternational
      ? `International flights from the US include: Customs Fee ($5.50), Immigration Fee ($7), APHIS Fee ($3.96), Security Fee ($5.60), and Airport PFC (~$4.50).`
      : `Domestic flights in the US include: 7.5% Federal Excise Tax, Passenger Facility Charge ($4.50), Security Fee ($5.60), and Segment Fee ($4.30 per segment).`;
  } else {
    return `Flights from ${country} include various airport taxes, security fees, passenger service charges, and fuel surcharges as mandated by aviation authorities.`;
  }
}

