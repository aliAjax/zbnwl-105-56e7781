import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, CalendarDays, LayoutDashboard, Image, BarChart3, Download, Upload, Users, Calendar, List, Grid, TrendingUp, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { ArtistModal } from '@/components/ArtistModal';
import { RevenueDashboard } from '@/components/RevenueDashboard';
import { ImportConfirmModal } from '@/components/ImportExportModal';
import { ListView } from '@/components/ListView';
import { WeekView } from '@/components/WeekView';
import { MonthView } from '@/components/MonthView';
import { AppointmentFilters } from '@/components/AppointmentFilters';
import { useAppointmentsRepository, useArtistsRepository, useCustomerMergesRepository } from '@/storage';
import { useAppointmentFilters } from '@/hooks/useAppointmentFilters';
import { formatDate, getWeekDates } from '@/utils/dateUtils';
import { calculateArtistStats, formatDuration } from '@/utils/artistStats';
import { Appointment, AppointmentStatus, TattooArtist, CalendarView, CALENDAR_VIEW_LABELS, CustomerMerge } from '@/types';
import {
  exportAppointmentsToJson,
  exportFullDataToJson,
  downloadJsonFile,
  generateExportFilename,
  generateFullExportFilename,
  parseAndValidateImportData,
  parseFullImportData,
  calculateImportDiff,
  executeImport,
  mergeCustomerMerges,
  ImportDiffResult
} from '@/utils/importExport';

