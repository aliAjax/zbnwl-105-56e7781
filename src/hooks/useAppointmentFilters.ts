import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Appointment, AppointmentFilters, DEFAULT_FILTERS } from '@/types';
import { hasDepositPaid } from '@/utils/paymentUtils';

const STORAGE_KEY = 'appointment-filters';

export function useAppointmentFilters(appointments: Appointment[]) {
  const [filters, setFilters] = useLocalStorage<AppointmentFilters>(STORAGE_KEY, DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof AppointmentFilters>(
    key: K,
    value: AppointmentFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, [setFilters]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (filters.artistId !== 'all' && apt.artistId !== filters.artistId) {
        return false;
      }
      if (filters.status !== 'all' && apt.status !== filters.status) {
        return false;
      }
      if (filters.depositPaid !== 'all') {
        const paid = hasDepositPaid(apt);
        if (filters.depositPaid === 'yes' && !paid) return false;
        if (filters.depositPaid === 'no' && paid) return false;
      }
      if (filters.customerKeyword.trim()) {
        const keyword = filters.customerKeyword.trim().toLowerCase();
        if (!apt.customerName.toLowerCase().includes(keyword)) {
          return false;
        }
      }
      if (filters.hasReferenceImage !== 'all') {
        const hasRef = !!apt.referenceImage;
        if (filters.hasReferenceImage === 'yes' && !hasRef) return false;
        if (filters.hasReferenceImage === 'no' && hasRef) return false;
      }
      return true;
    });
  }, [appointments, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.artistId !== 'all' ||
      filters.status !== 'all' ||
      filters.depositPaid !== 'all' ||
      filters.customerKeyword.trim() !== '' ||
      filters.hasReferenceImage !== 'all'
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    filteredAppointments,
    hasActiveFilters,
  };
}
