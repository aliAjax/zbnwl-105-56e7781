import { Appointment, CustomerProfile } from '@/types';
import { calculateBatchPaymentSummary, hasDepositPaid } from '@/utils/paymentUtils';

export const buildCustomerProfile = (
  appointments: Appointment[],
  customerName: string
): CustomerProfile | null => {
  const customerAppointments = appointments.filter(
    apt => apt.customerName === customerName
  );

  if (customerAppointments.length === 0) {
    return null;
  }

  const sortedByDate = [...customerAppointments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const bodyPartsSet = new Set<string>();
  const notesList: string[] = [];
  let totalDepositsPaid = 0;
  let totalDuration = 0;
  let completedCount = 0;

  customerAppointments.forEach(apt => {
    bodyPartsSet.add(apt.bodyPart);
    if (apt.notes && apt.notes.trim()) {
      notesList.push(apt.notes);
    }
    if (hasDepositPaid(apt)) {
      totalDepositsPaid++;
    }
    totalDuration += apt.duration;
    if (apt.status === 'completed') {
      completedCount++;
    }
  });

  const paymentSummary = calculateBatchPaymentSummary(customerAppointments);

  return {
    customerName,
    totalAppointments: customerAppointments.length,
    completedAppointments: completedCount,
    totalDepositsPaid,
    totalDuration,
    bodyParts: Array.from(bodyPartsSet),
    firstVisit: sortedByDate[0].date,
    lastVisit: sortedByDate[sortedByDate.length - 1].date,
    history: sortedByDate,
    notes: notesList,
    totalSpent: paymentSummary.netIncome,
    totalDepositPaidAmount: paymentSummary.totalDeposit,
    totalBalancePaidAmount: paymentSummary.totalBalance,
    totalSupplementPaidAmount: paymentSummary.totalSupplement,
    totalRefundAmount: paymentSummary.totalRefund,
  };
};

export const getAllCustomerNames = (appointments: Appointment[]): string[] => {
  const nameSet = new Set(appointments.map(apt => apt.customerName));
  return Array.from(nameSet).sort();
};
