import { Appointment, PaymentRecord, PaymentType } from '@/types';
import { formatDate } from '@/utils/dateUtils';

export type DateDimension = 'appointment_date' | 'payment_date';

export interface PaymentSummary {
  totalDeposit: number;
  totalBalance: number;
  totalSupplement: number;
  totalRefund: number;
  totalReceived: number;
  netIncome: number;
}

export interface DailyPaymentStats {
  date: string;
  summary: PaymentSummary;
  appointmentCount: number;
  recordCount: number;
}

export function getPaymentRecords(apt: Appointment): PaymentRecord[] {
  return apt.paymentRecords || [];
}

export function calculatePaymentSummary(apt: Appointment): PaymentSummary {
  const records = getPaymentRecords(apt);
  let totalDeposit = 0;
  let totalBalance = 0;
  let totalSupplement = 0;
  let totalRefund = 0;

  for (const record of records) {
    switch (record.type) {
      case 'deposit':
        totalDeposit += record.amount;
        break;
      case 'balance':
        totalBalance += record.amount;
        break;
      case 'supplement':
        totalSupplement += record.amount;
        break;
      case 'refund':
        totalRefund += record.amount;
        break;
    }
  }

  const totalReceived = totalDeposit + totalBalance + totalSupplement;
  const netIncome = totalReceived - totalRefund;

  return {
    totalDeposit,
    totalBalance,
    totalSupplement,
    totalRefund,
    totalReceived,
    netIncome,
  };
}

export function calculateBatchPaymentSummary(appointments: Appointment[]): PaymentSummary {
  let totalDeposit = 0;
  let totalBalance = 0;
  let totalSupplement = 0;
  let totalRefund = 0;

  for (const apt of appointments) {
    const summary = calculatePaymentSummary(apt);
    totalDeposit += summary.totalDeposit;
    totalBalance += summary.totalBalance;
    totalSupplement += summary.totalSupplement;
    totalRefund += summary.totalRefund;
  }

  const totalReceived = totalDeposit + totalBalance + totalSupplement;
  const netIncome = totalReceived - totalRefund;

  return {
    totalDeposit,
    totalBalance,
    totalSupplement,
    totalRefund,
    totalReceived,
    netIncome,
  };
}

export function hasDepositPaid(apt: Appointment): boolean {
  const summary = calculatePaymentSummary(apt);
  if (summary.totalDeposit > 0) {
    return true;
  }
  return apt.depositPaid;
}

export function getEstimatedTotal(apt: Appointment): number {
  const deposit = apt.depositAmount || 0;
  const balance = apt.estimatedBalance || 0;
  return deposit + balance;
}

export function getPaymentTypeAmount(
  apt: Appointment,
  type: PaymentType
): number {
  const records = getPaymentRecords(apt);
  return records
    .filter(r => r.type === type)
    .reduce((sum, r) => sum + r.amount, 0);
}

export function addPaymentRecord(
  apt: Appointment,
  record: Omit<PaymentRecord, 'id'>
): Appointment {
  const newRecord: PaymentRecord = {
    ...record,
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
  };

  const records = [...getPaymentRecords(apt), newRecord];
  
  const depositTotal = records.filter(r => r.type === 'deposit').reduce((sum, r) => sum + r.amount, 0);
  
  return {
    ...apt,
    paymentRecords: records,
    depositPaid: depositTotal > 0,
    depositAmount: depositTotal > 0 ? depositTotal : apt.depositAmount,
  };
}

export function updatePaymentRecord(
  apt: Appointment,
  recordId: string,
  updates: Partial<PaymentRecord>
): Appointment {
  const records = getPaymentRecords(apt).map(r =>
    r.id === recordId ? { ...r, ...updates } : r
  );

  const depositTotal = records.filter(r => r.type === 'deposit').reduce((sum, r) => sum + r.amount, 0);

  return {
    ...apt,
    paymentRecords: records,
    depositPaid: depositTotal > 0,
    depositAmount: depositTotal > 0 ? depositTotal : apt.depositAmount,
  };
}

export function deletePaymentRecord(
  apt: Appointment,
  recordId: string
): Appointment {
  const records = getPaymentRecords(apt).filter(r => r.id !== recordId);

  const depositTotal = records.filter(r => r.type === 'deposit').reduce((sum, r) => sum + r.amount, 0);

  return {
    ...apt,
    paymentRecords: records,
    depositPaid: depositTotal > 0,
    depositAmount: depositTotal > 0 ? depositTotal : apt.depositAmount,
  };
}

export function calculateDailyStatsByDimension(
  appointments: Appointment[],
  dimension: DateDimension,
  startDate?: string,
  endDate?: string
): DailyPaymentStats[] {
  const statsMap: Record<string, {
    summary: PaymentSummary;
    appointmentIds: Set<string>;
    recordCount: number;
  }> = {};

  const ensureDateEntry = (date: string) => {
    if (!statsMap[date]) {
      statsMap[date] = {
        summary: {
          totalDeposit: 0,
          totalBalance: 0,
          totalSupplement: 0,
          totalRefund: 0,
          totalReceived: 0,
          netIncome: 0,
        },
        appointmentIds: new Set<string>(),
        recordCount: 0,
      };
    }
  };

  const addRecordToStats = (date: string, apt: Appointment, record: PaymentRecord) => {
    ensureDateEntry(date);
    const entry = statsMap[date];
    entry.appointmentIds.add(apt.id);
    entry.recordCount++;

    switch (record.type) {
      case 'deposit':
        entry.summary.totalDeposit += record.amount;
        entry.summary.totalReceived += record.amount;
        entry.summary.netIncome += record.amount;
        break;
      case 'balance':
        entry.summary.totalBalance += record.amount;
        entry.summary.totalReceived += record.amount;
        entry.summary.netIncome += record.amount;
        break;
      case 'supplement':
        entry.summary.totalSupplement += record.amount;
        entry.summary.totalReceived += record.amount;
        entry.summary.netIncome += record.amount;
        break;
      case 'refund':
        entry.summary.totalRefund += record.amount;
        entry.summary.netIncome -= record.amount;
        break;
    }
  };

  for (const apt of appointments) {
    const records = getPaymentRecords(apt);

    if (dimension === 'appointment_date') {
      const date = apt.date;
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      for (const record of records) {
        addRecordToStats(date, apt, record);
      }
    } else {
      for (const record of records) {
        const date = formatDate(new Date(record.timestamp));
        if (startDate && date < startDate) continue;
        if (endDate && date > endDate) continue;
        addRecordToStats(date, apt, record);
      }
    }
  }

  const dates = Object.keys(statsMap).sort();
  return dates.map(date => ({
    date,
    summary: statsMap[date].summary,
    appointmentCount: statsMap[date].appointmentIds.size,
    recordCount: statsMap[date].recordCount,
  }));
}

export function migrateAppointmentPaymentRecords(apt: Appointment): Appointment {
  if (apt.paymentRecords && apt.paymentRecords.length > 0) {
    return apt;
  }

  const records: PaymentRecord[] = [];
  const createdAt = apt.createdAt || new Date().toISOString();

  if (apt.depositPaid && apt.depositAmount && apt.depositAmount > 0) {
    records.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      type: 'deposit',
      amount: apt.depositAmount,
      timestamp: createdAt,
      note: '数据迁移 - 定金',
    });
  }

  return {
    ...apt,
    paymentRecords: records.length > 0 ? records : undefined,
  };
}

export function migrateBatchPaymentRecords(appointments: Appointment[]): Appointment[] {
  return appointments.map(apt => migrateAppointmentPaymentRecords(apt));
}
