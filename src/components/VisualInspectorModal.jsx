import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Eye, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { validateAspectRatio } from '../services/imageAnalyzer';

export default function VisualInspectorModal({
  order,
  productGroup,
  onClose,
  onUploadDesign,
  onRunAIScan
}) {
  if (!order) return null;

  const currentGroup = productGroup || { templates: [] };
  const matchedTemplate = currentGroup.templates?.find(
    t => t.sizeLabel.toLowerCase().replace(',', '.') === (order.personalization?.size || order.targetSizeLabel || '').toLowerCase().replace(',', '.')
  ) || currentGroup.templates?.[0] || {
    sizeLabel: 'Safe Zone Standard',
    widthPx: 3012,
    heightPx: 3012,
    aspectRatio: 1.0,
    templateImage: ''
  };

  const [opacity, setOpacity] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState('overlay');
  const [showGrid, setShowGrid] = useState(true);

  const hasDesign = Boolean(order.hasUploadedDesign && order.designImage);

  // Safe image URL retriever (handles spaces & URL encoding)
  const getSafeImgSrc = (srcPath) => {
    if (!srcPath) return '';
    if (srcPath.startsWith('blob:') || srcPath.startsWith('data:')) return srcPath;
    return encodeURI(srcPath);
  };

  const templateImgSrc = getSafeImgSrc(matchedTemplate.templateImage || matchedTemplate.templateFile || '');

  // Real pixel dimensions
  const targetW = matchedTemplate.widthPx || 3012;
  const targetH = matchedTemplate.heightPx || 3012;
  const actualW = order.designWidth || targetW;
  const actualH = order.designHeight || targetH;

  // Aspect Ratios
  const templateAspectRatio = targetW / targetH;

  // True physical relative scale percentages relative to baseline Safe Zone template
  const scaleWidthPct = (actualW / targetW) * 100;
  const scaleHeightPct = (actualH / targetH) * 100;

  // Real-time aspect ratio validation comparison
  const ratioResult = validateAspectRatio(
    actualW,
    actualH,
    targetW,
    targetH,
    currentGroup.tolerancePercent || 1.5
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-extrabold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Visual Studio Inspector • Safe Zone Matching Engine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[11px]">
                  {order.storeName || 'Shop #1'}
                </span>
                <span className="font-mono text-xs font-extrabold text-orange-600">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhóm SP: <strong className="text-slate-800">{currentGroup.name}</strong> • Size Yêu Cầu: <strong className="text-orange-600">{matchedTemplate.sizeLabel} ({targetW}×{targetH}px)</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Main Inspection Viewport Area (8 Cols) */}
          <div className="lg:col-span-8 p-6 flex flex-col bg-slate-900 text-white space-y-4 overflow-y-auto">
            
            {/* Viewport Mode Toolbar & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-3">
              
              {/* Mode Selector */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    viewMode === 'overlay'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Đè Khung (Overlay)</span>
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    viewMode === 'split'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>So Sánh Song Song</span>
                </button>
              </div>

              {/* Opacity Slider (For Overlay Mode) */}
              {viewMode === 'overlay' && (
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-medium">Độ mờ đè khung:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-24 accent-orange-600 cursor-pointer"
                  />
                  <span className="font-mono text-amber-400 font-bold w-8">{opacity}%</span>
                </div>
              )}

              {/* Zoom & Grid Controls */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 25))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs px-1 text-slate-200 font-bold">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(300, z + 25))}
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
                        width: `${scaleWidthPct}%`,
                        height: `${scaleHeightPct}%`,
                        left: `${(100 - scaleWidthPct) / 2}%`,
                        top: `${(100 - scaleHeightPct) / 2}%`
                      }}
                    >
                      <img
                        src={order.designImage}
                        alt="Uploaded Artwork Real Scale"
                        className="w-full h-full object-fill rounded border border-amber-400/70 shadow-2xl bg-white/10"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* SIDE-BY-SIDE MODE */
                <div 
                  className="grid grid-cols-2 gap-4 w-full h-full max-h-[460px] items-center justify-center"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                  {/* Card 1: Uploaded Design */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 h-full relative">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                      {hasDesign ? `Ảnh Thiết Kế Upload (${actualW}×${actualH}px)` : 'Ảnh Thiết Kế (Chưa Upload)'}
                    </span>

                    <div 
                      className="relative flex items-center justify-center transition-all bg-slate-950/80 rounded p-1 border border-slate-700/80"
                      style={{ 
                        width: '100%',
                        maxWidth: templateAspectRatio >= 1 ? '270px' : `${270 * templateAspectRatio}px`,
                        aspectRatio: `${templateAspectRatio}`
                      }}
                    >
                      {hasDesign ? (
                        <div 
                          className="flex items-center justify-center transition-all"
                          style={{
                            width: `${Math.min(100, scaleWidthPct)}%`,
                            height: `${Math.min(100, scaleHeightPct)}%`
                          }}
                        >
                          <img
                            src={order.designImage}
                            alt="Uploaded Artwork"
                            className="w-full h-full object-contain rounded shadow-lg border border-amber-400/60"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full min-h-[180px] bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center text-slate-600 gap-1.5">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-xs font-bold text-slate-500">CHỜ UP ẢNH THIẾT KẾ</span>
                        </div>
                      )}
                    </div>

                    {hasDesign && (
                      <span className={`mt-2 text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        scaleWidthPct === 100 && scaleHeightPct === 100
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        Tỷ lệ hiển thị thực tế: {scaleWidthPct.toFixed(1)}% Rộng × {scaleHeightPct.toFixed(1)}% Cao
                      </span>
                    )}
                  </div>

                  {/* Card 2: Safe Zone Cut-line Template */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 h-full">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2 text-center">
                      Khung Safe Zone Template Chuẩn 100% ({targetW}×{targetH}px)
                    </span>
                    <div 
                      className="relative flex items-center justify-center transition-all bg-slate-950/80 rounded p-1 border border-orange-500/40 shadow-lg shadow-orange-500/10"
                      style={{ 
                        width: '100%',
                        maxWidth: templateAspectRatio >= 1 ? '270px' : `${270 * templateAspectRatio}px`,
                        aspectRatio: `${templateAspectRatio}`
                      }}
                    >
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

              {/* Dimension Specs Comparison Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Thông Số Kích Thước Pixel So Sánh
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

              {/* Upload Artwork Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Tải Lên File Thiết Kế Mới
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
