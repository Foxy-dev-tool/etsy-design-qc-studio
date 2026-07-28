import React, { useState } from 'react';
import { 
  Eye, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  Columns, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Copy,
  Layers,
  Zap
} from 'lucide-react';
import { DEFAULT_COLUMNS } from '../services/mockData';

// Frontend helper to parse JSON array notes
const formatNoteDisplay = (rawNote) => {
  if (!rawNote || rawNote === 'nan' || rawNote === 'None' || rawNote === '-') return '-';
  const str = String(rawNote).trim();
  
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        const texts = parsed
          .map(item => (typeof item === 'object' && item.text) ? String(item.text).trim() : String(item).trim())
          .filter(Boolean);
        if (texts.length > 0) return texts.join(' • ');
      }
    } catch (e) {
      // ignore
    }
  }
  return str;
};

// Helper to format date line 1 and time line 2
const formatDateAndTime = (dateStr) => {
  if (!dateStr || dateStr === 'nan') return { datePart: '-', timePart: '' };
  const parts = dateStr.trim().split(' ');
  if (parts.length >= 2) {
    return { datePart: parts[0], timePart: parts[1] };
  }
  return { datePart: dateStr, timePart: '' };
};

// Helper to find matching template in chosen group based EXCLUSIVELY on customer size text
const getMatchedTemplateForGroup = (group, orderSizeText = '') => {
  if (!group || !group.templates || group.templates.length === 0) return null;

  if (!orderSizeText) {
    return group.templates[0];
  }

  const searchText = orderSizeText.toLowerCase().replace(',', '.');

  // Try exact size match first
  for (const tmpl of group.templates) {
    const tmplSize = tmpl.sizeLabel.toLowerCase().replace(',', '.');
    if (searchText.includes(tmplSize)) {
      return tmpl;
    }
  }

  // Group specific matching
  if (group.name === 'Stained Glass Suncatcher') {
    if (searchText.includes('9.84')) return group.templates[3];
    if (searchText.includes('7.87')) return group.templates[2];
    if (searchText.includes('5.9')) return group.templates[1];
    if (searchText.includes('3.94')) return group.templates[0];
  } else if (group.name === 'Arylic Suncatcher') {
    if (searchText.includes('12')) return group.templates[1];
    if (searchText.includes('3.54')) return group.templates[0];
  } else if (group.name === 'Graduation Cap') {
    if (searchText.includes('9.5')) return group.templates[1];
    if (searchText.includes('7.5')) return group.templates[0];
  } else if (group.name === 'Desk Mat') {
    if (searchText.includes('90x40') || searchText.includes('90*40')) return group.templates[6];
    if (searchText.includes('80x30') || searchText.includes('80*30')) return group.templates[5];
    if (searchText.includes('70x35') || searchText.includes('70*35')) return group.templates[4];
    if (searchText.includes('60x30') || searchText.includes('60*30')) return group.templates[3];
    if (searchText.includes('45x40') || searchText.includes('45*40')) return group.templates[2];
    if (searchText.includes('30x25') || searchText.includes('30*25')) return group.templates[1];
    if (searchText.includes('18x22') || searchText.includes('18*22')) return group.templates[0];
  } else if (group.name === 'Stole') {
    if (searchText.includes('kid')) return group.templates[1];
    return group.templates[0];
  } else if (group.name === '1 layer wooden') {
    if (searchText.includes('20') || searchText.includes('24')) return group.templates[1];
    return group.templates[0];
  } else if (group.name === '2 layer Wooden 4') {
    if (searchText.includes('26') || searchText.includes('28') || searchText.includes('30')) return group.templates[3];
    if (searchText.includes('20') || searchText.includes('22') || searchText.includes('24')) return group.templates[2];
    if (searchText.includes('14') || searchText.includes('16') || searchText.includes('18')) return group.templates[1];
    return group.templates[0];
  } else if (group.name === '2 layer Wooden 2') {
    if (searchText.includes('24')) return group.templates[8];
    if (searchText.includes('20')) return group.templates[7];
    if (searchText.includes('18')) return group.templates[6];
    if (searchText.includes('16')) return group.templates[5];
    if (searchText.includes('14')) return group.templates[4];
    if (searchText.includes('12')) return group.templates[3];
    if (searchText.includes('10')) return group.templates[2];
    if (searchText.includes('8')) return group.templates[1];
    if (searchText.includes('6')) return group.templates[0];
  }

  return group.templates[0];
};

