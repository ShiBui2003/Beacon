import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider, ToastViewport } from "@/components/ui/toast"
import VapiWidget from "@/components/VapiWidget"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Beacon - Civic Issue Reporting & Community Impact",
  description:
    "Report civic issues, track progress, and make a real difference in your community. Powered by AI and transparent governance.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const vapiApiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY as string | undefined
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string | undefined
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} overflow-x-hidden font-inter`}>
        {/* Forced light site-wide for now: only the landing and auth pages
            were actually built with a working dark mode. Citizen/admin
            dashboards still have hardcoded light-only backgrounds from
            before this redesign, so toggling dark on them produces broken,
            low-contrast pages. Re-enable the toggle once those pages get
            their own dark-mode-aware pass. forcedTheme also immediately
            resets anyone already stuck on a stored dark preference. */}
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <AuthProvider>
            {children}
            <ToastProvider>
              <ToastViewport />
            </ToastProvider>
            {/* Global sticky voice widget (renders once, bottom-right) */}
            {vapiApiKey && vapiAssistantId ? <VapiWidget apiKey={vapiApiKey} assistantId={vapiAssistantId} /> : null}
          </AuthProvider>
        </ThemeProvider>

        {/* Razorpay Checkout Script */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
