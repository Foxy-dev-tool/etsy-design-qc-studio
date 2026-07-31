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
  Zap,
  Trash2
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

// Extract size string strictly from customer personalization text ONLY (No DB size property, title, or note)
export const extractOrderSize = (order) => {
  if (!order) return '';
  const text = typeof order.personalization === 'string'
    ? order.personalization
    : (order.personalization?.text || order.personalizationRaw || '');
  if (!text || typeof text !== 'string') return '';

  // 1. Explicit Size line e.g. "Size: 9,84 inches", "SIZE + STYLE: Sweatshirt | M", "Choose size (inches): 2.36x2.36"
  const lineMatch = text.match(/(?:Khách đặt Size|Select Size|Choose size|Size(?:\s*[\+/&]\s*(?:Style|Color|Type))?\s*(?:\([^)]*\))?|size|Kích thước|Dimensions)\s*[:=]\s*([^\n\r]+)/i);
  if (lineMatch && lineMatch[1] && lineMatch[1].trim()) {
    let cand = lineMatch[1].trim();
    // Normalize decimal commas e.g. "9,84 inches" -> "9.84 inches"
    cand = cand.replace(/(\d+),(\d+)/g, '$1.$2');

    if (!cand.toLowerCase().startsWith('1 layer') && !cand.toLowerCase().startsWith('2 layer')) {
      if (/^\d+(\.\d+)?$/.test(cand)) {
        cand = cand + ' in';
      }
      return cand;
    }
  }

  // 2. Explicit dimension patterns inside customer text e.g. "60" x 50"", "8x8", "9,84 inches", "10 in", "12in-18in"
  const dimMatch = text.match(/\b(\d+(?:[\.,]\d+)?\s*["″]?\s*[x×*]\s*\d+(?:[\.,]\d+)?\s*["″]?|\d+(?:[\.,]\d+)?\s*(?:in|inch|inches|cm)\b)/i);
  if (dimMatch && dimMatch[1] && dimMatch[1].trim()) {
    return dimMatch[1].trim().replace(/(\d+),(\d+)/g, '$1.$2');
  }

  // 3. Clothing Size pattern e.g. "Sweatshirt | M", "Hoodie | L"
  const clothMatch = text.match(/\b(Sweatshirt|Hoodie|T-Shirt|Tshirt|Shirt|Sweater)\s*[|\-/:]?\s*([XSMLXL23456789]+)\b/i);
  if (clothMatch) {
    return `${clothMatch[1]} | ${clothMatch[2].toUpperCase()}`;
  }

  return '';
};

// Clean customer text by removing redundant size lines already shown in the size badge
const cleanPersonalizationText = (rawText) => {
  if (!rawText || !rawText.trim()) return '';
  
  const lines = rawText.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    // Remove lines that state size e.g. "Size (inches): 8", "Size: 6 in"
    if (trimmed.match(/^(?:Khách đặt Size|Select Size|Size(?:\s*[\+/&]\s*(?:Style|Color|Type))?\s*(?:\([^)]*\))?|size|Kích thước|Dimensions)\s*[:=]/i)) {
      return false;
    }
    return true;
  });

  return filtered.join('\n').trim();
};

// Auto-detect matching Product Group from Product Title and SKU
export const autoDetectProductGroup = (title = '', sku = '', productGroups = []) => {
  const combined = (String(title || '') + ' ' + String(sku || '')).toLowerCase();

  // 1. Check for Shirts, Apparel, Bags, Clothes FIRST!
  if (combined.includes('shirt') || combined.includes('sweatshirt') || combined.includes('hoodie') || combined.includes('apparel') || combined.includes('clothing') || combined.includes('sweater') || combined.includes('t-shirt') || combined.includes('tshirt') || combined.includes('bag') || combined.includes('tote')) {
    const foundOther = productGroups.find(g => g && (g.name.includes('Sản phẩm khác') || g.name.includes('Apparel') || g.name.includes('Bags') || g.name.includes('Không Safe Zone')));
    if (foundOther) return foundOther.name;
  }

  // 2. Check for Wooden
  if (combined.includes('wooden') || combined.includes('wood') || combined.includes('plaque') || combined.includes('stat sign') || combined.includes('ted01')) {
    const found = productGroups.find(g => g && g.name.toLowerCase().includes('wooden'));
    if (found) return found.name;
  }
  if (combined.includes('arylic') || (combined.includes('acrylic') && combined.includes('suncatcher'))) {
    const found = productGroups.find(g => g && (g.name.toLowerCase().includes('arylic') || g.name.toLowerCase().includes('acrylic')));
    if (found) return found.name;
  }
  if (combined.includes('suncatcher') || combined.includes('stained glass')) {
    const found = productGroups.find(g => g && g.name.toLowerCase().includes('stained glass'));
    if (found) return found.name;
  }
  if (combined.includes('desk mat') || combined.includes('mousepad')) {
    const found = productGroups.find(g => g && g.name.toLowerCase().includes('desk mat'));
    if (found) return found.name;
  }
  if (combined.includes('graduation') || combined.includes('cap')) {
    const found = productGroups.find(g => g && g.name.toLowerCase().includes('graduation'));
    if (found) return found.name;
  }

  return productGroups[0]?.name || 'Stained Glass Suncatcher';
};

