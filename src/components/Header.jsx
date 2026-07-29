import React from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  Layers, 
  PackageCheck,
  Play,
  Cloud,
  CloudOff,
  Database
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  orders = [],
  onSyncEtsy,
  isSyncing,
  onRunToolScript,
  isCloudConnected,
  onSeedSupabase
}) {
  const totalOrders = orders.length;
  const successOrders = orders.filter(o => o.status === 'Thành công' || o.status === 'Hoàn thành').length;
  const errorOrders = orders.filter(o => o.status === 'Lỗi' || o.status === 'Sai chữ AI' || o.ratioStatus === 'MISMATCH').length;
  const pendingOrders = orders.filter(o => o.status === 'Chờ kiểm tra' || (!o.hasUploadedDesign && o.status !== 'Thành công' && o.status !== 'Lỗi')).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Logo & Operator Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/30">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">
                    Etsy Design QC Studio
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30 uppercase tracking-wider">
                    v2.5 Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Hệ thống Quản lý & Kiểm Tra QC Tự Động • <span className="text-emerald-400 font-bold">12,655 Đơn Hàng CSV</span>
                </p>
              </div>
            </div>

            {/* Operator Profile Badge */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center">
                DK
              </div>
              <div>
                <p className="text-[10px] text-slate-400 leading-none">Nhân viên QC</p>
                <p className="font-bold text-slate-200 text-xs leading-tight">Dakuho</p>
              </div>
            </div>
          </div>

          {/* Real-time Order Stats Counter */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <span className="text-slate-400 font-medium">Tổng đơn CSV:</span>
              <strong className="text-white font-extrabold text-sm">{totalOrders.toLocaleString()}</strong>
            </div>

            <div className="flex items-center gap-2 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Thành công:</span>
              <strong className="text-emerald-400 font-extrabold text-sm">{successOrders.toLocaleString()}</strong>
            </div>

            <div className="flex items-center gap-2 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-800/40">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-300 font-medium">Lỗi / Sai tỷ lệ:</span>
              <strong className="text-rose-400 font-extrabold text-sm">{errorOrders.toLocaleString()}</strong>
            </div>

            <div className="flex items-center gap-2 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-800/40">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300 font-medium">Chờ kiểm tra:</span>
              <strong className="text-amber-400 font-extrabold text-sm">{pendingOrders.toLocaleString()}</strong>
            </div>
          </div>

          {/* Right Action Tools & Cloud Sync Indicator */}
          <div className="flex items-center gap-2.5">
            
            {/* Supabase Cloud Connection Status Badge */}
            {isCloudConnected ? (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold"
                title="Đã kết nối Supabase Cloud Database! Mọi thao tác sẽ tự động lưu và đồng bộ real-time."
              >
                <Cloud className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Supabase Cloud</span>
              </div>
            ) : (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold"
                title="Chưa kết nối Supabase Cloud. Hệ thống đang chạy chế độ Local Offline Safety."
              >
                <CloudOff className="w-4 h-4 text-slate-400" />
                <span>Local Offline</span>
              </div>
            )}

            {/* Standalone Tools Execution Button */}
            <button
              onClick={onRunToolScript}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
              title="Bấm nút này để chạy tools xử lý dữ liệu đơn hàng tách biệt hoàn toàn với source code"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>🚀 Chạy Tools</span>
            </button>

            {/* Seed Cloud DB Button */}
            {isCloudConnected && (
              <button
                onClick={onSeedSupabase}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                title="Seed toàn bộ 12,655 đơn CSV lên cơ sở dữ liệu Supabase Cloud"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Seed Cloud DB</span>
              </button>
            )}

            {/* Tab Navigation Controls */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                  activeTab === 'orders'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Danh Sách Đơn</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                  activeTab === 'config'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cấu Hình Safe Zone</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
