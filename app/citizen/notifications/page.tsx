"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Bell,
    CheckCircle,
    AlertTriangle,
    Clock,
    Eye,
    Settings,
    Smartphone,
    Mail,
    MessageSquare,
} from "lucide-react";

// Mock notification data
const notifications = [
    {
        id: "1",
        type: "status_update",
        title: "Issue Status Updated",
        message:
            "Your pothole report (ISS-001) is now in progress. Repair crew has been assigned.",
        timestamp: "2024-01-18T10:30:00Z",
        read: false,
        issueId: "ISS-001",
        priority: "medium",
    },
    {
        id: "2",
        type: "resolved",
        title: "Issue Resolved",
        message:
            "Great news! Your garbage bin report (ISS-003) has been resolved. Thank you for helping improve our community.",
        timestamp: "2024-01-14T15:45:00Z",
        read: true,
        issueId: "ISS-003",
        priority: "high",
    },
    {
        id: "3",
        type: "assignment",
        title: "Issue Under Review",
        message:
            "Your streetlight report (ISS-005) is now being reviewed by the Electrical Services department.",
        timestamp: "2024-01-20T09:15:00Z",
        read: false,
        issueId: "ISS-005",
        priority: "medium",
    },
    {
        id: "4",
        type: "system",
        title: "Weekly Community Update",
        message:
            "This week: 23 new issues reported, 18 resolved. Your neighborhood saw 3 issues resolved!",
        timestamp: "2024-01-15T08:00:00Z",
        read: true,
        issueId: null,
        priority: "low",
    },
    {
        id: "5",
        type: "reminder",
        title: "Follow-up Required",
        message:
            "It's been 7 days since your pothole report. Is the issue still present? Please provide an update.",
        timestamp: "2024-01-13T12:00:00Z",
        read: false,
        issueId: "ISS-001",
        priority: "medium",
    },
];

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "status_update":
            return <AlertTriangle className="w-5 h-5 text-status-progress" />;
        case "resolved":
            return <CheckCircle className="w-5 h-5 text-status-resolved" />;
        case "assignment":
            return <Eye className="w-5 h-5 text-status-review" />;
        case "system":
            return <Bell className="w-5 h-5 text-accent" />;
        case "reminder":
            return <Clock className="w-5 h-5 text-status-review" />;
        default:
            return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "high":
            return "bg-destructive text-destructive-foreground shadow-sm";
        case "medium":
            return "bg-status-review text-white";
        case "low":
            return "bg-muted text-muted-foreground";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
};

export default function NotificationsPage() {
    const [notificationSettings, setNotificationSettings] = useState({
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        statusUpdates: true,
        weeklyDigest: true,
        communityUpdates: false,
    });

    const unreadNotifications = notifications.filter((n) => !n.read);
    const readNotifications = notifications.filter((n) => n.read);

    const handleSettingChange = (setting: string, value: boolean) => {
        setNotificationSettings((prev) => ({ ...prev, [setting]: value }));
    };

    const markAsRead = (notificationId: string) => {
        // In a real app, this would update the backend
        console.log(`Marking notification ${notificationId} as read`);
    };

    const markAllAsRead = () => {
        // In a real app, this would update the backend
        console.log("Marking all notifications as read");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="hover:bg-[#2E6A56]/10"
                            >
                                <Link href="/citizen/dashboard">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Notifications
                                </h1>
                                <p className="text-gray-600">
                                    Stay updated on your issues and community
                                    activity
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {unreadNotifications.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={markAllAsRead}
                                >
                                    Mark All Read
                                </Button>
                            )}
                            <Badge variant="secondary">
                                {unreadNotifications.length} unread
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <Tabs defaultValue="notifications" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="notifications">
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="notifications" className="space-y-4">
                        {/* Unread Notifications */}
                        {unreadNotifications.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Unread ({unreadNotifications.length})
                                </h3>
                                {unreadNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className="shadow-md border-0 bg-gradient-to-r from-white to-emerald-50/20"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-sm">
                                                                {
                                                                    notification.title
                                                                }
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {
                                                                    notification.message
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-2 ml-4">
                                                            <Badge
                                                                className={getPriorityColor(
                                                                    notification.priority
                                                                )}
                                                                variant="secondary"
                                                            >
                                                                {
                                                                    notification.priority
                                                                }
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    markAsRead(
                                                                        notification.id
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {formatTimestamp(
                                                                notification.timestamp
                                                            )}
                                                        </span>
                                                        {notification.issueId && (
                                                            <Link
                                                                href={`/citizen/issues?issue=${notification.issueId}`}
                                                                className="text-accent hover:underline"
                                                            >
                                                                View Issue{" "}
                                                                {
                                                                    notification.issueId
                                                                }
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Read Notifications */}
                        {readNotifications.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Earlier
                                </h3>
                                {readNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className="opacity-75 shadow-sm border-0 bg-white/80"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 mt-1 opacity-60">
                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-sm text-muted-foreground">
                                                                {
                                                                    notification.title
                                                                }
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {
                                                                    notification.message
                                                                }
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            className={getPriorityColor(
                                                                notification.priority
                                                            )}
                                                            variant="outline"
                                                        >
                                                            {
                                                                notification.priority
                                                            }
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {formatTimestamp(
                                                                notification.timestamp
                                                            )}
                                                        </span>
                                                        {notification.issueId && (
                                                            <Link
                                                                href={`/citizen/issues?issue=${notification.issueId}`}
                                                                className="text-accent hover:underline"
                                                            >
                                                                View Issue{" "}
                                                                {
                                                                    notification.issueId
                                                                }
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {notifications.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">
                                        No Notifications
                                    </h3>
                                    <p className="text-muted-foreground">
                                        You're all caught up! New notifications
                                        will appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Choose how you want to receive notifications
                                    about your issues and community updates.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Delivery Methods */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">
                                        Delivery Methods
                                    </h4>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="push">
                                                    Push Notifications
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive notifications on
                                                    your device
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="push"
                                            checked={
                                                notificationSettings.pushNotifications
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSettingChange(
                                                    "pushNotifications",
                                                    checked
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="email">
                                                    Email Notifications
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive notifications via
                                                    email
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="email"
                                            checked={
                                                notificationSettings.emailNotifications
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSettingChange(
                                                    "emailNotifications",
                                                    checked
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="sms">
                                                    SMS Notifications
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive notifications via
                                                    text message
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="sms"
                                            checked={
                                                notificationSettings.smsNotifications
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSettingChange(
                                                    "smsNotifications",
                                                    checked
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Notification Types */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">
                                        Notification Types
                                    </h4>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="status">
                                                Issue Status Updates
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified when your issues
                                                change status
                                            </p>
                                        </div>
                                        <Switch
                                            id="status"
                                            checked={
                                                notificationSettings.statusUpdates
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSettingChange(
                                                    "statusUpdates",
                                                    checked
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="weekly">
                                                Weekly Digest
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Weekly summary of community
                                                activity
                                            </p>
                                        </div>
                                        <Switch
                                            id="weekly"
                                            checked={
                                                notificationSettings.weeklyDigest
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSettingChange(
                                                    "weeklyDigest",
                                                    checked
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="community">
                                                Community Updates
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                News and announcements from your
                                                municipality
                                            </p>
                                        </div>
                                        <Switch
                                            id="community"
                                            checked={
                                                notificationSettings.communityUpdates
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSettingChange(
                                                    "communityUpdates",
                                                    checked
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <Button>Save Preferences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
