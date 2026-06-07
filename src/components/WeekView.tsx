import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Appointment, STATUS_COLORS, TattooArtist } from '@/types';
import {
  formatDate,
  getWeekDates,
  getDayName,
  isToday,
  getWeekStart,
  addDays,
  timeToMinutes,
  HOURS,
  minutesToTime,
} from '@/utils/dateUtils';

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  artists: TattooArtist[];
  selectedArtistId: string | 'all';
  onDateChange: (date: Date) => void;
  onSlotClick: (dateStr: string, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function WeekView({
  currentDate,
  appointments,
  artists,
  selectedArtistId,
  onDateChange,
  onSlotClick,
  onAppointmentClick,
}: WeekViewProps) {
  const weekStart = getWeekStart(currentDate);
  const weekDates = getWeekDates(7, weekStart);

  const filteredAppointments = selectedArtistId === 'all'
    ? appointments
    : appointments.filter(apt => apt.artistId === selectedArtistId);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return filteredAppointments
      .filter(apt => apt.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getArtistName = (artistId?: string): string => {
    if (!artistId) return '未分配';
    const artist = artists.find(a => a.id === artistId);
    return artist?.name || '未知纹身师';
  };

  const handlePrevWeek = () => {
    onDateChange(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(weekStart, 7));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatAppointmentStyle = (appointment: Appointment) => {
    const startMinutes = timeToMinutes(appointment.time);
    const top = ((startMinutes - 8 * 60) / 60) * 60;
    const height = appointment.duration * 60;
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="bg-ink-800/30 rounded-2xl border border-ink-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700 bg-ink-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-ink-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-xl font-semibold text-white">
            {weekStart.getFullYear()}年{weekStart.getMonth() + 1}月{weekStart.getDate()}日 -{' '}
            {weekEnd.getMonth() + 1}月{weekEnd.getDate()}日
          </h2>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-ink-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          今天
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[80px_1fr] border-b border-ink-700">
            <div className="py-3 px-2 border-r border-ink-700"></div>
            <div className="grid grid-cols-7">
              {weekDates.map((date) => {
                const dateStr = formatDate(date);
                const isTodayDate = isToday(dateStr);
                const dayApts = getAppointmentsForDate(date);
                return (
                  <div
                    key={dateStr}
                    className={`py-3 text-center border-r border-ink-700 last:border-r-0 ${
                      isTodayDate ? 'bg-gold-500/10' : ''
                    }`}
                  >
                    <div className={`text-sm ${isTodayDate ? 'text-gold-400 font-medium' : 'text-gray-400'}`}>
                      {getDayName(date)}
                    </div>
                    <div
                      className={`text-lg font-display font-bold ${
                        isTodayDate ? 'text-gold-500' : 'text-white'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-500">{dayApts.length} 单</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-[80px_1fr] relative">
            <div className="border-r border-ink-700">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] px-2 flex items-start justify-end pt-0 text-xs text-gray-500 border-b border-ink-700/50"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 relative">
              {weekDates.map((date) => {
                const dateStr = formatDate(date);
                const dayApts = getAppointmentsForDate(date);
                const isTodayDate = isToday(dateStr);

                return (
                  <div
                    key={dateStr}
                    className={`relative border-r border-ink-700/50 last:border-r-0 ${
                      isTodayDate ? 'bg-gold-500/5' : ''
                    }`}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="h-[60px] border-b border-ink-700/30 hover:bg-ink-700/20 cursor-pointer transition-colors"
                        onClick={() =>
                          onSlotClick(dateStr, `${String(hour).padStart(2, '0')}:00`)
                        }
                      />
                    ))}

                    {dayApts.map((apt) => {
                      const style = formatAppointmentStyle(apt);
                      const endMinutes = timeToMinutes(apt.time) + apt.duration * 60;
                      const endTime = minutesToTime(endMinutes);

                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          style={style}
                          className={`absolute left-1 right-1 px-2 py-1 rounded cursor-pointer border overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:z-10 ${
                            STATUS_COLORS[apt.status]
                          }`}
                          title={`${apt.customerName}\n${apt.time} - ${endTime}\n${apt.bodyPart}\n纹身师: ${getArtistName(apt.artistId)}`}
                        >
                          <div className="text-xs font-medium truncate">{apt.customerName}</div>
                          <div className="text-xs opacity-80 truncate">
                            {apt.time} - {endTime}
                          </div>
                          <div className="text-xs opacity-60 truncate">{apt.bodyPart}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
