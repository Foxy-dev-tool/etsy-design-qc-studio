import realOrdersData from '../data/realOrders.json';

// REAL SAFE ZONE PRODUCT GROUPS & TEMPLATES DATA (Extracted from 8 Safe Zone Folders)
export const INITIAL_PRODUCT_GROUPS = [
  {
    id: 'pg-stained-glass',
    name: 'Stained Glass Suncatcher',
    description: 'Nhóm sản phẩm Tranh Kính In Màu Suncatcher (4 Sizes tiêu chuẩn)',
    baseMockup: '/Stained Glass Suncatcher/- 9.84in copy.png',
    tolerancePercent: 1.5,
    minDpi: 300,
    aiRulesPrompt: 'Đối chiếu các chi tiết chữ cá nhân hóa và viền lọt lề 1.5%.',
    templates: [
      {
        sizeLabel: '3.94 inches',
        widthPx: 1240,
        heightPx: 1240,
        aspectRatio: 1.0,
        dpi: 314,
        templateImage: '/Stained Glass Suncatcher/- 3,94in copy.png',
        safeMarginPx: 40
      },
      {
        sizeLabel: '5.9 inches',
        widthPx: 1831,
        heightPx: 1831,
        aspectRatio: 1.0,
        dpi: 310,
        templateImage: '/Stained Glass Suncatcher/- 5.9in copy.png',
        safeMarginPx: 50
      },
      {
        sizeLabel: '7.87 inches',
        widthPx: 2421,
        heightPx: 2421,
        aspectRatio: 1.0,
        dpi: 307,
        templateImage: '/Stained Glass Suncatcher/- 7.87in copy.png',
        safeMarginPx: 60
      },
      {
        sizeLabel: '9.84 inches',
        widthPx: 3012,
        heightPx: 3012,
        aspectRatio: 1.0,
        dpi: 306,
        templateImage: '/Stained Glass Suncatcher/- 9.84in copy.png',
        safeMarginPx: 75
      }
    ]
  },
  {
    id: 'pg-acrylic-suncatcher',
    name: 'Arylic Suncatcher',
    description: 'Nhóm sản phẩm Acrylic Suncatcher Ornament 1 Layer',
    baseMockup: '/Arylic Suncatcher/Template_1 Layer Suncatcher Ornament_12in copy.png',
    tolerancePercent: 2.0,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra tỷ lệ 1:2 dọc và Safe Zone cắt viền Acrylic.',
    templates: [
      {
        sizeLabel: '3.54 inches',
        widthPx: 1181,
        heightPx: 2362,
        aspectRatio: 0.5,
        dpi: 333,
        templateImage: '/Arylic Suncatcher/Template_1 Layer Suncatcher Ornament_3.54in copy.png',
        safeMarginPx: 40
      },
      {
        sizeLabel: '12 inches',
        widthPx: 3718,
        heightPx: 7436,
        aspectRatio: 0.5,
        dpi: 310,
        templateImage: '/Arylic Suncatcher/Template_1 Layer Suncatcher Ornament_12in copy.png',
        safeMarginPx: 100
      }
    ]
  },
  {
    id: 'pg-graduation-cap',
    name: 'Graduation Cap',
    description: 'Nhóm Mũ Nón Cử Nhân (Graduation Cap Topper 7.5" & 9.5")',
    baseMockup: '/Graduation Cap/Template_Graduation Cap Topper_9.5in copy.png',
    tolerancePercent: 1.5,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra khớp lỗ nút nón ở chính giữa 3200px hoặc 4048px.',
    templates: [
      {
        sizeLabel: '7.5 inches',
        widthPx: 3200,
        heightPx: 3200,
        aspectRatio: 1.0,
        dpi: 426,
        templateImage: '/Graduation Cap/Template_Graduation Cap Topper_7.5in copy.png',
        safeMarginPx: 80
      },
      {
        sizeLabel: '9.5 inches',
        widthPx: 4048,
        heightPx: 4048,
        aspectRatio: 1.0,
        dpi: 426,
        templateImage: '/Graduation Cap/Template_Graduation Cap Topper_9.5in copy.png',
        safeMarginPx: 100
      }
    ]
  },
  {
    id: 'pg-desk-mat',
    name: 'Desk Mat',
    description: 'Nhóm Thảm Bàn Làm Việc Desk Mat (7 Kích thước tiêu chuẩn)',
    baseMockup: '/Desk Mat/Template_Desk Mat_90X40cm copy.png',
    tolerancePercent: 2.0,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra tỷ lệ tràn viền may bo góc thảm Desk Mat.',
    templates: [
      {
        sizeLabel: '18X22cm',
        widthPx: 1081,
        heightPx: 1317,
        aspectRatio: 0.821,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_18X22cm copy.png',
        safeMarginPx: 40
      },
      {
        sizeLabel: '30X25cm',
        widthPx: 1831,
        heightPx: 1535,
        aspectRatio: 1.193,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_30X25cm copy.png',
        safeMarginPx: 50
      },
      {
        sizeLabel: '45x40cm',
        widthPx: 2717,
        heightPx: 2421,
        aspectRatio: 1.122,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_45x40cm copy.png',
        safeMarginPx: 60
      },
      {
        sizeLabel: '60X30cm',
        widthPx: 3602,
        heightPx: 1831,
        aspectRatio: 1.967,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_60X30cm copy.png',
        safeMarginPx: 80
      },
      {
        sizeLabel: '70X35cm',
        widthPx: 4193,
        heightPx: 2126,
        aspectRatio: 1.972,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_70X35cm copy.png',
        safeMarginPx: 90
      },
      {
        sizeLabel: '80X30cm',
        widthPx: 4843,
        heightPx: 1890,
        aspectRatio: 2.562,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_80X30cm copy.png',
        safeMarginPx: 100
      },
      {
        sizeLabel: '90X40cm',
        widthPx: 5374,
        heightPx: 2421,
        aspectRatio: 2.22,
        dpi: 300,
        templateImage: '/Desk Mat/Template_Desk Mat_90X40cm copy.png',
        safeMarginPx: 120
      }
    ]
  },
  {
    id: 'pg-stole',
    name: 'Stole',
    description: 'Nhóm Khăn Quàng Cử Nhân Stole (Adult & Kid Size)',
    baseMockup: '/Stole/Adult.png',
    tolerancePercent: 2.0,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra hai bên vạt khăn quàng cử nhân.',
    templates: [
      {
        sizeLabel: 'Adult',
        widthPx: 2430,
        heightPx: 3668,
        aspectRatio: 0.662,
        dpi: 300,
        templateImage: '/Stole/Adult.png',
        safeMarginPx: 60
      },
      {
        sizeLabel: 'Kid',
        widthPx: 2430,
        heightPx: 3300,
        aspectRatio: 0.736,
        dpi: 300,
        templateImage: '/Stole/KID.png',
        safeMarginPx: 60
      }
    ]
  },
  {
    id: 'pg-1-layer-wooden',
    name: '1 layer wooden',
    description: 'Nhóm Biển Gỗ Custom Shape 1 Lớp (12in - 24in)',
    baseMockup: '/1 layer wooden/file hoàn thiện.png',
    tolerancePercent: 1.5,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra viền cắt định hình biển gỗ 1 lớp.',
    templates: [
      {
        sizeLabel: '12in-18in',
        widthPx: 4200,
        heightPx: 4200,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/1 layer wooden/Temp Custom shape wooden sign copy.png',
        safeMarginPx: 60
      },
      {
        sizeLabel: '20in-24in',
        widthPx: 6000,
        heightPx: 6000,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/1 layer wooden/Temp_Custom shape wooden sign_20in and 24in copy.png',
        safeMarginPx: 90
      }
    ]
  },
  {
    id: 'pg-2-layer-wooden-4',
    name: '2 layer Wooden 4',
    description: 'Nhóm Tranh Gỗ Dán Nổi 2 Lớp Vuông (6in - 30in)',
    baseMockup: '/2 layer Wooden 4/file hoàn thiện.png',
    tolerancePercent: 1.5,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra khớp Safe Zone tranh gỗ dán nổi 2 lớp hình vuông.',
    templates: [
      {
        sizeLabel: '6in-12in',
        widthPx: 4920,
        heightPx: 4920,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/2 layer Wooden 4/Template_6in_8in-10in-12in_Custom 2 Layered Wooden Art Piece copy.png',
        safeMarginPx: 80
      },
      {
        sizeLabel: '14in-18in',
        widthPx: 8520,
        heightPx: 8520,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/2 layer Wooden 4/Template_14in-16in-18in_Custom 2 Layered Wooden Art Piece copy.png',
        safeMarginPx: 120
      },
      {
        sizeLabel: '20in-24in',
        widthPx: 12120,
        heightPx: 12120,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/2 layer Wooden 4/Template_20in-22in-24in_Custom 2 Layered Wooden Art Piece copy.png',
        safeMarginPx: 160
      },
      {
        sizeLabel: '26in-30in',
        widthPx: 15720,
        heightPx: 15720,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/2 layer Wooden 4/Template_26in-28in-30in_Custom 2 Layered Wooden Art Piece copy.png',
        safeMarginPx: 200
      }
    ]
  },
  {
    id: 'pg-2-layer-wooden-2',
    name: '2 layer Wooden 2',
    description: 'Nhóm Tranh Gỗ Dán Nổi 2 Lớp Dọc 1:2 (6in - 24in)',
    baseMockup: '/2 layer Wooden 2/file hoàn thiện.png',
    tolerancePercent: 2.0,
    minDpi: 300,
    aiRulesPrompt: 'Kiểm tra tranh gỗ 2 lớp ghép dọc tỷ lệ 1:2.',
    templates: [
      {
        sizeLabel: '6in',
        widthPx: 1918,
        heightPx: 3836,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_6in copy.png',
        safeMarginPx: 40
      },
      {
        sizeLabel: '8in',
        widthPx: 2518,
        heightPx: 5036,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_8in copy.png',
        safeMarginPx: 50
      },
      {
        sizeLabel: '10in',
        widthPx: 3118,
        heightPx: 6236,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_10in copy.png',
        safeMarginPx: 60
      },
      {
        sizeLabel: '12in',
        widthPx: 3718,
        heightPx: 7436,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_12in copy.png',
        safeMarginPx: 70
      },
      {
        sizeLabel: '14in',
        widthPx: 4318,
        heightPx: 8636,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_14in copy.png',
        safeMarginPx: 80
      },
      {
        sizeLabel: '16in',
        widthPx: 4918,
        heightPx: 9836,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_16in copy.png',
        safeMarginPx: 90
      },
      {
        sizeLabel: '18in',
        widthPx: 5518,
        heightPx: 11036,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_18in copy.png',
        safeMarginPx: 100
      },
      {
        sizeLabel: '20in',
        widthPx: 6118,
        heightPx: 12236,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_20in copy.png',
        safeMarginPx: 110
      },
      {
        sizeLabel: '24in',
        widthPx: 7318,
        heightPx: 14636,
        aspectRatio: 0.5,
        dpi: 300,
        templateImage: '/2 layer Wooden 2/Template Custom_2 layed art piece_png_24in copy.png',
        safeMarginPx: 130
      }
    ]
  },
  {
    id: 'pg-other-no-safezone',
    name: 'Sản phẩm khác (Bags, Apparel, v.v. - Không Safe Zone)',
    description: 'Dành cho túi canvas, nón, áo, giỏ quà không có mẫu Safe Zone cố định',
    baseMockup: '/_4123920413.png',
    tolerancePercent: 5.0,
    minDpi: 300,
    aiRulesPrompt: 'Sản phẩm không có khung Safe Zone chuẩn. QC đối chiếu ảnh thiết kế thủ công.',
    templates: [
      {
        sizeLabel: 'Tự do / Phôi mở',
        widthPx: 3012,
        heightPx: 3012,
        aspectRatio: 1.0,
        dpi: 300,
        templateImage: '/_4123920413.png',
        safeMarginPx: 0,
        isNoSafeZoneGroup: true
      }
    ]
  }
];

// EXCLUSIVELY REAL ORDERS FROM CSV
export const INITIAL_ORDERS = realOrdersData;

// Available Columns Config with 8 Safe Zone Product Groups
export const DEFAULT_COLUMNS = [
  { id: 'select', label: '', visible: true, width: '3%' },
  { id: 'date', label: 'Ngày & Giờ', visible: true, width: '7%' },
  { id: 'orderId', label: 'ID đơn hàng', visible: true, width: '9%' },
  { id: 'product', label: 'Sản phẩm & Yêu Cầu Khách (Personalization)', visible: true, width: '36%' },
  { id: 'productGroupSelect', label: 'Chọn Nhóm SP Đổ Safe Zone & Quét QC', visible: true, width: '15%' },
  { id: 'aiCheck', label: 'AI Quét OCR', visible: true, width: '8%' },
  { id: 'note', label: 'Ghi chú', visible: false, width: '8%' },
  { id: 'uploadDesign', label: 'File Ảnh Thiết Kế', visible: true, width: '7%' },
  { id: 'previewAction', label: 'Preview', visible: true, width: '4%' },
  { id: 'status', label: 'Trạng Thái QC', visible: true, width: '5%' }
];
