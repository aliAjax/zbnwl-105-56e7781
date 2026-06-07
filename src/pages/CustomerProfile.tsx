import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, FileText, User, CheckCircle, History, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { buildCustomerProfile } from '@/utils/customerUtils';
import { Appointment, STATUS_LABELS, STATUS_COLORS } from '@/types';

export default function CustomerProfile() {
  const { customerName } = useParams<{ customerName: string }>();
  const navigate = useNavigate();
  const [appointments] = useLocalStorage<Appointment[]>('tattoo_appointments', []);

  const decodedName = customerName ? decodeURIComponent(customerName) : '';
  const profile = buildCustomerProfile(appointments, decodedName);

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
                <h1 className="font-display text-2xl font-bold text-white">{profile.customerName}</h1>
                <p className="text-gray-500 text-sm">客户档案</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-600" />
                    {apt.bodyPart}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.duration}小时
                  </span>
                  <span className={`flex items-center gap-1 ${apt.depositPaid ? 'text-emerald-400' : 'text-gray-500'}`}>
                    <DollarSign className="w-3.5 h-3.5" />
                    {apt.depositPaid ? '定金已付' : '定金未付'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
