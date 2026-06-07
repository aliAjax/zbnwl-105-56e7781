import { getWeekDates, formatDate, getDayName, isToday } from '@/utils/dateUtils';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const weekDates = getWeekDates();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {weekDates.map((date, index) => {
        const dateStr = formatDate(date);
        const isSelected = selectedDate === dateStr;
        const isTodayDate = isToday(dateStr);

        return (
          <button
            key={dateStr}
            onClick={() => onDateChange(dateStr)}
            className={`
              flex flex-col items-center min-w-[80px] py-3 px-4 rounded-xl border transition-all duration-300
              ${isSelected
                ? 'bg-gold-500/20 border-gold-500 text-gold-400 shadow-lg shadow-gold-500/10'
                : 'bg-ink-800 border-ink-700 text-gray-400 hover:border-ink-600 hover:text-gray-300'
              }
              ${isTodayDate && !isSelected ? 'border-gold-700/50' : ''}
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className={`text-xs mb-1 ${isTodayDate ? 'text-gold-500 font-medium' : ''}`}>
              {isTodayDate ? '今天' : getDayName(date)}
            </span>
            <span className="text-xl font-display font-semibold">
              {date.getDate()}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {date.getMonth() + 1}月
            </span>
          </button>
        );
      })}
    </div>
  );
}
