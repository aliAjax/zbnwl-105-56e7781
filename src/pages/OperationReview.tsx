import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Bell,
  Clock,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentsRepository } from '@/storage';
import { generateOperationReview, ANOMALY_TYPE_LABELS, REMINDER_TYPE_LABELS } from '@/utils/operationReview';
import { formatDate } from '@/utils/dateUtils';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';

const SEVERITY_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
};

const SEVERITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
};

const PRIORITY_LABELS = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export default function OperationReview() {
  const navigate = useNavigate();
  const { appointments } = useAppointmentsRepository();
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'anomalies' | 'reminders'>('overview');

  const reviewData = useMemo(() => {
    return generateOperationReview(appointments, days);
  }, [appointments, days]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
    trend?: number;
  }) => (
    <div className="bg-ink-800/50 rounded-xl border border-ink-700 p-5 hover:border-ink-600 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-display font-bold text-white">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-ink-700">
          <span className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% 较上周
          </span>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="总预约数"
          value={reviewData.summary.totalAppointments}
          icon={Calendar}
          color="bg-gold-500/20"
          subtitle={`过去 ${days} 天`}
        />
        <StatCard
          title="转化率"
          value={`${reviewData.summary.conversionRate}%`}
          icon={CheckCircle}
          color="bg-emerald-500/20"
          subtitle="已完成/已结束"
        />
        <StatCard
          title="未到店率"
          value={`${reviewData.summary.noShowRate}%`}
          icon={XCircle}
          color="bg-red-500/20"
          subtitle="爽约比例"
        />
        <StatCard
          title="平均确认时长"
          value={`${reviewData.summary.avgTimeToConfirm}h`}
          icon={Clock}
          color="bg-blue-500/20"
          subtitle="待确认→已确认"
        />
        <StatCard
          title="定金收取率"
          value={`${reviewData.summary.depositCollectionRate}%`}
          icon={DollarSign}
          color="bg-purple-500/20"
          subtitle="已付定金比例"
        />
        <StatCard
          title="排期过满天数"
          value={reviewData.summary.overbookedDays}
          icon={Users}
          color="bg-orange-500/20"
          subtitle="超过12小时"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">异常检测</h3>
                <p className="text-gray-500 text-sm">共 {reviewData.anomalies.length} 个异常</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('anomalies')}
              className="text-gold-500 text-sm hover:text-gold-400 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {reviewData.anomalies.slice(0, 5).map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex items-start gap-3 p-3 bg-ink-800/50 rounded-lg border border-ink-700"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[anomaly.severity]}`}>
                  {SEVERITY_LABELS[anomaly.severity]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{anomaly.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{anomaly.description}</p>
                </div>
              </div>
            ))}
            {reviewData.anomalies.length === 0 && (
              <p className="text-gray-500 text-center py-8">暂无异常数据</p>
            )}
          </div>
        </div>

        <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">可操作提醒</h3>
                <p className="text-gray-500 text-sm">共 {reviewData.reminders.length} 条提醒</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('reminders')}
              className="text-gold-500 text-sm hover:text-gold-400 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {reviewData.reminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start gap-3 p-3 bg-ink-800/50 rounded-lg border border-ink-700"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[reminder.priority]}`}>
                  {PRIORITY_LABELS[reminder.priority]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{reminder.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{reminder.description}</p>
                </div>
              </div>
            ))}
            {reviewData.reminders.length === 0 && (
              <p className="text-gray-500 text-center py-8">暂无待处理提醒</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrend = () => (
    <div className="space-y-6">
      <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-white">预约趋势</h3>
              <p className="text-gray-500 text-sm">过去 {days} 天的预约状态变化</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d
                    ? 'bg-gold-500 text-ink-950'
                    : 'bg-ink-800 text-gray-400 hover:text-white hover:bg-ink-700'
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex items-end gap-1 h-64 mb-4">
              {reviewData.trendData.map((point, index) => {
                const maxTotal = Math.max(...reviewData.trendData.map((p) => p.total), 1);
                const heightPercent = (point.total / maxTotal) * 100;
                return (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gold-500/80 rounded-t-sm hover:bg-gold-400 transition-colors cursor-pointer relative group"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-ink-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {point.date}: {point.total} 单
                      </div>
                    </div>
                    {index % Math.ceil(reviewData.trendData.length / 10) === 0 && (
                      <span className="text-xs text-gray-500 -rotate-45 origin-top-left translate-x-2">
                        {point.date.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-8 pt-4 border-t border-ink-700">
              {(['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'] as const).map((status) => {
                const colorClass = STATUS_COLORS[status];
                const count = reviewData.trendData.reduce((sum, p) => sum + p[status === 'no_show' ? 'noShow' : status], 0);
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]}`}></span>
                    <span className="text-gray-400 text-sm">
                      {STATUS_LABELS[status]}: {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">定金收取情况</h3>
            <p className="text-gray-500 text-sm">过去 {days} 天</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            {reviewData.trendData.slice(-7).map((point) => (
              <div key={point.date} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{point.date.slice(5)}</span>
                  <span className="text-white">
                    {point.depositPaid}/{point.total} 已付
                  </span>
                </div>
                <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${point.total > 0 ? (point.depositPaid / point.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-display font-bold text-gold-500 mb-2">
                {reviewData.summary.depositCollectionRate}%
              </div>
              <p className="text-gray-500">整体定金收取率</p>
              <div className="mt-4 flex gap-4 justify-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {reviewData.trendData.reduce((sum, p) => sum + p.depositPaid, 0)}
                  </p>
                  <p className="text-xs text-gray-500">已付定金</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {reviewData.trendData.reduce((sum, p) => sum + p.depositUnpaid, 0)}
                  </p>
                  <p className="text-xs text-gray-500">未付定金</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-6">
      <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">异常列表</h3>
            <p className="text-gray-500 text-sm">
              共 {reviewData.anomalies.length} 个异常，其中高危 {reviewData.anomalies.filter((a) => a.severity === 'high').length} 个
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {reviewData.anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="flex items-center justify-between p-4 bg-ink-800/50 rounded-xl border border-ink-700 hover:border-ink-600 transition-all"
            >
              <div className="flex items-start gap-4">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  anomaly.severity === 'high' ? 'text-red-400' :
                  anomaly.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[anomaly.severity]}`}>
                      {SEVERITY_LABELS[anomaly.severity]}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {ANOMALY_TYPE_LABELS[anomaly.type]}
                    </span>
                  </div>
                  <p className="text-white font-medium">{anomaly.title}</p>
                  <p className="text-gray-500 text-sm mt-1">{anomaly.description}</p>
                  {anomaly.date && (
                    <p className="text-gray-600 text-xs mt-1">预约日期: {anomaly.date}</p>
                  )}
                </div>
              </div>
              {anomaly.actionable && anomaly.actionLabel && (
                <button className="px-4 py-2 bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 rounded-lg text-sm font-medium transition-colors">
                  {anomaly.actionLabel}
                </button>
              )}
            </div>
          ))}
          {reviewData.anomalies.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">暂无异常数据</p>
              <p className="text-gray-500 text-sm mt-1">所有预约运营正常</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReminders = () => (
    <div className="space-y-6">
      <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">可操作提醒</h3>
            <p className="text-gray-500 text-sm">
              共 {reviewData.reminders.length} 条提醒，其中高优先级 {reviewData.reminders.filter((r) => r.priority === 'high').length} 条
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {reviewData.reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-4 bg-ink-800/50 rounded-xl border border-ink-700 hover:border-ink-600 transition-all"
            >
              <div className="flex items-start gap-4">
                <Bell className={`w-5 h-5 mt-0.5 ${
                  reminder.priority === 'high' ? 'text-red-400' :
                  reminder.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[reminder.priority]}`}>
                      {PRIORITY_LABELS[reminder.priority]}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {REMINDER_TYPE_LABELS[reminder.type]}
                    </span>
                  </div>
                  <p className="text-white font-medium">{reminder.title}</p>
                  <p className="text-gray-500 text-sm mt-1">{reminder.description}</p>
                  {reminder.dueDate && (
                    <p className="text-gray-600 text-xs mt-1">截止日期: {reminder.dueDate}</p>
                  )}
                </div>
              </div>
              <button className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-lg text-sm font-medium transition-colors">
                处理
              </button>
            </div>
          ))}
          {reviewData.reminders.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">暂无待处理提醒</p>
              <p className="text-gray-500 text-sm mt-1">所有事项都已处理完毕</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: BarChart3 },
    { id: 'trend' as const, label: '趋势分析', icon: TrendingUp },
    { id: 'anomalies' as const, label: '异常列表', icon: AlertTriangle },
    { id: 'reminders' as const, label: '可操作提醒', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <div className="bg-ink-900/50 border-b border-ink-800 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-ink-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-ink-950" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">运营复盘</h1>
                  <p className="text-gray-500 text-sm">分析预约流失与到店效率</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">数据时间范围:</span>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-ink-800 border border-ink-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              >
                <option value={7}>最近 7 天</option>
                <option value={14}>最近 14 天</option>
                <option value={30}>最近 30 天</option>
                <option value={90}>最近 90 天</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-5 bg-ink-800 rounded-xl p-1 border border-ink-700 w-fit">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-ink-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trend' && renderTrend()}
        {activeTab === 'anomalies' && renderAnomalies()}
        {activeTab === 'reminders' && renderReminders()}
      </div>
    </div>
  );
}
