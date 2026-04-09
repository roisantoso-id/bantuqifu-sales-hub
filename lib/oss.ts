'use server'

import OSS from 'ali-oss'

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024
const MAX_INTERACTION_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024
const MAX_RECEIPT_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
])
const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'image/png',
  'image/jpeg',
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

export interface UploadInteractionAttachmentToOssParams {
  file: File
  tenantId: string
  opportunityId: string
  interactionId: string
}

export interface UploadedInteractionAttachmentFile {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  objectKey: string
}

export interface UploadFinanceReceiptToOssParams {
  file: File
  tenantId: string
  opportunityId: string
}

export interface UploadedFinanceReceiptFile {
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

function assertValidInteractionAttachment(file: File) {
  if (!file.name.trim()) {
    throw new Error('附件文件名不能为空')
  }

  if (file.size <= 0) {
    throw new Error(`附件 ${file.name} 不能为空`)
  }

  if (file.size > MAX_INTERACTION_ATTACHMENT_SIZE_BYTES) {
    throw new Error(`附件 ${file.name} 不能超过 50MB`)
  }
}

function assertValidFinanceReceipt(file: File) {
  const lowerName = file.name.toLowerCase()
  const contentType = file.type?.toLowerCase() || ''

  if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.png') && !lowerName.endsWith('.jpg') && !lowerName.endsWith('.jpeg')) {
    throw new Error('仅支持上传 PNG/JPG/PDF 格式的打款凭证')
  }

  if (contentType && !ALLOWED_RECEIPT_MIME_TYPES.has(contentType)) {
    throw new Error('打款凭证类型无效，请上传 PNG/JPG/PDF 文件')
  }

  if (file.size <= 0) {
    throw new Error('打款凭证不能为空')
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error('打款凭证不能超过 50MB')
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

function buildInteractionAttachmentObjectKey(
  tenantId: string,
  opportunityId: string,
  interactionId: string,
  fileName: string
): string {
  const safeName = sanitizeFileName(fileName)
  return `interactions/${tenantId}/${opportunityId}/${interactionId}/${Date.now()}-${safeName}`
}

function buildFinanceReceiptObjectKey(tenantId: string, opportunityId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName)
  return `finance-receipts/${tenantId}/${opportunityId}/${Date.now()}-${safeName}`
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

function isBlobLikeUrl(value: string): boolean {
  return value.startsWith('blob:') || value.startsWith('data:')
}

function extractObjectKeyFromPersistedUrl(input: string): string | null {
  const bucket = getRequiredEnv('ALIYUN_OSS_BUCKET', 'OSS_BUCKET', 'OSS_BUCKET_NAME')
  const region = getOssRegion()
  const customDomain = process.env.ALIYUN_OSS_PUBLIC_URL_BASE?.replace(/\/$/, '')
  const candidates = [
    customDomain,
    `https://${bucket}.${region}.aliyuncs.com`,
    `http://${bucket}.${region}.aliyuncs.com`,
  ].filter(Boolean) as string[]

  for (const baseUrl of candidates) {
    if (input === baseUrl) {
      return ''
    }

    if (input.startsWith(`${baseUrl}/`)) {
      return decodeURIComponent(input.slice(baseUrl.length + 1))
    }
  }

  try {
    const url = new URL(input)
    const pathname = url.pathname.replace(/^\/+/, '')
    if (!pathname) {
      return null
    }

    const host = url.host
    if (host === `${bucket}.${region}.aliyuncs.com`) {
      return decodeURIComponent(pathname)
    }

    if (customDomain) {
      const customHost = new URL(customDomain).host
      if (host === customHost) {
        return decodeURIComponent(pathname)
      }
    }
  } catch {
    return null
  }

  return null
}

function resolveOssObjectKey(input: string): string | null {
  const trimmed = input.trim()

  if (!trimmed || isBlobLikeUrl(trimmed)) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return extractObjectKeyFromPersistedUrl(trimmed)
  }

  return trimmed.replace(/^\/+/, '')
}

export interface TemporaryPreviewUrlOptions {
  expiresInSeconds?: number
}

export async function getTemporaryPreviewUrl(
  input: string | null | undefined,
  options: TemporaryPreviewUrlOptions = {}
): Promise<string | undefined> {
  if (!input) {
    return undefined
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return undefined
  }

  if (isBlobLikeUrl(trimmed)) {
    return trimmed
  }

  const objectKey = resolveOssObjectKey(trimmed)
  if (!objectKey) {
    return trimmed
  }

  const client = createOssClient()
  return client.signatureUrl(objectKey, {
    expires: options.expiresInSeconds ?? 300,
  })
}

export async function getTemporaryPreviewUrls(
  inputs: Array<string | null | undefined>,
  options: TemporaryPreviewUrlOptions = {}
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    inputs.map(async (input) => {
      if (!input) {
        return null
      }

      const previewUrl = await getTemporaryPreviewUrl(input, options)
      return previewUrl ? [input, previewUrl] as const : null
    })
  )

  return entries.reduce((map, entry) => {
    if (entry) {
      map.set(entry[0], entry[1])
    }
    return map
  }, new Map<string, string>())
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

export async function uploadInteractionAttachmentToOss({
  file,
  tenantId,
  opportunityId,
  interactionId,
}: UploadInteractionAttachmentToOssParams): Promise<UploadedInteractionAttachmentFile> {
  assertValidInteractionAttachment(file)

  const bucket = getRequiredEnv('ALIYUN_OSS_BUCKET', 'OSS_BUCKET', 'OSS_BUCKET_NAME')
  const region = getOssRegion()
  const objectKey = buildInteractionAttachmentObjectKey(tenantId, opportunityId, interactionId, file.name)
  const client = createOssClient()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await client.put(objectKey, buffer, {
    mime: file.type || 'application/octet-stream',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  return {
    url: buildPublicUrl(bucket, region, objectKey),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    objectKey,
  }
}

export async function uploadFinanceReceiptToOss({
  file,
  tenantId,
  opportunityId,
}: UploadFinanceReceiptToOssParams): Promise<UploadedFinanceReceiptFile> {
  assertValidFinanceReceipt(file)

  const bucket = getRequiredEnv('ALIYUN_OSS_BUCKET', 'OSS_BUCKET', 'OSS_BUCKET_NAME')
  const region = getOssRegion()
  const objectKey = buildFinanceReceiptObjectKey(tenantId, opportunityId, file.name)
  const client = createOssClient()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = file.type || 'application/octet-stream'

  await client.put(objectKey, buffer, {
    mime: mimeType,
    headers: {
      'Content-Type': mimeType,
    },
  })

  return {
    url: buildPublicUrl(bucket, region, objectKey),
    fileName: file.name,
    fileSize: file.size,
    mimeType,
    objectKey,
  }
}
