'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LeadEntryForm } from './lead-entry-form'

interface CreateLeadDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateLeadDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateLeadDialogProps) {

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增线索</DialogTitle>
          <DialogDescription>
            填写线索基本信息，创建后将自动分配给您
          </DialogDescription>
        </DialogHeader>

        <LeadEntryForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
