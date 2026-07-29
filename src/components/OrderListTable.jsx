import React, { useState } from 'react';
import { 
  Eye, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Layers,
  Zap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  XCircle,
  AlertCircle,
  FileCode,
  Image as ImageIcon,
  HelpCircle,
  Columns,
  Maximize2,
  Trash2,
  Database
} from 'lucide-react';

// Helper to format SKU / Note display safely
const formatNoteDisplay = (str) => {
  if (!str || str === '-') return '-';
  if (typeof str === 'string' && str.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        const texts = parsed
          .map(item => (typeof item === 'object' && item && item.text) ? String(item.text).trim() : String(item).trim())
          .filter(Boolean);
        if (texts.length > 0) return texts.join(' • ');
      }
    } catch (e) {
      // ignore
    }
  }
  return String(str);
};

// Helper to format date line 1 and time line 2
const formatDateAndTime = (dateStr) => {
  if (!dateStr || dateStr === 'nan') return { datePart: '-', timePart: '' };
  const parts = String(dateStr).trim().split(' ');
  if (parts.length >= 2) {
    return { datePart: parts[0], timePart: parts[1] };
  }
  return { datePart: String(dateStr), timePart: '' };
};

// Dynamic client-side size parser from personalization text
const parseSizeFromText = (fullText = '') => {
  if (!fullText || !fullText.trim()) return '';

  // 1. Line starting with Size: / size: / Kích thước: / Dimensions:
  const lineMatch = fullText.match(/(?:Size|size|Kích thước|Dimensions)\s*[:=]\s*([^\n\r,]+)/i);
  if (lineMatch && lineMatch[1] && lineMatch[1].trim()) {
    const candidate = lineMatch[1].trim();
    if (!candidate.toLowerCase().startsWith('1 layer') && !candidate.toLowerCase().startsWith('2 layer')) {
      return candidate;
    }
  }

  // 2. Explicit dimension patterns e.g. 8x8, 8×8, 60" x 50", 10x10, 3.94 in, 12in-18in
  const dimMatch = fullText.match(/(\d+(?:\.\d+)?\s*(?:in|inch|inches|cm|X\d+|\d+\s*["″]?\s*[x×*]\s*\d+["″]?|\d+in-\d+in))/i);
  if (dimMatch && dimMatch[1] && dimMatch[1].trim()) {
    return dimMatch[1].trim();
  }

  // 3. Clothing size e.g. 2XL, XL, Small, Medium, Large
  const clothingMatch = fullText.match(/\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL|Small|Medium|Large|X-Large|2X-Large|3X-Large)\b/i);
  if (clothingMatch && clothingMatch[1] && clothingMatch[1].trim()) {
    return clothingMatch[1].trim();
  }

  return '';
};

// Fail-proof template matcher
const getMatchedTemplateForGroup = (group, orderSizeText = '') => {
  const defaultFallback = { sizeLabel: 'Standard', widthPx: 3012, heightPx: 3012, tmplFile: '/_4123920413.png' };
  if (!group || !Array.isArray(group.templates) || group.templates.length === 0) {
    return defaultFallback;
  }

  const safeSizeText = (orderSizeText || '').toString().toLowerCase().replace(',', '.');
  if (!safeSizeText) {
    return group.templates[0] || defaultFallback;
  }

  // Exact / partial size match
  for (const tmpl of group.templates) {
    if (tmpl && tmpl.sizeLabel) {
      const tmplSize = tmpl.sizeLabel.toString().toLowerCase().replace(',', '.');
      if (safeSizeText.includes(tmplSize)) {
        return tmpl;
      }
    }
  }

  return group.templates[0] || defaultFallback;
};

