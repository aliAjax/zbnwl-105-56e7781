import { useState, useEffect, useRef } from 'react';
import { Plus, CalendarDays, ChevronDown, LayoutDashboard, Image, BarChart3, Download, Upload, Users, Filter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentModal } from '@/components/AppointmentModal';
import { ArtistModal } from '@/components/ArtistModal';
import { RevenueDashboard } from '@/components/RevenueDashboard';
import { ImportConfirmModal } from '@/components/ImportExportModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatDate, getWeekDates, getDayName, isToday } from '@/utils/dateUtils';
import { Appointment, AppointmentStatus, TattooArtist } from '@/types';
import {
  exportAppointmentsToJson,
  downloadJsonFile,
  generateExportFilename,
  parseAndValidateImportData,
  calculateImportDiff,
  executeImport,
  ImportDiffResult
} from '@/utils/importExport';

export function AppointmentBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('tattoo_appointments', []);
  const [artists, setArtists] = useLocalStorage<TattooArtist[]>('tattoo_artists', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [modalDate, setModalDate] = useState(formatDate(new Date()));
  const [showDashboard, setShowDashboard] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDiff, setImportDiff] = useState<ImportDiffResult | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const state = location.state as { editAppointment?: Appointment } | null;
    if (state?.editAppointment) {
      setEditingAppointment(state.editAppointment);
      setModalDate(state.editAppointment.date);
      setIsModalOpen(true);
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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

  const weekAppointmentsList = allWeekAppointments.flatMap(d => d.appointments);
  const filteredWeekList = filteredAppointments.filter(apt => 
    weekDates.some(d => formatDate(d) === apt.date)
  );

  const totalWeek = weekAppointmentsList.length;
  const totalToday = allWeekAppointments.find(d => d.dateStr === todayStr)?.appointments.length || 0;
  const totalPending = filteredWeekList.filter(apt => apt.status === 'pending').length;
  const totalCompleted = filteredWeekList.filter(apt => apt.status === 'completed').length;
  const totalConfirmed = filteredWeekList.filter(apt => apt.status === 'confirmed').length;
  const totalArrived = filteredWeekList.filter(apt => apt.status === 'arrived').length;

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

  const handleSaveAppointment = (appointment: Appointment) => {
    setAppointments(prev => {
      const exists = prev.find(apt => apt.id === appointment.id);
      if (exists) {
        return prev.map(apt => apt.id === appointment.id ? appointment : apt);
      }
      const next = [...prev, appointment];
      setExpandedDates(prev => new Set(prev).add(appointment.date));
      return next;
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

  const handleExport = () => {
    const jsonContent = exportAppointmentsToJson(appointments);
    const filename = generateExportFilename();
    downloadJsonFile(jsonContent, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { valid, invalid } = parseAndValidateImportData(content);
      const diff = calculateImportDiff(appointments, valid);
      setImportDiff({ ...diff, invalid });
      setIsImportModalOpen(true);
    };
    reader.onerror = () => {
      alert('文件读取失败，请重试');
    };
    reader.readAsText(file);
    
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importDiff) return;
    
    const newAppointments = executeImport(appointments, importDiff);
    setAppointments(newAppointments);
    setIsImportModalOpen(false);
    setImportDiff(null);
    
    const totalImported = importDiff.toAdd.length + importDiff.toUpdate.length;
    alert(`导入成功！共导入 ${totalImported} 条预约记录`);
  };

  const handleCancelImport = () => {
    setIsImportModalOpen(false);
    setImportDiff(null);
  };

  const handleSaveArtist = (artist: TattooArtist) => {
    setArtists(prev => {
      const exists = prev.find(a => a.id === artist.id);
      if (exists) {
        return prev.map(a => a.id === artist.id ? artist : a);
      }
      return [...prev, artist];
    });
  };

  const handleToggleArtistActive = (id: string) => {
    setArtists(prev =>
      prev.map(a => a.id === id ? { ...a, active: !a.active } : a)
    );
  };

  const handleDeleteArtist = (id: string) => {
    setArtists(prev => prev.filter(a => a.id !== id));
  };

  const activeArtists = artists.filter(a => a.active);

  const getArtistName = (artistId?: string): string => {
    if (!artistId) return '未分配';
    const artist = artists.find(a => a.id === artistId);
    return artist?.name || '未知纹身师';
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
                  <p className="text-gray-500 text-sm">管理今日及未来七天预约，跟踪客户到店状态</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsArtistModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <Users className="w-4 h-4" />
                <span>纹身师管理</span>
              </button>
              <button
                onClick={() => navigate('/reference-images')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <Image className="w-4 h-4" />
                <span>参考图管理</span>
              </button>
              <button
                onClick={() => navigate('/today')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>今日工作台</span>
              </button>
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border ${
                  showDashboard
                    ? 'bg-gold-500/20 text-gold-400 border-gold-500/50'
                    : 'bg-ink-800 hover:bg-ink-700 text-gray-300 border-ink-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>收入看板</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <Download className="w-4 h-4" />
                <span>导出数据</span>
              </button>
              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <Upload className="w-4 h-4" />
                <span>导入数据</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>新增预约</span>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500 text-sm">纹身师:</span>
              <select
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="bg-ink-800 border border-ink-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
              >
                <option value="all">全部纹身师</option>
                {activeArtists.map(artist => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-px h-6 bg-ink-700" />
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">未来八天总计:</span>
              <span className="text-white font-semibold">{totalWeek} 单</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-500"></span>
              <span className="text-gray-400 text-sm">今日: {totalToday}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {showDashboard && (
          <RevenueDashboard appointments={appointments} />
        )}

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
                          handleOpenModal(dateStr);
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
                          onStatusChange={handleStatusChange}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
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

      <AppointmentModal
        isOpen={isModalOpen}
        editingAppointment={editingAppointment}
        selectedDate={modalDate}
        appointments={appointments}
        artists={activeArtists}
        onSave={handleSaveAppointment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
      />
      <ArtistModal
        isOpen={isArtistModalOpen}
        artists={artists}
        onSave={handleSaveArtist}
        onToggleActive={handleToggleArtistActive}
        onDelete={handleDeleteArtist}
        onClose={() => setIsArtistModalOpen(false)}
      />
      <ImportConfirmModal
        isOpen={isImportModalOpen}
        diff={importDiff}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />
    </div>
  );
}
