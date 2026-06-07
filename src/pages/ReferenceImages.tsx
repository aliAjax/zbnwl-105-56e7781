import { useMemo } from 'react';
import { Image, CalendarDays, ExternalLink, Edit, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentsRepository } from '@/storage';
import { Appointment } from '@/types';
import { getDayName, isToday } from '@/utils/dateUtils';

interface GroupedByDate {
  [date: string]: {
    [customerName: string]: Appointment[];
  };
}

export default function ReferenceImages() {
  const navigate = useNavigate();
  const { appointments } = useAppointmentsRepository();

  const appointmentsWithImages = useMemo(() => {
    return appointments.filter(
      (apt) => apt.referenceImage && apt.referenceImage.trim().length > 0
    );
  }, [appointments]);

  const groupedData = useMemo(() => {
    const grouped: GroupedByDate = {};

    appointmentsWithImages.forEach((apt) => {
      if (!grouped[apt.date]) {
        grouped[apt.date] = {};
      }
      if (!grouped[apt.date][apt.customerName]) {
        grouped[apt.date][apt.customerName] = [];
      }
      grouped[apt.date][apt.customerName].push(apt);
    });

    return grouped;
  }, [appointmentsWithImages]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
  }, [groupedData]);

  const totalImages = appointmentsWithImages.length;
  const totalCustomers = new Set(appointmentsWithImages.map((a) => a.customerName)).size;

  const handleEditAppointment = (appointment: Appointment) => {
    navigate('/', { state: { editAppointment: appointment } });
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return {
      full: `${month}月${day}日`,
      dayName: getDayName(date),
      isToday: isToday(dateStr),
    };
  };

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <div className="bg-ink-900/50 border-b border-ink-800 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                  <Image className="w-5 h-5 text-ink-950" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">参考图管理</h1>
                  <p className="text-gray-500 text-sm">集中查看所有预约的参考图，快速定位和跳转</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-ink-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回看板</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">参考图总计:</span>
              <span className="text-white font-semibold">{totalImages} 张</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-500"></span>
              <span className="text-gray-400 text-sm">涉及客户: {totalCustomers} 位</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {totalImages === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-ink-800 flex items-center justify-center mb-6">
              <Image className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-400 mb-2">暂无参考图</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              目前还没有任何预约填写过参考图链接。在预约编辑中添加参考图链接后，它们将显示在这里。
            </p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-xl font-medium transition-all duration-300"
            >
              <CalendarDays className="w-4 h-4" />
              <span>前往预约看板</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateStr, dateIndex) => {
              const dateInfo = formatDateDisplay(dateStr);
              const customers = groupedData[dateStr];

              return (
                <div
                  key={dateStr}
                  className="bg-ink-800/30 rounded-2xl border border-ink-700 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${dateIndex * 80}ms` }}
                >
                  <div
                    className={`px-5 py-4 border-b border-ink-700/50 ${
                      dateInfo.isToday ? 'bg-gold-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                          dateInfo.isToday
                            ? 'bg-gold-500 text-ink-950'
                            : 'bg-ink-700 text-gray-300'
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {dateInfo.isToday ? '今天' : dateInfo.dayName}
                        </span>
                        <span className="text-xl font-display font-bold">
                          {new Date(dateStr).getDate()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-white">
                          {dateInfo.full}
                          <span className="text-gray-500 text-sm ml-2 font-normal">
                            {dateInfo.dayName}
                          </span>
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {Object.keys(customers).length} 位客户 ·{' '}
                          {Object.values(customers).flat().length} 张参考图
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    {Object.entries(customers).map(([customerName, customerApts]) => (
                      <div key={customerName} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gold-500" />
                          <h4 className="font-medium text-white">{customerName}</h4>
                          <span className="text-gray-500 text-sm">
                            ({customerApts.length} 张)
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {customerApts.map((apt) => (
                            <div
                              key={apt.id}
                              className="bg-ink-900/50 rounded-xl border border-ink-700 overflow-hidden group hover:border-gold-500/50 transition-all duration-300"
                            >
                              <a
                                href={apt.referenceImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block aspect-square bg-ink-800 relative overflow-hidden"
                              >
                                <img
                                  src={apt.referenceImage!}
                                  alt={`${customerName} 的参考图`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-ink-800">
                                  <Image className="w-12 h-12 text-gray-600 mb-2" />
                                  <p className="text-gray-500 text-sm">点击查看原图</p>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="w-8 h-8 rounded-lg bg-ink-900/80 flex items-center justify-center">
                                    <ExternalLink className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              </a>

                              <div className="p-3 border-t border-ink-700/50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-gray-400">
                                      {apt.time} · {apt.bodyPart}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                      {apt.referenceImage}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleEditAppointment(apt)}
                                    className="p-2 text-gray-400 hover:text-gold-500 hover:bg-ink-700 rounded-lg transition-colors"
                                    title="编辑预约"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
