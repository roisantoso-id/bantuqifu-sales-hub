'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'])

function getFileExtension(value: string): string | undefined {
  const withoutQuery = value.split('#')[0]?.split('?')[0] ?? value
  const segments = withoutQuery.split('.')
  if (segments.length < 2) {
    return undefined
  }

  return segments.at(-1)?.toLowerCase()
}

export function isImagePreviewable(input: { url?: string; fileName?: string; mimeType?: string | null }) {
  if (input.mimeType?.toLowerCase().startsWith('image/')) {
    return true
  }

  const extension = input.fileName ? getFileExtension(input.fileName) : getFileExtension(input.url ?? '')
  return extension ? IMAGE_EXTENSIONS.has(extension) : false
}

interface ImagePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  src?: string
  title?: string
}

export function ImagePreviewDialog({ open, onOpenChange, src, title }: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[95vh] w-[96vw] max-w-[96vw] border-none bg-black/95 p-2 text-white sm:h-[92vh] sm:w-[92vw] sm:max-w-[92vw] sm:p-4">
        <DialogTitle className="pr-8 text-sm font-medium text-white">{title || '图片预览'}</DialogTitle>
        {src ? (
          <div className="flex h-full items-center justify-center overflow-auto">
            <img src={src} alt={title || '图片预览'} className="max-h-[calc(95vh-4rem)] max-w-full rounded object-contain sm:max-h-[calc(92vh-5rem)]" />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
