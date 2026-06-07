import { useState, useEffect } from 'react';
import { X, AlertTriangle, Plus, Trash2, Edit2 } from 'lucide-react';
import { Appointment, AppointmentStatus, TattooArtist, PaymentRecord, PaymentType, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS } from '@/types';
import { generateId, getTimeSlot, isTimeOverlap, minutesToTime } from '@/utils/dateUtils';
import { calculatePaymentSummary } from '@/utils/paymentUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  editingAppointment?: Appointment | null;
  selectedDate: string;
  selectedTime?: string;
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

interface NewPaymentForm {
  type: PaymentType;
  amount: number;
  timestamp: string;
  note: string;
}

const toDateTimeLocalInputValue = (value?: string): string => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const toIsoTimestamp = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const formatPaymentTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间无效';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const createInitialNewPayment = (): NewPaymentForm => ({
  type: 'deposit',
  amount: 0,
  timestamp: toDateTimeLocalInputValue(),
  note: '',
});

const getInitialNewPayment = (): NewPaymentForm => {
  return createInitialNewPayment();
};

export function AppointmentModal({ isOpen, editingAppointment, selectedDate, selectedTime = '10:00', appointments, artists, onSave, onClose }: AppointmentModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictingAppointments, setConflictingAppointments] = useState<Appointment[]>([]);
  const [pendingAppointment, setPendingAppointment] = useState<Appointment | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState<NewPaymentForm>(() => getInitialNewPayment());
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

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
        setPaymentRecords(editingAppointment.paymentRecords || []);
      } else {
        setFormData({
          ...initialFormData,
          date: selectedDate,
          time: selectedTime,
        });
        setPaymentRecords([]);
      }
      setErrors({});
      setShowConflictWarning(false);
      setConflictingAppointments([]);
      setPendingAppointment(null);
      setShowAddPayment(false);
      setNewPayment(getInitialNewPayment());
      setEditingPaymentId(null);
    }
  }, [isOpen, editingAppointment, selectedDate, selectedTime]);

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

  const handleAddPayment = () => {
    if (newPayment.amount <= 0 || !newPayment.timestamp) return;
    
    const newRecord: PaymentRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      type: newPayment.type,
      amount: newPayment.amount,
      timestamp: toIsoTimestamp(newPayment.timestamp),
      note: newPayment.note.trim() || undefined,
    };
    
    setPaymentRecords([...paymentRecords, newRecord]);
    setNewPayment(getInitialNewPayment());
    setShowAddPayment(false);
  };

  const handleDeletePayment = (recordId: string) => {
    setPaymentRecords(paymentRecords.filter(r => r.id !== recordId));
  };

  const handleStartEditPayment = (record: PaymentRecord) => {
    setEditingPaymentId(record.id);
    setNewPayment({
      type: record.type,
      amount: record.amount,
      timestamp: toDateTimeLocalInputValue(record.timestamp),
      note: record.note || '',
    });
  };

  const handleSaveEditPayment = () => {
    if (!editingPaymentId || newPayment.amount <= 0 || !newPayment.timestamp) return;
    
    setPaymentRecords(paymentRecords.map(r =>
      r.id === editingPaymentId
        ? {
            ...r,
            type: newPayment.type,
            amount: newPayment.amount,
            timestamp: toIsoTimestamp(newPayment.timestamp),
            note: newPayment.note.trim() || undefined,
          }
        : r
    ));
    setEditingPaymentId(null);
    setNewPayment(getInitialNewPayment());
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setNewPayment(getInitialNewPayment());
  };

  const currentPaymentSummary = calculatePaymentSummary({ paymentRecords } as Appointment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const depositTotal = paymentRecords.filter(r => r.type === 'deposit').reduce((sum, r) => sum + r.amount, 0);
    const finalDepositPaid = depositTotal > 0 || formData.depositPaid;
    const finalDepositAmount = depositTotal > 0 ? depositTotal : formData.depositAmount || undefined;

    const appointment: Appointment = {
      id: editingAppointment?.id || generateId(),
      customerName: formData.customerName.trim(),
      date: formData.date,
      time: formData.time,
      bodyPart: formData.bodyPart.trim(),
      duration: formData.duration,
      referenceImage: formData.referenceImage.trim() || undefined,
      depositPaid: finalDepositPaid,
      depositAmount: finalDepositAmount,
      estimatedBalance: formData.estimatedBalance || undefined,
      notes: formData.notes.trim() || undefined,
      artistId: formData.artistId || undefined,
      status: editingAppointment?.status || ('pending' as AppointmentStatus),
      createdAt: editingAppointment?.createdAt || new Date().toISOString(),
      statusHistory: editingAppointment?.statusHistory || [],
      paymentRecords: paymentRecords.length > 0 ? paymentRecords : undefined,
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

          <div className="bg-ink-900/50 rounded-xl border border-ink-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-white">收款流水</h3>
                <p className="text-xs text-gray-500 mt-0.5">管理定金、尾款、补款、退款记录</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  实收: <span className="text-emerald-400 font-bold">¥{currentPaymentSummary.netIncome}</span>
                </p>
              </div>
            </div>

            {paymentRecords.length > 0 && (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {paymentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-ink-800 rounded-lg p-3 border border-ink-700"
                  >
                    {editingPaymentId === record.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newPayment.type}
                            onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as PaymentType })}
                            className="px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                          >
                            <option value="deposit">定金</option>
                            <option value="balance">尾款</option>
                            <option value="supplement">补款</option>
                            <option value="refund">退款</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={newPayment.amount}
                            onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                            className="px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                            placeholder="金额"
                          />
                        </div>
                        <input
                          type="datetime-local"
                          value={newPayment.timestamp}
                          onChange={(e) => setNewPayment({ ...newPayment, timestamp: e.target.value })}
                          className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                        <input
                          type="text"
                          value={newPayment.note}
                          onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                          className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                          placeholder="备注（可选）"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEditPayment}
                            className="flex-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditPayment}
                            className="flex-1 px-3 py-1.5 bg-ink-700 text-gray-400 rounded-lg text-sm hover:bg-ink-600 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs border ${PAYMENT_TYPE_COLORS[record.type]}`}>
                            {PAYMENT_TYPE_LABELS[record.type]}
                          </span>
                          <span className="text-white font-medium">¥{record.amount}</span>
                          <span className="text-gray-500 text-xs">{formatPaymentTime(record.timestamp)}</span>
                          {record.note && (
                            <span className="text-gray-500 text-xs">({record.note})</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditPayment(record)}
                            className="p-1.5 text-gray-500 hover:text-gold-500 hover:bg-ink-700 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(record.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-ink-700 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAddPayment ? (
              <div className="space-y-3 bg-ink-800 rounded-lg p-3 border border-ink-600">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as PaymentType })}
                    className="px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="deposit">定金</option>
                    <option value="balance">尾款</option>
                    <option value="supplement">补款</option>
                    <option value="refund">退款</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                    className="px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="金额"
                  />
                </div>
                <input
                  type="datetime-local"
                  value={newPayment.timestamp}
                  onChange={(e) => setNewPayment({ ...newPayment, timestamp: e.target.value })}
                  className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <input
                  type="text"
                  value={newPayment.note}
                  onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                  className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="备注（可选）"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="flex-1 px-3 py-2 bg-gold-500 text-ink-950 rounded-lg text-sm font-medium hover:bg-gold-400 transition-colors"
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddPayment(false); setNewPayment(getInitialNewPayment()); }}
                    className="flex-1 px-3 py-2 bg-ink-700 text-gray-300 rounded-lg text-sm hover:bg-ink-600 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddPayment(true)}
                className="w-full py-2.5 border-2 border-dashed border-ink-600 rounded-lg text-gray-400 hover:text-gold-400 hover:border-gold-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加流水记录
              </button>
            )}
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
