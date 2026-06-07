import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Appointment, AppointmentStatus, TattooArtist } from '@/types';
import { generateId, getTimeSlot, isTimeOverlap, minutesToTime } from '@/utils/dateUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  editingAppointment?: Appointment | null;
  selectedDate: string;
  appointments: Appointment[];
  artists: TattooArtist[];
  onSave: (appointment: Appointment) => void;
  onClose: () => void;
}

const initialFormData = {
  customerName: '',
  date: '',
  time: '10:00',
  bodyPart: '',
  duration: 2,
  referenceImage: '',
  depositPaid: false,
  depositAmount: 0,
  estimatedBalance: 0,
  notes: '',
  artistId: '',
};

export function AppointmentModal({ isOpen, editingAppointment, selectedDate, appointments, artists, onSave, onClose }: AppointmentModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictingAppointments, setConflictingAppointments] = useState<Appointment[]>([]);
  const [pendingAppointment, setPendingAppointment] = useState<Appointment | null>(null);

  const activeArtists = artists.filter(a => a.active);

  const getArtistName = (artistId?: string): string => {
    if (!artistId) return '未分配';
    const artist = artists.find(a => a.id === artistId);
    return artist?.name || '未知纹身师';
  };

  useEffect(() => {
    if (isOpen) {
      if (editingAppointment) {
        setFormData({
          customerName: editingAppointment.customerName,
          date: editingAppointment.date,
          time: editingAppointment.time,
          bodyPart: editingAppointment.bodyPart,
          duration: editingAppointment.duration,
          referenceImage: editingAppointment.referenceImage || '',
          depositPaid: editingAppointment.depositPaid,
          depositAmount: editingAppointment.depositAmount || 0,
          estimatedBalance: editingAppointment.estimatedBalance || 0,
          notes: editingAppointment.notes || '',
          artistId: editingAppointment.artistId || '',
        });
      } else {
        setFormData({
          ...initialFormData,
          date: selectedDate,
        });
      }
      setErrors({});
      setShowConflictWarning(false);
      setConflictingAppointments([]);
      setPendingAppointment(null);
    }
  }, [isOpen, editingAppointment, selectedDate]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = '请输入客户昵称';
    }
    if (!formData.date) {
      newErrors.date = '请选择预约日期';
    }
    if (!formData.bodyPart.trim()) {
      newErrors.bodyPart = '请输入纹身部位';
    }
    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = '请输入有效的预计时长';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const findConflictingAppointments = (appointment: Appointment): Appointment[] => {
    const currentSlot = getTimeSlot(appointment.time, appointment.duration);
    
    return appointments.filter(apt => {
      if (apt.id === appointment.id) return false;
      if (apt.date !== appointment.date) return false;
      if (apt.artistId !== appointment.artistId) return false;
      if (!appointment.artistId && !apt.artistId) return false;
      
      const aptSlot = getTimeSlot(apt.time, apt.duration);
      return isTimeOverlap(currentSlot, aptSlot);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const appointment: Appointment = {
      id: editingAppointment?.id || generateId(),
      customerName: formData.customerName.trim(),
      date: formData.date,
      time: formData.time,
      bodyPart: formData.bodyPart.trim(),
      duration: formData.duration,
      referenceImage: formData.referenceImage.trim() || undefined,
      depositPaid: formData.depositPaid,
      depositAmount: formData.depositAmount || undefined,
      estimatedBalance: formData.estimatedBalance || undefined,
      notes: formData.notes.trim() || undefined,
      artistId: formData.artistId || undefined,
      status: editingAppointment?.status || ('pending' as AppointmentStatus),
      createdAt: editingAppointment?.createdAt || new Date().toISOString(),
    };

    const conflicts = findConflictingAppointments(appointment);
    
    if (conflicts.length > 0) {
      setConflictingAppointments(conflicts);
      setPendingAppointment(appointment);
      setShowConflictWarning(true);
      return;
    }

    onSave(appointment);
    onClose();
  };

  const handleConfirmSave = () => {
    if (pendingAppointment) {
      onSave(pendingAppointment);
      onClose();
    }
  };

  const handleCancelConflict = () => {
    setShowConflictWarning(false);
    setConflictingAppointments([]);
    setPendingAppointment(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-ink-800 rounded-2xl border border-ink-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <div className="sticky top-0 bg-ink-800 border-b border-ink-700 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            {editingAppointment ? '编辑预约' : '新增预约'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-ink-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              客户昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className={`w-full px-4 py-2.5 bg-ink-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all ${
                errors.customerName ? 'border-red-500' : 'border-ink-700'
              }`}
              placeholder="输入客户昵称"
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-500">{errors.customerName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                预约日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-4 py-2.5 bg-ink-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all ${
                  errors.date ? 'border-red-500' : 'border-ink-700'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                预约时间
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              负责纹身师
            </label>
            <select
              value={formData.artistId}
              onChange={(e) => setFormData({ ...formData, artistId: e.target.value })}
              className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
            >
              <option value="">请选择纹身师（可选）</option>
              {activeArtists.map(artist => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                  {artist.specialty ? ` - ${artist.specialty}` : ''}
                </option>
              ))}
            </select>
            {activeArtists.length === 0 && (
              <p className="mt-1 text-sm text-yellow-500">暂无纹身师，请先在"纹身师管理"中添加</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                纹身部位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bodyPart}
                onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                className={`w-full px-4 py-2.5 bg-ink-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all ${
                  errors.bodyPart ? 'border-red-500' : 'border-ink-700'
                }`}
                placeholder="如：手臂、背部"
              />
              {errors.bodyPart && (
                <p className="mt-1 text-sm text-red-500">{errors.bodyPart}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                预计时长(小时) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2.5 bg-ink-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all ${
                  errors.duration ? 'border-red-500' : 'border-ink-700'
                }`}
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              参考图链接
            </label>
            <input
              type="url"
              value={formData.referenceImage}
              onChange={(e) => setFormData({ ...formData, referenceImage: e.target.value })}
              className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="depositPaid"
              checked={formData.depositPaid}
              onChange={(e) => setFormData({ ...formData, depositPaid: e.target.checked })}
              className="w-5 h-5 rounded border-ink-600 bg-ink-900 text-gold-500 focus:ring-gold-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="depositPaid" className="text-sm text-gray-300 cursor-pointer">
              定金已支付
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                定金金额 (元)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
                placeholder="输入定金金额"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                预计尾款 (元)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.estimatedBalance}
                onChange={(e) => setFormData({ ...formData, estimatedBalance: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
                placeholder="输入预计尾款"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all resize-none"
              placeholder="输入备注信息..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-lg font-medium transition-colors"
            >
              {editingAppointment ? '保存修改' : '创建预约'}
            </button>
          </div>
        </form>
      </div>

      {showConflictWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancelConflict} />
          
          <div className="relative bg-ink-800 rounded-2xl border border-tattoo-red/50 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="px-6 py-5 border-b border-ink-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-tattoo-red/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-tattoo-red" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">预约时间冲突</h3>
                  <p className="text-gray-400 text-sm">该时间段已有其他预约</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-gray-300 text-sm mb-4">以下预约与当前预约时间重叠（同一纹身师）：</p>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {conflictingAppointments.map((apt) => {
                  const endTime = minutesToTime(
                    (parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1])) + apt.duration * 60
                  );
                  const artistName = getArtistName(apt.artistId);
                  return (
                    <div
                      key={apt.id}
                      className="bg-ink-900/50 border border-ink-700 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{apt.customerName}</span>
                        <span className="text-xs px-2 py-0.5 bg-tattoo-red/20 text-tattoo-red rounded-full">
                          冲突
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <span>时间: {apt.time} - {endTime}</span>
                        <span className="mx-2">|</span>
                        <span>时长: {apt.duration}小时</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <span>纹身师: {artistName}</span>
                      </div>
                      {apt.bodyPart && (
                        <div className="text-sm text-gray-500 mt-1">
                          部位: {apt.bodyPart}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-700 flex gap-3">
              <button
                type="button"
                onClick={handleCancelConflict}
                className="flex-1 px-4 py-2.5 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg font-medium transition-colors"
              >
                返回修改
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2.5 bg-tattoo-red hover:bg-tattoo-red/90 text-white rounded-lg font-medium transition-colors"
              >
                强制保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
