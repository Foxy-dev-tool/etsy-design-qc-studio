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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Khung Hình Sản Phẩm & Test Khớp Thiết Kế (Preview Studio)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                  Đơn {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sản phẩm: {order.productTitle?.slice(0, 50)}... | Safe Zone: <strong className="text-amber-400">{matchedTemplate.sizeLabel}</strong> ({targetW}×{targetH} px)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>{hasDesign ? 'Up Ảnh Thiết Kế Khác' : 'Up Ảnh Thiết Kế Mới'}</span>
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

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SYSTEM STATUS BANNER */}
        {!hasDesign ? (
          <div className="bg-amber-500 text-slate-950 px-5 py-2.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <ImageIcon className="w-5 h-5 shrink-0 text-slate-950" />
              <span>
                Chưa có ảnh thiết kế upload cho đơn hàng này. Bạn có thể nhấp nút "Up Ảnh Thiết Kế Mới" để kiểm tra Safe Zone trực tiếp.
              </span>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-950 text-amber-400 font-extrabold text-[10.5px] rounded-lg shadow-2xs whitespace-nowrap">
              CHỜ UP ẢNH
            </span>
          </div>
        ) : !ratioResult.isValid ? (
          <div className="bg-rose-600 text-white px-5 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white shrink-0 animate-bounce" />
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wide">
                  🚨 HỆ THỐNG BÁO LỖI: SAI TỶ LỆ KHUNG HÌNH SẢN PHẨM!
                </h4>
                <p className="text-xs opacity-95">
                  File thiết kế upload ({actualW}x{actualH}px - {scaleWidthPct.toFixed(1)}% Rộng × {scaleHeightPct.toFixed(1)}% Cao) <strong>KHÔNG KHỚP</strong> với Khung kích thước Template tiêu chuẩn ({targetW}x{targetH}px). Lệch {ratioResult.diffPercent.toFixed(1)}%!
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-rose-700 font-extrabold text-xs rounded-lg shadow-sm whitespace-nowrap">
              MISMATCH ALERT
            </span>
          </div>
        ) : (
          <div className="bg-emerald-600 text-white px-5 py-2.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wide">
                  ✅ HỆ THỐNG XÁC NHẬN: KHỚP 100% KHUNG KÍCH THƯỚC SAFE ZONE
                </h4>
                <p className="text-[11px] opacity-95">
                  File thiết kế ({actualW}x{actualH}px) khớp hoàn hảo với Khung Template Safe Zone size {matchedTemplate.sizeLabel}.
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
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200 text-xs">
              
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

            {/* Interactive Viewport Box */}
            <div className="flex-1 min-h-[380px] max-h-[520px] bg-slate-950 rounded-xl border border-slate-300 flex items-center justify-center p-4 overflow-auto relative shadow-inner">
              
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
                  {/* Baseline Safe Zone Template Frame (Defines 100% Canvas Boundary) */}
                  {matchedTemplate.templateImage ? (
                    <img
                      src={matchedTemplate.templateImage}
                      alt="Template Safe Zone Baseline"
                      className="w-full h-full object-contain rounded border border-slate-700 bg-slate-900/90 shadow-2xl relative z-10 transition-opacity"
                      style={{ opacity: opacity / 100 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 border border-slate-700 rounded flex items-center justify-center">
                      <span className="text-slate-500 text-xs font-bold">(Khung Safe Zone Template)</span>
                    </div>
                  )}

                  {/* Uploaded Artwork Layer (Scaled to EXACT relative pixel dimensions!) */}
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
                /* SIDE-BY-SIDE MODE: BOTH CARDS ANCHORED TO SAME BASELINE SCALE */
                <div 
                  className="grid grid-cols-2 gap-4 w-full h-full max-h-[460px] items-center justify-center"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                  {/* Card 1: Uploaded Design (Scaled to true relative physical size!) */}
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
                            alt="Design File Real Scale"
                            className="w-full h-full object-fill rounded border border-orange-500 shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="text-center p-6 text-slate-500 text-xs font-medium">
                          (Chưa upload file thiết kế)
                        </div>
                      )}
                    </div>

                    {hasDesign && (
                      <span className="mt-2 text-[9.5px] font-mono text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {scaleWidthPct < 100 ? `⚠️ Nhỏ hơn Safe Zone (${scaleWidthPct.toFixed(1)}% Rộng × ${scaleHeightPct.toFixed(1)}% Cao)` : scaleWidthPct > 100 ? `⚠️ To hơn Safe Zone (${scaleWidthPct.toFixed(1)}% Rộng × ${scaleHeightPct.toFixed(1)}% Cao)` : `✅ Khớp 100% kích thước`}
                      </span>
                    )}
                  </div>

                  {/* Card 2: Safe Zone Template Baseline */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 h-full">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                      Khung Safe Zone ({matchedTemplate.sizeLabel} - {targetW}×{targetH}px)
                    </span>

                    <div 
                      className="relative flex items-center justify-center transition-all rounded"
                      style={{ 
                        width: '100%',
                        maxWidth: templateAspectRatio >= 1 ? '270px' : `${270 * templateAspectRatio}px`,
                        aspectRatio: `${templateAspectRatio}`
                      }}
                    >
                      {matchedTemplate.templateImage ? (
                        <img
                          src={matchedTemplate.templateImage}
                          alt="Template File Baseline"
                          className="w-full h-full object-contain rounded border border-emerald-500/80 bg-slate-900 shadow-md"
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-500 text-xs font-medium">
                          (Chưa chọn Safe Zone Template)
                        </div>
                      )}
                    </div>

                    <span className="mt-2 text-[9.5px] font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Standard Baseline 100% (1:1 Target)
                    </span>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Right Inspection Summary */}
          <div className="lg:col-span-4 bg-white p-4 flex flex-col justify-between overflow-y-auto space-y-3">
            
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" />
                <span>Chi Tiết So Sánh Khung Kích Thước</span>
              </h4>

              {/* Specs Table */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between pb-1 border-b border-slate-200 text-slate-500 font-sans font-bold text-[11px]">
                  <span>Thông số</span>
                  <span>Ảnh Upload</span>
                  <span>Khung Safe Zone</span>
                </div>

                <div className="flex justify-between text-slate-800">
                  <span className="font-sans text-slate-600">Pixel ($W \times H$):</span>
                  <span className={scaleWidthPct < 100 ? 'text-amber-700 font-bold' : 'text-slate-800'}>{hasDesign ? `${actualW}×${actualH}` : 'Chưa Up'}</span>
                  <span className="text-orange-600 font-bold">{targetW}×{targetH}</span>
                </div>

                <div className="flex justify-between text-slate-800">
                  <span className="font-sans text-slate-600">Tỷ lệ Rộng (Vs Safe Zone):</span>
                  <span className={scaleWidthPct < 98.5 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                    {hasDesign ? `${scaleWidthPct.toFixed(1)}%` : '-'}
                  </span>
                  <span className="text-slate-500">100% Standard</span>
                </div>

                <div className="flex justify-between text-slate-800">
                  <span className="font-sans text-slate-600">Tỷ lệ Cao (Vs Safe Zone):</span>
                  <span className={scaleHeightPct < 98.5 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                    {hasDesign ? `${scaleHeightPct.toFixed(1)}%` : '-'}
                  </span>
                  <span className="text-slate-500">100% Standard</span>
                </div>

                <div className="flex justify-between text-slate-800 pt-1 border-t border-slate-200">
                  <span className="font-sans text-slate-600">Độ lệch tỷ lệ khung:</span>
                  <span className={!hasDesign ? 'text-slate-400 font-bold' : ratioResult.diffPercent > 1.5 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                    {hasDesign ? `${ratioResult.diffPercent.toFixed(2)}%` : '-'}
                  </span>
                  <span className="text-slate-500">≤ {currentGroup.tolerancePercent || 1.5}%</span>
                </div>
              </div>
            </div>

            {/* Template Info Card */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Khung Safe Zone Đang Sử Dụng:
              </span>
              
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    📐
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{matchedTemplate.sizeLabel}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{targetW} × {targetH} px</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono text-[10px] border border-slate-200 font-bold">
                  {currentGroup.name}
                </span>
              </div>
            </div>

            {/* Personalization Info */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Nội Dung Chữ Cá Nhân Hóa (Etsy)
              </span>

              <div className="p-2 rounded bg-white text-slate-900 font-semibold border border-slate-200 text-xs">
                "{order.personalization?.text || 'Không có'}"
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={() => onRunAIScan(order)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quét AI So Chữ Khách</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
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
