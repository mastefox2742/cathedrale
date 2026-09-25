import { Suspense, type ReactNode } from 'react'
import { Layout2 } from '../../components/layout/Layout2'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Layout2>
      <Suspense fallback={<div className="page-loader"><div className="page-loader-ring" /></div>}>
        {children}
      </Suspense>
    </Layout2>
  )
}
