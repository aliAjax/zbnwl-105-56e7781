import { Appointment, CustomerProfile, CustomerMerge } from '@/types';
import { calculateBatchPaymentSummary, hasDepositPaid } from '@/utils/paymentUtils';
import { generateId } from './dateUtils';

export const buildAliasMap = (customerMerges: CustomerMerge[]): Map<string, string> => {
  const aliasMap = new Map<string, string>();
  for (const merge of customerMerges) {
    aliasMap.set(merge.canonicalName, merge.canonicalName);
    for (const alias of merge.aliases) {
      aliasMap.set(alias, merge.canonicalName);
    }
  }
  return aliasMap;
};

export const getCanonicalName = (customerName: string, aliasMap: Map<string, string>): string => {
  return aliasMap.get(customerName) || customerName;
};

export const getAliasesForCanonical = (canonicalName: string, customerMerges: CustomerMerge[]): string[] => {
  const merge = customerMerges.find(m => m.canonicalName === canonicalName);
  return merge ? merge.aliases : [];
};

export const buildCustomerProfile = (
  appointments: Appointment[],
  customerName: string,
  customerMerges: CustomerMerge[] = []
): CustomerProfile | null => {
  const aliasMap = buildAliasMap(customerMerges);
  const canonicalName = getCanonicalName(customerName, aliasMap);
  const aliases = getAliasesForCanonical(canonicalName, customerMerges);
  const allNames = [canonicalName, ...aliases];

  const customerAppointments = appointments.filter(
    apt => allNames.includes(apt.customerName)
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
    canonicalName,
    aliases,
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

export const getAllCustomerNames = (
  appointments: Appointment[],
  customerMerges: CustomerMerge[] = []
): string[] => {
  const aliasMap = buildAliasMap(customerMerges);
  const canonicalSet = new Set<string>();
  
  for (const apt of appointments) {
    const canonical = getCanonicalName(apt.customerName, aliasMap);
    canonicalSet.add(canonical);
  }
  
  return Array.from(canonicalSet).sort();
};

export const getAllRawCustomerNames = (appointments: Appointment[]): string[] => {
  const nameSet = new Set(appointments.map(apt => apt.customerName));
  return Array.from(nameSet).sort();
};

export const createCustomerMerge = (
  canonicalName: string,
  aliases: string[]
): CustomerMerge => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    canonicalName,
    aliases: [...aliases],
    createdAt: now,
    updatedAt: now,
  };
};

export const mergeCustomers = (
  existingMerges: CustomerMerge[],
  targetCanonicalName: string,
  namesToMerge: string[]
): CustomerMerge[] => {
  const aliasMap = buildAliasMap(existingMerges);
  const result: CustomerMerge[] = JSON.parse(JSON.stringify(existingMerges));
  
  let targetMerge = result.find(m => m.canonicalName === targetCanonicalName);
  
  if (!targetMerge) {
    targetMerge = createCustomerMerge(targetCanonicalName, []);
    result.push(targetMerge);
  }
  
  const newAliases = new Set(targetMerge.aliases);
  
  for (const name of namesToMerge) {
    if (name === targetCanonicalName) continue;
    
    const existingCanonical = aliasMap.get(name);
    if (existingCanonical && existingCanonical !== targetCanonicalName) {
      const existingMergeIndex = result.findIndex(m => m.canonicalName === existingCanonical);
      if (existingMergeIndex !== -1) {
        const existingMerge = result[existingMergeIndex];
        for (const alias of existingMerge.aliases) {
          if (alias !== targetCanonicalName) {
            newAliases.add(alias);
          }
        }
        if (existingMerge.canonicalName !== targetCanonicalName) {
          newAliases.add(existingMerge.canonicalName);
        }
        result.splice(existingMergeIndex, 1);
      }
    } else if (!existingCanonical) {
      newAliases.add(name);
    }
  }
  
  const finalTargetMerge = result.find(m => m.canonicalName === targetCanonicalName)!;
  finalTargetMerge.aliases = Array.from(newAliases);
  finalTargetMerge.updatedAt = new Date().toISOString();
  
  return result;
};

export const removeAlias = (
  existingMerges: CustomerMerge[],
  canonicalName: string,
  aliasToRemove: string
): CustomerMerge[] => {
  return existingMerges.map(merge => {
    if (merge.canonicalName === canonicalName) {
      return {
        ...merge,
        aliases: merge.aliases.filter(a => a !== aliasToRemove),
        updatedAt: new Date().toISOString(),
      };
    }
    return merge;
  }).filter(merge => merge.aliases.length > 0 || merge.canonicalName === canonicalName);
};

export const changeCanonicalName = (
  existingMerges: CustomerMerge[],
  oldCanonical: string,
  newCanonical: string
): CustomerMerge[] => {
  return existingMerges.map(merge => {
    if (merge.canonicalName === oldCanonical) {
      const newAliases = merge.aliases.filter(a => a !== newCanonical);
      if (oldCanonical !== newCanonical) {
        newAliases.push(oldCanonical);
      }
      return {
        ...merge,
        canonicalName: newCanonical,
        aliases: newAliases,
        updatedAt: new Date().toISOString(),
      };
    }
    return merge;
  });
};
