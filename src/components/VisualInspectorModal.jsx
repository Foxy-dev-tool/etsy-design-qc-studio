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
  
  // Safe Zone template matcher (by size label or closest aspect ratio)
  const matchedTemplate = (() => {
    if (!currentGroup.templates || currentGroup.templates.length === 0) {
      return {
        sizeLabel: 'Safe Zone Standard',
        widthPx: 3012,
        heightPx: 3012,
        aspectRatio: 1.0,
        templateImage: currentGroup.baseMockup || '/_4123920413.png'
      };
    }
    const orderSize = (order.personalization?.size || order.targetSizeLabel || '').toLowerCase().replace(',', '.');
    if (orderSize) {
      const match = currentGroup.templates.find(
        t => t.sizeLabel && t.sizeLabel.toLowerCase().replace(',', '.').includes(orderSize)
      );
      if (match) return match;
    }
    if (order.designWidth > 0 && order.designHeight > 0) {
      const actualRatio = order.designWidth / order.designHeight;
      let best = currentGroup.templates[0];
      let minDiff = Infinity;
      for (const tmpl of currentGroup.templates) {
        const tmplRatio = (tmpl.widthPx || 1) / (tmpl.heightPx || 1);
        const diff = Math.abs(actualRatio - tmplRatio);
        if (diff < minDiff) {
          minDiff = diff;
          best = tmpl;
        }
      }
      return best;
    }
    return currentGroup.templates[0];
  })();

  const templateImgSrc = matchedTemplate.templateImage || matchedTemplate.tmplFile || currentGroup.baseMockup || '/_4123920413.png';

  const [opacity, setOpacity] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState('overlay');
  const [showGrid, setShowGrid] = useState(true);

  const hasDesign = Boolean(order.hasUploadedDesign && order.designImage);

  // Real pixel dimensions
  const targetW = matchedTemplate.widthPx || 3012;
  const targetH = matchedTemplate.heightPx || 3012;
  const actualW = order.designWidth || targetW;
  const actualH = order.designHeight || targetH;

  // Exact relative scale percentages relative to the baseline template
  const scaleWidthPct = (actualW / targetW) * 100;
  const scaleHeightPct = (actualH / targetH) * 100;
  const templateAspectRatio = targetW / targetH;

  const ratioResult = validateAspectRatio(
    actualW,
    actualH,
    targetW,
    targetH,
    currentGroup.tolerancePercent || 1.5
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Visual Safe Zone Inspector • Đơn {order.orderNumber}
                </h3>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-extrabold text-[10.5px]">
                  {currentGroup.name} ({matchedTemplate.sizeLabel})
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Khách hàng: <strong>{order.customerName}</strong> • SKU: <span className="font-mono text-slate-300">{order.sku}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95">
              <Upload className="w-4 h-4" />
              <span>Up Ảnh Thiết Kế Mới</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0] && onUploadDesign) {
                    onUploadDesign(order, e.target.files[0]);
                  }
                }}
              />
            </label>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SYSTEM STATUS BANNER */}
        {!hasDesign ? (
          <div className="bg-amber-500 text-slate-950 px-5 py-2.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <ImageIcon className="w-5 h-5 shrink-0 text-slate-950" />
              <span>
                Chưa có ảnh thiết kế upload cho đơn hàng này. Bạn có thể nhấp nút "Up Ảnh Thiết Kế Mới" để kiểm tra Safe Zone trực tiếp.
              </span>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-950 text-amber-400 font-extrabold text-[10.5px] rounded-lg shadow-2xs whitespace-nowrap">
              CHỜ UP TẢI
            </span>
          </div>
        ) : !ratioResult.isValid ? (
          <div className="bg-rose-600 text-white px-5 py-3 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white shrink-0 animate-bounce" />
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wide">
                  🚨 HỆ THỐNG BÁO LỖI: KHÔNG ĐẠT TỶ LỆ HOẶC ĐỘ PHÂN GIẢI!
                </h4>
                <p className="text-xs opacity-95">
                  {ratioResult.message}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-rose-700 font-extrabold text-xs rounded-lg shadow-sm whitespace-nowrap">
              MISMATCH ALERT
            </span>
          </div>
        ) : (
          <div className="bg-emerald-600 text-white px-5 py-2.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wide">
                  ✅ HỆ THỐNG XÁC NHẬN: KHỚP 100% KHUNG KÍCH THƯỚC SAFE ZONE
                </h4>
                <p className="text-[11px] opacity-95">
                  File thiết kế ({actualW}×{actualH}px) khớp đúng tỷ lệ và độ phân giải với Khung Template Safe Zone size {matchedTemplate.sizeLabel} ({targetW}×{targetH}px).
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-white text-emerald-800 font-extrabold text-[11px] rounded-lg shadow-sm whitespace-nowrap">
              MATCH PASSED
            </span>
          </div>
        )}

        {/* Modal Main Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden">
          
          {/* Left Canvas Preview Window */}
          <div className="lg:col-span-8 bg-slate-100 p-3.5 flex flex-col relative overflow-hidden border-r border-slate-200">
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200 text-xs shrink-0">
              
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === 'overlay' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Đè Khung (Overlay Preview)
                </button>
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === 'sideBySide' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  So Sánh Song Song
                </button>
              </div>

              {viewMode === 'overlay' && (
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-slate-600 font-medium">Độ Trong Khung Template:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-24 accent-orange-600 cursor-pointer"
                  />
                  <span className="font-mono text-slate-900 font-bold w-8">{opacity}%</span>
                </div>
              )}

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 25))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs px-1 text-slate-800 font-bold">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(300, z + 25))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Reset 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Interactive Viewport Box - Fit 100% of frame without scrollbars */}
            <div className="flex-1 w-full h-full min-h-[380px] bg-slate-950 rounded-xl border border-slate-300 flex items-center justify-center p-3 relative shadow-inner overflow-hidden">
              
              {showGrid && (
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />
              )}

              {/* OVERLAY MODE: 100% COMPLETE FRAME FIT ON 1 CANVAS WITHOUT SCROLLBARS */}
              {viewMode === 'overlay' ? (
                <div 
                  className="relative transition-transform duration-200 ease-out shadow-2xl rounded flex items-center justify-center max-w-full max-h-full"
                  style={{ 
                    transform: `scale(${zoom / 100})`, 
                    transformOrigin: 'center center',
                    width: templateAspectRatio >= 1 ? '100%' : 'auto',
                    height: templateAspectRatio <= 1 ? '100%' : 'auto',
                    maxHeight: '440px',
                    maxWidth: '100%',
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
                        className="w-full h-full object-contain rounded border border-amber-400/70 shadow-2xl bg-white/10"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* SIDE-BY-SIDE MODE */
                <div 
                  className="grid grid-cols-2 gap-4 w-full h-full max-h-[440px] items-center justify-center"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                  {/* Card 1: Uploaded Design */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 h-full relative overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                      {hasDesign ? `Ảnh Thiết Kế Upload (${actualW}×${actualH}px)` : 'Ảnh Thiết Kế (Chưa Upload)'}
                    </span>

                    <div 
                      className="relative flex items-center justify-center transition-all bg-slate-950/80 rounded p-1 border border-slate-700/80 max-h-[320px] max-w-full"
                      style={{ 
                        aspectRatio: `${templateAspectRatio}`
                      }}
                    >
                      {hasDesign ? (
                        <img
                          src={order.designImage}
                          alt="Uploaded Design"
                          className="max-h-[300px] max-w-full object-contain rounded"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs font-bold">
                          Chưa Upload Ảnh
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Safe Zone Baseline Template */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 h-full relative overflow-hidden">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 text-center">
                      Khung Safe Zone Mẫu ({targetW}×{targetH}px)
                    </span>

                    <div 
                      className="relative flex items-center justify-center transition-all bg-slate-950/80 rounded p-1 border border-slate-700/80 max-h-[320px] max-w-full"
                      style={{ 
                        aspectRatio: `${templateAspectRatio}`
                      }}
                    >
                      {templateImgSrc ? (
                        <img
                          src={templateImgSrc}
                          alt="Template Safe Zone Baseline"
                          className="max-h-[300px] max-w-full object-contain rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/_4123920413.png';
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs font-bold">
                          Khung Template Standard
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Scale Comparison Legend */}
            <div className="mt-2.5 p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-700 font-bold">Tỷ Lệ Thực File Upload:</span>
                <span className="font-mono text-slate-900 font-extrabold">{actualW}×{actualH} px</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                <span className="text-slate-700 font-bold">Khung Template Mẫu:</span>
                <span className="font-mono text-slate-900 font-extrabold">{targetW}×{targetH} px</span>
              </div>
            </div>

          </div>

          {/* Right Information & Action Panel */}
          <div className="lg:col-span-4 p-5 bg-slate-50 overflow-y-auto space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              
              {/* Product Info Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Thông Tin Đơn Hàng</h4>
                <div className="text-xs space-y-1">
                  <div className="font-extrabold text-slate-900 leading-snug">{order.productTitle}</div>
                  <div className="text-slate-500 font-medium">SKU: <span className="font-mono text-slate-700 font-bold">{order.sku}</span></div>
                </div>
              </div>

              {/* QC Details */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Thông Số Kỹ Thuật QC</h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Tỷ Lệ Dài/Rộng:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{(actualW / actualH).toFixed(2)}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Ngưỡng Cho Phép:</span>
                    <span className="font-mono font-extrabold text-orange-600 text-sm">±{currentGroup.tolerancePercent || 1.5}%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Run AI Scan Button */}
            <div className="pt-2">
              <button
                onClick={() => onRunAIScan && onRunAIScan(order)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chạy AI Vision Scan OCR</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
