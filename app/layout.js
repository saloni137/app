import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Layout from '@/components/Layout'

export const metadata = {
  title: 'Budget Planner',
  description: 'Personal budget planning application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Layout>{children}</Layout>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
