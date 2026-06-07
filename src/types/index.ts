export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show';

export interface StatusHistoryEntry {
  status: AppointmentStatus;
  timestamp: string;
  note?: string;
}

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
  statusHistory: StatusHistoryEntry[];
}

export interface TrendDataPoint {
  date: string;
  total: number;
  pending: number;
  confirmed: number;
  arrived: number;
  completed: number;
  cancelled: number;
  noShow: number;
  depositPaid: number;
  depositUnpaid: number;
}

export type AnomalyType = 
  | 'confirmed_no_deposit'
  | 'long_pending'
  | 'overbooked'
  | 'no_show'
  | 'cancelled_last_minute';

export interface AnomalyItem {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  appointmentId?: string;
  customerName?: string;
  date?: string;
  actionable: boolean;
  actionLabel?: string;
}

export type ReminderType = 
  | 'follow_up_pending'
  | 'remind_deposit'
  | 'confirm_arrival'
  | 'schedule_check';

export interface ReminderItem {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  appointmentId?: string;
  customerName?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface OperationReviewData {
  trendData: TrendDataPoint[];
  anomalies: AnomalyItem[];
  reminders: ReminderItem[];
  summary: {
    totalAppointments: number;
    conversionRate: number;
    noShowRate: number;
    avgTimeToConfirm: number;
    depositCollectionRate: number;
    overbookedDays: number;
  };
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
  cancelled: '已取消',
  no_show: '未到店',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-tattoo-red/20 text-red-300 border-red-800',
  confirmed: 'bg-gold-500/20 text-gold-400 border-gold-600',
  arrived: 'bg-blue-500/20 text-blue-400 border-blue-600',
  completed: 'bg-tattoo-green/20 text-emerald-400 border-emerald-700',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-600',
  no_show: 'bg-purple-500/20 text-purple-400 border-purple-600',
};

export type CalendarView = 'list' | 'week' | 'month';

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  list: '列表视图',
  week: '周视图',
  month: '月视图',
};
