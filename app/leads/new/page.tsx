import { getCustomersAction } from '@/app/actions/customer'
import { LeadForm } from '@/components/leads/lead-form'

export const metadata = {
  title: '新增线索 — BantuQiFu Sales Hub',
}

export default async function NewLeadPage() {
  const customers = await getCustomersAction()

  const customerOptions = customers.map((c) => ({
    id: c.id,
    customerName: c.customerName,
    customerId: c.customerId,
    customerCode: c.customerCode,
  }))

  return <LeadForm customers={customerOptions} />
}
