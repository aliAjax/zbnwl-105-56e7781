import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, FileText, User, CheckCircle, History, AlertCircle, TrendingUp, MinusCircle, Users, X, Plus, UserPlus, Edit2, Trash2, Save } from 'lucide-react';
import { useAppointmentsRepository, useCustomerMergesRepository } from '@/storage';
import { buildCustomerProfile, buildAliasMap, getCanonicalName, getAllRawCustomerNames, mergeCustomers, removeAlias, changeCanonicalName } from '@/utils/customerUtils';
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS } from '@/types';
import { calculatePaymentSummary, hasDepositPaid } from '@/utils/paymentUtils';

export default function CustomerProfile() {
  const { customerName } = useParams<{ customerName: string }>();
  const navigate = useNavigate();
  const { appointments } = useAppointmentsRepository();
  const { customerMerges, saveCustomerMerges } = useCustomerMergesRepository();
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [selectedToMerge, setSelectedToMerge] = useState<string[]>([]);
  const [newCanonicalName, setNewCanonicalName] = useState('');

  const decodedName = customerName ? decodeURIComponent(customerName) : '';
  const aliasMap = buildAliasMap(customerMerges);
  const canonicalName = getCanonicalName(decodedName, aliasMap);
  const profile = buildCustomerProfile(appointments, decodedName, customerMerges);

  const allRawNames = getAllRawCustomerNames(appointments);
  const availableToMerge = allRawNames.filter(name => {
    const nameCanonical = getCanonicalName(name, aliasMap);
    return nameCanonical !== canonicalName && name !== canonicalName;
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-ink-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">未找到客户 "{decodedName}" 的档案</p>
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回看板
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleMergeCustomers = () => {
    if (selectedToMerge.length === 0) return;
    const updatedMerges = mergeCustomers(customerMerges, canonicalName, selectedToMerge);
    saveCustomerMerges(updatedMerges);
    setSelectedToMerge([]);
    setShowMergeModal(false);
  };

  const handleRemoveAlias = (alias: string) => {
    if (confirm(`确定要移除别名 "${alias}" 吗？`)) {
      const updatedMerges = removeAlias(customerMerges, canonicalName, alias);
      saveCustomerMerges(updatedMerges);
    }
  };

  const handleChangeCanonicalName = () => {
    if (!newCanonicalName.trim()) return;
    const updatedMerges = changeCanonicalName(customerMerges, canonicalName, newCanonicalName.trim());
    saveCustomerMerges(updatedMerges);
    setNewCanonicalName('');
    setShowEditNameModal(false);
    navigate(`/customer/${encodeURIComponent(newCanonicalName.trim())}`);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <div className="bg-ink-900/50 border-b border-ink-800 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-white hover:bg-ink-800 rounded-lg transition-colors"
              title="返回看板"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                <User className="w-6 h-6 text-ink-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-white">{profile.canonicalName}</h1>
                  <button
                    onClick={() => {
                      setNewCanonicalName(profile.canonicalName);
                      setShowEditNameModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-ink-800 rounded-lg transition-colors"
                    title="修改客户名称"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-500 text-sm">客户档案</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {profile.aliases.length > 0 && (
          <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                <h2 className="font-display text-lg font-semibold text-white">客户别名</h2>
              </div>
              <button
                onClick={() => setShowMergeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg text-sm font-medium transition-colors border border-gold-500/30"
              >
                <UserPlus className="w-4 h-4" />
                合并客户
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.aliases.map((alias, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-700/50 text-gray-300 rounded-lg text-sm border border-ink-600 group"
                >
                  <span>{alias}</span>
                  <button
                    onClick={() => handleRemoveAlias(alias)}
                    className="p-0.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="移除别名"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.aliases.length === 0 && (
          <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                <h2 className="font-display text-lg font-semibold text-white">客户别名</h2>
              </div>
              <button
                onClick={() => setShowMergeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg text-sm font-medium transition-colors border border-gold-500/30"
              >
                <UserPlus className="w-4 h-4" />
                合并客户
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-2">暂无别名，点击"合并客户"将多个昵称合并为同一客户</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>累计消费</span>
            </div>
            <p className="text-2xl font-display font-bold text-emerald-400">¥{profile.totalSpent || 0}</p>
          </div>
          <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Calendar className="w-4 h-4 text-gold-500" />
              <span>总预约</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">{profile.totalAppointments}</p>
          </div>
          <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>已完成</span>
            </div>
            <p className="text-2xl font-display font-bold text-emerald-400">{profile.completedAppointments}</p>
          </div>
          <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign className="w-4 h-4 text-gold-500" />
              <span>定金已付</span>
            </div>
            <p className="text-2xl font-display font-bold text-gold-400">{profile.totalDepositsPaid}</p>
          </div>
          <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>累计时长</span>
            </div>
            <p className="text-2xl font-display font-bold text-blue-400">{profile.totalDuration}h</p>
          </div>
          {profile.totalRefundAmount && profile.totalRefundAmount > 0 && (
            <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <MinusCircle className="w-4 h-4 text-red-400" />
                <span>累计退款</span>
              </div>
              <p className="text-2xl font-display font-bold text-red-400">¥{profile.totalRefundAmount}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gold-500" />
              <h2 className="font-display text-lg font-semibold text-white">常用纹身部位</h2>
            </div>
            {profile.bodyParts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.bodyParts.map((part, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-ink-700/50 text-gray-300 rounded-lg text-sm border border-ink-600"
                  >
                    {part}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无记录</p>
            )}
          </div>

          <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gold-500" />
              <h2 className="font-display text-lg font-semibold text-white">到店记录</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">首次到店</span>
                <span className="text-white font-medium">{formatDateDisplay(profile.firstVisit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">最近到店</span>
                <span className="text-white font-medium">{formatDateDisplay(profile.lastVisit)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gold-500" />
            <h2 className="font-display text-lg font-semibold text-white">历史备注</h2>
          </div>
          {profile.notes.length > 0 ? (
            <div className="space-y-3">
              {profile.notes.map((note, index) => (
                <div
                  key={index}
                  className="bg-ink-900/50 rounded-lg p-3 border border-ink-700"
                >
                  <p className="text-gray-300 text-sm">{note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">暂无备注</p>
          )}
        </div>

        <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gold-500" />
            <h2 className="font-display text-lg font-semibold text-white">历史预约</h2>
          </div>
          <div className="space-y-3">
            {profile.history.map((apt) => (
              <div
                key={apt.id}
                className="bg-ink-800/50 rounded-xl border border-ink-700 p-4 hover:border-ink-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-white font-medium">
                      {formatDateDisplay(apt.date)}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[apt.status]}`}>
                      {STATUS_LABELS[apt.status]}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">{apt.time}</div>
                </div>
                {apt.customerName !== profile.canonicalName && (
                  <div className="mb-2 text-xs text-gray-500">
                    原始昵称: <span className="text-gray-400">{apt.customerName}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-600" />
                    {apt.bodyPart}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.duration}小时
                  </span>
                  <span className={`flex items-center gap-1 ${hasDepositPaid(apt) ? 'text-emerald-400' : 'text-gray-500'}`}>
                    <DollarSign className="w-3.5 h-3.5" />
                    {hasDepositPaid(apt) ? '定金已付' : '定金未付'}
                  </span>
                  {(() => {
                    const summary = calculatePaymentSummary(apt);
                    if (summary.netIncome > 0) {
                      return (
                        <span className="flex items-center gap-1 text-emerald-400">
                          ¥{summary.netIncome}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                {apt.paymentRecords && apt.paymentRecords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {apt.paymentRecords.map(record => (
                      <span
                        key={record.id}
                        className={`px-2 py-0.5 rounded text-xs border ${PAYMENT_TYPE_COLORS[record.type]}`}
                        title={record.note}
                      >
                        {PAYMENT_TYPE_LABELS[record.type]} ¥{record.amount}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMergeModal(false)} />
          <div className="relative bg-ink-800 rounded-2xl border border-ink-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
            <div className="sticky top-0 bg-ink-800 border-b border-ink-700 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">合并客户</h2>
              <button
                onClick={() => setShowMergeModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-ink-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-ink-900/50 border border-ink-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm">将选中的客户合并到</p>
                <p className="text-white font-medium text-lg mt-1">{profile.canonicalName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-3">选择要合并的客户昵称：</p>
                {availableToMerge.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableToMerge.map(name => (
                      <label
                        key={name}
                        className="flex items-center gap-3 p-3 bg-ink-900/50 rounded-lg border border-ink-700 hover:border-ink-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToMerge.includes(name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedToMerge([...selectedToMerge, name]);
                            } else {
                              setSelectedToMerge(selectedToMerge.filter(n => n !== name));
                            }
                          }}
                          className="w-4 h-4 rounded border-ink-600 bg-ink-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
                        />
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-white">{name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">没有可合并的其他客户</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="flex-1 px-4 py-2.5 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleMergeCustomers}
                  disabled={selectedToMerge.length === 0}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedToMerge.length > 0
                      ? 'bg-gold-500 hover:bg-gold-400 text-ink-950'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  合并 ({selectedToMerge.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditNameModal(false)} />
          <div className="relative bg-ink-800 rounded-2xl border border-ink-700 w-full max-w-md animate-scale-in shadow-2xl">
            <div className="sticky top-0 bg-ink-800 border-b border-ink-700 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">修改客户名称</h2>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-ink-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">新的客户名称</label>
                <input
                  type="text"
                  value={newCanonicalName}
                  onChange={(e) => setNewCanonicalName(e.target.value)}
                  placeholder="输入新的客户名称"
                  className="w-full px-4 py-2.5 bg-ink-900/50 border border-ink-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
              <p className="text-gray-500 text-sm">
                原名称 "{profile.canonicalName}" 将变为别名
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 px-4 py-2.5 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleChangeCanonicalName}
                  disabled={!newCanonicalName.trim() || newCanonicalName.trim() === profile.canonicalName}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    newCanonicalName.trim() && newCanonicalName.trim() !== profile.canonicalName
                      ? 'bg-gold-500 hover:bg-gold-400 text-ink-950'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
