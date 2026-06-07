import { Appointment, AppointmentStatus, PaymentType } from '@/types';
import { migrateBatchPaymentRecords } from '@/utils/paymentUtils';

const VALID_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'];
const VALID_PAYMENT_TYPES: PaymentType[] = ['deposit', 'balance', 'supplement', 'refund'];
const REQUIRED_FIELDS: (keyof Appointment)[] = ['id', 'customerName', 'date', 'time', 'bodyPart', 'duration', 'depositPaid', 'status', 'createdAt'];

export interface ImportValidationResult {
  valid: Appointment[];
  invalid: { data: unknown; errors: string[] }[];
}

export interface ImportDiffResult {
  toAdd: Appointment[];
  toUpdate: Appointment[];
  toSkip: Appointment[];
  invalid: { data: unknown; errors: string[] }[];
}

export function validateAppointment(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['数据格式错误，不是有效的对象'] };
  }

  const apt = data as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (!(field in apt) || apt[field] === undefined || apt[field] === null) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  if (typeof apt.id !== 'string' || apt.id.trim() === '') {
    errors.push('字段 id 必须是非空字符串');
  }

  if (typeof apt.customerName !== 'string' || apt.customerName.trim() === '') {
    errors.push('字段 customerName 必须是非空字符串');
  }

  if (typeof apt.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(apt.date)) {
    errors.push('字段 date 格式不正确，应为 YYYY-MM-DD');
  }

  if (typeof apt.time !== 'string' || !/^\d{2}:\d{2}$/.test(apt.time)) {
    errors.push('字段 time 格式不正确，应为 HH:MM');
  }

  if (typeof apt.bodyPart !== 'string' || apt.bodyPart.trim() === '') {
    errors.push('字段 bodyPart 必须是非空字符串');
  }

  if (typeof apt.duration !== 'number' || apt.duration <= 0) {
    errors.push('字段 duration 必须是大于 0 的数字');
  }

  if (typeof apt.depositPaid !== 'boolean') {
    errors.push('字段 depositPaid 必须是布尔值');
  }

  if (typeof apt.status !== 'string' || !VALID_STATUSES.includes(apt.status as AppointmentStatus)) {
    errors.push(`字段 status 必须是以下值之一: ${VALID_STATUSES.join(', ')}`);
  }

  if (typeof apt.createdAt !== 'string' || isNaN(Date.parse(apt.createdAt))) {
    errors.push('字段 createdAt 必须是有效的日期字符串');
  }

  if (apt.depositAmount !== undefined && typeof apt.depositAmount !== 'number') {
    errors.push('字段 depositAmount 必须是数字');
  }

  if (apt.estimatedBalance !== undefined && typeof apt.estimatedBalance !== 'number') {
    errors.push('字段 estimatedBalance 必须是数字');
  }

  if (apt.referenceImage !== undefined && typeof apt.referenceImage !== 'string') {
    errors.push('字段 referenceImage 必须是字符串');
  }

  if (apt.notes !== undefined && typeof apt.notes !== 'string') {
    errors.push('字段 notes 必须是字符串');
  }

  if (apt.artistId !== undefined && apt.artistId !== null && typeof apt.artistId !== 'string') {
    errors.push('字段 artistId 必须是字符串');
  }

  if (apt.statusHistory !== undefined) {
    if (!Array.isArray(apt.statusHistory)) {
      errors.push('字段 statusHistory 必须是数组');
    } else {
      for (let i = 0; i < apt.statusHistory.length; i++) {
        const entry = apt.statusHistory[i] as Record<string, unknown>;
        if (typeof entry !== 'object' || entry === null) {
          errors.push(`statusHistory[${i}] 必须是对象`);
        } else {
          if (!VALID_STATUSES.includes(entry.status as AppointmentStatus)) {
            errors.push(`statusHistory[${i}].status 必须是有效的状态`);
          }
          if (typeof entry.timestamp !== 'string' || isNaN(Date.parse(entry.timestamp))) {
            errors.push(`statusHistory[${i}].timestamp 必须是有效的日期字符串`);
          }
        }
      }
    }
  }

  if (apt.paymentRecords !== undefined) {
    if (!Array.isArray(apt.paymentRecords)) {
      errors.push('字段 paymentRecords 必须是数组');
    } else {
      for (let i = 0; i < apt.paymentRecords.length; i++) {
        const record = apt.paymentRecords[i] as Record<string, unknown>;
        if (typeof record !== 'object' || record === null) {
          errors.push(`paymentRecords[${i}] 必须是对象`);
        } else {
          if (typeof record.id !== 'string' || record.id.trim() === '') {
            errors.push(`paymentRecords[${i}].id 必须是非空字符串`);
          }
          if (!VALID_PAYMENT_TYPES.includes(record.type as PaymentType)) {
            errors.push(`paymentRecords[${i}].type 必须是有效的支付类型: ${VALID_PAYMENT_TYPES.join(', ')}`);
          }
          if (typeof record.amount !== 'number' || record.amount < 0) {
            errors.push(`paymentRecords[${i}].amount 必须是大于等于 0 的数字`);
          }
          if (typeof record.timestamp !== 'string' || isNaN(Date.parse(record.timestamp))) {
            errors.push(`paymentRecords[${i}].timestamp 必须是有效的日期字符串`);
          }
          if (record.note !== undefined && record.note !== null && typeof record.note !== 'string') {
            errors.push(`paymentRecords[${i}].note 必须是字符串`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function parseAndValidateImportData(jsonString: string): ImportValidationResult {
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(jsonString);
  } catch {
    return {
      valid: [],
      invalid: [{ data: jsonString, errors: ['JSON 解析失败，请检查文件格式'] }]
    };
  }

  const valid: Appointment[] = [];
  const invalid: { data: unknown; errors: string[] }[] = [];

  if (!Array.isArray(parsedData)) {
    return {
      valid: [],
      invalid: [{ data: parsedData, errors: ['导入数据必须是预约数组'] }]
    };
  }

  for (const item of parsedData) {
    const { valid: isValid, errors } = validateAppointment(item);
    if (isValid) {
      valid.push(item as Appointment);
    } else {
      invalid.push({ data: item, errors });
    }
  }

  const migratedValid = migrateBatchPaymentRecords(valid);

  return { valid: migratedValid, invalid };
}

export function calculateImportDiff(
  existingAppointments: Appointment[],
  validImported: Appointment[]
): ImportDiffResult {
  const existingIds = new Set(existingAppointments.map(apt => apt.id));

  const toAdd: Appointment[] = [];
  const toUpdate: Appointment[] = [];
  const toSkip: Appointment[] = [];

  for (const imported of validImported) {
    if (!existingIds.has(imported.id)) {
      toAdd.push(imported);
    } else {
      const existing = existingAppointments.find(apt => apt.id === imported.id)!;
      const isIdentical = JSON.stringify(existing) === JSON.stringify(imported);
      if (isIdentical) {
        toSkip.push(imported);
      } else {
        toUpdate.push(imported);
      }
    }
  }

  return { toAdd, toUpdate, toSkip, invalid: [] };
}

export function exportAppointmentsToJson(appointments: Appointment[]): string {
  return JSON.stringify(appointments, null, 2);
}

export function downloadJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateExportFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `tattoo-appointments-${dateStr}-${timeStr}.json`;
}

export function executeImport(
  existingAppointments: Appointment[],
  diff: ImportDiffResult
): Appointment[] {
  const updatedMap = new Map(diff.toUpdate.map(apt => [apt.id, apt]));
  const result: Appointment[] = [];

  for (const apt of existingAppointments) {
    if (updatedMap.has(apt.id)) {
      result.push(updatedMap.get(apt.id)!);
    } else {
      result.push(apt);
    }
  }

  result.push(...diff.toAdd);

  return result;
}
