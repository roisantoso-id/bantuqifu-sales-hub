'use server'

import type { ActionLog, ActionLogAttachment } from '@/lib/types'

/**
 * 上传文件到阿里云 OSS
 * 占位符实现：返回模拟 URL
 * 生产环境替换为真实 OSS 上传逻辑
 */
async function uploadFileToOSS(file: File): Promise<ActionLogAttachment> {
  // TODO: 集成阿里云 OSS SDK
  // const ossBucket = await getOSSClient()
  // const key = `audit-logs/${Date.now()}-${file.name}`
  // await ossBucket.put(key, file)
  // const fileUrl = `https://your-oss-domain.aliyuncs.com/${key}`

  // 模拟 OSS 上传
  const mockOssUrl = `https://mock-oss.example.com/audit-logs/${Date.now()}-${file.name}`

  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fileName: file.name,
    fileSize: file.size,
    fileUrl: mockOssUrl,
    uploadedAt: new Date().toISOString(),
  }
}

/**
 * 添加备注到审计流
 * @param opportunityId 商机ID
 * @param remark 备注文本
 * @param fileList 上传的文件列表（FormData）
 * @returns 新创建的 ActionLog
 */
export async function addAuditNote(
  opportunityId: string,
  remark: string,
  fileList: File[]
): Promise<ActionLog> {
  // 验证
  if (!opportunityId) {
    throw new Error('Missing opportunityId')
  }

  // 上传所有文件
  const attachments: ActionLogAttachment[] = []
  for (const file of fileList) {
    const att = await uploadFileToOSS(file)
    attachments.push(att)
  }

  // 创建新的 ActionLog
  const newLog: ActionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    opportunityId,
    operatorId: 'user-placeholder', // 从 session/auth 获取
    operatorName: '当前用户', // 从 session/auth 获取
    actionType: 'NOTE',
    actionLabel: '添加备注',
    timestamp: new Date().toISOString(),
    remark: remark.trim() || undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  }

  // TODO: 保存到数据库
  // await db.actionLog.create(newLog)

  console.log('[v0] Created audit note:', newLog)
  return newLog
}
