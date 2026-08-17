"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    Building2,
    AlertCircle,
    Clock,
    CheckCircle,
    FileText,
    ExternalLink,
    Map as MapIcon,
    MessageCircle,
} from "lucide-react";
import AdminIssueStatusUpdater from "@/components/admin-issue-status-updater";
import AdminDepartmentAssigner from "@/components/admin-department-assigner";
import AdminUserAssigner from "@/components/admin-user-assigner";
import CitizenComments from "@/components/citizen-comments";
import GoogleMapsEmbed from "@/components/google-maps-embed";
import InteractiveGoogleMap from "@/components/interactive-google-map";

interface Issue {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    location_address: string;
    location_lat: number;
    location_lng: number;
    landmark?: string;
    image_url?: string;
    audio_url?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    estimated_completion?: string;
    profiles?: {
        full_name: string;
        email: string;
    };
    department?: {
        id: string;
        name: string;
        email: string;
        description?: string;
    };
    assigned_profile?: {
        full_name: string;
        email: string;
    };
    comments_count?: number;
    votes_count?: number;
}

const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
    urgent: "bg-red-200 text-red-900",
};

const statusColors = {
    submitted: "bg-blue-100 text-blue-800",
    assigned: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
};

export default function AdminIssueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const issueId = params.id as string;

    const fetchIssue = async () => {
        try {
            const response = await fetch(`/api/issues?id=${issueId}`);
            if (response.ok) {
                const data = await response.json();
                setIssue(data.issue);
            } else {
                setError("Issue not found");
            }
        } catch (error) {
            console.error("Error fetching issue:", error);
            setError("Failed to load issue");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = (newStatus: string, assignedTo?: string) => {
        if (issue) {
            setIssue({
                ...issue,
                status: newStatus,
                assigned_profile: assignedTo
                    ? { full_name: "Updated", email: "" }
                    : issue.assigned_profile,
            });
        }
    };

    const handleDepartmentAssigned = (department: any) => {
        if (issue) {
            setIssue({
                ...issue,
                department: {
                    id: department.id,
                    name: department.name,
                    email: department.email || "",
                    description: department.description,
                },
            });
        }
    };

    const handleUserAssigned = (
        user: { id: string; full_name: string | null; email: string } | null
    ) => {
        if (issue) {
            setIssue({
                ...issue,
                assigned_profile: user
                    ? { full_name: user.full_name || "", email: user.email }
                    : undefined,
            });
        }
    };

    useEffect(() => {
        if (issueId) {
            fetchIssue();
        }
    }, [issueId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-64 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-96 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !issue) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Issue Not Found</h1>
                    <p className="text-muted-foreground mb-4">
                        {error ||
                            "The issue you are looking for does not exist."}
                    </p>
                    <Button asChild>
                        <Link href="/admin/issues">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Issues
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/issues">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Issues
                    </Link>
                </Button>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {issue.title}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Issue #{issue.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>
                                Reported{" "}
                                {new Date(
                                    issue.created_at
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            className={
                                priorityColors[
                                    issue.priority as keyof typeof priorityColors
                                ]
                            }
                        >
                            {issue.priority.charAt(0).toUpperCase() +
                                issue.priority.slice(1)}{" "}
                            Priority
                        </Badge>
                        <Badge
                            className={
                                statusColors[
                                    issue.status as keyof typeof statusColors
                                ]
                            }
                        >
                            {issue.status
                                .replace("_", " ")
                                .charAt(0)
                                .toUpperCase() +
                                issue.status.replace("_", " ").slice(1)}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Issue Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Issue Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">
                                    Description
                                </h3>
                                <p className="text-muted-foreground">
                                    {issue.description}
                                </p>
                            </div>

                            {issue.audio_url && (
                                <div>
                                    <h3 className="font-medium mb-2">
                                        Audio Recording
                                    </h3>
                                    <audio
                                        src={issue.audio_url}
                                        controls
                                        className="w-full"
                                        preload="metadata"
                                    />
                                </div>
                            )}

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1">
                                        Category
                                    </h4>
                                    <p className="text-muted-foreground capitalize">
                                        {issue.category.replace("-", " ")}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1">
                                        Priority
                                    </h4>
                                    <p className="text-muted-foreground capitalize">
                                        {issue.priority}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Location with Map */}
                            <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </h4>
                                <p className="text-muted-foreground mb-2">
                                    {issue.location_address}
                                </p>
                                {issue.landmark && (
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Landmark: {issue.landmark}
                                    </p>
                                )}

                                {/* Interactive Map */}
                                <div className="mb-3">
                                    <InteractiveGoogleMap
                                        lat={issue.location_lat}
                                        lng={issue.location_lng}
                                        address={issue.location_address}
                                        height={300}
                                        zoom={16}
                                    />
                                </div>

                                {/* Map Action Buttons */}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={`https://maps.google.com/?q=${issue.location_lat},${issue.location_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Open in Google Maps
                                        </a>
                                    </Button>

                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${issue.location_lat},${issue.location_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MapIcon className="w-4 h-4 mr-2" />
                                            Get Directions
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {issue.image_url && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Photo
                                        </h4>
                                        <img
                                            src={issue.image_url}
                                            alt="Issue photo"
                                            className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer"
                                            onClick={() =>
                                                window.open(
                                                    issue.image_url,
                                                    "_blank"
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reporter Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporter Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Reporter
                                    </h4>
                                    <p className="text-muted-foreground">
                                        {issue.profiles?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {issue.profiles?.email}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Reported Date
                                    </h4>
                                    <p className="text-muted-foreground">
                                        {new Date(
                                            issue.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {issue.department && (
                                    <div>
                                        <h4 className="font-medium mb-1 flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Department
                                        </h4>
                                        <p className="text-muted-foreground">
                                            {issue.department.name}
                                        </p>
                                        {issue.department.email && (
                                            <p className="text-sm text-muted-foreground">
                                                {issue.department.email}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <h4 className="font-medium mb-1 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Assigned To
                                    </h4>
                                    {issue.assigned_profile ? (
                                        <>
                                            <p className="text-muted-foreground">
                                                {
                                                    issue.assigned_profile
                                                        .full_name
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {issue.assigned_profile.email}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">
                                            Not assigned
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Timeline Information */}
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {issue.estimated_completion && (
                                    <div>
                                        <h4 className="font-medium mb-1 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Estimated Completion
                                        </h4>
                                        <p className="text-muted-foreground">
                                            {new Date(
                                                issue.estimated_completion
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {issue.completed_at && (
                                    <div>
                                        <h4 className="font-medium mb-1 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Completed On
                                        </h4>
                                        <p className="text-muted-foreground">
                                            {new Date(
                                                issue.completed_at
                                            ).toLocaleDateString()}{" "}
                                            at{" "}
                                            {new Date(
                                                issue.completed_at
                                            ).toLocaleTimeString()}
                                        </p>
                                        <Badge className="bg-green-100 text-green-800 mt-1">
                                            Resolved
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {!issue.department && !issue.assigned_profile && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>
                                        This issue is awaiting assignment to a
                                        department.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Citizen Comments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Citizen Comments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CitizenComments issueId={issue.id} />
                        </CardContent>
                    </Card>
                </div>

                {/* Status Update Sidebar */}
                <div className="space-y-6">
                    <AdminDepartmentAssigner
                        issueId={issue.id}
                        issueCategory={issue.category}
                        currentDepartment={
                            issue.department
                                ? {
                                      id: issue.department.id,
                                      name: issue.department.name,
                                  }
                                : undefined
                        }
                        onDepartmentAssigned={handleDepartmentAssigned}
                    />

                    <AdminUserAssigner
                        issueId={issue.id}
                        departmentId={issue.department?.id}
                        currentAssignee={issue.assigned_profile || null}
                        onAssigned={handleUserAssigned}
                    />
                    {/* 
                    <AdminIssueStatusUpdater
                        issueId={issue.id}
                        currentStatus={issue.status}
                        currentAssignedTo={undefined}
                        departmentId={issue.department?.id}
                        onStatusUpdate={handleStatusUpdate}
                    /> */}

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href="/admin/issues">
                                    <FileText className="w-4 h-4 mr-2" />
                                    View All Issues
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href="/admin/dashboard">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Admin Dashboard
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                asChild
                            >
                                <a
                                    href={`https://maps.google.com/maps/dir/?api=1&destination=${issue.location_lat},${issue.location_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <MapIcon className="w-4 h-4 mr-2" />
                                    Navigate to Location
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
