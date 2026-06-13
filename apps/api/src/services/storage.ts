import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const endpoint = process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000';
const bucket = process.env.STORAGE_BUCKET ?? 'slideforge';
const publicBase = process.env.STORAGE_PUBLIC_URL ?? `${endpoint}/${bucket}`;

const client = new S3Client({
  endpoint,
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
});

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  bucketReady = true;
}

export async function uploadImage(buffer: Buffer, contentType = 'image/jpeg'): Promise<string> {
  await ensureBucket();
  const key = `images/${randomUUID()}.jpg`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${publicBase}/${key}`;
}

export async function uploadFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadImage(buffer, contentType);
}

export async function uploadPlaceholder(keywords: string): Promise<string> {
  const { createHash } = await import('node:crypto');
  const seed = createHash('sha256').update(keywords).digest('hex').slice(0, 12);
  const res = await fetch(`https://picsum.photos/seed/${seed}/1280/720`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadImage(buffer);
}

export async function uploadExport(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  await ensureBucket();
  const key = `exports/${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${publicBase}/${key}`;
}
