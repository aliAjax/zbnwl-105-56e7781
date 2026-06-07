import { Appointment, TattooArtist, CustomerMerge } from '@/types';
import { LocalStorageRepository } from './LocalStorageRepository';
import { APPOINTMENTS_STORAGE_KEY, ARTISTS_STORAGE_KEY, CUSTOMER_MERGES_STORAGE_KEY, appointmentsMigrations, artistsMigrations, customerMergesMigrations, CURRENT_STORAGE_VERSION } from './migrations';

let appointmentsRepository: LocalStorageRepository<Appointment[]> | null = null;
let artistsRepository: LocalStorageRepository<TattooArtist[]> | null = null;
let customerMergesRepository: LocalStorageRepository<CustomerMerge[]> | null = null;

export function getAppointmentsRepository(): LocalStorageRepository<Appointment[]> {
  if (!appointmentsRepository) {
    appointmentsRepository = new LocalStorageRepository<Appointment[]>({
      key: APPOINTMENTS_STORAGE_KEY,
      defaultValue: [],
      migrations: appointmentsMigrations,
      currentVersion: CURRENT_STORAGE_VERSION,
    });
  }
  return appointmentsRepository;
}

export function getArtistsRepository(): LocalStorageRepository<TattooArtist[]> {
  if (!artistsRepository) {
    artistsRepository = new LocalStorageRepository<TattooArtist[]>({
      key: ARTISTS_STORAGE_KEY,
      defaultValue: [],
      migrations: artistsMigrations,
      currentVersion: CURRENT_STORAGE_VERSION,
    });
  }
  return artistsRepository;
}

export function getCustomerMergesRepository(): LocalStorageRepository<CustomerMerge[]> {
  if (!customerMergesRepository) {
    customerMergesRepository = new LocalStorageRepository<CustomerMerge[]>({
      key: CUSTOMER_MERGES_STORAGE_KEY,
      defaultValue: [],
      migrations: customerMergesMigrations,
      currentVersion: CURRENT_STORAGE_VERSION,
    });
  }
  return customerMergesRepository;
}

export function destroyRepositories(): void {
  if (appointmentsRepository) {
    appointmentsRepository.destroy();
    appointmentsRepository = null;
  }
  if (artistsRepository) {
    artistsRepository.destroy();
    artistsRepository = null;
  }
  if (customerMergesRepository) {
    customerMergesRepository.destroy();
    customerMergesRepository = null;
  }
}
