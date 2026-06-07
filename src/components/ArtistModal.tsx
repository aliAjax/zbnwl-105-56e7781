import { useState, useEffect } from 'react';
import { X, Plus, User, Phone, Briefcase, Check, X as XIcon, Edit2, Trash2 } from 'lucide-react';
import { TattooArtist } from '@/types';
import { generateId } from '@/utils/dateUtils';

interface ArtistModalProps {
  isOpen: boolean;
  artists: TattooArtist[];
  onSave: (artist: TattooArtist) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const initialFormData = {
  name: '',
  phone: '',
  specialty: '',
};

export function ArtistModal({ isOpen, artists, onSave, onToggleActive, onDelete, onClose }: ArtistModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingArtist, setEditingArtist] = useState<TattooArtist | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setEditingArtist(null);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入纹身师姓名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const artist: TattooArtist = {
      id: editingArtist?.id || generateId(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      specialty: formData.specialty.trim() || undefined,
      active: editingArtist?.active ?? true,
      createdAt: editingArtist?.createdAt || new Date().toISOString(),
    };

    onSave(artist);
    setFormData(initialFormData);
    setEditingArtist(null);
    setErrors({});
  };

  const handleEdit = (artist: TattooArtist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      phone: artist.phone || '',
      specialty: artist.specialty || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingArtist(null);
    setFormData(initialFormData);
    setErrors({});
  };

  if (!isOpen) return null;

  const activeArtists = artists.filter(a => a.active);
  const inactiveArtists = artists.filter(a => !a.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-ink-800 rounded-2xl border border-ink-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <div className="sticky top-0 bg-ink-800 border-b border-ink-700 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            纹身师管理
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-ink-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-ink-900/50 rounded-xl border border-ink-700 p-5">
            <h3 className="font-display text-lg font-semibold text-white mb-4">
              {editingArtist ? '编辑纹身师' : '新增纹身师'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-ink-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all ${
                      errors.name ? 'border-red-500' : 'border-ink-700'
                    }`}
                    placeholder="输入纹身师姓名"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
                    placeholder="输入联系电话"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  擅长风格
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ink-900 border border-ink-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
                  placeholder="如：传统、写实、小清新等"
                />
              </div>

              <div className="flex gap-3">
                {editingArtist && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2.5 bg-ink-700 hover:bg-ink-600 text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    取消编辑
                  </button>
                )}
                <button
                  type="submit"
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-ink-950 rounded-lg font-medium transition-colors ${
                    editingArtist ? 'flex-1' : 'w-full'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingArtist ? '保存修改' : '添加纹身师'}</span>
                </button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">
              在职纹身师 ({activeArtists.length})
            </h3>
            {activeArtists.length === 0 ? (
              <div className="bg-ink-900/30 rounded-xl border border-ink-700 p-8 text-center">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">暂无在职纹身师，请先添加</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="bg-ink-900/50 rounded-xl border border-ink-700 p-4 flex items-center justify-between hover:border-ink-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-ink-950" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{artist.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-3">
                          {artist.specialty && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {artist.specialty}
                            </span>
                          )}
                          {artist.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {artist.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(artist)}
                        className="p-2 text-gray-400 hover:text-gold-500 hover:bg-ink-700 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleActive(artist.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-ink-700 rounded-lg transition-colors"
                        title="停用"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这个纹身师吗？')) {
                            onDelete(artist.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-ink-700 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inactiveArtists.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-semibold text-gray-400 mb-4">
                已停用 ({inactiveArtists.length})
              </h3>
              <div className="space-y-3">
                {inactiveArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="bg-ink-900/30 rounded-xl border border-ink-700/50 p-4 flex items-center justify-between opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-ink-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-400">{artist.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          {artist.specialty && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {artist.specialty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleActive(artist.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        启用
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这个纹身师吗？')) {
                            onDelete(artist.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-ink-700 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
