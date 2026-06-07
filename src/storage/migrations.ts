import { Migration } from './types';
import { Appointment, StatusHistoryEntry } from '@/types';

export const CURRENT_STORAGE_VERSION = 2;

export const APPOINTMENTS_STORAGE_KEY = 'tattoo_appointments';
export const ARTISTS_STORAGE_KEY = 'tattoo_artists';

const generateStatusHistoryForLegacy = (apt: Appointment): StatusHistoryEntry[] => {
  const history: StatusHistoryEntry[] = [];
  const createdAt = apt.createdAt || new Date().toISOString();
  
  history.push({
    status: 'pending',
    timestamp: createdAt,
    note: '系统初始化',
  });

  if (apt.status !== 'pending') {
    const statusOrder: Appointment['status'][] = ['pending', 'confirmed', 'arrived', 'completed'];
    const currentIndex = statusOrder.indexOf(apt.status);
    for (let i = 1; i <= currentIndex; i++) {
      if (statusOrder[i]) {
        history.push({
          status: statusOrder[i],
          timestamp: createdAt,
          note: '历史数据迁移',
        });
      }
    }
  }

  return history;
};

export const appointmentsMigrations: Migration[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (data: unknown) => {
      return data as unknown;
    },
  },
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (data: unknown) => {
      const appointments = data as Appointment[];
      return appointments.map((apt) => {
        if (!apt.statusHistory || apt.statusHistory.length === 0) {
          return {
            ...apt,
            statusHistory: generateStatusHistoryForLegacy(apt),
          };
        }
        return apt;
      });
    },
  },
];

export const artistsMigrations: Migration[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (data: unknown) => {
      return data as unknown;
    },
  },
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (data: unknown) => {
      return data as unknown;
    },
  },
];
