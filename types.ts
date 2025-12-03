export enum MeasurementStatus {
  PENDING = 'Pendente',
  COMPLETED = 'Realizado',
  CANCELLED = 'Cancelado',
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
}

export interface Measurement {
  id: string;
  orderNumber?: string;
  date: string; // ISO Date string
  requesterName: string;
  status: MeasurementStatus;
  clientName: string;
  clientPhone: string;
  address: Address;
  observations?: string;
  orderValue?: number | null;
  commissionRate?: number | null;
  commissionPaid: boolean;
}

export interface CommissionItem extends Omit<Measurement, 'orderValue' | 'commissionRate'> {
  orderValue: string; // Sempre uma string para consistência no input
  commissionRate: string; // Alterado para string para consistência no input
  commissionValue: number;
}


export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Needed for local registration
}