// Strict Size vs Product Group Compatibility Checker
export const checkSizeMatchStatus = (group, orderSizeText = '') => {
  if (!group || !Array.isArray(group.templates) || group.templates.length === 0) {
    return { isMatched: true, template: null };
  }

  // If group is No Safe Zone / Free-Form / Apparel / Bags, any size is allowed
  if (group.name.includes('Không Safe Zone') || group.name.includes('Sản phẩm khác') || group.isFreeForm) {
    return { isMatched: true, template: group.templates[0], isFreeForm: true };
  }

  if (!orderSizeText || !orderSizeText.trim()) {
    return { isMatched: true, template: group.templates[0], isDefault: true };
  }

  const searchText = orderSizeText.toLowerCase().replace(',', '.');

  // Try exact size match first
  for (const tmpl of group.templates) {
    const tmplSize = tmpl.sizeLabel.toLowerCase().replace(',', '.');
    const tmplNums = tmplSize.match(/\d+(?:\.\d+)?/g) || [];
    const searchNums = searchText.match(/\d+(?:\.\d+)?/g) || [];

    if (searchText.includes(tmplSize)) {
      return { isMatched: true, template: tmpl };
    }

    if (tmplNums.length > 0 && searchNums.length > 0 && tmplNums.every(n => searchNums.includes(n))) {
      return { isMatched: true, template: tmpl };
    }
  }

  // Group specific matching
  if (group.name === 'Stained Glass Suncatcher') {
    if (searchText.includes('9.84')) return { isMatched: true, template: group.templates[3] };
    if (searchText.includes('7.87')) return { isMatched: true, template: group.templates[2] };
    if (searchText.includes('5.9')) return { isMatched: true, template: group.templates[1] };
    if (searchText.includes('3.94')) return { isMatched: true, template: group.templates[0] };
  } else if (group.name === 'Arylic Suncatcher') {
    if (searchText.includes('12')) return { isMatched: true, template: group.templates[1] };
    if (searchText.includes('3.54')) return { isMatched: true, template: group.templates[0] };
  } else if (group.name === 'Graduation Cap') {
    if (searchText.includes('9.5')) return { isMatched: true, template: group.templates[1] };
    if (searchText.includes('7.5')) return { isMatched: true, template: group.templates[0] };
  } else if (group.name === 'Desk Mat') {
    if (searchText.includes('90x40') || searchText.includes('90*40')) return { isMatched: true, template: group.templates[6] };
    if (searchText.includes('80x30') || searchText.includes('80*30')) return { isMatched: true, template: group.templates[5] };
    if (searchText.includes('70x35') || searchText.includes('70*35')) return { isMatched: true, template: group.templates[4] };
    if (searchText.includes('60x30') || searchText.includes('60*30')) return { isMatched: true, template: group.templates[3] };
    if (searchText.includes('45x40') || searchText.includes('45*40')) return { isMatched: true, template: group.templates[2] };
    if (searchText.includes('30x25') || searchText.includes('30*25')) return { isMatched: true, template: group.templates[1] };
    if (searchText.includes('18x22') || searchText.includes('18*22')) return { isMatched: true, template: group.templates[0] };
  }

  // IF NO TEMPLATE MATCHED (e.g. orderSizeText is "Sweatshirt | M" but group is "Stained Glass Suncatcher")
  return {
    isMatched: false,
    template: group.templates[0],
    errorReason: `Kích thước "${orderSizeText}" không thuộc nhóm "${group.name}".`
  };
};

// Safe Zone template matcher by size text or closest aspect ratio
export const getMatchedTemplateForGroup = (group, orderSizeText = '') => {
  const result = checkSizeMatchStatus(group, orderSizeText);
  return result.template || (group && group.templates ? group.templates[0] : null);
};

