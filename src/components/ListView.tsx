import { useState, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Appointment, AppointmentStatus, TattooArtist } from '@/types';
import { AppointmentCard } from '@/components/AppointmentCard';
import { formatDate, getWeekDates, getDayName, isToday } from '@/utils/dateUtils';

interface ListViewProps {
  appointments: Appointment[];
  artists: TattooArtist[];
  selectedArtistId: string | 'all';
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onAddClick: (dateStr: string) => void;
}

export function ListView({
  appointments,
  artists,
  selectedArtistId,
  onStatusChange,
  onEdit,
  onDelete,
  onAddClick,
}: ListViewProps) {
  const weekDates = getWeekDates(8);
  const todayStr = formatDate(new Date());

  const filteredAppointments = selectedArtistId === 'all'
    ? appointments
    : appointments.filter(apt => apt.artistId === selectedArtistId);

  const allWeekAppointments = weekDates.map(date => {
    const dateStr = formatDate(date);
    const dayAppointments = filteredAppointments
      .filter(apt => apt.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
    return { date, dateStr, appointments: dayAppointments };
  });

  const getDefaultExpandedDates = (): Set<string> => {
    const expanded = new Set<string>();
    expanded.add(todayStr);
    allWeekAppointments.forEach(d => {
      if (d.appointments.length > 0) {
        expanded.add(d.dateStr);
      }
    });
    return expanded;
  };

  const [expandedDates, setExpandedDates] = useState<Set<string>>(getDefaultExpandedDates());

  useEffect(() => {
    setExpandedDates(getDefaultExpandedDates());
  }, [appointments.length, selectedArtistId]);

  const toggleDateExpand = (dateStr: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const getArtistName = (artistId?: string): string => {
    if (!artistId) return '未分配';
    const artist = artists.find(a => a.id === artistId);
    return artist?.name || '未知纹身师';
  };

  return (
    <div className="space-y-6">
      {allWeekAppointments.map(({ date, dateStr, appointments: dayApts }, dayIndex) => {
        const isExpanded = expandedDates.has(dateStr);
        const isTodayDate = isToday(dateStr);

        return (
          <div
            key={dateStr}
            className="bg-ink-800/30 rounded-2xl border border-ink-700 overflow-hidden animate-fade-in-up"
            style={{ animationDelay: `${dayIndex * 80}ms` }}
          >
            <button
              onClick={() => toggleDateExpand(dateStr)}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                isTodayDate ? 'bg-gold-500/10 hover:bg-gold-500/15' : 'hover:bg-ink-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                    isTodayDate
                      ? 'bg-gold-500 text-ink-950'
                      : 'bg-ink-700 text-gray-300'
                  }`}
                >
                  <span className="text-xs font-medium">
                    {isTodayDate ? '今天' : getDayName(date)}
                  </span>
                  <span className="text-xl font-display font-bold">
                    {date.getDate()}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {date.getMonth() + 1}月{date.getDate()}日
                    <span className="text-gray-500 text-sm ml-2 font-normal">
                      {getDayName(date)}
                    </span>
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {dayApts.length} 个预约
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {dayApts.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2">
                    {dayApts.filter(a => a.status === 'pending').length > 0 && (
                      <span className="px-2 py-1 bg-tattoo-red/20 text-red-300 text-xs rounded-full">
                        待确认 {dayApts.filter(a => a.status === 'pending').length}
                      </span>
                    )}
                    {dayApts.filter(a => a.status === 'completed').length > 0 && (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        完成 {dayApts.filter(a => a.status === 'completed').length}
                      </span>
                    )}
                  </div>
                )}
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 pt-2 border-t border-ink-700/50">
                {dayApts.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 mb-3">这一天暂无预约</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddClick(dateStr);
                      }}
                      className="inline-flex items-center gap-1.5 text-gold-500 hover:text-gold-400 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      添加预约
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dayApts.map((appointment, aptIndex) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onStatusChange={onStatusChange}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        index={aptIndex}
                        artistName={getArtistName(appointment.artistId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
