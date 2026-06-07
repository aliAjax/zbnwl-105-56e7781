export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'completed';

export interface Appointment {
  id: string;
  customerName: string;
  date: string;
  time: string;
  bodyPart: string;
  duration: number;
  referenceImage?: string;
  depositPaid: boolean;
  depositAmount?: number;
  estimatedBalance?: number;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface CustomerProfile {
  customerName: string;
  totalAppointments: number;
  completedAppointments: number;
  totalDepositsPaid: number;
  totalDuration: number;
  bodyParts: string[];
  firstVisit: string;
  lastVisit: string;
  history: Appointment[];
  notes: string[];
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  arrived: '已到店',
  completed: '已完成',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-tattoo-red/20 text-red-300 border-red-800',
  confirmed: 'bg-gold-500/20 text-gold-400 border-gold-600',
  arrived: 'bg-blue-500/20 text-blue-400 border-blue-600',
  completed: 'bg-tattoo-green/20 text-emerald-400 border-emerald-700',
};
