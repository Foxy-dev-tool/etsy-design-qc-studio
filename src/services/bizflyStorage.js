import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Bizfly Cloud Storage Configuration
const BIZFLY_CONFIG = {
  region: 'hn',
  endpoint: 'https://hn.ss.bfcplatform.vn',
  bucketName: 'bucket-dakuho',
  credentials: {
    accessKeyId: 'D0XBG4R9TKPUURF455DU',
    secretAccessKey: 'a16Mq9cQVBOIFOaLxaQ1OxgdPDdndqOSvMRkqEOa'
  }
};

// Initialize S3 Client targeting Bizfly Cloud S3 Endpoint
const s3Client = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.endpoint,
  credentials: BIZFLY_CONFIG.credentials,
  forcePathStyle: false // Enable virtual-hosted style (bucket-dakuho.hn.ss.bfcplatform.vn)
});

/**
 * Convert Base64 dataURL / File object to Uint8Array for S3 PutObjectCommand
 */
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
 * Upload Image to Bizfly Cloud Storage Bucket
 * @param {string|File} imageInput - Base64 DataURL string or File object
 * @param {string|number} orderId - Order ID or Order Number
 * @returns {Promise<string>} Public CDN URL of the uploaded image on Bizfly Cloud
 */
export const uploadImageToBizfly = async (imageInput, orderId) => {
  try {
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
      ACL: 'public-read' // Ensure public read access for CDN URL
    });

    await s3Client.send(command);

    // Public URL format on Bizfly Cloud Storage
    const publicUrl = `https://${BIZFLY_CONFIG.bucketName}.hn.ss.bfcplatform.vn/${objectKey}`;
    console.log('✅ Upload thành công lên Bizfly Storage:', publicUrl);
    return publicUrl;

  } catch (err) {
    console.error('❌ Lỗi khi upload ảnh lên Bizfly Cloud Storage:', err);
    throw err;
  }
};

/**
 * Delete Image from Bizfly Cloud Storage Bucket
 * @param {string} publicUrl - Public URL of the image on Bizfly Cloud
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deleteImageFromBizfly = async (publicUrl) => {
  if (!publicUrl || !publicUrl.includes('bfcplatform.vn')) return false;

  try {
    const urlObj = new URL(publicUrl);
    // Remove leading slash to get key
    const objectKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

    const command = new DeleteObjectCommand({
      Bucket: BIZFLY_CONFIG.bucketName,
      Key: objectKey
    });

    await s3Client.send(command);
    console.log('🗑️ Đã xóa ảnh trên Bizfly Storage:', objectKey);
    return true;
  } catch (err) {
    console.warn('⚠️ Lỗi khi xóa ảnh trên Bizfly Storage:', err);
    return false;
  }
};
