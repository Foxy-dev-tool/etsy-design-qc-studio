import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Wand2,
  Zap,
  Info
} from 'lucide-react';

export default function AIScannerModal({
  order,
  onClose,
  onRunAIScan,
  isScanning
}) {
  if (!order) return null;

  const [customPrompt, setCustomPrompt] = useState(
    `Hãy quét hình ảnh này và đối chiếu với tên khách hàng cá nhân hóa: "${order.personalization?.text || ''}". Kiểm tra lỗi chính tả, viền an toàn và độ sắc nét.`
  );
  const [showPromptBox, setShowPromptBox] = useState(false);

  const report = order.aiReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Hệ Thống AI Quét Ảnh & Đọc Nội Dung Chữ
              </h3>
              <p className="text-xs text-slate-500">
                Đơn {order.orderNumber} | Đối chiếu thiết kế với Yêu cầu Etsy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Preview */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-900 p-4 rounded-xl border border-slate-300 relative min-h-[300px]">
              
              {isScanning && (
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 via-orange-500/40 to-transparent z-10 animate-pulse pointer-events-none rounded-xl flex items-center justify-center">
                  <div className="w-full h-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-bounce" />
                </div>
              )}

              <img
                src={order.designImage || '/_4123920413.png'}
                alt="Design Artwork"
                className="max-h-[320px] object-contain rounded border border-slate-700 shadow-xl"
              />

              <div className="mt-3 text-center">
                <span className="text-[11px] text-slate-300 font-mono">
                  File upload: {order.designWidth || 3012}x{order.designHeight || 3012} px
                </span>
              </div>
            </div>

            {/* Right Results */}
            <div className="md:col-span-7 space-y-4">
              
              <button
                onClick={() => onRunAIScan(order, customPrompt)}
                disabled={isScanning}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Wand2 className={`w-4 h-4 text-amber-300 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Đang Quét AI Vision & OCR...' : 'Chạy Quét AI Ngay Tức Thì'}</span>
              </button>

              {report ? (
                <div className="space-y-4">
                  
                  <div className={`p-4 rounded-xl border space-y-1.5 ${
                    report.status === 'MATCH'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center justify-between font-extrabold text-sm">
                      <div className="flex items-center gap-2">
                        {report.status === 'MATCH' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                        <span>{report.status === 'MATCH' ? 'AI DỰ ĐOÁN: CHÍNH XÁC 100%' : 'AI DỰ ĐOÁN: PHÁT HIỆN LỖI'}</span>
                      </div>
                      <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 bg-white rounded border border-slate-200 shadow-2xs">
                        {report.confidence}% Confidence
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">
                      {report.textMatchDetails}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Đối Chiếu Nội Dung Chữ Quét Động
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block">Tên & Chữ Cá Nhân Hóa (Đã Phân Loại):</span>
                        {report.targetNames && report.targetNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {report.targetNames.map((name, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-[11px]">
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="font-extrabold text-amber-700 text-xs">
                            "{order.personalization?.text || 'None'}"
                          </p>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold block">Kết Quả Đọc & Tìm Tên Trên Ảnh:</span>
                        {report.targetNames && report.targetNames.length > 0 ? (
                          <div className="space-y-1.5">
                            {report.foundNames && report.foundNames.length > 0 && (
                              <div>
                                <span className="text-[9.5px] font-bold text-emerald-700 block mb-1">✅ Tên tìm thấy trên ảnh:</span>
                                <div className="flex flex-wrap gap-1">
                                  {report.foundNames.map((name, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{name}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {report.missingNames && report.missingNames.length > 0 && (
                              <div>
                                <span className="text-[9.5px] font-bold text-rose-700 block mb-1">❌ Tên thiếu hoặc sai trên ảnh:</span>
                                <div className="flex flex-wrap gap-1">
                                  {report.missingNames.map((name, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-extrabold text-[11px] flex items-center gap-1">
                                      <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>{name}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className={`font-extrabold text-xs ${report.textMatch ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {report.detectedText?.filter(l => l.length > 3 && !l.includes('WTF')).slice(0, 5).join(' | ') || 'Không quét được chữ từ ảnh'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-orange-600 block mb-1">💡 Đề Xuất Của Hệ Thống AI:</span>
                    <p className="text-slate-800 font-medium">{report.suggestion}</p>
                  </div>

                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-xs space-y-2">
                  <Zap className="w-8 h-8 mx-auto text-amber-500 opacity-70" />
                  <p className="font-semibold text-slate-700">Bấm nút "Chạy Quét AI Ngay Tức Thì" để thực hiện đối chiếu tự động.</p>
                </div>
              )}

              {/* Collapsible Cloud AI Prompt Settings */}
              <div className="pt-2 border-t border-slate-200 text-xs">
                <button
                  onClick={() => setShowPromptBox(!showPromptBox)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-[11px] transition"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>{showPromptBox ? '▲ Ẩn Tùy chỉnh Prompt AI Cloud' : '▼ Tùy chỉnh Prompt câu lệnh (Chỉ dùng khi nối OpenAI/Gemini API)'}</span>
                </button>

                {showPromptBox && (
                  <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Quy tắc Prompt gửi tới Cloud AI Model:
                    </label>
                    <textarea
                      rows={2}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
