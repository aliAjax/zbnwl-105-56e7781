import { useState, useEffect, useCallback, useRef } from 'react';
import { getAppointmentsRepository, getArtistsRepository, getCustomerMergesRepository } from './repositories';
import { generateStatusHistoryForLegacy } from './migrations';
import { Appointment, TattooArtist, CustomerMerge } from '@/types';
import { RepositoryError } from './types';

const ensureStatusHistory = (appointment: Appointment): Appointment => {
  if (appointment.statusHistory?.length) {
    return appointment;
  }

  return {
    ...appointment,
    statusHistory: generateStatusHistoryForLegacy(appointment),
  };
};

export function useAppointmentsRepository() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RepositoryError | null>(null);
  const repositoryRef = useRef(getAppointmentsRepository());

  useEffect(() => {
    const repo = repositoryRef.current;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await repo.getAll();
        setAppointments(data);
        setError(null);
      } catch (err) {
        setError({ operation: 'initialize', error: err as Error, timestamp: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = repo.subscribe((data) => {
      setAppointments(data);
    });

    const unsubscribeErrors = repo.subscribeErrors((err) => {
      setError(err);
    });

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  const saveAppointments = useCallback(async (data: Appointment[]) => {
    const repo = repositoryRef.current;
    await repo.save(data.map(ensureStatusHistory));
  }, []);

  const addAppointment = useCallback(async (appointment: Appointment) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const exists = current.find(apt => apt.id === appointment.id);
    
    const appointmentWithHistory = ensureStatusHistory(
      appointment.statusHistory?.length || !exists?.statusHistory?.length
        ? appointment
        : { ...appointment, statusHistory: exists.statusHistory }
    );

    if (exists) {
      const updated = current.map(apt => apt.id === appointmentWithHistory.id ? appointmentWithHistory : apt);
      await repo.save(updated);
    } else {
      await repo.save([...current, appointmentWithHistory]);
    }
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const existing = current.find(apt => apt.id === id);
    
    const finalUpdates = { ...updates };
    
    if (updates.status && existing) {
      const baseHistory = ensureStatusHistory(existing).statusHistory;
      const lastStatus = baseHistory[baseHistory.length - 1]?.status || existing.status;

      if (!existing.statusHistory?.length) {
        finalUpdates.statusHistory = baseHistory;
      }
      
      if (updates.status !== lastStatus) {
        const newHistoryEntry = {
          status: updates.status,
          timestamp: new Date().toISOString(),
          note: existing.status === updates.status ? '状态更新' : `从${existing.status}变更为${updates.status}`,
        };
        finalUpdates.statusHistory = [
          ...baseHistory,
          newHistoryEntry,
        ];
      }
    } else if (existing && !existing.statusHistory?.length) {
      finalUpdates.statusHistory = ensureStatusHistory(existing).statusHistory;
    }

    const updated = current.map(apt => apt.id === id ? { ...apt, ...finalUpdates } : apt);
    await repo.save(updated);
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const filtered = current.filter(apt => apt.id !== id);
    await repo.save(filtered);
  }, []);

  const clearAppointments = useCallback(async () => {
    const repo = repositoryRef.current;
    await repo.clear();
  }, []);

  const updateStatus = useCallback(async (id: string, status: Appointment['status']) => {
    await updateAppointment(id, { status });
  }, [updateAppointment]);

  return {
    appointments,
    loading,
    error,
    saveAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    clearAppointments,
    updateStatus,
  };
}

export function useArtistsRepository() {
  const [artists, setArtists] = useState<TattooArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RepositoryError | null>(null);
  const repositoryRef = useRef(getArtistsRepository());

  useEffect(() => {
    const repo = repositoryRef.current;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await repo.getAll();
        setArtists(data);
        setError(null);
      } catch (err) {
        setError({ operation: 'initialize', error: err as Error, timestamp: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = repo.subscribe((data) => {
      setArtists(data);
    });

    const unsubscribeErrors = repo.subscribeErrors((err) => {
      setError(err);
    });

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  const saveArtists = useCallback(async (data: TattooArtist[]) => {
    const repo = repositoryRef.current;
    await repo.save(data);
  }, []);

  const addArtist = useCallback(async (artist: TattooArtist) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const exists = current.find(a => a.id === artist.id);
    if (exists) {
      const updated = current.map(a => a.id === artist.id ? artist : a);
      await repo.save(updated);
    } else {
      await repo.save([...current, artist]);
    }
  }, []);

  const updateArtist = useCallback(async (id: string, updates: Partial<TattooArtist>) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const updated = current.map(a => a.id === id ? { ...a, ...updates } : a);
    await repo.save(updated);
  }, []);

  const toggleArtistActive = useCallback(async (id: string) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const updated = current.map(a => a.id === id ? { ...a, active: !a.active } : a);
    await repo.save(updated);
  }, []);

  const clearArtists = useCallback(async () => {
    const repo = repositoryRef.current;
    await repo.clear();
  }, []);

  return {
    artists,
    loading,
    error,
    saveArtists,
    addArtist,
    updateArtist,
    toggleArtistActive,
    clearArtists,
  };
}

export function useCustomerMergesRepository() {
  const [customerMerges, setCustomerMerges] = useState<CustomerMerge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RepositoryError | null>(null);
  const repositoryRef = useRef(getCustomerMergesRepository());

  useEffect(() => {
    const repo = repositoryRef.current;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await repo.getAll();
        setCustomerMerges(data);
        setError(null);
      } catch (err) {
        setError({ operation: 'initialize', error: err as Error, timestamp: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = repo.subscribe((data) => {
      setCustomerMerges(data);
    });

    const unsubscribeErrors = repo.subscribeErrors((err) => {
      setError(err);
    });

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  const saveCustomerMerges = useCallback(async (data: CustomerMerge[]) => {
    const repo = repositoryRef.current;
    await repo.save(data);
  }, []);

  const addCustomerMerge = useCallback(async (merge: CustomerMerge) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const exists = current.find(m => m.id === merge.id);
    if (exists) {
      const updated = current.map(m => m.id === merge.id ? merge : m);
      await repo.save(updated);
    } else {
      await repo.save([...current, merge]);
    }
  }, []);

  const updateCustomerMerge = useCallback(async (id: string, updates: Partial<CustomerMerge>) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const now = new Date().toISOString();
    const updated = current.map(m => m.id === id ? { ...m, ...updates, updatedAt: now } : m);
    await repo.save(updated);
  }, []);

  const deleteCustomerMerge = useCallback(async (id: string) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const filtered = current.filter(m => m.id !== id);
    await repo.save(filtered);
  }, []);

  const clearCustomerMerges = useCallback(async () => {
    const repo = repositoryRef.current;
    await repo.clear();
  }, []);

  return {
    customerMerges,
    loading,
    error,
    saveCustomerMerges,
    addCustomerMerge,
    updateCustomerMerge,
    deleteCustomerMerge,
    clearCustomerMerges,
  };
}
