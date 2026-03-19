'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateOpportunityDialog } from '@/components/opportunities/create-opportunity-dialog'
import { useRouter } from 'next/navigation'

export function OpportunityListHeader() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button size="sm" className="h-8 text-[13px] gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        新建商机
      </Button>
      <CreateOpportunityDialog
        customerId=""
        customerName=""
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
