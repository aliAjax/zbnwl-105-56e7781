import { DollarSign, Calendar, Clock, TrendingUp, ArrowDownCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { Appointment } from '@/types';
import { formatDate, getWeekDates } from '@/utils/dateUtils';
import { calculateBatchPaymentSummary, hasDepositPaid } from '@/utils/paymentUtils';

interface RevenueDashboardProps {
  appointments: Appointment[];
}

interface StatsData {
  totalDepositsReceived: number;
  totalBalanceReceived: number;
  totalSupplementReceived: number;
  totalRefund: number;
  netIncome: number;
  unpaidDepositCount: number;
  completedCount: number;
  totalAppointments: number;
  totalEstimatedRevenue: number;
}

export function RevenueDashboard({ appointments }: RevenueDashboardProps) {
  const today = new Date();
  const weekDates = getWeekDates(8);
  const weekStartStr = formatDate(weekDates[0]);
  const weekEndStr = formatDate(weekDates[weekDates.length - 1]);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthStartStr = formatDate(monthStart);
  const monthEndStr = formatDate(monthEnd);

  const calculateStats = (filterFn: (apt: Appointment) => boolean): StatsData => {
    const filtered = appointments.filter(filterFn);
    
    const paymentSummary = calculateBatchPaymentSummary(filtered);

    const unpaidDepositCount = filtered.filter(apt => !hasDepositPaid(apt)).length;
    const completedCount = filtered.filter(apt => apt.status === 'completed').length;

    const totalEstimatedRevenue = filtered.reduce((sum, apt) => {
      const deposit = apt.depositAmount || 0;
      const balance = apt.estimatedBalance || 0;
      return sum + deposit + balance;
    }, 0);

    return {
      totalDepositsReceived: paymentSummary.totalDeposit,
      totalBalanceReceived: paymentSummary.totalBalance,
      totalSupplementReceived: paymentSummary.totalSupplement,
      totalRefund: paymentSummary.totalRefund,
      netIncome: paymentSummary.netIncome,
      unpaidDepositCount,
      completedCount,
      totalAppointments: filtered.length,
      totalEstimatedRevenue,
    };
  };

  const weekStats = calculateStats((apt) => {
    return apt.date >= weekStartStr && apt.date <= weekEndStr;
  });

  const monthStats = calculateStats((apt) => {
    return apt.date >= monthStartStr && apt.date <= monthEndStr;
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    color: string;
    subtitle?: string;
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-ink-800/30 rounded-2xl border border-ink-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">收入与定金看板</h2>
            <p className="text-gray-500 text-sm">统计未来八天及本月的预约收入数据</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gold-500" />
            <h3 className="font-medium text-white">未来八天 ({weekStartStr} ~ {weekEndStr})</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="实收总计"
              value={`¥${weekStats.netIncome.toLocaleString()}`}
              icon={TrendingUp}
              color="bg-emerald-500/20"
              subtitle={`${weekStats.totalAppointments} 个预约`}
            />
            <StatCard
              title="已收定金"
              value={`¥${weekStats.totalDepositsReceived.toLocaleString()}`}
              icon={DollarSign}
              color="bg-gold-500/20"
              subtitle="定金收入"
            />
            <StatCard
              title="已收尾款"
              value={`¥${weekStats.totalBalanceReceived.toLocaleString()}`}
              icon={ArrowDownCircle}
              color="bg-blue-500/20"
              subtitle="尾款收入"
            />
            <StatCard
              title="已收补款"
              value={`¥${weekStats.totalSupplementReceived.toLocaleString()}`}
              icon={PlusCircle}
              color="bg-purple-500/20"
              subtitle="补款收入"
            />
            <StatCard
              title="已退款"
              value={`¥${weekStats.totalRefund.toLocaleString()}`}
              icon={MinusCircle}
              color="bg-tattoo-red/20"
              subtitle="退款金额"
            />
            <StatCard
              title="未付定金"
              value={weekStats.unpaidDepositCount}
              icon={Clock}
              color="bg-orange-500/20"
              subtitle="待跟进"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gold-500" />
            <h3 className="font-medium text-white">本月 ({monthStartStr} ~ {monthEndStr})</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="实收总计"
              value={`¥${monthStats.netIncome.toLocaleString()}`}
              icon={TrendingUp}
              color="bg-emerald-500/20"
              subtitle={`${monthStats.totalAppointments} 个预约`}
            />
            <StatCard
              title="已收定金"
              value={`¥${monthStats.totalDepositsReceived.toLocaleString()}`}
              icon={DollarSign}
              color="bg-gold-500/20"
              subtitle="定金收入"
            />
            <StatCard
              title="已收尾款"
              value={`¥${monthStats.totalBalanceReceived.toLocaleString()}`}
              icon={ArrowDownCircle}
              color="bg-blue-500/20"
              subtitle="尾款收入"
            />
            <StatCard
              title="已收补款"
              value={`¥${monthStats.totalSupplementReceived.toLocaleString()}`}
              icon={PlusCircle}
              color="bg-purple-500/20"
              subtitle="补款收入"
            />
            <StatCard
              title="已退款"
              value={`¥${monthStats.totalRefund.toLocaleString()}`}
              icon={MinusCircle}
              color="bg-tattoo-red/20"
              subtitle="退款金额"
            />
            <StatCard
              title="未付定金"
              value={monthStats.unpaidDepositCount}
              icon={Clock}
              color="bg-orange-500/20"
              subtitle="待跟进"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
