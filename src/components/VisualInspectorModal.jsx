import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Eye, 
  Maximize2,
  Grid,
  Check,
  Zap,
  Trash2
} from 'lucide-react';
import { validateAspectRatio, getSafeImgSrc } from '../services/imageAnalyzer';

export default function VisualInspectorModal({
  order,
  productGroup,
  onClose,
  onUploadDesign,
  onDeleteDesign,
  onRunAIScan
}) {
  const currentGroup = productGroup || { name: 'Stained Glass Suncatcher', tolerancePercent: 1.5, templates: [] };
  
  // Active Safe Zone template match based on size
  const activeTemplate = currentGroup.templates?.find(
    t => t.sizeLabel.toLowerCase().replace(',', '.') === (order.personalization?.size || order.targetSizeLabel || '').toLowerCase().replace(',', '.')
  ) || currentGroup.templates?.[0] || { sizeLabel: 'Standard', widthPx: 3012, heightPx: 3012, tmplFile: '/_4123920413.png' };

  // View state
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'sideBySide'
  const [zoom, setZoom] = useState(100);
  const [opacity, setOpacity] = useState(50);
  const [showGrid, setShowGrid] = useState(true);

  const hasDesign = Boolean(order.hasUploadedDesign && order.designImage);
  const artworkSrc = order.designImage || order.mockupThumb;
  const templateImgSrc = getSafeImgSrc(activeTemplate.tmplFile);

  // Math ratio calculations
  const targetW = activeTemplate.widthPx || 3012;
  const targetH = activeTemplate.heightPx || 3012;

  const actualW = order.designWidth || 3000;
  const actualH = order.designHeight || 3000;

  const ratioResult = validateAspectRatio(
    actualW,
    actualH,
    targetW,
    targetH,
    currentGroup.tolerancePercent || 1.5
  );

  const templateAspectRatio = targetW / targetH;
  const designAspectRatio = actualW / actualH;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 lg:p-6 font-sans">
      <div className="bg-white text-slate-800 w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Visual Safe Zone Inspector • Đơn {order.orderNumber}
                </h3>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-extrabold text-[10.5px]">
                  {currentGroup.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Khách hàng: <strong>{order.customerName}</strong> • SKU: <span className="font-mono text-slate-300">{order.sku}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body (2 Columns Layout) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Canvas Viewport Area (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900 p-6 flex flex-col justify-between space-y-4 overflow-hidden relative">
            
            {/* View Mode & Zoom Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80 text-xs font-bold shrink-0">
              
              {/* Toggle Mode */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    viewMode === 'overlay' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Khớp Khung Chuẩn (Overlay)
                </button>
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    viewMode === 'sideBySide' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Xem Song Song (Side-by-Side)
                </button>
              </div>

              {/* Opacity Slider for Overlay Mode */}
              {viewMode === 'overlay' && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-[11px] font-bold">Độ trong suốt Safe Zone:</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-24 accent-orange-500 cursor-pointer"
                  />
                  <span className="w-8 font-mono text-[11px] text-orange-400">{opacity}%</span>
                </div>
              )}

              {/* Zooming Controls */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono text-orange-400 text-xs">{zoom}%</span>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 25, 200))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                  title="Reset 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Interactive Viewport Box */}
            <div className="flex-1 min-h-[380px] max-h-[520px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-auto relative shadow-inner">
              
              {showGrid && (
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />
              )}

              {/* OVERLAY MODE: 100% REAL PHYSICAL PROPORTIONAL SCALE */}
              {viewMode === 'overlay' ? (
                <div 
                  className="relative transition-transform duration-200 ease-out shadow-2xl rounded flex items-center justify-center"
                  style={{ 
                    transform: `scale(${zoom / 100})`, 
                    transformOrigin: 'center center',
                    width: '100%',
                    maxWidth: templateAspectRatio >= 1 ? '560px' : `${560 * templateAspectRatio}px`,
                    aspectRatio: `${templateAspectRatio}`
                  }}
                >
                  {/* Baseline Safe Zone Template Frame */}
                  {templateImgSrc ? (
                    <img
                      src={templateImgSrc}
                      alt="Template Safe Zone Baseline"
                      className="w-full h-full object-contain rounded border border-slate-700 bg-slate-900/90 shadow-2xl relative z-10 transition-opacity"
                      style={{ opacity: opacity / 100 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/_4123920413.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 border border-slate-700 rounded flex items-center justify-center">
                      <span className="text-slate-500 text-xs font-bold">(Khung Safe Zone Template)</span>
                    </div>
                  )}

                  {/* Uploaded Artwork Layer */}
                  {hasDesign && (
                    <div 
                      className="absolute z-0 flex items-center justify-center pointer-events-none transition-all"
                      style={{
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      <img
                        src={artworkSrc}
                        alt="Uploaded Artwork Design"
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                  )}

                </div>
              ) : (
                /* SIDE BY SIDE MODE */
                <div 
                  className="grid grid-cols-2 gap-6 w-full h-full items-center transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                  {/* Left: Uploaded Design */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 mb-2">1. File Ảnh Thiết Kế Upload ({actualW}×{actualH} px)</span>
                    <div className="w-full max-h-[320px] aspect-square flex items-center justify-center bg-slate-950 rounded border border-slate-800 overflow-hidden">
                      {artworkSrc ? (
                        <img src={artworkSrc} alt="Uploaded Design" className="w-full h-full object-contain rounded" />
                      ) : (
                        <span className="text-xs text-slate-500 font-bold">(Chưa up file ảnh)</span>
                      )}
                    </div>
                    <span className="mt-2 text-[10px] font-mono text-slate-400">
                      Tỷ lệ thực: <strong>{designAspectRatio.toFixed(2)}</strong>
                    </span>
                  </div>

                  {/* Right: Safe Zone Baseline Template */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 mb-2">2. Khung Safe Zone Mẫu ({targetW}×{targetH} px)</span>
                    <div className="w-full max-h-[320px] aspect-square flex items-center justify-center bg-slate-950 rounded border border-slate-800 overflow-hidden">
                      {templateImgSrc ? (
                        <img
                          src={templateImgSrc}
                          alt="Safe Zone Template"
                          className="w-full h-full object-contain rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/_4123920413.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full min-h-[180px] bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center text-slate-500">
                          <span className="text-xs font-bold">(Chưa chọn file Safe Zone)</span>
                        </div>
                      )}
                    </div>
                    <span className="mt-2 text-[10px] font-extrabold text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30">
                      Chuẩn Baseline 100%
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Status Message Banner */}
            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
              ratioResult.isValid
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/50 border-rose-800 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {ratioResult.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{ratioResult.message}</span>
              </div>

              <span className="font-mono font-extrabold">
                Lệch: {ratioResult.diffPercent.toFixed(2)}% (Cho phép: ≤{currentGroup.tolerancePercent || 1.5}%)
              </span>
            </div>

          </div>

          {/* Right Sidebar Inspection Details (4 Cols) */}
          <div className="lg:col-span-4 p-6 bg-slate-50 border-l border-slate-200 flex flex-col justify-between space-y-6 overflow-y-auto">
            
            <div className="space-y-4">
              
              {/* Personalization Info Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Yêu Cầu Cá Nhân Hóa Của Khách (Personalization)
                </span>
                
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
                  {order.personalization?.size && (
                    <p className="font-bold text-orange-700">
                      • Size yêu cầu: <span className="underline">{order.personalization.size}</span>
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed text-[11px]">
                    {order.personalization?.text || 'Khách không nhập văn bản cá nhân hóa'}
                  </p>
                </div>
              </div>

              {/* Technical Specifications Summary */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Thông Số Tỷ Lệ & Pixel
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium">Khung Template Chuẩn:</span>
                    <strong className="font-mono text-slate-900 font-extrabold">
                      {targetW} × {targetH} px
                    </strong>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium">File Thiết Kế Upload:</span>
                    <strong className="font-mono text-slate-900 font-extrabold">
                      {hasDesign ? `${actualW} × ${actualH} px` : 'Chưa up file ảnh'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium">Tỷ lệ Aspect Ratio:</span>
                    <strong className="font-mono text-orange-600 font-extrabold">
                      {ratioResult.actualRatio.toFixed(2)} vs {ratioResult.targetRatio.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Upload & Delete Artwork Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Quản Lý File Ảnh Thiết Kế
                </span>

                <label className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-sm active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{hasDesign ? 'Thay Đổi File Ảnh Thiết Kế' : 'Tải Lên File Ảnh Thiết Kế'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onUploadDesign(order, e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {/* XÓA ẢNH THIẾT KẾ BUTTON IN MODAL */}
                {hasDesign && (
                  <button
                    onClick={() => {
                      if (onDeleteDesign) {
                        onDeleteDesign(order);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Xóa Ảnh Thiết Kế Đã Tải</span>
                  </button>
                )}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <button
                onClick={() => onRunAIScan(order)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Quét AI OCR Chữ</span>
              </button>

              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
              >
                Đóng
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