export default function OrderListTable({
  orders = [],
  productGroups = [],
  onOpenVisualInspector,
  onOpenAIScanner,
  onUploadDesign,
  onRunQCScan,
  selectedOrders = [],
  onToggleSelectAll,
  onToggleSelectOrder,
  onImportCSV,
  onGroupChange
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRatio, setFilterRatio] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter logic across all orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.personalization?.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.note || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRatio = filterRatio === 'ALL' || order.ratioStatus === filterRatio;
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;

    return matchesSearch && matchesRatio && matchesStatus;
  });

  const totalRecords = filteredOrders.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const toggleColumnVisibility = (colId) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  const isColVisible = (colId) => {
    const found = columns.find(c => c.id === colId);
    return found ? found.visible : true;
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  return (
    <div className="space-y-3 w-full">
      
      {/* Search & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs text-xs">
        
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-extrabold border border-orange-200 shrink-0 text-xs">
            <Database className="w-4 h-4" />
            <span>CSV Thật: {orders.length.toLocaleString()} Đơn</span>
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm Mã đơn (#3925127491), SKU, Tên, Chữ..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 hidden sm:inline">Khung Tỷ Lệ:</span>
              <select
                value={filterRatio}
                onChange={(e) => {
                  setFilterRatio(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả tỷ lệ</option>
                <option value="MATCH">✅ Đạt tỷ lệ</option>
                <option value="MISMATCH">❌ Sai tỷ lệ</option>
                <option value="NEEDS_CHECK">⏳ Chờ kiểm tra</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 hidden sm:inline">Trạng thái QC:</span>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Thành công">Thành công</option>
                <option value="Lỗi">Lỗi / Sai tỷ lệ</option>
                <option value="Chờ kiểm tra">Chờ kiểm tra</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-orange-600" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onImportCSV(e.target.files);
                }
              }}
            />
          </label>

          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Ẩn / Hiện các cột"
            >
              <Columns className="w-3.5 h-3.5 text-orange-600" />
              <span>Tinh chỉnh Cột</span>
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Ẩn / Hiện Cột</span>
                  <button 
                    onClick={() => setShowColumnPicker(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto text-xs">
                  {columns.map(col => col.id !== 'select' && (
                    <label key={col.id} className="flex items-center gap-2 text-slate-700 hover:bg-slate-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumnVisibility(col.id)}
                        className="rounded border-slate-300 text-orange-500"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* DYNAMIC PRODUCT GROUP SELECTION & 8 SAFE ZONE GROUPS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs w-full">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-extrabold uppercase tracking-wider text-[10.5px]">
                
                {isColVisible('select') && (
                  <th className="p-3 w-9 text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={onToggleSelectAll}
                      className="rounded border-slate-300 text-orange-500"
                    />
                  </th>
                )}

                {isColVisible('date') && <th className="p-3 min-w-[95px] text-center whitespace-nowrap">Ngày & Giờ</th>}
                {isColVisible('orderId') && <th className="p-3 min-w-[135px] whitespace-nowrap">ID đơn hàng</th>}
                {isColVisible('product') && <th className="p-3 min-w-[380px]">Sản phẩm & Yêu Cầu Khách (Personalization)</th>}
                {isColVisible('productGroupSelect') && <th className="p-3 min-w-[210px]">Chọn Nhóm SP Đổ Safe Zone & Quét QC</th>}
                {isColVisible('aiCheck') && <th className="p-3 min-w-[125px] whitespace-nowrap">AI Quét OCR</th>}
                {isColVisible('note') && <th className="p-3 min-w-[135px]">Ghi chú</th>}
                {isColVisible('uploadDesign') && <th className="p-3 min-w-[115px] text-center whitespace-nowrap">File Ảnh Thiết Kế</th>}
                {isColVisible('previewAction') && <th className="p-3 min-w-[100px] text-center whitespace-nowrap">Preview</th>}
                {isColVisible('status') && <th className="p-3 min-w-[115px] text-center whitespace-nowrap">Trạng Thái QC</th>}

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    Không có đơn hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedOrders.includes(order.id);
                  const rawText = order.personalization?.text || '';
                  const hasExplicitSizeInCustomerText = Boolean(order.personalization?.size && order.personalization.size.trim() !== '');
                  const cleanNote = formatNoteDisplay(order.note);
                  const { datePart, timePart } = formatDateAndTime(order.orderDate);

                  // Current Group & Matched Safe Zone Template
                  const currentGroupName = order.productGroup || 'Stained Glass Suncatcher';
                  const currentGroupObj = productGroups.find(g => g.name === currentGroupName) || productGroups[0];
                  const matchedTmpl = getMatchedTemplateForGroup(
                    currentGroupObj, 
                    order.personalization?.size || ''
                  );

                  return (
                    <tr 
                      key={order.id}
                      className={`hover:bg-slate-50 transition ${
                        isSelected ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      {isColVisible('select') && (
                        <td className="p-3 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectOrder(order.id)}
                            className="rounded border-slate-300 text-orange-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* 2. Date */}
                      {isColVisible('date') && (
                        <td className="p-3 text-center text-slate-600 font-sans text-xs leading-snug align-top">
                          <div className="font-bold text-slate-800 whitespace-nowrap text-[11.5px]">{datePart}</div>
                          {timePart && <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{timePart}</div>}
                        </td>
                      )}

                      {/* 3. Store & Order ID */}
                      {isColVisible('orderId') && (
                        <td className="p-3 align-top">
                          <div className="space-y-0.5">
                            <p className="text-[10.5px] text-slate-500 font-extrabold tracking-tight truncate max-w-[125px]" title={`Shop: ${order.storeName}`}>
                              {order.storeName}
                            </p>
                            <span className="font-extrabold text-orange-600 text-xs block whitespace-nowrap">
                              {order.orderNumber}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* 4. Product details & Personalization */}
                      {isColVisible('product') && (
                        <td className="p-3 align-top">
                          <div className="flex items-start gap-3">
                            <img
                              src={order.mockupThumb || '/_4123920413.png'}
                              alt="Mockup"
                              onError={(e) => { e.target.src = '/_4123920413.png'; }}
                              className="w-11 h-11 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0 shadow-2xs"
                            />
                            <div className="space-y-2 min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-xs leading-snug tracking-tight" title={order.productTitle}>
                                {order.productTitle}
                              </p>

                              <div className="flex items-center gap-2 text-[10.5px]">
                                <span className="text-slate-500 font-medium">Qty: <strong className="text-slate-900 font-extrabold">{order.quantity}</strong></span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200 inline-block" title={order.sku}>
                                  SKU: {order.sku}
                                </span>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                <div className="flex items-center gap-2">
                                  {hasExplicitSizeInCustomerText ? (
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-extrabold shadow-2xs">
                                      Khách đặt Size: {order.personalization.size}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-medium italic">
                                      (Yêu cầu khách không ghi Size)
                                    </span>
                                  )}

                                  {rawText && (
                                    <button
                                      onClick={() => copyToClipboard(rawText, order.id)}
                                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 font-bold transition shadow-2xs"
                                      title="Copy chữ cá nhân hóa"
                                    >
                                      <Copy className="w-3 h-3 text-slate-600" />
                                      <span>{copiedTextId === order.id ? 'Đã copy!' : 'Copy Text'}</span>
                                    </button>
                                  )}
                                </div>

                                {rawText && (
                                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-slate-900 font-sans text-xs font-semibold whitespace-pre-wrap leading-relaxed shadow-2xs break-words tracking-normal">
                                    {rawText}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </td>
                      )}

                      {/* 5. Dynamic Product Group Dropdown & 8 Safe Zone Groups */}
                      {isColVisible('productGroupSelect') && (
                        <td className="p-3 align-top">
                          <div className="space-y-2">
                            {/* Group Dropdown Selector */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Layers className="w-3 h-3 text-orange-500" />
                                <span>Nhóm SP Safe Zone:</span>
                              </label>
                              <select
                                value={currentGroupName}
                                onChange={(e) => onGroupChange && onGroupChange(order.id, e.target.value)}
                                className="w-full p-1.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs transition"
                              >
                                {productGroups.map(group => (
                                  <option key={group.id} value={group.name}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Matched Safe Zone Size Badge */}
                            {matchedTmpl && (
                              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/90 text-slate-800 text-[10.5px] space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-emerald-700">✅ Khớp Safe Zone:</span>
                                  <span className="font-extrabold text-slate-900">{matchedTmpl.sizeLabel}</span>
                                </div>
                                <div className="text-[9.5px] text-slate-500 font-mono flex items-center justify-between">
                                  <span>Chuẩn Pixel:</span>
                                  <span className="font-extrabold text-slate-700">{matchedTmpl.widthPx}×{matchedTmpl.heightPx} px</span>
                                </div>
                              </div>
                            )}

                            {/* Scan QC Trigger Button */}
                            <button
                              onClick={() => onRunQCScan && onRunQCScan(order, currentGroupObj, matchedTmpl)}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                              title="Bấm nút Quét để hệ thống tính toán tỷ lệ ảnh thiết kế đã up với Safe Zone"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>⚡ Quét QC Ảnh</span>
                            </button>

                          </div>
                        </td>
                      )}

                      {/* 6. AI Scan OCR Status */}
                      {isColVisible('aiCheck') && (
                        <td className="p-3 align-top">
                          <div className="space-y-1.5">
                            {order.aiStatus === 'MATCH' ? (
                              <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-between font-extrabold text-[10.5px]">
                                <span>AI Khớp 100%</span>
                                <span className="text-[10px]">{order.aiScore}%</span>
                              </div>
                            ) : order.aiStatus === 'TEXT_MISMATCH' ? (
                              <div className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10.5px] flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Sai Chữ Khách</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-center text-[10.5px] font-semibold">
                                Chưa Quét OCR
                              </div>
                            )}

                            <button
                              onClick={() => onOpenAIScanner(order)}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-1 transition"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Quét AI</span>
                            </button>
                          </div>
                        </td>
                      )}

                      {/* 7. Cleaned Note */}
                      {isColVisible('note') && (
                        <td className="p-3 align-top text-slate-800 text-xs">
                          <div className="whitespace-pre-wrap leading-relaxed text-xs font-medium break-words max-h-32 overflow-y-auto" title={cleanNote}>
                            {cleanNote}
                          </div>
                        </td>
                      )}

                      {/* 8. File Ảnh Thiết Kế */}
                      {isColVisible('uploadDesign') && (
                        <td className="p-3 align-top text-center">
                          <div className="space-y-1.5 flex flex-col items-center justify-center">
                            {order.hasUploadedDesign && order.designImage ? (
                              <div className="relative group/up">
                                <img
                                  src={order.designImage}
                                  alt="Uploaded Design"
                                  className="w-10 h-10 object-cover rounded-md border border-emerald-400 bg-white shadow-xs mx-auto"
                                />
                                <span className="text-[9px] text-emerald-700 font-bold block pt-0.5 whitespace-nowrap">
                                  {order.designWidth}×{order.designHeight}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic block font-medium">Chưa có ảnh</span>
                            )}

                            <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs whitespace-nowrap">
                              <Upload className="w-3.5 h-3.5 text-orange-600" />
                              <span>{order.hasUploadedDesign ? 'Up Ảnh Khác' : 'Up Ảnh'}</span>
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
                        </td>
                      )}

                      {/* 9. Preview Button */}
                      {isColVisible('previewAction') && (
                        <td className="p-3 align-top text-center">
                          <button
                            onClick={() => onOpenVisualInspector(order)}
                            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition active:scale-95 mx-auto whitespace-nowrap"
                            title="Bấm nút Preview để xem khung sản phẩm khớp với thiết kế"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        </td>
                      )}

                      {/* 10. Trạng Thái QC */}
                      {isColVisible('status') && (
                        <td className="p-3 align-top text-center">
                          {order.status === 'Thành công' || order.status === 'Hoàn thành' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Thành công</span>
                            </span>
                          ) : order.status === 'Lỗi' || order.status === 'Sai chữ AI' || order.ratioStatus === 'MISMATCH' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Lỗi QC</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-block whitespace-nowrap">
                              Chờ kiểm tra
                            </span>
                          )}
                        </td>
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none"
            >
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
              <option value={250}>250 dòng</option>
            </select>
            <span>
              | {startIndex + 1} - {Math.min(startIndex + pageSize, totalRecords)} trong tổng số <strong className="text-slate-900 font-extrabold">{totalRecords.toLocaleString()}</strong> đơn
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trang trước</span>
            </button>

            <span className="px-3 py-1 bg-white border border-slate-200 rounded font-bold text-orange-600">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
