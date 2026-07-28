import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fetch ALL orders from Supabase using pagination loop (bypassing Supabase 1,000 row API limit)
export const fetchOrdersFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.warn('Supabase fetch orders error:', error);
        break;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    if (allData.length > 0) {
      return allData.map(row => ({
        id: row.id,
        orderDate: row.order_date,
        storeName: row.store_name,
        customerName: row.customer_name,
        storeIcon: 'Etsy',
        orderNumber: row.order_number,
        productTitle: row.product_title,
        productGroup: row.product_group,
        quantity: row.quantity,
        sku: row.sku,
        personalization: {
          size: row.personalization_size || '',
          text: row.personalization_text || ''
        },
        note: row.note,
        skuNote: row.sku_note,
        driveLink: row.drive_link,
        hasUploadedDesign: row.has_uploaded_design,
        uploadedDesignFile: row.uploaded_design_file,
        designImage: row.design_image,
        designWidth: row.design_width,
        designHeight: row.design_height,
        designAspectRatio: row.design_aspect_ratio,
        targetSizeLabel: row.target_size_label,
        targetWidth: row.target_width,
        targetHeight: row.target_height,
        ratioStatus: row.ratio_status,
        aiStatus: row.ai_status,
        aiScore: row.ai_score,
        aiReport: row.ai_report,
        status: row.status,
        mockupThumb: row.mockup_thumb,
        assignee: row.assignee
      }));
    }
  } catch (err) {
    console.error('Lỗi kết nối Supabase:', err);
  }
  return null;
};

// Update order fields in Supabase
export const updateOrderInSupabase = async (orderId, fields) => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {};
    if (fields.productGroup !== undefined) payload.product_group = fields.productGroup;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.ratioStatus !== undefined) payload.ratio_status = fields.ratioStatus;
    if (fields.aiStatus !== undefined) payload.ai_status = fields.aiStatus;
    if (fields.aiScore !== undefined) payload.ai_score = fields.aiScore;
    if (fields.aiReport !== undefined) payload.ai_report = fields.aiReport;
    if (fields.hasUploadedDesign !== undefined) payload.has_uploaded_design = fields.hasUploadedDesign;
    if (fields.uploadedDesignFile !== undefined) payload.uploaded_design_file = fields.uploadedDesignFile;
    if (fields.designImage !== undefined) payload.design_image = fields.designImage;
    if (fields.designWidth !== undefined) payload.design_width = fields.designWidth;
    if (fields.designHeight !== undefined) payload.design_height = fields.designHeight;

    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', orderId);

    if (error) {
      console.warn('Lỗi cập nhật Supabase order:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu Supabase:', err);
    return false;
  }
};

// Upload artwork design file to Supabase Storage permanently
export const uploadDesignToSupabaseStorage = async (file) => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `artwork/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('qc-designs')
      .upload(filePath, file);

    if (uploadError) {
      console.warn('Lỗi upload file lên Supabase Storage:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('qc-designs')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Lỗi upload file Supabase:', err);
    return null;
  }
};

// Seed initial orders into Supabase in bulk
export const seedOrdersToSupabase = async (ordersArray) => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const rows = ordersArray.map(ord => ({
      id: ord.id,
      order_number: ord.orderNumber,
      order_date: ord.orderDate,
      store_name: ord.storeName,
      customer_name: ord.customerName || '',
      product_title: ord.productTitle,
      product_group: ord.productGroup,
      quantity: ord.quantity,
      sku: ord.sku,
      personalization_size: ord.personalization?.size || '',
      personalization_text: ord.personalization?.text || '',
      note: ord.note,
      sku_note: ord.skuNote,
      drive_link: ord.driveLink,
      has_uploaded_design: ord.hasUploadedDesign || false,
      uploaded_design_file: ord.uploadedDesignFile || null,
      design_image: ord.designImage || null,
      design_width: ord.designWidth || null,
      design_height: ord.designHeight || null,
      target_size_label: ord.targetSizeLabel || null,
      target_width: ord.targetWidth || null,
      target_height: ord.targetHeight || null,
      ratio_status: ord.ratioStatus || 'NEEDS_CHECK',
      ai_status: ord.aiStatus || 'NEEDS_SCAN',
      status: ord.status || 'Chờ kiểm tra',
      mockup_thumb: ord.mockupThumb,
      assignee: ord.assignee || 'Dakuho (QC SP)'
    }));

    // Upsert in batches of 500
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from('orders').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error('Lỗi seed batch:', error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Lỗi seed Supabase:', err);
    return false;
  }
};
