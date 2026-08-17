"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Filter, Layers, ZoomIn, ZoomOut } from "lucide-react"

interface Issue {
  id: string
  title: string
  category: string
  status: "submitted" | "in-review" | "in-progress" | "resolved"
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  priority: "low" | "medium" | "high"
  created_at: string
  upvotes: number
}

const statusColors = {
  submitted: "bg-gray-500",
  "in-review": "bg-orange-500",
  "in-progress": "bg-blue-500",
  resolved: "bg-green-500",
}

const priorityColors = {
  low: "border-green-300",
  medium: "border-yellow-300",
  high: "border-red-300",
}

export default function InteractiveMap() {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [zoom, setZoom] = useState(12)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues?limit=100')
      const data = await response.json()
      if (data.issues) {
        // Filter out issues without coordinates
        const issuesWithCoords = data.issues.filter((issue: Issue) => 
          issue.location_lat && issue.location_lng
        )
        setIssues(issuesWithCoords)
      }
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredIssues = filter === "all" ? issues : issues.filter((issue) => issue.status === filter)

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Issues</option>
            <option value="submitted">Submitted</option>
            <option value="in-review">Under Review</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(zoom + 1, 18))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(zoom - 1, 8))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-96 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
              {/* Simulated Map Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-8 grid-rows-6 h-full">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border border-gray-200" />
                  ))}
                </div>
              </div>

              {/* Issue Markers */}
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-500">Loading issues...</div>
                </div>
              ) : (
                filteredIssues.map((issue, index) => {
                  // Calculate position based on coordinates (simplified for demo)
                  const lat = issue.location_lat || 40.7128
                  const lng = issue.location_lng || -74.006
                  const x = ((lng + 74.1) / 0.2) * 100 // Normalize to 0-100%
                  const y = ((40.8 - lat) / 0.2) * 100 // Normalize to 0-100%
                  
                  return (
                    <div
                      key={issue.id}
                      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${priorityColors[issue.priority]} border-2 rounded-full`}
                      style={{
                        left: `${Math.max(5, Math.min(95, x))}%`,
                        top: `${Math.max(5, Math.min(95, y))}%`,
                      }}
                      onClick={() => setSelectedIssue(issue)}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${statusColors[issue.status]} border-2 border-white shadow-lg`}
                      />
                      {selectedIssue?.id === issue.id && (
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-lg border min-w-48 z-10">
                          <h4 className="font-medium text-sm">{issue.title}</h4>
                          <p className="text-xs text-gray-600">{issue.location_address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {issue.category}
                            </Badge>
                            <Badge variant="secondary" className={`text-xs text-white ${statusColors[issue.status]}`}>
                              {issue.status}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-md">
              <p className="text-xs text-gray-600">Zoom: {zoom}x</p>
            </div>
          </Card>
        </div>

        {/* Issue List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Issues on Map ({filteredIssues.length})</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedIssue?.id === issue.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[issue.status]} mt-1`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {issue.location_address || 'No address'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {issue.category}
                      </Badge>
                      <span
                        className={`text-xs px-1 py-0.5 rounded ${
                          issue.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : issue.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Map Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-sm">Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm">In Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">Resolved</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
