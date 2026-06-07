import { useState } from 'react';
import { Plus, LayoutDashboard, CalendarDays, Clock, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentModal } from '@/components/AppointmentModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatDate } from '@/utils/dateUtils';
import { Appointment, AppointmentStatus, STATUS_LABELS, TattooArtist } from '@/types';

const STATUS_GROUPS: { key: AppointmentStatus; icon: typeof Clock; color: string }[] = [
  { key: 'pending', icon: Clock, color: 'text-tattoo-red border-tattoo-red/30 bg-tattoo-red/10' },
  { key: 'confirmed', icon: Clock, color: 'text-gold-500 border-gold-500/30 bg-gold-500/10' },
  { key: 'arrived', icon: Clock, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { key: 'completed', icon: Clock, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
];

export default function TodayWorkbench() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('tattoo_appointments', []);
  const [artists] = useLocalStorage<TattooArtist[]>('tattoo_artists', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [modalDate, setModalDate] = useState(formatDate(new Date()));

  const activeArtists = artists.filter(a => a.active);

  const getArtistName = (artistId?: string): string | undefined => {
    if (!artistId) return undefined;
    const artist = artists.find(a => a.id === artistId);
    return artist?.name;
  };

  const todayStr = formatDate(new Date());

  const todayAppointments = appointments
    .filter(apt => apt.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const groupedAppointments = STATUS_GROUPS.map(group => ({
    ...group,
    appointments: todayAppointments.filter(apt => apt.status === group.key),
  }));

  const totalToday = todayAppointments.length;
  const totalPending = todayAppointments.filter(apt => apt.status === 'pending').length;
  const totalConfirmed = todayAppointments.filter(apt => apt.status === 'confirmed').length;
  const totalArrived = todayAppointments.filter(apt => apt.status === 'arrived').length;
  const totalCompleted = todayAppointments.filter(apt => apt.status === 'completed').length;

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

  const handleOpenModal = (date = todayStr) => {
    setEditingAppointment(null);
    setModalDate(date);
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
                  <LayoutDashboard className="w-5 h-5 text-ink-950" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">今日到店工作台</h1>
                  <p className="text-gray-500 text-sm">专注处理今日预约，高效管理到店流程</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/reference-images')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <Image className="w-4 h-4" />
                <span>参考图管理</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <CalendarDays className="w-4 h-4" />
                <span>预约看板</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>新增预约</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">今日总计:</span>
              <span className="text-white font-semibold">{totalToday} 单</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tattoo-red"></span>
              <span className="text-gray-400 text-sm">待确认: {totalPending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-600"></span>
              <span className="text-gray-400 text-sm">已确认: {totalConfirmed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-gray-400 text-sm">已到店: {totalArrived}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-gray-400 text-sm">已完成: {totalCompleted}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {totalToday === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-ink-800 flex items-center justify-center mb-6">
              <CalendarDays className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-400 mb-2">今日暂无预约</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              今天还没有安排任何预约，点击下方按钮添加新的预约，或者切换到预约看板查看更多日期。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-xl font-medium transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span>添加预约</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-5 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <CalendarDays className="w-4 h-4" />
                <span>查看预约看板</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {groupedAppointments.map((group, groupIndex) => {
              const StatusIcon = group.icon;
              return (
                <div
                  key={group.key}
                  className="bg-ink-800/30 rounded-2xl border border-ink-700 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${groupIndex * 80}ms` }}
                >
                  <div className={`px-5 py-4 border-b border-ink-700/50 ${group.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="w-5 h-5" />
                        <h3 className="font-display text-lg font-semibold">
                          {STATUS_LABELS[group.key]}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-ink-900/50">
                        {group.appointments.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {group.appointments.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="w-12 h-12 rounded-xl bg-ink-800 flex items-center justify-center mx-auto mb-3">
                          <StatusIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm">暂无{STATUS_LABELS[group.key]}的预约</p>
                      </div>
                    ) : (
                      group.appointments.map((appointment, aptIndex) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onStatusChange={handleStatusChange}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          index={aptIndex}
                          artistName={getArtistName(appointment.artistId)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        editingAppointment={editingAppointment}
        selectedDate={modalDate}
        appointments={appointments}
        artists={artists}
        onSave={handleSaveAppointment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
      />
    </div>
  );
}
