import { Clock, MapPin, Edit2, Trash2, ExternalLink, Check, User, DollarSign } from 'lucide-react';
import { Appointment, AppointmentStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  index: number;
}

const STATUS_FLOW: AppointmentStatus[] = ['pending', 'confirmed', 'arrived', 'completed'];

export function AppointmentCard({ appointment, onStatusChange, onEdit, onDelete, index }: AppointmentCardProps) {
  const currentStatusIndex = STATUS_FLOW.indexOf(appointment.status);

  const getNextStatus = (): AppointmentStatus | null => {
    if (currentStatusIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentStatusIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const statusColor = STATUS_COLORS[appointment.status];

  return (
    <div
      className="bg-ink-800 rounded-xl border border-ink-700 p-5 hover:border-ink-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 group animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center">
            <User className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">{appointment.customerName}</h3>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{appointment.time}</span>
              <span className="text-gray-600">·</span>
              <span>{appointment.duration}小时</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {STATUS_LABELS[appointment.status]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <MapPin className="w-4 h-4 text-gold-600" />
          <span>部位：{appointment.bodyPart}</span>
        </div>
        {appointment.referenceImage && (
          <a
            href={appointment.referenceImage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold-500 text-sm hover:text-gold-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>查看参考图</span>
          </a>
        )}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className={`w-4 h-4 ${appointment.depositPaid ? 'text-emerald-500' : 'text-gray-500'}`} />
          <span className={appointment.depositPaid ? 'text-emerald-400' : 'text-gray-500'}>
            {appointment.depositPaid ? '定金已付' : '定金未付'}
          </span>
        </div>
        {appointment.notes && (
          <div className="text-gray-400 text-sm bg-ink-900/50 rounded-lg p-3 border border-ink-700">
            <p className="text-xs text-gray-500 mb-1">备注</p>
            <p>{appointment.notes}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-ink-700">
        <div className="flex gap-2">
          {nextStatus && (
            <button
              onClick={() => onStatusChange(appointment.id, nextStatus)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>标记{STATUS_LABELS[nextStatus]}</span>
            </button>
          )}
          {appointment.status !== 'pending' && (
            <button
              onClick={() => onStatusChange(appointment.id, 'pending')}
              className="px-4 py-2 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              重置
            </button>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(appointment)}
            className="p-2 text-gray-400 hover:text-gold-500 hover:bg-ink-700 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(appointment.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-ink-700 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