export default function OrderListTable({
  orders = [],
  productGroups = [],
  onOpenVisualInspector,
  onOpenAIScanner,
  onUploadDesign,
  onDeleteDesign,
  onRunQCScan,
  selectedOrders = [],
  onToggleSelectAll,
  onToggleSelectOrder,
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
        
        {/* Left Filter & Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm Mã đơn (#4065973514), SKU, Tên, Chữ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
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

        {/* Right Action Tools: Column Customizer */}
        <div className="flex items-center gap-2">
          
          {/* Column Toggle Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5 text-slate-600" />
              <span>Tinh chỉnh Cột</span>
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 space-y-1 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Ẩn / Hiện Cột</span>
                  <button onClick={() => setShowColumnPicker(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
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
                  const rawText = typeof order.personalization === 'string'
                    ? order.personalization
                    : (order.personalization?.text || order.personalizationRaw || '');
                  const detectedSize = extractOrderSize(order);
                  const cleanNote = formatNoteDisplay(order.note);

                  const orderSizeText = detectedSize || (typeof order.personalization === 'object' ? order.personalization?.size : '') || order.targetSizeLabel || '';

                  // Fail-proof group & template retrieval
                  const currentGroupName = order.productGroup || autoDetectProductGroup(order.productTitle, order.sku, productGroups);
                  const currentGroupObj = productGroups.find(g => g && g.name === currentGroupName) || productGroups[0];
                  const sizeMatch = checkSizeMatchStatus(currentGroupObj, orderSizeText);
                  const matchedTmpl = sizeMatch.template || getMatchedTemplateForGroup(currentGroupObj, orderSizeText);

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
                          <div>{order.orderDate || '-'}</div>
                        </td>
                      )}

                      {/* 3. ID Đơn hàng */}
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
                                {copiedTextId === order.id ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
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
                            <div className="space-y-2 flex-1 min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2" title={order.productTitle}>
                                {order.productTitle || 'Sản phẩm Etsy'}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="font-bold text-slate-600">Qty: <strong>{order.quantity || 1}</strong></span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10.5px] font-bold border border-slate-200">
                                  SKU: {order.sku || '-'}
                                </span>
                              </div>

                              {/* Exact Size Badge & Copy Text Button Line */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {detectedSize ? (
                                  <div className="px-3 py-1 rounded-xl bg-amber-50 text-amber-950 border border-amber-300/90 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-2xs">
                                    <span className="font-extrabold text-amber-950">Khách đặt Size:</span>
                                    <span className="text-amber-900 font-black">{detectedSize}</span>
                                  </div>
                                ) : (
                                  <div className="px-3 py-1 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 text-xs italic font-medium inline-flex items-center gap-1 shadow-2xs">
                                    <span>(Yêu cầu khách không ghi Size)</span>
                                  </div>
                                )}

                                {rawText && (
                                  <button
                                    onClick={() => copyToClipboard(rawText, `pers-${order.id}`)}
                                    className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-2xs"
                                    title="Sao chép toàn bộ Yêu cầu khách"
                                  >
                                    {copiedTextId === `pers-${order.id}` ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700">Đã Copy</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                                        <span>Copy Text</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Customer Personalization Text Box (100% RAW FROM DATABASE) */}
                              {rawText && (
                                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-slate-900 font-sans text-xs font-semibold whitespace-pre-wrap leading-relaxed shadow-2xs break-words tracking-normal">
                                  {rawText}
                                </div>
                              )}

                            </div>
                          </div>
                        </td>
                      )}

                      {/* 5. Dynamic Product Group Dropdown */}
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
                            {!sizeMatch.isMatched ? (
                              <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[10.5px] space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between font-extrabold text-rose-700">
                                  <span>⚠️ SAI NHÓM SP / KHÔNG CÓ SIZE:</span>
                                </div>
                                <div className="text-[9.5px] text-rose-700 font-bold leading-tight pt-0.5">
                                  Size "{orderSizeText}" không thuộc các mẫu Safe Zone của nhóm {currentGroupName}.
                                </div>
                                <div className="text-[9.5px] text-rose-600 font-medium pt-0.5">
                                  👉 Vui lòng chọn lại Nhóm "Sản phẩm khác (Bags, Apparel)".
                                </div>
                              </div>
                            ) : currentGroupName.includes('Không Safe Zone') || currentGroupName.includes('Sản phẩm khác') ? (
                              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[10.5px] space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-blue-700">ℹ️ Phôi tự do (Áo / Bags):</span>
                                  <span className="font-extrabold text-blue-900">Không Safe Zone</span>
                                </div>
                                <div className="text-[9.5px] text-blue-600 flex items-center justify-between">
                                  <span>Kích thước:</span>
                                  <span className="font-bold text-blue-800">Tự do / Freesize</span>
                                </div>
                              </div>
                            ) : matchedTmpl && (
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

                            {order.hasUploadedDesign && onDeleteDesign && (
                              <button
                                onClick={() => onDeleteDesign(order)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs whitespace-nowrap mt-1"
                                title="Xóa ảnh thiết kế đã tải lên"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Xóa Ảnh</span>
                              </button>
                            )}

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
                          {!sizeMatch.isMatched && (order.hasUploadedDesign || order.designImage) ? (
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs" title={`Size "${orderSizeText}" không thuộc nhóm ${currentGroupName}`}>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Lỗi QC</span>
                            </span>
                          ) : order.status === 'Thành công' || order.status === 'Hoàn thành' ? (
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
