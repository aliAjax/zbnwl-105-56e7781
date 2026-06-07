import { Appointment, PaymentRecord, PaymentType } from '@/types';

export interface PaymentSummary {
  totalDeposit: number;
  totalBalance: number;
  totalSupplement: number;
  totalRefund: number;
  totalReceived: number;
  netIncome: number;
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
