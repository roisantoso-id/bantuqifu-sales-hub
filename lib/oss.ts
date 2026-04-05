'use server'

import OSS from 'ali-oss'

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
])

export interface UploadContractToOssParams {
  file: File
  tenantId: string
  opportunityId: string
}

export interface UploadedContractFile {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  objectKey: string
}

function getEnvValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (value) {
      return value
    }
  }

  return undefined
}

function getRequiredEnv(label: string, ...names: string[]): string {
  const value = getEnvValue(...names)

  if (!value) {
    throw new Error(`Missing required OSS configuration: ${label}`)
  }

  return value
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'contract.pdf'
}

function assertValidPdf(file: File) {
  const lowerName = file.name.toLowerCase()
  const contentType = file.type?.toLowerCase() || ''

  if (!lowerName.endsWith('.pdf')) {
    throw new Error('仅支持上传 PDF 合同文件')
  }

  if (contentType && !ALLOWED_PDF_MIME_TYPES.has(contentType)) {
    throw new Error('合同文件类型无效，请上传 PDF')
  }

  if (file.size <= 0) {
    throw new Error('合同文件不能为空')
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('合同文件不能超过 50MB')
  }
}

function inferRegionFromEndpoint(endpoint?: string): string | undefined {
  if (!endpoint) {
    return undefined
  }

  const normalized = endpoint
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')

  const match = normalized.match(/^oss-([a-z0-9-]+)\.aliyuncs\.com$/)
  return match?.[1]
}

function getOssRegion(): string {
  return (
    getEnvValue('ALIYUN_OSS_REGION', 'OSS_REGION') ||
    inferRegionFromEndpoint(getEnvValue('ALIYUN_OSS_ENDPOINT', 'OSS_ENDPOINT')) ||
    (() => {
      throw new Error('Missing required OSS configuration: ALIYUN_OSS_REGION')
    })()
  )
}

function buildObjectKey(tenantId: string, opportunityId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName)
  return `contracts/${tenantId}/${opportunityId}/${Date.now()}-${safeName}`
}

function buildPublicUrl(bucket: string, region: string, objectKey: string): string {
  const customDomain = process.env.ALIYUN_OSS_PUBLIC_URL_BASE?.replace(/\/$/, '')

  if (customDomain) {
    return `${customDomain}/${objectKey}`
  }

  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
}

function createOssClient() {
  return new OSS({
    region: getOssRegion(),
    bucket: getRequiredEnv('ALIYUN_OSS_BUCKET', 'OSS_BUCKET', 'OSS_BUCKET_NAME'),
    endpoint: getEnvValue('ALIYUN_OSS_ENDPOINT', 'OSS_ENDPOINT') || undefined,
    accessKeyId: getRequiredEnv('ALIYUN_OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_ID'),
    accessKeySecret: getRequiredEnv('ALIYUN_OSS_ACCESS_KEY_SECRET', 'OSS_ACCESS_KEY_SECRET'),
    secure: true,
  })
}

export async function uploadContractToOss({
  file,
  tenantId,
  opportunityId,
}: UploadContractToOssParams): Promise<UploadedContractFile> {
  assertValidPdf(file)

  const bucket = getRequiredEnv('ALIYUN_OSS_BUCKET', 'OSS_BUCKET', 'OSS_BUCKET_NAME')
  const region = getOssRegion()
  const objectKey = buildObjectKey(tenantId, opportunityId, file.name)
  const client = createOssClient()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await client.put(objectKey, buffer, {
    mime: 'application/pdf',
    headers: {
      'Content-Type': 'application/pdf',
    },
  })

  return {
    url: buildPublicUrl(bucket, region, objectKey),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/pdf',
    objectKey,
  }
}
