import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OrderListTable, { autoDetectProductGroup, getMatchedTemplateForGroup, checkSizeMatchStatus } from './components/OrderListTable';
import VisualInspectorModal from './components/VisualInspectorModal';
import ProductGroupConfig from './components/ProductGroupConfig';
import AIScannerModal from './components/AIScannerModal';

import { INITIAL_PRODUCT_GROUPS } from './services/mockData';
import { getImageDimensions, validateAspectRatio, runAIScanSimulated } from './services/imageAnalyzer';
import { 
  fetchOrdersFromPostgres, 
  updateOrderInPostgres 
} from './services/postgresClient';
import { uploadImageToBizfly, deleteImageFromBizfly } from './services/bizflyStorage';
import { Check, Loader2, Database, RefreshCw } from 'lucide-react';

// Helper to convert File to Base64 Data URL
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Helper to compress image for lightweight storage & instant DB sync (~50KB)
const compressImageForStorage = (dataUrl, maxDim = 800, quality = 0.85) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'config'
  const [orders, setOrders] = useState([]); // Real PostgreSQL orders array
  const [productGroups, setProductGroups] = useState(INITIAL_PRODUCT_GROUPS);
  
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [totalInDbCount, setTotalInDbCount] = useState(11553);

  // Active Modals state
  const [inspectorOrder, setInspectorOrder] = useState(null);
  const [aiScannerOrder, setAiScannerOrder] = useState(null);
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [isSyncingEtsy, setIsSyncingEtsy] = useState(false);
  const [csvNotifyMsg, setCsvNotifyMsg] = useState('');
  const [isPostgresConnected, setIsPostgresConnected] = useState(false);

  // Load real-time orders strictly from PostgreSQL Database (Single Source of Truth)
  const loadLivePostgresOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const dbOrders = await fetchOrdersFromPostgres();
      if (dbOrders && Array.isArray(dbOrders) && dbOrders.length > 0) {
        setOrders(dbOrders);
        setTotalInDbCount(dbOrders.length);
        setIsPostgresConnected(true);
      }
    } catch (err) {
      console.error('Error loading PostgreSQL orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Initial fetch ONCE on mount (Clean up all legacy localStorage cache)
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('qc_design_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
    loadLivePostgresOrders();
  }, []);

  // Sync Etsy API simulation
  const handleSyncEtsy = () => {
    setIsSyncingEtsy(true);
    loadLivePostgresOrders();
    setTimeout(() => {
      setIsSyncingEtsy(false);
      setCsvNotifyMsg('⚡ Đã làm mới và đồng bộ dữ liệu Real-time từ PostgreSQL database!');
      setTimeout(() => setCsvNotifyMsg(''), 4000);
    }, 1000);
  };

  // Standalone Run Tools handler
  const handleRunToolScript = () => {
    setCsvNotifyMsg('🚀 Đang làm mới dữ liệu Real-time từ Database 103.75.184.164...');
    loadLivePostgresOrders();
    setTimeout(() => {
      setCsvNotifyMsg(`✅ Cập nhật thành công ${orders.length.toLocaleString()} đơn hàng từ PostgreSQL!`);
      setTimeout(() => setCsvNotifyMsg(''), 4000);
    }, 800);
  };

  // Product Group change handler for order
  const handleGroupChange = (orderId, newGroupName) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          productGroup: newGroupName
        };
      }
      return ord;
    }));

    // Sync to PostgreSQL DB
    updateOrderInPostgres(orderId, { productGroup: newGroupName });
  };

  // FAIL-PROOF INSTANT IMAGE UPLOAD PIPELINE
  const handleUploadDesign = async (targetOrder, imageFile) => {
    try {
      const localDataUrl = await readFileAsDataURL(imageFile);
      const dimensions = await getImageDimensions(localDataUrl);

      const group = productGroups.find(g => g.name === targetOrder.productGroup) || productGroups[0];
      const orderSizeText = targetOrder.personalization?.size || targetOrder.targetSizeLabel || targetOrder.personalizationRaw || '';
      const sizeMatch = checkSizeMatchStatus(group, orderSizeText);
      const matchedTmpl = sizeMatch.template || getMatchedTemplateForGroup(group, orderSizeText);

      const ratioCheck = validateAspectRatio(
        dimensions.width,
        dimensions.height,
        matchedTmpl.widthPx,
        matchedTmpl.heightPx,
        group.tolerancePercent
      );

      if (!sizeMatch.isMatched) {
        ratioCheck.isValid = false;
        ratioCheck.message = sizeMatch.errorReason;
      }

      const newStatus = ratioCheck.isValid ? 'Thành công' : 'Lỗi';

      let finalImageUrl = '';
      let isBizflySuccess = false;

      // Compress image to clean HD JPEG (~100KB) for fast network upload to Bizfly Cloud
      const compressedForUpload = await compressImageForStorage(localDataUrl, 1200, 0.88);

      try {
        setCsvNotifyMsg(`⚡ Đang tải ảnh lên Bizfly Cloud Storage...`);
        finalImageUrl = await uploadImageToBizfly(compressedForUpload, targetOrder.id || targetOrder.orderNumber);
        isBizflySuccess = true;
      } catch (bizflyErr) {
        console.warn('Bizfly upload error, applying PostgreSQL direct fallback:', bizflyErr);
        finalImageUrl = compressedForUpload;
      }

      const updates = {
        productGroup: group.name,
        hasUploadedDesign: true,
        uploadedDesignFile: imageFile.name,
        designImage: finalImageUrl,
        designWidth: dimensions.width,
        designHeight: dimensions.height,
        designAspectRatio: dimensions.aspectRatio,
        ratioStatus: ratioCheck.isValid ? 'MATCH' : 'MISMATCH',
        status: newStatus
      };

      // 1. Update UI State INSTANTLY!
      setOrders(prev => prev.map(ord => {
        if (ord.id === targetOrder.id) {
          return {
            ...ord,
            ...updates
          };
        }
        return ord;
      }));

      if (inspectorOrder && inspectorOrder.id === targetOrder.id) {
        setInspectorOrder(prev => ({
          ...prev,
          ...updates
        }));
      }

      if (isBizflySuccess) {
        setCsvNotifyMsg(`✅ Upload ảnh lên Bizfly Cloud thành công! Kích thước gốc: ${dimensions.width}×${dimensions.height}px.`);
      } else {
        setCsvNotifyMsg(`⚠️ Bizfly chặn CORS trình duyệt -> Hệ thống đã tự động lưu ảnh an toàn vào PostgreSQL Database! (Vui lòng cấu hình CORS trên Bizfly).`);
      }
      setTimeout(() => setCsvNotifyMsg(''), 6000);

      // 2. Sync URL or Fallback Image to PostgreSQL Database
      updateOrderInPostgres(targetOrder.id, updates);

    } catch (err) {
      console.error('Lỗi khi xử lý ảnh upload:', err);
      setCsvNotifyMsg(`❌ Lỗi khi đọc ảnh: ${err.message || 'File không hợp lệ'}`);
      setTimeout(() => setCsvNotifyMsg(''), 4000);
    }
  };

  // DELETE UPLOADED DESIGN IMAGE PIPELINE
  const handleDeleteDesign = (targetOrder) => {
    if (targetOrder.designImage && targetOrder.designImage.includes('bfcplatform.vn')) {
      deleteImageFromBizfly(targetOrder.designImage).catch(err => console.warn('Lỗi xóa trên Bizfly:', err));
    }

    const updates = {
      productGroup: targetOrder.productGroup,
      hasUploadedDesign: false,
      uploadedDesignFile: null,
      designImage: null,
      designWidth: null,
      designHeight: null,
      designAspectRatio: null,
      ratioStatus: 'NEEDS_CHECK',
      aiStatus: 'NEEDS_SCAN',
      aiScore: null,
      status: 'Chờ kiểm tra'
    };

    // 1. Update UI State INSTANTLY!
    setOrders(prev => prev.map(ord => {
      if (ord.id === targetOrder.id) {
        return {
          ...ord,
          ...updates
        };
      }
      return ord;
    }));

    if (inspectorOrder && inspectorOrder.id === targetOrder.id) {
      setInspectorOrder(prev => ({
        ...prev,
        ...updates
      }));
    }

    setCsvNotifyMsg(`🗑️ Đã xóa ảnh thiết kế của đơn ${targetOrder.orderNumber}! Trạng thái được chuyển về "Chờ kiểm tra".`);
    setTimeout(() => setCsvNotifyMsg(''), 4000);

    // 2. Sync to PostgreSQL Database
    updateOrderInPostgres(targetOrder.id, updates);
  };

  // Manual QC Scan button click handler for row
  const handleRunQCScan = async (targetOrder, groupObj, matchedTmpl) => {
    if (!targetOrder.designImage && !targetOrder.mockupThumb) {
      setCsvNotifyMsg('⚠️ Vui lòng nhấp "Up Ảnh" để tải ảnh thiết kế lên trước khi Quét QC!');
      setTimeout(() => setCsvNotifyMsg(''), 4000);
      return;
    }

    try {
      const imgUrl = targetOrder.designImage || targetOrder.mockupThumb;
      const dimensions = await getImageDimensions(imgUrl);

      const orderSizeText = targetOrder.personalization?.size || targetOrder.targetSizeLabel || targetOrder.personalizationRaw || '';
      const sizeMatch = checkSizeMatchStatus(groupObj, orderSizeText);

      const ratioCheck = validateAspectRatio(
        dimensions.width,
        dimensions.height,
        matchedTmpl ? matchedTmpl.widthPx : 3012,
        matchedTmpl ? matchedTmpl.heightPx : 3012,
        groupObj ? groupObj.tolerancePercent : 1.5
      );

      if (!sizeMatch.isMatched) {
        ratioCheck.isValid = false;
        ratioCheck.message = sizeMatch.errorReason;
      }

      const newStatus = ratioCheck.isValid ? 'Thành công' : 'Lỗi';

      const updates = {
        productGroup: groupObj ? groupObj.name : targetOrder.productGroup,
        designWidth: dimensions.width,
        designHeight: dimensions.height,
        designAspectRatio: dimensions.aspectRatio,
        ratioStatus: ratioCheck.isValid ? 'MATCH' : 'MISMATCH',
        status: newStatus
      };

      setOrders(prev => prev.map(ord => {
        if (ord.id === targetOrder.id) {
          return {
            ...ord,
            ...updates
          };
        }
        return ord;
      }));

      // Sync to PostgreSQL DB
      updateOrderInPostgres(targetOrder.id, updates);

      setCsvNotifyMsg(`⚡ Quét QC hoàn tất cho đơn ${targetOrder.orderNumber}! Trạng thái: ${newStatus}`);
      setTimeout(() => setCsvNotifyMsg(''), 4000);

    } catch (err) {
      console.error('Lỗi khi quét QC:', err);
    }
  };


  // Run AI Vision & OCR Scan on order
  const handleRunAIScan = async (targetOrder, customPrompt = '') => {
    setIsScanningAI(true);
    try {
      const scanResult = await runAIScanSimulated(targetOrder, targetOrder.designImage || targetOrder.mockupThumb, customPrompt);
      
      const newStatus = (scanResult.status === 'MATCH' && targetOrder.ratioStatus === 'MATCH') ? 'Thành công' : 'Lỗi';

      const updates = {
        aiStatus: scanResult.status,
        aiScore: scanResult.confidence,
        aiReport: scanResult,
        status: newStatus
      };

      setOrders(prev => prev.map(ord => {
        if (ord.id === targetOrder.id) {
          return {
            ...ord,
            ...updates
          };
        }
        return ord;
      }));

      if (aiScannerOrder && aiScannerOrder.id === targetOrder.id) {
        setAiScannerOrder(prev => ({
          ...prev,
          ...updates
        }));
      }

      // Sync to PostgreSQL DB
      updateOrderInPostgres(targetOrder.id, updates);

    } finally {
      setIsScanningAI(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const handleToggleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(oId => oId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleSaveGroup = (updatedGroup) => {
    setProductGroups(prev => {
      const exists = prev.some(g => g.id === updatedGroup.id);
      if (exists) {
        return prev.map(g => g.id === updatedGroup.id ? updatedGroup : g);
      }
      return [...prev, updatedGroup];
    });
  };

  const handleDeleteGroup = (groupId) => {
    setProductGroups(prev => prev.filter(g => g.id !== groupId));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orders={orders}
        onSyncEtsy={handleSyncEtsy}
        isSyncing={isSyncingEtsy}
        onRunToolScript={handleRunToolScript}
        isPostgresConnected={isPostgresConnected}
      />

      {/* Loading Bar when fetching initial DB orders */}
      {isLoadingOrders && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>⚡ Đang nạp dữ liệu thực tế từ PostgreSQL Database... (Đã tải {orders.length.toLocaleString()} / {totalInDbCount.toLocaleString()} đơn hàng)</span>
        </div>
      )}

      {/* CSV / Tools / PostgreSQL Toast Alert */}
      {csvNotifyMsg && (
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8 pt-2">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{csvNotifyMsg}</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* TAB 1: ORDER LIST & QC MANAGEMENT */}
        {activeTab === 'orders' && (
          <OrderListTable
            orders={orders}
            productGroups={productGroups}
            onOpenVisualInspector={(ord) => setInspectorOrder(ord)}
            onOpenAIScanner={(ord) => setAiScannerOrder(ord)}
            onUploadDesign={handleUploadDesign}
            onDeleteDesign={handleDeleteDesign}
            onRunQCScan={handleRunQCScan}
            onGroupChange={handleGroupChange}
            selectedOrders={selectedOrders}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectOrder={handleToggleSelectOrder}
          />
        )}

        {/* TAB 2: PRODUCT GROUP & TEMPLATE CONFIGURATOR */}
        {activeTab === 'config' && (
          <ProductGroupConfig
            productGroups={productGroups}
            onSaveGroup={handleSaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

      </main>

      {/* Modals */}
      {inspectorOrder && (
        <VisualInspectorModal
          order={inspectorOrder}
          productGroup={productGroups.find(g => g.name === inspectorOrder.productGroup) || productGroups[0]}
          onClose={() => setInspectorOrder(null)}
          onUploadDesign={handleUploadDesign}
          onDeleteDesign={handleDeleteDesign}
          onRunAIScan={(ord) => {
            setInspectorOrder(null);
            setAiScannerOrder(ord);
          }}
        />
      )}

      {aiScannerOrder && (
        <AIScannerModal
          order={aiScannerOrder}
          onClose={() => setAiScannerOrder(null)}
          onRunAIScan={handleRunAIScan}
          isScanning={isScanningAI}
        />
      )}
    </div>
  );
}
