export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekDates = (days: number = 8): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export const getDayName = (date: Date): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
};

export const isToday = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr === today;
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
