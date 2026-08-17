"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Download, FileText, CalendarIcon, BarChart3, PieChart, TrendingUp } from "lucide-react"
import { format } from "date-fns"

// Mock report data
const availableReports = [
  {
    id: "monthly-summary",
    title: "Monthly Issue Summary",
    description: "Comprehensive overview of all issues reported and resolved in the selected month",
    type: "summary",
    lastGenerated: "2024-01-15T10:30:00Z",
    size: "2.3 MB",
  },
  {
    id: "department-performance",
    title: "Department Performance Report",
    description: "Analysis of each department's efficiency and resolution rates",
    type: "performance",
    lastGenerated: "2024-01-14T16:45:00Z",
    size: "1.8 MB",
  },
  {
    id: "citizen-satisfaction",
    title: "Citizen Satisfaction Survey",
    description: "Results from citizen feedback and satisfaction ratings",
    type: "satisfaction",
    lastGenerated: "2024-01-12T09:15:00Z",
    size: "1.2 MB",
  },
  {
    id: "geographic-analysis",
    title: "Geographic Issue Analysis",
    description: "Breakdown of issues by location and district patterns",
    type: "geographic",
    lastGenerated: "2024-01-10T14:20:00Z",
    size: "3.1 MB",
  },
  {
    id: "trend-analysis",
    title: "Trend Analysis Report",
    description: "Historical trends and predictive insights for issue patterns",
    type: "trends",
    lastGenerated: "2024-01-08T11:00:00Z",
    size: "2.7 MB",
  },
]

const quickStats = {
  totalReports: 47,
  thisMonth: 12,
  avgSize: "2.1 MB",
  lastExport: "2024-01-15",
}

const getReportIcon = (type: string) => {
  switch (type) {
    case "summary":
      return <FileText className="w-5 h-5 text-accent" />
    case "performance":
      return <BarChart3 className="w-5 h-5 text-status-progress" />
    case "satisfaction":
      return <TrendingUp className="w-5 h-5 text-status-resolved" />
    case "geographic":
      return <PieChart className="w-5 h-5 text-status-review" />
    case "trends":
      return <TrendingUp className="w-5 h-5 text-status-submitted" />
    default:
      return <FileText className="w-5 h-5 text-muted-foreground" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "summary":
      return "bg-accent text-accent-foreground"
    case "performance":
      return "bg-status-progress text-white"
    case "satisfaction":
      return "bg-status-resolved text-white"
    case "geographic":
      return "bg-status-review text-white"
    case "trends":
      return "bg-status-submitted text-white"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [reportFormat, setReportFormat] = useState("pdf")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async () => {
    if (!selectedReport) return

    setIsGenerating(true)
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsGenerating(false)

    // In a real app, this would trigger a download
    console.log(`Generating ${selectedReport} report in ${reportFormat} format`)
  }

  const handleDownloadExisting = (reportId: string) => {
    // In a real app, this would trigger a download
    console.log(`Downloading report: ${reportId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/reports">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate and download comprehensive reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Report Generation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-accent">{quickStats.totalReports}</div>
                  <div className="text-sm text-muted-foreground">Total Reports</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-status-progress">{quickStats.thisMonth}</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-status-resolved">{quickStats.avgSize}</div>
                  <div className="text-sm text-muted-foreground">Avg Size</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{quickStats.lastExport}</div>
                  <div className="text-sm text-muted-foreground">Last Export</div>
                </CardContent>
              </Card>
            </div>

            {/* Generate New Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-accent" />
                  Generate New Report
                </CardTitle>
                <CardDescription>Create custom reports with specific parameters and date ranges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Type</label>
                    <Select value={selectedReport} onValueChange={setSelectedReport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableReports.map((report) => (
                          <SelectItem key={report.id} value={report.id}>
                            {report.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Format</label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {selectedReport && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">{availableReports.find((r) => r.id === selectedReport)?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {availableReports.find((r) => r.id === selectedReport)?.description}
                    </p>
                  </div>
                )}

                <Button onClick={handleGenerateReport} disabled={!selectedReport || isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate & Download Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Available Reports */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>Previously generated reports ready for download</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableReports.map((report) => (
                  <div key={report.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      {getReportIcon(report.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{report.title}</h4>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                      <Badge className={getTypeColor(report.type)} variant="secondary">
                        {report.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(report.lastGenerated).toLocaleDateString()}</span>
                      <span>{report.size}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleDownloadExisting(report.id)}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
