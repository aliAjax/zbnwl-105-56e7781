import {
  Appointment,
  TrendDataPoint,
  AnomalyItem,
  ReminderItem,
  OperationReviewData,
} from '@/types';
import { formatDate, getDateRange } from './dateUtils';

const LONG_PENDING_HOURS = 48;
const OVERBOOKED_HOURS_THRESHOLD = 12;
const LAST_MINUTE_CANCEL_HOURS = 24;

export function generateTrendData(
  appointments: Appointment[],
  days: number = 30
): TrendDataPoint[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);

  const dateRange = getDateRange(startDate, endDate);
  const trendData: TrendDataPoint[] = [];

  for (const date of dateRange) {
    const dateStr = formatDate(date);
    const dayAppointments = appointments.filter((apt) => apt.date === dateStr);

    trendData.push({
      date: dateStr,
      total: dayAppointments.length,
      pending: dayAppointments.filter((a) => a.status === 'pending').length,
      confirmed: dayAppointments.filter((a) => a.status === 'confirmed').length,
      arrived: dayAppointments.filter((a) => a.status === 'arrived').length,
      completed: dayAppointments.filter((a) => a.status === 'completed').length,
      cancelled: dayAppointments.filter((a) => a.status === 'cancelled').length,
      noShow: dayAppointments.filter((a) => a.status === 'no_show').length,
      depositPaid: dayAppointments.filter((a) => a.depositPaid).length,
      depositUnpaid: dayAppointments.filter((a) => !a.depositPaid).length,
    });
  }

  return trendData;
}

function getHoursDifference(date1: string, date2: string): number {
  return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60 * 60);
}

