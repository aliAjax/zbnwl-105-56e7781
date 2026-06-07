import { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { DateNavigator } from '@/components/DateNavigator';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentModal } from '@/components/AppointmentModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatDate } from '@/utils/dateUtils';
import { Appointment, AppointmentStatus, STATUS_LABELS } from '@/types';

export function AppointmentBoard() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('tattoo_appointments', []);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const filteredAppointments = appointments
    .filter(apt => apt.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const stats = {
    total: appointments.filter(apt => apt.date === selectedDate).length,
    pending: appointments.filter(apt => apt.date === selectedDate && apt.status === 'pending').length,
    completed: appointments.filter(apt => apt.date === selectedDate && apt.status === 'completed').length,
  };

  const handleSaveAppointment = (appointment: Appointment) => {
    setAppointments(prev => {
      const exists = prev.find(apt => apt.id === appointment.id);
      if (exists) {
        return prev.map(apt => apt.id === appointment.id ? appointment : apt);
      }
      return [...prev, appointment];
    });
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(apt => apt.id === id ? { ...apt, status } : apt)
    );
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个预约吗？')) {
      setAppointments(prev => prev.filter(apt => apt.id !== id));
    }
  };

  const handleOpenModal = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <div className="bg-ink-900/50 border-b border-ink-800 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-ink-950" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">纹身工作室预约看板</h1>
                  <p className="text-gray-500 text-sm">管理每日预约，跟踪客户到店状态</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25"
            >
              <Plus className="w-5 h-5" />
              <span>新增预约</span>
            </button>
          </div>

          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">今日总计:</span>
              <span className="text-white font-semibold">{stats.total} 单</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tattoo-red"></span>
              <span className="text-gray-400 text-sm">待确认: {stats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-gray-400 text-sm">已完成: {stats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-gray-200">
            {selectedDate === formatDate(new Date()) ? '今天' : selectedDate} 的预约
          </h2>
          <span className="text-gray-500 text-sm">
            共 {filteredAppointments.length} 个预约
          </span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="bg-ink-800/50 border border-ink-700 border-dashed rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ink-700 flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">暂无预约</h3>
            <p className="text-gray-500 mb-4">点击"新增预约"按钮添加第一个预约</p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-lg font-medium transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              添加预约
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        editingAppointment={editingAppointment}
        selectedDate={selectedDate}
        onSave={handleSaveAppointment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
      />
    </div>
  );
}
