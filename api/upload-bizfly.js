import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

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

const s3Client = new S3Client({
  region: BIZFLY_CONFIG.region,
  endpoint: BIZFLY_CONFIG.endpoint,
  credentials: BIZFLY_CONFIG.credentials,
  forcePathStyle: true
});

export default async function handler(req, res) {
  // Allow CORS for API Endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, orderId } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh imageBase64' });
    }

    const arr = imageBase64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    let fileExtension = 'jpg';
    if (contentType.includes('png')) fileExtension = 'png';
    if (contentType.includes('webp')) fileExtension = 'webp';

    const buffer = Buffer.from(arr[1], 'base64');
    const cleanOrderId = String(orderId || 'design').replace(/[^a-zA-Z0-9]/g, '_');
    const objectKey = `designs/order_${cleanOrderId}_${Date.now()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BIZFLY_CONFIG.bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    });

    await s3Client.send(command);

    const publicUrl = `${BIZFLY_CONFIG.bucketEndpoint}/${objectKey}`;
    return res.status(200).json({
      success: true,
      publicUrl,
      objectKey
    });

  } catch (err) {
    console.error('❌ Serverless Bizfly Upload Error:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi tải ảnh lên Bizfly Cloud Storage'
    });
  }
}
