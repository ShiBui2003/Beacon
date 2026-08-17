import type React from "react"
import CitizenNav from "@/components/citizen-nav"

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <CitizenNav />
      <main className="pb-safe w-full">{children}</main>
    </div>
  )
}
