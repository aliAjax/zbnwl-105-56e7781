export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekDates = (days: number = 8, startDate?: Date): Date[] => {
  const dates: Date[] = [];
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export const getDayName = (date: Date): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
};

export const getDayNameShort = (date: Date): string => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[date.getDay()];
};

export const isToday = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr === today;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

export const getMonthDates = (year: number, month: number): Date[] => {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, 1 - i - 1);
    dates.push(date);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  
  const remainingDays = 42 - dates.length;
  for (let i = 1; i <= remainingDays; i++) {
    dates.push(new Date(year, month + 1, i));
  }
  
  return dates;
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekEnd = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (6 - day);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getMonthName = (month: number): string => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return months[month];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export interface TimeSlot {
  startTime: number;
  endTime: number;
}

export const getTimeSlot = (time: string, duration: number): TimeSlot => {
  const startTime = timeToMinutes(time);
  const endTime = startTime + duration * 60;
  return { startTime, endTime };
};

export const isTimeOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime;
};

export const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