export function detectAnomalies(appointments: Appointment[]): AnomalyItem[] {
  const anomalies: AnomalyItem[] = [];
  const now = new Date();

  const dateGroups: Record<string, Appointment[]> = {};
  for (const apt of appointments) {
    if (!dateGroups[apt.date]) {
      dateGroups[apt.date] = [];
    }
    dateGroups[apt.date].push(apt);
  }

  for (const [date, dayAppointments] of Object.entries(dateGroups)) {
    const totalHours = dayAppointments.reduce((sum, apt) => sum + apt.duration, 0);
    if (totalHours > OVERBOOKED_HOURS_THRESHOLD) {
      anomalies.push({
        id: `overbooked-${date}`,
        type: 'overbooked',
        severity: totalHours > OVERBOOKED_HOURS_THRESHOLD * 1.3 ? 'high' : 'medium',
        title: `${date} 排期过满`,
        description: `当日预约总时长 ${totalHours} 小时，超过阈值 ${OVERBOOKED_HOURS_THRESHOLD} 小时`,
        date,
        actionable: true,
        actionLabel: '查看当日',
      });
    }
  }

  for (const apt of appointments) {
    if (apt.status === 'confirmed' && !apt.depositPaid) {
      anomalies.push({
        id: `no-deposit-${apt.id}`,
        type: 'confirmed_no_deposit',
        severity: 'high',
        title: `${apt.customerName} 已确认但未付定金`,
        description: `预约时间: ${apt.date} ${apt.time}，部位: ${apt.bodyPart}`,
        appointmentId: apt.id,
        customerName: apt.customerName,
        date: apt.date,
        actionable: true,
        actionLabel: '提醒付定金',
      });
    }

    if (apt.status === 'pending') {
      const pendingEntry = apt.statusHistory?.find((h) => h.status === 'pending');
      if (pendingEntry) {
        const hoursPending = getHoursDifference(pendingEntry.timestamp, now.toISOString());
        if (hoursPending > LONG_PENDING_HOURS) {
          anomalies.push({
            id: `long-pending-${apt.id}`,
            type: 'long_pending',
            severity: hoursPending > LONG_PENDING_HOURS * 2 ? 'high' : 'medium',
            title: `${apt.customerName} 长时间待确认`,
            description: `已待确认 ${Math.floor(hoursPending)} 小时，预约时间: ${apt.date} ${apt.time}`,
            appointmentId: apt.id,
            customerName: apt.customerName,
            date: apt.date,
            actionable: true,
            actionLabel: '跟进确认',
          });
        }
      }
    }

    if (apt.status === 'no_show') {
      anomalies.push({
        id: `no-show-${apt.id}`,
        type: 'no_show',
        severity: 'high',
        title: `${apt.customerName} 未到店`,
        description: `预约时间: ${apt.date} ${apt.time}，部位: ${apt.bodyPart}`,
        appointmentId: apt.id,
        customerName: apt.customerName,
        date: apt.date,
        actionable: false,
      });
    }

    if (apt.status === 'cancelled') {
      const cancelEntry = apt.statusHistory?.find((h) => h.status === 'cancelled');
      if (cancelEntry && apt.date) {
        const aptDateTime = new Date(`${apt.date}T${apt.time || '00:00'}`);
        const cancelTime = new Date(cancelEntry.timestamp);
        const hoursBefore = (aptDateTime.getTime() - cancelTime.getTime()) / (1000 * 60 * 60);
        if (hoursBefore > 0 && hoursBefore < LAST_MINUTE_CANCEL_HOURS) {
          anomalies.push({
            id: `last-minute-cancel-${apt.id}`,
            type: 'cancelled_last_minute',
            severity: 'medium',
            title: `${apt.customerName} 临时取消`,
            description: `预约前 ${Math.floor(hoursBefore)} 小时取消，预约时间: ${apt.date} ${apt.time}`,
            appointmentId: apt.id,
            customerName: apt.customerName,
            date: apt.date,
            actionable: false,
          });
        }
      }
    }
  }

  return anomalies.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export function generateReminders(appointments: Appointment[]): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  const now = new Date();
  const todayStr = formatDate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  for (const apt of appointments) {
    if (apt.status === 'pending') {
      const pendingEntry = apt.statusHistory?.find((h) => h.status === 'pending');
      if (pendingEntry) {
        const hoursPending = getHoursDifference(pendingEntry.timestamp, now.toISOString());
        if (hoursPending > 24) {
          reminders.push({
            id: `follow-up-${apt.id}`,
            type: 'follow_up_pending',
            title: `跟进 ${apt.customerName} 的预约确认`,
            description: `预约时间: ${apt.date} ${apt.time}，已待确认 ${Math.floor(hoursPending)} 小时`,
            appointmentId: apt.id,
            customerName: apt.customerName,
            priority: hoursPending > 48 ? 'high' : 'medium',
          });
        }
      }
    }

    if (apt.status === 'confirmed' && !apt.depositPaid) {
      reminders.push({
        id: `deposit-${apt.id}`,
        type: 'remind_deposit',
        title: `提醒 ${apt.customerName} 支付定金`,
        description: `预约时间: ${apt.date} ${apt.time}，部位: ${apt.bodyPart}`,
        appointmentId: apt.id,
        customerName: apt.customerName,
        priority: apt.date === todayStr || apt.date === tomorrowStr ? 'high' : 'medium',
        dueDate: apt.date,
      });
    }

    if ((apt.status === 'confirmed' || apt.status === 'pending') && apt.date === todayStr) {
      reminders.push({
        id: `arrival-${apt.id}`,
        type: 'confirm_arrival',
        title: `确认 ${apt.customerName} 今日到店`,
        description: `预约时间: ${apt.time}，部位: ${apt.bodyPart}`,
        appointmentId: apt.id,
        customerName: apt.customerName,
        priority: 'high',
        dueDate: apt.date,
      });
    }
  }

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

  const weekAppointments = appointments.filter(
    (apt) => apt.date >= formatDate(thisWeekStart) && apt.date <= formatDate(thisWeekEnd)
  );

  if (weekAppointments.length > 0) {
    const confirmedCount = weekAppointments.filter((a) => a.status === 'confirmed').length;
    const pendingCount = weekAppointments.filter((a) => a.status === 'pending').length;
    const unpaidCount = weekAppointments.filter((a) => !a.depositPaid).length;

    if (pendingCount > 0 || unpaidCount > 0) {
      reminders.push({
        id: `weekly-check-${formatDate(thisWeekStart)}`,
        type: 'schedule_check',
        title: '本周预约情况检查',
        description: `本周共 ${weekAppointments.length} 个预约，${confirmedCount} 个已确认，${pendingCount} 个待确认，${unpaidCount} 个未付定金`,
        priority: pendingCount > 2 ? 'high' : 'medium',
      });
    }
  }

  return reminders.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function calculateSummary(appointments: Appointment[]) {
  const total = appointments.length;
  if (total === 0) {
    return {
      totalAppointments: 0,
      conversionRate: 0,
      noShowRate: 0,
      avgTimeToConfirm: 0,
      depositCollectionRate: 0,
      overbookedDays: 0,
    };
  }

  const completed = appointments.filter((a) => a.status === 'completed').length;
  const noShows = appointments.filter((a) => a.status === 'no_show').length;
  const closedAppointments = appointments.filter((a) =>
    ['completed', 'no_show', 'cancelled'].includes(a.status)
  );

  let totalConfirmHours = 0;
  let confirmCount = 0;
  for (const apt of appointments) {
    const pendingEntry = apt.statusHistory?.find((h) => h.status === 'pending');
    const confirmedEntry = apt.statusHistory?.find((h) => h.status === 'confirmed');
    if (pendingEntry && confirmedEntry) {
      totalConfirmHours += getHoursDifference(pendingEntry.timestamp, confirmedEntry.timestamp);
      confirmCount++;
    }
  }

  const depositPaidCount = appointments.filter((a) => a.depositPaid).length;

  const dateGroups: Record<string, Appointment[]> = {};
  for (const apt of appointments) {
    if (!dateGroups[apt.date]) {
      dateGroups[apt.date] = [];
    }
    dateGroups[apt.date].push(apt);
  }
  const overbookedDays = Object.values(dateGroups).filter(
    (dayApts) => dayApts.reduce((sum, apt) => sum + apt.duration, 0) > OVERBOOKED_HOURS_THRESHOLD
  ).length;

  return {
    totalAppointments: total,
    conversionRate: closedAppointments.length > 0
      ? Math.round((completed / closedAppointments.length) * 100)
      : 0,
    noShowRate: closedAppointments.length > 0
      ? Math.round((noShows / closedAppointments.length) * 100)
      : 0,
    avgTimeToConfirm: confirmCount > 0 ? Math.round(totalConfirmHours / confirmCount) : 0,
    depositCollectionRate: Math.round((depositPaidCount / total) * 100),
    overbookedDays,
  };
}

export function generateOperationReview(
  appointments: Appointment[],
  days: number = 30
): OperationReviewData {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);
  const startDateStr = formatDate(startDate);

  const filteredAppointments = appointments.filter((apt) => apt.date >= startDateStr);

  return {
    trendData: generateTrendData(filteredAppointments, days),
    anomalies: detectAnomalies(filteredAppointments),
    reminders: generateReminders(appointments),
    summary: calculateSummary(filteredAppointments),
  };
}

export const ANOMALY_TYPE_LABELS: Record<string, string> = {
  confirmed_no_deposit: '已确认未付定金',
  long_pending: '长时间待确认',
  overbooked: '排期过满',
  no_show: '未到店',
  cancelled_last_minute: '临时取消',
};

export const REMINDER_TYPE_LABELS: Record<string, string> = {
  follow_up_pending: '跟进待确认',
  remind_deposit: '提醒付定金',
  confirm_arrival: '确认到店',
  schedule_check: '排期检查',
};
