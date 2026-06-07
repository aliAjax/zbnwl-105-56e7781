import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Appointment, AppointmentStatus, STATUS_COLORS, TattooArtist } from '@/types';
import {
  formatDate,
  getMonthDates,
  getDayNameShort,
  isToday,
  isSameMonth,
  getMonthName,
  addMonths,
} from '@/utils/dateUtils';

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  artists: TattooArtist[];
  selectedArtistId: string | 'all';
  onDateChange: (date: Date) => void;
  onDateClick: (dateStr: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function MonthView({
  currentDate,
  appointments,
  artists,
  selectedArtistId,
  onDateChange,
  onDateClick,
  onAppointmentClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthDates = getMonthDates(year, month);

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

  const handlePrevMonth = () => {
    onDateChange(addMonths(currentDate, -1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-ink-800/30 rounded-2xl border border-ink-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700 bg-ink-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-ink-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-xl font-semibold text-white">
            {year}年 {getMonthName(month)}
          </h2>
          <button
            onClick={handleNextMonth}
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

      <div className="grid grid-cols-7 border-b border-ink-700">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`py-3 text-center text-sm font-medium ${
              index === 0 || index === 6 ? 'text-tattoo-red' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDates.map((date, index) => {
          const dateStr = formatDate(date);
          const dayApts = getAppointmentsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(dateStr);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div
              key={`${dateStr}-${index}`}
              className={`min-h-[120px] border-b border-r border-ink-700/50 p-2 transition-colors ${
                !isCurrentMonth ? 'bg-ink-900/30' : 'hover:bg-ink-700/30 cursor-pointer'
              } ${isTodayDate ? 'bg-gold-500/10' : ''}`}
              onClick={() => isCurrentMonth && onDateClick(dateStr)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? 'bg-gold-500 text-ink-950'
                      : isCurrentMonth
                      ? isWeekend
                        ? 'text-tattoo-red'
                        : 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayApts.length > 0 && (
                  <span className="text-xs text-gray-500">{dayApts.length}</span>
                )}
              </div>

              <div className="space-y-1">
                {dayApts.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(apt);
                    }}
                    className={`text-xs px-2 py-1 rounded truncate cursor-pointer border ${
                      STATUS_COLORS[apt.status]
                    } hover:opacity-80 transition-opacity`}
                    title={`${apt.customerName} - ${apt.time} - ${getArtistName(apt.artistId)}`}
                  >
                    <span className="font-medium">{apt.time}</span> {apt.customerName}
                  </div>
                ))}
                {dayApts.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayApts.length - 3} 更多
                  </div>
                )}
              </div>

              {dayApts.length === 0 && isCurrentMonth && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateClick(dateStr);
                  }}
                  className="w-full mt-2 py-1 text-gray-600 hover:text-gold-500 text-xs opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
