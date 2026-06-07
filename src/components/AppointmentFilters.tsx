import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { AppointmentFilters as AppointmentFiltersType, AppointmentStatus, STATUS_LABELS, TattooArtist } from '@/types';

interface AppointmentFiltersProps {
  filters: AppointmentFiltersType;
  artists: TattooArtist[];
  onFilterChange: <K extends keyof AppointmentFiltersType>(
    key: K,
    value: AppointmentFiltersType[K]
  ) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function AppointmentFilters({
  filters,
  artists,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: AppointmentFiltersProps) {
  const statusOptions: { value: AppointmentStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: STATUS_LABELS.pending },
    { value: 'confirmed', label: STATUS_LABELS.confirmed },
    { value: 'arrived', label: STATUS_LABELS.arrived },
    { value: 'completed', label: STATUS_LABELS.completed },
    { value: 'cancelled', label: STATUS_LABELS.cancelled },
    { value: 'no_show', label: STATUS_LABELS.no_show },
  ];

  const depositOptions = [
    { value: 'all', label: '全部定金' },
    { value: 'yes', label: '已付定金' },
    { value: 'no', label: '未付定金' },
  ];

  const referenceImageOptions = [
    { value: 'all', label: '全部参考图' },
    { value: 'yes', label: '有参考图' },
    { value: 'no', label: '无参考图' },
  ];

  const selectClass =
    'bg-ink-800 border border-ink-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all min-w-[120px]';

  return (
    <div className="bg-ink-800/30 rounded-xl border border-ink-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gold-500" />
          <span className="text-white font-medium">筛选条件</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs rounded-full">
              已筛选
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors hover:bg-ink-700 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">纹身师:</span>
          <select
            value={filters.artistId}
            onChange={(e) => onFilterChange('artistId', e.target.value)}
            className={selectClass}
          >
            <option value="all">全部纹身师</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
                {!artist.active ? ' (已停用)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">状态:</span>
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange('status', e.target.value as AppointmentStatus | 'all')
            }
            className={selectClass}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">定金:</span>
          <select
            value={filters.depositPaid}
            onChange={(e) =>
              onFilterChange('depositPaid', e.target.value as 'all' | 'yes' | 'no')
            }
            className={selectClass}
          >
            {depositOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">参考图:</span>
          <select
            value={filters.hasReferenceImage}
            onChange={(e) =>
              onFilterChange('hasReferenceImage', e.target.value as 'all' | 'yes' | 'no')
            }
            className={selectClass}
          >
            {referenceImageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-500 text-sm">客户:</span>
          <div className="relative flex-1 max-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={filters.customerKeyword}
              onChange={(e) => onFilterChange('customerKeyword', e.target.value)}
              placeholder="搜索客户昵称..."
              className="w-full bg-ink-800 border border-ink-700 text-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all placeholder:text-gray-600"
            />
            {filters.customerKeyword && (
              <button
                onClick={() => onFilterChange('customerKeyword', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