export default function OrderListTable({
  orders = [],
  productGroups = [],
  onOpenVisualInspector,
  onOpenAIScanner,
  onUploadDesign,
  onDeleteDesign,
  onRunQCScan,
  onGroupChange,
  selectedOrders = [],
  onToggleSelectAll,
  onToggleSelectOrder,
  onImportCSV
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRatio, setFilterRatio] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Column Visibility Customizer state
  const [showColMenu, setShowColMenu] = useState(false);
  const [columns, setColumns] = useState([
    { id: 'select', label: 'Select Checkbox', visible: true },
    { id: 'date', label: 'Ngày & Giờ', visible: true },
    { id: 'orderId', label: 'ID Đơn Hàng', visible: true },
    { id: 'product', label: 'Sản phẩm & Yêu Cầu Khách', visible: true },
    { id: 'productGroupSelect', label: 'Chọn Nhóm SP Safe Zone & Quét QC', visible: true },
    { id: 'aiCheck', label: 'AI Quét OCR', visible: true },
    { id: 'note', label: 'Ghi Chú', visible: false },
    { id: 'uploadDesign', label: 'File Ảnh Thiết Kế', visible: true },
    { id: 'previewAction', label: 'Nút Preview', visible: true },
    { id: 'status', label: 'Trạng Thái QC', visible: true }
  ]);

  const [copiedTextId, setCopiedTextId] = useState(null);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeGroups = Array.isArray(productGroups) && productGroups.length > 0 ? productGroups : [
    { id: '1', name: 'Stained Glass Suncatcher', tolerancePercent: 1.5, templates: [] }
  ];

  // Filter Logic
  const filteredOrders = safeOrders.filter(order => {
    if (!order) return false;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !term ||
      (order.orderNumber && String(order.orderNumber).toLowerCase().includes(term)) ||
      (order.customerName && String(order.customerName).toLowerCase().includes(term)) ||
      (order.sku && String(order.sku).toLowerCase().includes(term)) ||
      (order.productTitle && String(order.productTitle).toLowerCase().includes(term)) ||
      (order.personalization?.text && String(order.personalization.text).toLowerCase().includes(term));

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
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedTextId(id);
      setTimeout(() => setCopiedTextId(null), 2000);
    }
  };

  return (
    <div className="space-y-3 w-full">
      
      {/* Search & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs text-xs">
        
        {/* Left Filter & Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg text-orange-800 font-extrabold text-xs shrink-0">
            <Database className="w-3.5 h-3.5 text-orange-600" />
            <span>PostgreSQL: {safeOrders.length.toLocaleString()} Đơn Real-time</span>
          </div>

          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm Mã đơn (#4065973514), SKU, Tên, Chữ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Ratio */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <Filter className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-bold">Khung Tỷ Lệ:</span>
            <select
              value={filterRatio}
              onChange={(e) => {
                setFilterRatio(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả tỷ lệ</option>
              <option value="MATCH">✅ Khớp chuẩn (MATCH)</option>
              <option value="MISMATCH">⚠️ Sai tỷ lệ (MISMATCH)</option>
              <option value="NEEDS_CHECK">❓ Chưa kiểm tra</option>
            </select>
          </div>

          {/* Filter QC Status */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold">Trạng thái QC:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Thành công">Thành công</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Lỗi">Lỗi tỷ lệ</option>
              <option value="Chờ kiểm tra">Chờ kiểm tra</option>
            </select>
          </div>

        </div>

        {/* Right Action Tools: Column Customizer & Import CSV */}
        <div className="flex items-center gap-2">
          
          <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95">
            <Upload className="w-3.5 h-3.5 text-orange-600" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0 && onImportCSV) {
                  onImportCSV(Array.from(e.target.files));
                }
              }}
            />
          </label>

          {/* Column Toggle Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5 text-slate-600" />
              <span>Tinh chỉnh Cột</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 space-y-1 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Ẩn / Hiện Cột</span>
                  <button onClick={() => setShowColMenu(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>
                {columns.map(col => (
                  <label key={col.id} className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumnVisibility(col.id)}
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
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
                {isColVisible('uploadDesign') && <th className="p-3 min-w-[125px] text-center whitespace-nowrap">File Ảnh Thiết Kế</th>}
                {isColVisible('previewAction') && <th className="p-3 min-w-[100px] text-center whitespace-nowrap">Preview</th>}
                {isColVisible('status') && <th className="p-3 min-w-[115px] text-center whitespace-nowrap">Trạng Thái QC</th>}

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs font-bold">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-400" />
                    Không có đơn hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  if (!order) return null;

                  const isSelected = selectedOrders.includes(order.id);
                  const rawText = order.personalization?.text || '';
                  
                  // Accurate size recognition from order.personalization.size or rawText
                  const detectedSize = (order.personalization?.size && String(order.personalization.size).trim()) || parseSizeFromText(rawText);
                  const hasExplicitSizeInCustomerText = Boolean(detectedSize && detectedSize.trim() !== '');

                  const cleanNote = formatNoteDisplay(order.note);
                  const { datePart, timePart } = formatDateAndTime(order.orderDate);

                  // Fail-proof group & template retrieval
                  const currentGroupName = order.productGroup || 'Stained Glass Suncatcher';
                  const currentGroupObj = safeGroups.find(g => g && g.name === currentGroupName) || safeGroups[0];
                  const matchedTmpl = getMatchedTemplateForGroup(
                    currentGroupObj, 
                    detectedSize
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
                        <td className="p-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectOrder && onToggleSelectOrder(order.id)}
                            className="rounded border-slate-300 text-orange-500"
                          />
                        </td>
                      )}

                      {/* 2. Ngày & Giờ */}
                      {isColVisible('date') && (
                        <td className="p-3 align-top text-center text-[11px] font-bold text-slate-700 whitespace-nowrap">
                          <div>{datePart}</div>
                          {timePart && <div className="text-[10px] text-slate-400 font-medium pt-0.5">{timePart}</div>}
                        </td>
                      )}

                      {/* 3. ID Đơn hàng & Store */}
                      {isColVisible('orderId') && (
                        <td className="p-3 align-top">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {order.storeName || 'Etsy Shop'}
                            </span>
                            <div className="flex items-center gap-1 font-extrabold text-orange-600 text-xs">
                              <span>{order.orderNumber || `#${order.id}`}</span>
                              <button
                                onClick={() => copyToClipboard(order.orderNumber, order.id)}
                                className="text-slate-400 hover:text-orange-500 transition p-0.5"
                                title="Copy mã đơn"
                              >
                                {copiedTextId === order.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            {order.driveLink && (
                              <a
                                href={order.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10.5px] font-bold text-blue-600 hover:underline flex items-center gap-1 pt-0.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Drive File</span>
                              </a>
                            )}
                          </div>
                        </td>
                      )}

                      {/* 4. Product Title & Personalization */}
                      {isColVisible('product') && (
                        <td className="p-3 align-top">
                          <div className="flex items-start gap-3">
                            <img
                              src={order.mockupThumb || '/_4123920413.png'}
                              alt="Mockup Thumbnail"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0 bg-slate-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/_4123920413.png';
                              }}
                            />
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2" title={order.productTitle}>
                                {order.productTitle || 'Sản phẩm Etsy'}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="font-bold text-slate-600">Qty: <strong>{order.quantity || 1}</strong></span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10.5px] font-bold border border-slate-200">
                                  SKU: {order.sku || '-'}
                                </span>
                              </div>

                              {/* Customer Personalization Text & Highlighted Size */}
                              <div className="space-y-1 pt-0.5">
                                {!hasExplicitSizeInCustomerText && (
                                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>Yêu cầu khách không ghi Size</span>
                                  </div>
                                )}

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

                      {/* 5. Dynamic Product Group Dropdown & Safe Zone Match */}
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
                                {safeGroups.map(group => (
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
                              onClick={() => onOpenAIScanner && onOpenAIScanner(order)}
                              className="w-full py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-600" />
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

                      {/* 8. File Ảnh Thiết Kế & Nút Xóa Ảnh */}
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

                            <div className="flex flex-col gap-1 w-full">
                              <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs whitespace-nowrap">
                                <Upload className="w-3.5 h-3.5 text-orange-600" />
                                <span>{order.hasUploadedDesign ? 'Up Ảnh Khác' : 'Up Ảnh'}</span>
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

                              {/* XÓA ẢNH THIẾT KẾ BUTTON */}
                              {order.hasUploadedDesign && (
                                <button
                                  onClick={() => onDeleteDesign && onDeleteDesign(order)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs whitespace-nowrap"
                                  title="Xóa ảnh thiết kế đã tải lên"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Xóa Ảnh</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* 9. Preview Button */}
                      {isColVisible('previewAction') && (
                        <td className="p-3 align-top text-center">
                          <button
                            onClick={() => onOpenVisualInspector && onOpenVisualInspector(order)}
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
                          ) : order.status === 'Lỗi' || order.ratioStatus === 'MISMATCH' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Lỗi Tỷ Lệ</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                              <span>Chờ kiểm tra</span>
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

        {/* Footer Pagination Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 font-semibold text-slate-600">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 focus:outline-none"
            >
              <option value={10}>10 đơn/trang</option>
              <option value={20}>20 đơn/trang</option>
              <option value={50}>50 đơn/trang</option>
              <option value={100}>100 đơn/trang</option>
            </select>
            <span>trong tổng số <strong>{totalRecords.toLocaleString()}</strong> đơn</span>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-extrabold text-slate-800">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
