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

const s3ClientVirtual = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.endpoint,
  credentials: BIZFLY_CONFIG.credentials,
  forcePathStyle: false
});

const s3ClientPathStyle = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.endpoint,
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
 * Upload Image to Bizfly Cloud Storage Bucket with API Gateway Proxy + S3 Fallback
 */
export const uploadImageToBizfly = async (imageInput, orderId) => {
  // Strategy 1: Serverless API Gateway Upload (/api/upload-bizfly)
  // This bypasses browser CORS restrictions 100% by doing Server-to-Server S3 upload!
  try {
    const response = await fetch('/api/upload-bizfly', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: typeof imageInput === 'string' ? imageInput : '',
        orderId
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.publicUrl) {
        console.log('✅ Upload thành công lên Bizfly Cloud Storage (via Serverless API):', data.publicUrl);
        return data.publicUrl;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ Serverless API upload unreachable, falling back to direct S3 client:', apiErr.message);
  }

  // Strategy 2: Direct Client-Side S3 SDK Fallback
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

  try {
    await s3ClientPathStyle.send(command);
    return `${BIZFLY_CONFIG.bucketEndpoint}/${objectKey}`;
  } catch (e1) {
    try {
      await s3ClientVirtual.send(command);
      return `${BIZFLY_CONFIG.bucketEndpoint}/${objectKey}`;
    } catch (e2) {
      throw new Error('Bizfly Cloud từ chối kết nối trực tiếp từ trình duyệt. Vui lòng thử lại.');
    }
  }
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

    await s3ClientPathStyle.send(command).catch(() => s3ClientVirtual.send(command));
    console.log('🗑️ Đã xóa ảnh trên Bizfly Storage:', objectKey);
    return true;
  } catch (err) {
    console.warn('⚠️ Lỗi khi xóa ảnh trên Bizfly Storage:', err);
    return false;
  }
};
