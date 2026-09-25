import type { Metadata } from 'next'
import { AdminServicesParoissiauxPage } from '../../../../views/admin/AdminServicesParoissiauxPage'

export const metadata: Metadata = { title: 'Admin — Services paroissiaux' }

export default function Page() {
  return <AdminServicesParoissiauxPage />
}
