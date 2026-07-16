import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: "Forever Caffe - POS & Manajemen",
  description: "Aplikasi Point of Sale & Manajemen UMKM Forever Caffe",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#4A3728",
              color: "#FFF8F0",
              fontFamily: "Inter, sans-serif",
              borderRadius: "12px",
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
