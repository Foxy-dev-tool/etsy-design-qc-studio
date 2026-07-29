import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  Sparkles, 
  Image as ImageIcon,
  Ruler
} from 'lucide-react';

export default function ProductGroupConfig({
  productGroups = [],
  onSaveGroup,
  onDeleteGroup
}) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [activeGroup, setActiveGroup] = useState(productGroups[0] || {
    id: 'pg-new',
    name: 'Nhóm Hàng Mới',
    description: '',
    baseMockup: '',
    tolerancePercent: 1.5,
    minDpi: 300,
    aiRulesPrompt: '',
    templates: []
  });

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleSelectGroup = (idx) => {
    setSelectedGroupIndex(idx);
    setIsCreatingNew(false);
    setActiveGroup({ ...productGroups[idx] });
  };

  const handleCreateNewGroup = () => {
    setIsCreatingNew(true);
    setActiveGroup({
      id: `pg-${Date.now()}`,
      name: 'Nhóm Hàng Sản Phẩm Mới',
      description: 'Mô tả quy chuẩn sản xuất và thiết kế cho nhóm hàng',
      baseMockup: '/_4123920413.png',
      tolerancePercent: 1.5,
      minDpi: 300,
      aiRulesPrompt: 'Quét và kiểm tra tên khách hàng cá nhân hóa, viền lọt lề safe margin 3mm.',
      templates: [
        {
          sizeLabel: '3.94 inches',
          widthPx: 1240,
          heightPx: 1240,
          aspectRatio: 1.0,
          dpi: 300,
          templateImage: '/- 3,94in copy.png',
          safeMarginPx: 40
        },
        {
          sizeLabel: '5.9 inches',
          widthPx: 1831,
          heightPx: 1831,
          aspectRatio: 1.0,
          dpi: 300,
          templateImage: '/- 5.9in copy.png',
          safeMarginPx: 50
        },
        {
          sizeLabel: '7.87 inches',
          widthPx: 2421,
          heightPx: 2421,
          aspectRatio: 1.0,
          dpi: 300,
          templateImage: '/- 7.87in copy.png',
          safeMarginPx: 60
        },
        {
          sizeLabel: '9.84 inches',
          widthPx: 3012,
          heightPx: 3012,
          aspectRatio: 1.0,
          dpi: 300,
          templateImage: '/- 9.84in copy.png',
          safeMarginPx: 75
        }
      ]
    });
  };

  const handleAddSizeTemplate = () => {
    const newTemplate = {
      sizeLabel: '12 inches',
      widthPx: 3600,
      heightPx: 3600,
      aspectRatio: 1.0,
      dpi: 300,
      templateImage: '',
      safeMarginPx: 80
    };
    setActiveGroup({
      ...activeGroup,
      templates: [...activeGroup.templates, newTemplate]
    });
  };

  const handleRemoveSizeTemplate = (index) => {
    const updated = activeGroup.templates.filter((_, i) => i !== index);
    setActiveGroup({ ...activeGroup, templates: updated });
  };

  const handleTemplateChange = (index, field, value) => {
    const updated = [...activeGroup.templates];
    updated[index][field] = value;

    if (field === 'widthPx' || field === 'heightPx') {
      const w = Number(updated[index].widthPx) || 1;
      const h = Number(updated[index].heightPx) || 1;
      updated[index].aspectRatio = w / h;
    }

    setActiveGroup({ ...activeGroup, templates: updated });
  };

  const handleSave = () => {
    onSaveGroup(activeGroup);
    setSaveSuccessMsg('Đã lưu thành công cấu hình Nhóm sản phẩm & Template!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg text-slate-900">
              Cấu Hình Logic Nhóm Sản Phẩm & Template Size
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200">
              Modular Logic Config
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh mục size, upload hình ảnh template cắt, quy chuẩn aspect ratio và câu lệnh AI kiểm tra tự động.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNewGroup}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>Tạo Nhóm Sản Phẩm Mới</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình Nhóm</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List of Groups */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">
              Danh Sách Nhóm Sản Phẩm
            </span>

            <div className="space-y-2">
              {productGroups.map((group, idx) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(idx)}
                  className={`w-full p-3.5 rounded-xl text-left border transition flex items-start justify-between ${
                    !isCreatingNew && selectedGroupIndex === idx
                      ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-xs">{group.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{group.description}</p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-orange-600 font-bold">
                      <Ruler className="w-3 h-3" />
                      <span>{group.templates?.length || 0} Size templates</span>
                    </div>
                  </div>

                  {group.baseMockup && (
                    <img
                      src={group.baseMockup}
                      alt="Mockup"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Name & Mockup */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>1. Thông Tin Tên Nhóm & Ảnh Mockup Gốc</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tên Nhóm Sản Phẩm:</label>
                <input
                  type="text"
                  value={activeGroup.name}
                  onChange={(e) => setActiveGroup({ ...activeGroup, name: e.target.value })}
                  placeholder="Ví dụ: Custom Acrylic Plaque Series..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mô Tả Quy Chuẩn:</label>
                <input
                  type="text"
                  value={activeGroup.description}
                  onChange={(e) => setActiveGroup({ ...activeGroup, description: e.target.value })}
                  placeholder="Mô tả chất liệu, máy in, quy cách..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Base Mockup */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Hình Ảnh Mockup Sản Phẩm Gốc:</label>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img
                  src={activeGroup.baseMockup || '/_4123920413.png'}
                  alt="Base Mockup"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white"
                />
                <div className="space-y-1 flex-1">
                  <p className="text-xs text-slate-800 font-bold">Upload file ảnh Mockup sản phẩm mẫu</p>
                  <p className="text-[10px] text-slate-500">Dùng để làm hình đại diện và căn viền sản phẩm gốc.</p>
                </div>
                <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition">
                  Up Mockup
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setActiveGroup({ ...activeGroup, baseMockup: url });
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Size Specs Management (4 sizes) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-orange-600" />
                <span>2. Danh Mục Template Kích Thước Sản Phẩm (4 Size Tiêu Chuẩn)</span>
              </h3>

              <button
                onClick={handleAddSizeTemplate}
                className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold flex items-center gap-1 border border-orange-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Size Mới</span>
              </button>
            </div>

            {/* Template Items */}
            <div className="space-y-3">
              {activeGroup.templates?.map((tmpl, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={tmpl.sizeLabel}
                        onChange={(e) => handleTemplateChange(idx, 'sizeLabel', e.target.value)}
                        placeholder="Tên size (VD: 9.84 inches)"
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveSizeTemplate(idx)}
                      className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa size này</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Rộng (px):</label>
                      <input
                        type="number"
                        value={tmpl.widthPx}
                        onChange={(e) => handleTemplateChange(idx, 'widthPx', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Cao (px):</label>
                      <input
                        type="number"
                        value={tmpl.heightPx}
                        onChange={(e) => handleTemplateChange(idx, 'heightPx', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Tỷ lệ (Ratio):</label>
                      <input
                        type="text"
                        disabled
                        value={(tmpl.aspectRatio || 1.0).toFixed(2)}
                        className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-mono text-orange-600 font-extrabold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Vùng Bleed (px):</label>
                      <input
                        type="number"
                        value={tmpl.safeMarginPx}
                        onChange={(e) => handleTemplateChange(idx, 'safeMarginPx', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Size File Upload */}
                  <div className="flex items-center gap-3 pt-1">
                    {tmpl.templateImage ? (
                      <img
                        src={tmpl.templateImage}
                        alt="Template File"
                        className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-slate-800 block">File Template Cut-line Kích Thước</span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-sm">
                        {tmpl.templateImage || 'Chưa chọn file template'}
                      </span>
                    </div>

                    <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition">
                      Up File Size
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = URL.createObjectURL(e.target.files[0]);
                            handleTemplateChange(idx, 'templateImage', url);
                          }
                        }}
                      />
                    </label>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Section 3: AI Prompt Rules */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>3. Quy Tắc Logic QC & Yêu Cầu AI Quét Ảnh</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Dung Sai Tỷ Lệ Cho Phép (% Tolerance):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={activeGroup.tolerancePercent}
                    onChange={(e) => setActiveGroup({ ...activeGroup, tolerancePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-xs text-slate-500 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Độ Phân Giải Tối Thiểu (DPI):</label>
                <input
                  type="number"
                  value={activeGroup.minDpi}
                  onChange={(e) => setActiveGroup({ ...activeGroup, minDpi: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Yêu Cầu Thêm Cho AI Quét Ảnh (Custom AI Prompt Rules):</label>
              <textarea
                rows={3}
                value={activeGroup.aiRulesPrompt}
                onChange={(e) => setActiveGroup({ ...activeGroup, aiRulesPrompt: e.target.value })}
                placeholder="Nhập quy tắc AI kiểm tra..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
