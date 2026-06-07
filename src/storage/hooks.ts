import { useState, useEffect, useCallback, useRef } from 'react';
import { getAppointmentsRepository, getArtistsRepository } from './repositories';
import { Appointment, TattooArtist } from '@/types';
import { RepositoryError } from './types';

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
    await repo.save(data);
  }, []);

  const addAppointment = useCallback(async (appointment: Appointment) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const exists = current.find(apt => apt.id === appointment.id);
    if (exists) {
      const updated = current.map(apt => apt.id === appointment.id ? appointment : apt);
      await repo.save(updated);
    } else {
      await repo.save([...current, appointment]);
    }
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    const repo = repositoryRef.current;
    const current = await repo.getAll();
    const updated = current.map(apt => apt.id === id ? { ...apt, ...updates } : apt);
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
