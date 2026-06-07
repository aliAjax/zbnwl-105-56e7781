export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'completed';

export interface TattooArtist {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  active: boolean;
  createdAt: string;
}

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
  artistId?: string;
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

export type CalendarView = 'list' | 'week' | 'month';

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  list: '列表视图',
  week: '周视图',
  month: '月视图',
};
