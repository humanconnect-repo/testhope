// Tipi per le prediction
export type PredictionStatus = 
  | 'in_attesa'
  | 'attiva' 
  | 'in_pausa'
  | 'risolta'
  | 'cancellata';

export interface Prediction {
  id: string;
  title: string;
  description: string;
  category: string;
  closing_date: string;
  closing_bid: string;
  status: PredictionStatus;
  contract_address?: string;
  rules?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PredictionFormData {
  title: string;
  description: string;
  category: string;
  closing_date: string;
  closing_bid: string;
  status: PredictionStatus;
  rules: string;
  image_url?: string;
}
