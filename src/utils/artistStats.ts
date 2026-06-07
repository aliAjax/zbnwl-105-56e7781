import { Appointment, TattooArtist, ArtistStats, ArtistStatsSummary } from '@/types';
import { formatDate, getWeekDates } from './dateUtils';
import { hasDepositPaid } from '@/utils/paymentUtils';

export function calculateArtistStats(
  appointments: Appointment[],
  artist: TattooArtist,
  days: number = 8
): ArtistStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDates = getWeekDates(days);
  const futureDateStrs = futureDates.map(d => formatDate(d));

  const artistAppointments = appointments.filter(apt => apt.artistId === artist.id);

  const futureAppointments = artistAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate >= today && apt.status !== 'cancelled';
  });

  const dateRangeAppointments = artistAppointments.filter(apt =>
    futureDateStrs.includes(apt.date) && apt.status !== 'cancelled'
  );

  const appointmentCount = dateRangeAppointments.length;
  const totalDuration = dateRangeAppointments.reduce((sum, apt) => sum + apt.duration, 0);
  const pendingCount = dateRangeAppointments.filter(apt => apt.status === 'pending').length;
  const unpaidDepositCount = dateRangeAppointments.filter(apt => !hasDepositPaid(apt)).length;
  const futureAppointmentCount = futureAppointments.length;

  return {
    artistId: artist.id,
    appointmentCount,
    totalDuration,
    pendingCount,
    unpaidDepositCount,
    futureAppointmentCount,
  };
}

export function calculateAllArtistsStats(
  appointments: Appointment[],
  artists: TattooArtist[],
  days: number = 8
): ArtistStatsSummary {
  const stats: ArtistStatsSummary = {};
  artists.forEach(artist => {
    stats[artist.id] = calculateArtistStats(appointments, artist, days);
  });
  return stats;
}

export function getArtistFutureAppointments(
  appointments: Appointment[],
  artistId: string
): Appointment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return appointments.filter(apt => {
    if (apt.artistId !== artistId) return false;
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate >= today && apt.status !== 'cancelled';
  });
}

export function hasFutureAppointments(
  appointments: Appointment[],
  artistId: string
): boolean {
  return getArtistFutureAppointments(appointments, artistId).length > 0;
}

export function formatDuration(hours: number): string {
  if (hours === 0) return '0h';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}h`;
  if (wholeHours === 0) return `${minutes}min`;
  return `${wholeHours}h${minutes}min`;
}
