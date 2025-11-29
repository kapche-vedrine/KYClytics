import { create } from 'zustand';
import { calculateRisk, RiskBand, ReviewStatus, RiskConfig, DEFAULT_RISK_CONFIG } from './risk-engine';
import { addMonths, isPast, subDays } from 'date-fns';

export interface ClientDocument {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  type: string;
}

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
  documents: ClientDocument[];
}

interface StoreState {
  user: { name: string; role: 'ADMIN' | 'COMPLIANCE_OFFICER' } | null;
  clients: Client[];
  riskConfig: RiskConfig;
  login: (email: string) => void;
  logout: () => void;
  addClient: (data: Omit<Client, 'id' | 'score' | 'band' | 'status' | 'nextReview' | 'lastUpdated' | 'documents'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updateRiskConfig: (newConfig: Partial<RiskConfig>) => void;
  addDocument: (clientId: string, document: Omit<ClientDocument, 'id' | 'uploadDate'>) => void;
  deleteDocument: (clientId: string, documentId: string) => void;
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
    documents: [
        { id: 'd1', name: 'passport_copy.pdf', size: '2.4 MB', uploadDate: subDays(new Date(), 2).toISOString(), type: 'application/pdf' },
        { id: 'd2', name: 'utility_bill.jpg', size: '1.8 MB', uploadDate: subDays(new Date(), 2).toISOString(), type: 'image/jpeg' }
    ]
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
    documents: []
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
    documents: []
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
    documents: []
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
      documents: []
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
  addDocument: (clientId, document) => set((state) => {
     const updatedClients = state.clients.map((c) => {
      if (c.id !== clientId) return c;
      const newDoc: ClientDocument = {
        ...document,
        id: Math.random().toString(36).substr(2, 9),
        uploadDate: new Date().toISOString()
      };
      return { ...c, documents: [...c.documents, newDoc] };
    });
    return { clients: updatedClients };
  }),
  deleteDocument: (clientId, documentId) => set((state) => {
    const updatedClients = state.clients.map((c) => {
      if (c.id !== clientId) return c;
      return { ...c, documents: c.documents.filter(d => d.id !== documentId) };
    });
    return { clients: updatedClients };
  })
}));
