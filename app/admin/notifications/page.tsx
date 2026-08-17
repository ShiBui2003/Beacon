"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, Bell, Users, AlertTriangle, CheckCircle, Calendar, Megaphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock notification data
const sentNotifications = [
  {
    id: "1",
    title: "Scheduled Maintenance - Water Service",
    message:
      "Water service will be temporarily interrupted on Main Street from 9 AM to 3 PM tomorrow for pipe repairs.",
    type: "maintenance",
    audience: "location",
    targetLocation: "Main Street District",
    sentDate: "2024-01-19T14:30:00Z",
    recipients: 234,
    status: "sent",
  },
  {
    id: "2",
    title: "Road Closure Update",
    message: "5th Avenue will remain closed until Friday due to ongoing pothole repairs. Alternative routes available.",
    type: "traffic",
    audience: "all",
    targetLocation: "All Citizens",
    sentDate: "2024-01-18T10:15:00Z",
    recipients: 1247,
    status: "sent",
  },
  {
    id: "3",
    title: "Community Meeting Reminder",
    message:
      "Monthly town hall meeting scheduled for next Tuesday at 7 PM. Your input on civic improvements is valued.",
    type: "community",
    audience: "all",
    targetLocation: "All Citizens",
    sentDate: "2024-01-17T16:45:00Z",
    recipients: 1247,
    status: "sent",
  },
]

const getNotificationTypeIcon = (type: string) => {
  switch (type) {
    case "maintenance":
      return <AlertTriangle className="w-5 h-5 text-status-review" />
    case "traffic":
      return <CheckCircle className="w-5 h-5 text-status-progress" />
    case "community":
      return <Users className="w-5 h-5 text-accent" />
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "maintenance":
      return "bg-status-review text-white"
    case "traffic":
      return "bg-status-progress text-white"
    case "community":
      return "bg-accent text-accent-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function AdminNotificationsPage() {
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "",
    audience: "all",
    targetLocation: "",
    priority: "medium",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setNotificationForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Notification Sent Successfully!",
      description: `Your ${notificationForm.type} notification has been sent to ${
        notificationForm.audience === "all" ? "all citizens" : notificationForm.targetLocation
      }.`,
    })

    setIsSubmitting(false)

    // Reset form
    setNotificationForm({
      title: "",
      message: "",
      type: "",
      audience: "all",
      targetLocation: "",
      priority: "medium",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Notification Center</h1>
              <p className="text-muted-foreground">Send updates and alerts to citizens</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList>
            <TabsTrigger value="send">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </TabsTrigger>
            <TabsTrigger value="history">
              <Bell className="w-4 h-4 mr-2" />
              Notification History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Send Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Megaphone className="w-5 h-5 mr-2 text-accent" />
                      Compose Notification
                    </CardTitle>
                    <CardDescription>
                      Send important updates, alerts, and announcements to citizens in your municipality.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendNotification} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Notification Type *</Label>
                          <Select
                            value={notificationForm.type}
                            onValueChange={(value) => handleInputChange("type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select notification type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maintenance">Maintenance Alert</SelectItem>
                              <SelectItem value="traffic">Traffic Update</SelectItem>
                              <SelectItem value="community">Community News</SelectItem>
                              <SelectItem value="emergency">Emergency Alert</SelectItem>
                              <SelectItem value="service">Service Update</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority Level</Label>
                          <Select
                            value={notificationForm.priority}
                            onValueChange={(value) => handleInputChange("priority", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="high">High Priority</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Notification Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter a clear, descriptive title"
                          value={notificationForm.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Write your notification message. Be clear and concise."
                          value={notificationForm.message}
                          onChange={(e) => handleInputChange("message", e.target.value)}
                          rows={4}
                          required
                        />
                        <div className="text-sm text-muted-foreground">
                          {notificationForm.message.length}/500 characters
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Target Audience *</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="all"
                              name="audience"
                              value="all"
                              checked={notificationForm.audience === "all"}
                              onChange={(e) => handleInputChange("audience", e.target.value)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="all">All Citizens (1,247 users)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="location"
                              name="audience"
                              value="location"
                              checked={notificationForm.audience === "location"}
                              onChange={(e) => handleInputChange("audience", e.target.value)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="location">Specific Location/District</Label>
                          </div>
                        </div>

                        {notificationForm.audience === "location" && (
                          <div className="space-y-2">
                            <Label htmlFor="targetLocation">Target Location</Label>
                            <Select
                              value={notificationForm.targetLocation}
                              onValueChange={(value) => handleInputChange("targetLocation", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select target location" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="downtown">Downtown District (234 users)</SelectItem>
                                <SelectItem value="riverside">Riverside Area (189 users)</SelectItem>
                                <SelectItem value="westside">Westside (156 users)</SelectItem>
                                <SelectItem value="north-end">North End (198 users)</SelectItem>
                                <SelectItem value="central-park">Central Park Area (145 users)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Notification
                            </>
                          )}
                        </Button>
                        <Button type="button" variant="outline">
                          Save Draft
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Preview */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>How your notification will appear to citizens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-start gap-3">
                          {notificationForm.type && getNotificationTypeIcon(notificationForm.type)}
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{notificationForm.title || "Notification Title"}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notificationForm.message || "Your notification message will appear here..."}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {notificationForm.type && (
                                <Badge className={getTypeColor(notificationForm.type)} variant="secondary">
                                  {notificationForm.type}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">Just now</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>
                          <strong>Recipients:</strong>{" "}
                          {notificationForm.audience === "all"
                            ? "All citizens (1,247)"
                            : notificationForm.targetLocation || "Select location"}
                        </p>
                        <p>
                          <strong>Priority:</strong> {notificationForm.priority || "medium"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sent Notifications</CardTitle>
                <CardDescription>History of all notifications sent to citizens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">{getNotificationTypeIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                        <Badge className={getTypeColor(notification.type)} variant="secondary">
                          {notification.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(notification.sentDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {notification.recipients} recipients
                        </span>
                        <span>{notification.targetLocation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