export function AppointmentBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointments, addAppointment, deleteAppointment, updateStatus, saveAppointments } = useAppointmentsRepository();
  const { artists, addArtist, toggleArtistActive } = useArtistsRepository();
  const { customerMerges, saveCustomerMerges } = useCustomerMergesRepository();
  const [importedCustomerMerges, setImportedCustomerMerges] = useState<CustomerMerge[] | null>(null);
  const {
    filters,
    setFilter,
    resetFilters,
    filteredAppointments,
    hasActiveFilters,
  } = useAppointmentFilters(appointments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [modalDate, setModalDate] = useState(formatDate(new Date()));
  const [modalTime, setModalTime] = useState('10:00');
  const [showDashboard, setShowDashboard] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDiff, setImportDiff] = useState<ImportDiffResult | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const state = location.state as { editAppointment?: Appointment } | null;
    if (state?.editAppointment) {
      setEditingAppointment(state.editAppointment);
      setModalDate(state.editAppointment.date);
      setModalTime(state.editAppointment.time);
      setIsModalOpen(true);
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const weekDates = getWeekDates(8);
  const todayStr = formatDate(new Date());

  const selectedArtist = useMemo(() => {
    if (filters.artistId === 'all') return null;
    return artists.find(a => a.id === filters.artistId) || null;
  }, [filters.artistId, artists]);

  const selectedArtistStats = useMemo(() => {
    if (!selectedArtist) return null;
    return calculateArtistStats(appointments, selectedArtist, 8);
  }, [appointments, selectedArtist]);

  const allWeekAppointments = weekDates.map(date => {
    const dateStr = formatDate(date);
    const dayAppointments = filteredAppointments
      .filter(apt => apt.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
    return { date, dateStr, appointments: dayAppointments };
  });

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

  const handleSaveAppointment = (appointment: Appointment) => {
    addAppointment(appointment);
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateStatus(id, status);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setModalDate(appointment.date);
    setModalTime(appointment.time);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个预约吗？')) {
      deleteAppointment(id);
    }
  };

  const handleOpenModal = (date = todayStr, time = '10:00') => {
    setEditingAppointment(null);
    setModalDate(date);
    setModalTime(time);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const jsonContent = exportFullDataToJson(appointments, customerMerges);
    const filename = generateFullExportFilename();
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
      const { appointments: importedAppointments, customerMerges: importedMerges, errors } = parseFullImportData(content);
      const diff = calculateImportDiff(appointments, importedAppointments);
      
      if (errors.length > 0 && diff.toAdd.length === 0 && diff.toUpdate.length === 0) {
        alert(`导入失败：${errors.join('; ')}`);
        return;
      }
      
      setImportDiff({ ...diff, invalid: errors.map(e => ({ data: null, errors: [e] })) });
      setImportedCustomerMerges(importedMerges);
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
    saveAppointments(newAppointments);
    
    if (importedCustomerMerges && importedCustomerMerges.length > 0) {
      const mergedCustomerMerges = mergeCustomerMerges(customerMerges, importedCustomerMerges);
      saveCustomerMerges(mergedCustomerMerges);
    }
    
    setIsImportModalOpen(false);
    setImportDiff(null);
    setImportedCustomerMerges(null);
    
    const totalImported = importDiff.toAdd.length + importDiff.toUpdate.length;
    let message = `导入成功！共导入 ${totalImported} 条预约记录`;
    if (importedCustomerMerges && importedCustomerMerges.length > 0) {
      message += `，${importedCustomerMerges.length} 条客户合并记录`;
    }
    alert(message);
  };

  const handleCancelImport = () => {
    setIsImportModalOpen(false);
    setImportDiff(null);
  };

  const handleSaveArtist = (artist: TattooArtist) => {
    addArtist(artist);
  };

  const handleToggleArtistActive = (id: string) => {
    toggleArtistActive(id);
  };

  const handleMonthDateClick = (dateStr: string) => {
    handleOpenModal(dateStr);
  };

  const handleWeekSlotClick = (dateStr: string, time: string) => {
    handleOpenModal(dateStr, time);
  };

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
    setCurrentDate(new Date());
  };

  const viewTabs: { view: CalendarView; icon: typeof Calendar; label: string }[] = [
    { view: 'list', icon: List, label: CALENDAR_VIEW_LABELS.list },
    { view: 'week', icon: Grid, label: CALENDAR_VIEW_LABELS.week },
    { view: 'month', icon: Calendar, label: CALENDAR_VIEW_LABELS.month },
  ];

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
                  <p className="text-gray-500 text-sm">管理预约，跟踪客户到店状态</p>
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
                onClick={() => navigate('/operation-review')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <TrendingUp className="w-4 h-4" />
                <span>运营复盘</span>
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

          <div className="flex flex-col gap-4 mt-5">
            <AppointmentFilters
              filters={filters}
              artists={artists}
              onFilterChange={setFilter}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {selectedArtist && selectedArtistStats && (
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                      <Users className="w-5 h-5 text-ink-950" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{selectedArtist.name} - 未来8天概览</div>
                      <div className="text-sm text-gray-400">{selectedArtist.specialty || '纹身师'}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-ink-800/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gold-400" />
                    <div>
                      <div className="text-white font-semibold">{selectedArtistStats.appointmentCount}</div>
                      <div className="text-xs text-gray-500">预约数</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-ink-800/50 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-white font-semibold">{formatDuration(selectedArtistStats.totalDuration)}</div>
                      <div className="text-xs text-gray-500">总工时</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-ink-800/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-tattoo-red" />
                    <div>
                      <div className="text-white font-semibold">{selectedArtistStats.pendingCount}</div>
                      <div className="text-xs text-gray-500">待确认</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-ink-800/50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-white font-semibold">{selectedArtistStats.unpaidDepositCount}</div>
                      <div className="text-xs text-gray-500">未付定金</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 bg-ink-800 rounded-xl p-1 border border-ink-700">
                {viewTabs.map(({ view, icon: Icon, label }) => (
                  <button
                    key={view}
                    onClick={() => handleViewChange(view)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentView === view
                        ? 'bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-ink-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-ink-700 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">总计:</span>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {showDashboard && (
          <RevenueDashboard appointments={appointments} />
        )}

        {currentView === 'list' && (
          <ListView
            appointments={filteredAppointments}
            artists={artists}
            selectedArtistId="all"
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddClick={handleOpenModal}
          />
        )}

        {currentView === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={filteredAppointments}
            artists={artists}
            selectedArtistId="all"
            onDateChange={setCurrentDate}
            onSlotClick={handleWeekSlotClick}
            onAppointmentClick={handleEdit}
          />
        )}

        {currentView === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={filteredAppointments}
            artists={artists}
            selectedArtistId="all"
            onDateChange={setCurrentDate}
            onDateClick={handleMonthDateClick}
            onAppointmentClick={handleEdit}
          />
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        editingAppointment={editingAppointment}
        selectedDate={modalDate}
        selectedTime={modalTime}
        appointments={appointments}
        artists={artists}
        onSave={handleSaveAppointment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
      />
      <ArtistModal
        isOpen={isArtistModalOpen}
        artists={artists}
        appointments={appointments}
        onSave={handleSaveArtist}
        onToggleActive={handleToggleArtistActive}
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
