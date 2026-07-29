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
import { validateAspectRatio } from '../services/imageAnalyzer';

export default function VisualInspectorModal({
  order,
  productGroup,
  onClose,
  onUploadDesign,
  onDeleteDesign,
  onRunAIScan
}) {
  const currentGroup = productGroup || { name: 'Stained Glass Suncatcher', tolerancePercent: 1.5, templates: [] };
  
  // Dynamic Safe Zone template matcher (by size text or closest aspect ratio)
  const activeTemplate = (() => {
    if (!currentGroup.templates || currentGroup.templates.length === 0) {
      return { 
        sizeLabel: 'Standard', 
        widthPx: 3012, 
        heightPx: 3012, 
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
    // Match by closest aspect ratio if uploaded design dimensions exist
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

  // View state
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'sideBySide'
  const [zoom, setZoom] = useState(100);
  const [opacity, setOpacity] = useState(50);
  const [showGrid, setShowGrid] = useState(true);

  const hasDesign = Boolean(order.hasUploadedDesign && order.designImage);
  const artworkSrc = order.designImage || order.mockupThumb;
  
  // Safe template image URL from templateImage, tmplFile, or group baseMockup
  const templateImgSrc = activeTemplate.templateImage || activeTemplate.tmplFile || currentGroup.baseMockup || '/_4123920413.png';

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
                <span className="px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 font-extrabold text-[11px]">
                  {currentGroup.name} ({activeTemplate.sizeLabel})
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
          
          {/* LEFT: CANVAS VIEWPORT INTERACTION */}
          <div className="lg:col-span-8 bg-slate-950 flex flex-col items-center justify-between p-4 relative overflow-hidden select-none">
            
            {/* Top Toolbar Controls */}
            <div className="z-20 flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl backdrop-blur-md shadow-xl text-xs text-white">
              
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1 rounded-md font-bold transition ${
                    viewMode === 'overlay' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chồng Lớp (Overlay)
                </button>
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-3 py-1 rounded-md font-bold transition ${
                    viewMode === 'sideBySide' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  So Sánh Song Song
                </button>
              </div>

              {viewMode === 'overlay' && (
                <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                  <span className="text-[11px] text-slate-400 font-medium">Độ trong suốt:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-24 accent-orange-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold w-8">{opacity}%</span>
                </div>
              )}

              <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 20, 40))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 20, 250))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setZoom(100); setOpacity(50); }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 ml-1"
                  title="Đặt lại zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* MAIN INTERACTIVE CANVAS AREA */}
            <div className="flex-1 w-full flex items-center justify-center relative overflow-auto p-4">
              
              {viewMode === 'overlay' ? (
                /* OVERLAY STACK MODE */
                <div 
                  className="relative flex items-center justify-center transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center center',
                    width: '500px',
                    height: '500px'
                  }}
                >
                  {/* Grid background */}
                  {showGrid && (
                    <div 
                      className="absolute inset-0 border border-slate-800/80 rounded pointer-events-none z-0"
                      style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }}
                    />
                  )}

                  {/* Template Layer */}
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
                  className="grid grid-cols-2 gap-6 w-full h-full items-center transition-transform duration-200 max-w-5xl"
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
                          alt="Template Safe Zone Baseline"
                          className="w-full h-full object-contain rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/_4123920413.png';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 font-bold">(Khung Safe Zone Mẫu)</span>
                      )}
                    </div>
                    <span className="mt-2 text-[10px] font-mono text-amber-500 font-bold">
                      Chuẩn Baseline 100%
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Status Legend Bar */}
            <div className="z-20 w-full max-w-xl bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>File thiết kế</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>Đường Safe Zone (Lọt lòng 1.5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Khung viền cắt ghép (Bleed Line)</span>
              </div>
            </div>

          </div>

          {/* RIGHT: QC RATIO CALCULATOR & ACTION PANEL */}
          <div className="lg:col-span-4 bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            
            <div className="space-y-6">
              
              {/* Box 1: Ratio Validation Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-500" />
                    <span>Kết Quả Kiểm Tỷ Lệ QC</span>
                  </h4>

                  {ratioResult.isValid ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>MATCH</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>MISMATCH</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10.5px] font-bold text-slate-400 block mb-0.5">Kích thước Upload:</span>
                    <div className="font-mono font-extrabold text-slate-900 text-sm">{actualW}×{actualH} px</div>
                    <span className="text-[10px] text-slate-500 block pt-1">Tỷ lệ: {designAspectRatio.toFixed(3)}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10.5px] font-bold text-slate-400 block mb-0.5">Safe Zone Chuẩn:</span>
                    <div className="font-mono font-extrabold text-slate-900 text-sm">{targetW}×{targetH} px</div>
                    <span className="text-[10px] text-slate-500 block pt-1">Tỷ lệ: {templateAspectRatio.toFixed(3)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-orange-950 text-xs space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Độ lệch tỷ lệ thực tế:</span>
                    <span className="font-mono font-extrabold text-orange-700">{ratioResult.diffPercent}%</span>
                  </div>
                  <div className="text-[11px] text-orange-900/80">
                    Ngưỡng cho phép: <strong>±{currentGroup.tolerancePercent || 1.5}%</strong> • {ratioResult.isValid ? 'Nằm trong phạm vi an toàn.' : 'Vượt ngưỡng sai số.'}
                  </div>
                </div>
              </div>

              {/* Box 2: Order Customer Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  Chi tiết Đơn hàng Etsy
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Sản phẩm:</span>
                    <p className="font-bold text-slate-900 line-clamp-2">{order.productTitle}</p>
                  </div>

                  {order.personalization?.text && (
                    <div className="pt-1">
                      <span className="text-slate-400 font-medium block mb-1">Yêu cầu khách (Personalization):</span>
                      <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-950 text-[11px] font-semibold whitespace-pre-wrap">
                        {order.personalization.text}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Actions: Re-Upload, Delete Image & Run AI Scan */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              
              <div className="grid grid-cols-2 gap-2">
                <label className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition active:scale-95">
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>Up Ảnh Khác</span>
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

                {order.hasUploadedDesign && (
                  <button
                    onClick={() => onDeleteDesign && onDeleteDesign(order)}
                    className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Xóa Ảnh Upload</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => onRunAIScan && onRunAIScan(order)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chạy AI Vision Check OCR Chữ & Khung</span>
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
