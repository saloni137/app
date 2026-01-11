"use client";

import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Layout from '@/components/Layout'
import Snowfall from "react-snowfall";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Snowfall color="#ffffff" snowflakeCount={200} />
        <Layout>{children}</Layout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
