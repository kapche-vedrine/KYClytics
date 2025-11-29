import { create } from 'zustand';
import { calculateRisk, RiskBand, ReviewStatus, RiskConfig, DEFAULT_RISK_CONFIG } from './risk-engine';
import { addMonths, isPast, subDays } from 'date-fns';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  address: string;
  country: string;
  postalCode: string;
  job: string;
  industry: string;
  pep: boolean;
  score: number;
  band: RiskBand;
  status: ReviewStatus;
  nextReview: string; // ISO Date
  lastUpdated: string;
}

interface StoreState {
  user: { name: string; role: 'ADMIN' | 'COMPLIANCE_OFFICER' } | null;
  clients: Client[];
  riskConfig: RiskConfig;
  login: (email: string) => void;
  logout: () => void;
  addClient: (data: Omit<Client, 'id' | 'score' | 'band' | 'status' | 'nextReview' | 'lastUpdated'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updateRiskConfig: (newConfig: Partial<RiskConfig>) => void;
}

// Seed Data
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    firstName: 'Alice',
    lastName: 'Thompson',
    dob: '1985-04-12',
    address: '123 Maple Ave, London',
    country: 'United Kingdom',
    postalCode: 'SW1A 1AA',
    job: 'Software Engineer',
    industry: 'Technology',
    pep: false,
    score: 0,
    band: 'GREEN',
    status: 'OK',
    nextReview: addMonths(new Date(), 20).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Boris',
    lastName: 'Ivanov',
    dob: '1978-11-23',
    address: '456 High St, Moscow',
    country: 'Russia',
    postalCode: '101000',
    job: 'CEO',
    industry: 'Oil & Gas',
    pep: true,
    score: 50,
    band: 'RED',
    status: 'DUE_SOON',
    nextReview: addMonths(new Date(), 1).toISOString(),
    lastUpdated: subDays(new Date(), 150).toISOString(),
  },
  {
    id: '3',
    firstName: 'Charlie',
    lastName: 'Wu',
    dob: '1992-02-15',
    address: '789 Market St, San Francisco',
    country: 'United States',
    postalCode: '94103',
    job: 'Crypto Trader',
    industry: 'Cryptocurrency',
    pep: false,
    score: 20,
    band: 'GREEN',
    status: 'OK',
    nextReview: addMonths(new Date(), 24).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Miller',
    dob: '1980-06-30',
    address: '101 Casino Blvd, Las Vegas',
    country: 'United States',
    postalCode: '89109',
    job: 'Dealer',
    industry: 'Gambling',
    pep: false,
    score: 30,
    band: 'YELLOW',
    status: 'OVERDUE',
    nextReview: subDays(new Date(), 5).toISOString(),
    lastUpdated: subDays(new Date(), 370).toISOString(),
  },
];

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  clients: MOCK_CLIENTS,
  riskConfig: DEFAULT_RISK_CONFIG,
  login: (email: string) => set({ user: { name: email.split('@')[0], role: 'COMPLIANCE_OFFICER' } }),
  logout: () => set({ user: null }),
  addClient: (data) => set((state) => {
    const risk = calculateRisk(data, state.riskConfig);
    const nextReview = addMonths(new Date(), risk.nextReviewMonths);
    
    const newClient: Client = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      score: risk.score,
      band: risk.band,
      status: 'OK',
      nextReview: nextReview.toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    return { clients: [newClient, ...state.clients] };
  }),
  updateClient: (id: string, data: Partial<Client>) => set((state) => {
    const updatedClients = state.clients.map((c) => {
      if (c.id !== id) return c;
      
      const merged = { ...c, ...data };
      
      const risk = calculateRisk({
        pep: merged.pep,
        country: merged.country,
        industry: merged.industry,
        job: merged.job
      }, state.riskConfig);
      
      return {
        ...merged,
        score: risk.score,
        band: risk.band,
        nextReview: addMonths(new Date(), risk.nextReviewMonths).toISOString(),
        lastUpdated: new Date().toISOString(),
      };
    });
    return { clients: updatedClients };
  }),
  deleteClient: (id: string) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== id)
  })),
  updateRiskConfig: (newConfig) => set((state) => ({
    riskConfig: { ...state.riskConfig, ...newConfig }
  })),
}));
