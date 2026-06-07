import { Migration } from './types';

export const CURRENT_STORAGE_VERSION = 1;

export const APPOINTMENTS_STORAGE_KEY = 'tattoo_appointments';
export const ARTISTS_STORAGE_KEY = 'tattoo_artists';

export const appointmentsMigrations: Migration[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (data: unknown) => {
      return data as unknown;
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
];
