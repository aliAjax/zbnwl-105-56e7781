import { X, Check, AlertTriangle, ArrowRight, FileDown, FileUp } from 'lucide-react';
import { Appointment } from '@/types';
import { ImportDiffResult } from '@/utils/importExport';

interface ImportConfirmModalProps {
  isOpen: boolean;
  diff: ImportDiffResult | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportConfirmModal({ isOpen, diff, onConfirm, onCancel }: ImportConfirmModalProps) {
  if (!isOpen || !diff) return null;

  const totalValid = diff.toAdd.length + diff.toUpdate.length + diff.toSkip.length;
  const totalProcessed = totalValid + diff.invalid.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="relative bg-ink-800 rounded-2xl border border-ink-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <div className="sticky top-0 bg-ink-800 border-b border-ink-700 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            导入预约数据
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-ink-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-ink-900/50 border border-ink-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
                <FileUp className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <p className="text-white font-medium">数据解析完成</p>
                <p className="text-gray-400 text-sm">共 {totalProcessed} 条预约记录</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {diff.toAdd.length > 0 && (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-medium">新增预约</p>
                    <p className="text-gray-400 text-sm">本地不存在的新记录</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-400">{diff.toAdd.length}</span>
              </div>
            )}

            {diff.toUpdate.length > 0 && (
              <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-blue-400 font-medium">覆盖更新</p>
                    <p className="text-gray-400 text-sm">ID 相同但内容不同的记录</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-400">{diff.toUpdate.length}</span>
              </div>
            )}

            {diff.toSkip.length > 0 && (
              <div className="flex items-center justify-between bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">跳过</p>
                    <p className="text-gray-500 text-sm">与现有数据完全一致</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-400">{diff.toSkip.length}</span>
              </div>
            )}

            {diff.invalid.length > 0 && (
              <div className="bg-tattoo-red/10 border border-tattoo-red/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tattoo-red/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-tattoo-red" />
                  </div>
                  <div className="flex-1">
                    <p className="text-tattoo-red font-medium mb-2">
                      无效数据 ({diff.invalid.length} 条)
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {diff.invalid.slice(0, 5).map((item, index) => (
                        <div key={index} className="bg-ink-900/50 rounded-lg p-3 text-sm">
                          <p className="text-gray-300 mb-1 truncate">
                            记录 {index + 1}: {(item.data as Appointment)?.customerName || '未知客户'}
                          </p>
                          <ul className="text-tattoo-red/80 text-xs space-y-0.5">
                            {item.errors.slice(0, 2).map((error, errIndex) => (
                              <li key={errIndex}>• {error}</li>
                            ))}
                            {item.errors.length > 2 && (
                              <li>• 还有 {item.errors.length - 2} 个问题...</li>
                            )}
                          </ul>
                        </div>
                      ))}
                      {diff.invalid.length > 5 && (
                        <p className="text-gray-500 text-xs">
                          还有 {diff.invalid.length - 5} 条无效数据未显示
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {totalValid === 0 && (
            <div className="bg-tattoo-red/10 border border-tattoo-red/30 rounded-xl p-4 text-center">
              <AlertTriangle className="w-10 h-10 text-tattoo-red mx-auto mb-2" />
              <p className="text-tattoo-red font-medium">没有可导入的有效数据</p>
              <p className="text-gray-400 text-sm mt-1">请检查文件格式和内容是否正确</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={totalValid === 0}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                totalValid > 0
                  ? 'bg-gold-500 hover:bg-gold-400 text-ink-950'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              确认导入 ({totalValid} 条)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
