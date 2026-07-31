import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Bizfly Cloud Storage Configuration
const BIZFLY_CONFIG = {
  region: 'hn',
  endpoint: 'https://hn.ss.bfcplatform.vn',
  bucketEndpoint: 'https://bucket-dakuho.hn.ss.bfcplatform.vn',
  bucketName: 'bucket-dakuho',
  credentials: {
    accessKeyId: 'D0XBG4R9TKPUURF455DU',
    secretAccessKey: 'a16Mq9cQVBOIFOaLxaQ1OxgdPDdndqOSvMRkqEOa'
  }
};

// Client 1: Virtual-Hosted Style (https://bucket-dakuho.hn.ss.bfcplatform.vn/...)
const s3ClientVirtual = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.endpoint,
  credentials: BIZFLY_CONFIG.credentials,
  forcePathStyle: false
});

// Client 2: Path Style (https://hn.ss.bfcplatform.vn/bucket-dakuho/...)
const s3ClientPathStyle = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.endpoint,
  credentials: BIZFLY_CONFIG.credentials,
  forcePathStyle: true
});

// Client 3: Direct Bucket Domain Client
const s3ClientDirectBucket = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.bucketEndpoint,
  credentials: BIZFLY_CONFIG.credentials,
  forcePathStyle: true
});

const dataURLToUint8Array = (dataURL) => {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { u8arr, contentType };
};

/**
 * Upload Image to Bizfly Cloud Storage Bucket with Multi-Strategy & Auto-Retry
 */
export const uploadImageToBizfly = async (imageInput, orderId) => {
  let bodyBytes;
  let contentType = 'image/jpeg';
  let fileExtension = 'jpg';

  if (typeof imageInput === 'string' && imageInput.startsWith('data:image/')) {
    const parsed = dataURLToUint8Array(imageInput);
    bodyBytes = parsed.u8arr;
    contentType = parsed.contentType;
    if (contentType.includes('png')) fileExtension = 'png';
    if (contentType.includes('webp')) fileExtension = 'webp';
  } else if (imageInput instanceof File || imageInput instanceof Blob) {
    bodyBytes = new Uint8Array(await imageInput.arrayBuffer());
    contentType = imageInput.type || 'image/jpeg';
    if (contentType.includes('png')) fileExtension = 'png';
    if (contentType.includes('webp')) fileExtension = 'webp';
  } else {
    throw new Error('Định dạng ảnh không hợp lệ.');
  }

  const cleanOrderId = String(orderId || 'design').replace(/[^a-zA-Z0-9]/g, '_');
  const objectKey = `designs/order_${cleanOrderId}_${Date.now()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BIZFLY_CONFIG.bucketName,
    Key: objectKey,
    Body: bodyBytes,
    ContentType: contentType,
    ACL: 'public-read'
  });

  const clients = [
    { client: s3ClientVirtual, name: 'Virtual-Hosted' },
    { client: s3ClientPathStyle, name: 'Path-Style' },
    { client: s3ClientDirectBucket, name: 'Direct-Bucket' }
  ];

  let lastError = null;

  for (const { client, name } of clients) {
    try {
      await client.send(command);
      const publicUrl = `${BIZFLY_CONFIG.bucketEndpoint}/${objectKey}`;
      console.log(`✅ Upload thành công lên Bizfly Storage (${name}):`, publicUrl);
      return publicUrl;
    } catch (err) {
      console.warn(`⚠️ Thử upload phương thức ${name} thất bại:`, err.message);
      lastError = err;
    }
  }

  // If all S3 client strategies hit browser CORS "Failed to fetch"
  if (lastError && (lastError.message.includes('Failed to fetch') || lastError.name === 'TypeError')) {
    throw new Error('Bizfly Cloud chặn CORS từ trình duyệt. Vui lòng bật CORS [AllowedOrigins: *] trong Bảng quản trị Bizfly Storage.');
  }

  throw lastError || new Error('Không thể tải ảnh lên Bizfly Cloud Storage.');
};

/**
 * Delete Image from Bizfly Cloud Storage Bucket
 */
export const deleteImageFromBizfly = async (publicUrl) => {
  if (!publicUrl || (!publicUrl.includes('bfcplatform.vn') && !publicUrl.includes('bizflycloud.vn'))) return false;

  try {
    const urlObj = new URL(publicUrl);
    const objectKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

    const command = new DeleteObjectCommand({
      Bucket: BIZFLY_CONFIG.bucketName,
      Key: objectKey
    });

    await s3ClientVirtual.send(command).catch(() => s3ClientPathStyle.send(command));
    console.log('🗑️ Đã xóa ảnh trên Bizfly Storage:', objectKey);
    return true;
  } catch (err) {
    console.warn('⚠️ Lỗi khi xóa ảnh trên Bizfly Storage:', err);
    return false;
  }
};
