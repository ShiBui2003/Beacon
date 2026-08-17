"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Clock,
    Eye,
    AlertTriangle,
    CheckCircle,
    Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

type Issue = {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    location_address: string | null;
    image_url: string | null;
    upvotes: number; // Added for upvote-based ranking
    ai_urgency?: "low" | "medium" | "high" | null;
    ai_confidence?: number | null;
    created_at: string;
    updated_at: string;
    user_id: string;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "submitted":
            return "bg-status-submitted text-white shadow-md";
        case "in-review":
            return "bg-status-review text-white shadow-md";
        case "in-progress":
            return "bg-status-progress text-white shadow-md";
        case "resolved":
            return "bg-status-resolved text-white shadow-md";
        default:
            return "bg-muted text-muted-foreground shadow-md";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "submitted":
            return <Clock className="w-4 h-4" />;
        case "in-review":
            return <Eye className="w-4 h-4" />;
        case "in-progress":
            return <AlertTriangle className="w-4 h-4" />;
        case "resolved":
            return <CheckCircle className="w-4 h-4" />;
        default:
            return <Clock className="w-4 h-4" />;
    }
};

const getProgressPercentage = (status: string) => {
    switch (status) {
        case "submitted":
            return 25;
        case "in-review":
            return 50;
        case "in-progress":
            return 75;
        case "resolved":
            return 100;
        default:
            return 0;
    }
};

const getCategoryLabel = (category: string) => {
    switch (category) {
        case "pothole":
            return "Pothole";
        case "streetlight":
            return "Streetlight";
        case "garbage":
            return "Garbage";
        default:
            return "Other";
    }
};

export default function MyIssuesPage() {
    const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchMine = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`/api/issues?page=1&limit=100`, {
                    credentials: "include",
                });
                const json = await res.json();
                if (!res.ok)
                    throw new Error(json.error || "Failed to fetch issues");
                const mine = (json.issues || []).filter(
                    (i: Issue) => i.user_id === user.id
                );
                setIssues(mine);
            } catch (e: any) {
                setError(e.message || "Failed to load your issues");
            } finally {
                setLoading(false);
            }
        };
        fetchMine();
    }, [user?.id]);

    const activeIssues = useMemo(
        () =>
            issues
                .filter((i) => (i.status === "resolved") === false)
                .sort((a, b) => {
                    // Calculate combined scores using AI urgency and upvotes
                    const getCombinedScore = (issue: Issue) => {
                        const upvotes = issue.upvotes || 0;
                        const urgency = issue.ai_urgency || "medium";

                        // AI urgency weight: low=1, medium=2, high=3
                        const urgencyWeight =
                            urgency === "high"
                                ? 3
                                : urgency === "medium"
                                ? 2
                                : 1;
                        const upvoteScore = Math.log(1 + upvotes);

                        // Combined score: 0.7 * AI urgency + 0.3 * log(1 + upvotes)
                        return 0.7 * urgencyWeight + 0.3 * upvoteScore;
                    };

                    const scoreA = getCombinedScore(a);
                    const scoreB = getCombinedScore(b);
                    const scoreDiff = scoreB - scoreA;

                    if (scoreDiff !== 0) return scoreDiff;

                    // Secondary sort: by creation date (descending) for stable sorting
                    return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    );
                }),
        [issues]
    );

    const resolvedIssues = useMemo(
        () =>
            issues
                .filter((i) => i.status === "resolved")
                .sort((a, b) => {
                    // Calculate combined scores using AI urgency and upvotes
                    const getCombinedScore = (issue: Issue) => {
                        const upvotes = issue.upvotes || 0;
                        const urgency = issue.ai_urgency || "medium";

                        // AI urgency weight: low=1, medium=2, high=3
                        const urgencyWeight =
                            urgency === "high"
                                ? 3
                                : urgency === "medium"
                                ? 2
                                : 1;
                        const upvoteScore = Math.log(1 + upvotes);

                        // Combined score: 0.7 * AI urgency + 0.3 * log(1 + upvotes)
                        return 0.7 * urgencyWeight + 0.3 * upvoteScore;
                    };

                    const scoreA = getCombinedScore(a);
                    const scoreB = getCombinedScore(b);
                    const scoreDiff = scoreB - scoreA;

                    if (scoreDiff !== 0) return scoreDiff;

                    // Secondary sort: by creation date (descending) for stable sorting
                    return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    );
                }),
        [issues]
    );

    const selectedIssueData =
        issues.find((issue) => issue.id === selectedIssue) || null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <div className="responsive-container py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="flex-shrink-0"
                            >
                                <Link href="/citizen/dashboard">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">
                                        Back to Dashboard
                                    </span>
                                    <span className="sm:hidden">Back</span>
                                </Link>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="responsive-heading-2">
                                    My Issues
                                </h1>
                                <p className="responsive-body text-muted-foreground">
                                    Track the progress of your reported issues
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            className="w-full sm:w-auto responsive-button"
                        >
                            <Link href="/citizen/report">
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">
                                    Report New Issue
                                </span>
                                <span className="sm:hidden">Report Issue</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="responsive-container py-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Issues List */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="active" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger
                                    value="active"
                                    className="text-xs sm:text-sm"
                                >
                                    <span className="hidden sm:inline">
                                        Active Issues
                                    </span>
                                    <span className="sm:hidden">Active</span>
                                    <span className="ml-1">
                                        ({activeIssues.length})
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="resolved"
                                    className="text-xs sm:text-sm"
                                >
                                    <span className="hidden sm:inline">
                                        Resolved
                                    </span>
                                    <span className="sm:hidden">Done</span>
                                    <span className="ml-1">
                                        ({resolvedIssues.length})
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="space-y-4">
                                {loading && (
                                    <Card className="responsive-card">
                                        <CardContent className="responsive-card-content text-center">
                                            <div className="responsive-loading">
                                                <div className="text-sm text-muted-foreground">
                                                    Loading your issues...
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {error && (
                                    <Card className="responsive-card">
                                        <CardContent className="responsive-card-content text-center">
                                            <div className="responsive-error">
                                                <div className="text-sm text-red-600">
                                                    {error}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {!loading &&
                                !error &&
                                activeIssues.length === 0 ? (
                                    <Card className="responsive-card">
                                        <CardContent className="responsive-card-content text-center">
                                            <div className="responsive-empty">
                                                <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-base sm:text-lg font-semibold mb-2">
                                                    No Active Issues
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                                                    You don't have any active
                                                    issues at the moment.
                                                </p>
                                                <Button
                                                    asChild
                                                    className="responsive-button"
                                                >
                                                    <Link href="/citizen/report">
                                                        Report Your First Issue
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    activeIssues.map((issue) => (
                                        <Card
                                            key={issue.id}
                                            className={`responsive-card cursor-pointer transition-all hover:shadow-md ${
                                                selectedIssue === issue.id
                                                    ? "ring-2 ring-accent"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setSelectedIssue(issue.id)
                                            }
                                        >
                                            <CardContent className="responsive-card-content">
                                                {/* Mobile Layout: Stacked */}
                                                <div className="block sm:hidden space-y-3">
                                                    {/* Image at top for mobile */}
                                                    <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                                                        <img
                                                            src={
                                                                issue.image_url ||
                                                                "/placeholder.svg"
                                                            }
                                                            alt={issue.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>

                                                    {/* Content below image */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                                                                    {
                                                                        issue.title
                                                                    }
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    ID:{" "}
                                                                    {issue.id.slice(
                                                                        0,
                                                                        8
                                                                    )}
                                                                    ...
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                className={`${getStatusColor(
                                                                    issue.status.replace(
                                                                        "_",
                                                                        "-"
                                                                    )
                                                                )} text-xs`}
                                                            >
                                                                {getStatusIcon(
                                                                    issue.status
                                                                )}
                                                                <span className="ml-1 capitalize text-xs">
                                                                    {issue.status.replace(
                                                                        /[_-]/g,
                                                                        " "
                                                                    )}
                                                                </span>
                                                            </Badge>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {issue.location_address ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    {new Date(
                                                                        issue.created_at
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {getCategoryLabel(
                                                                        issue.category
                                                                    )}
                                                                </Badge>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span>
                                                                        Progress
                                                                    </span>
                                                                    <span>
                                                                        {getProgressPercentage(
                                                                            issue.status.replace(
                                                                                "_",
                                                                                "-"
                                                                            )
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <Progress
                                                                    value={getProgressPercentage(
                                                                        issue.status.replace(
                                                                            "_",
                                                                            "-"
                                                                        )
                                                                    )}
                                                                    className="h-1.5"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Desktop Layout: Side by side */}
                                                <div className="hidden sm:flex gap-4">
                                                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={
                                                                issue.image_url ||
                                                                "/placeholder.svg"
                                                            }
                                                            alt={issue.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold truncate">
                                                                    {
                                                                        issue.title
                                                                    }
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    ID:{" "}
                                                                    {issue.id}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                className={getStatusColor(
                                                                    issue.status.replace(
                                                                        "_",
                                                                        "-"
                                                                    )
                                                                )}
                                                            >
                                                                {getStatusIcon(
                                                                    issue.status
                                                                )}
                                                                <span className="ml-1 capitalize">
                                                                    {issue.status.replace(
                                                                        /[_-]/g,
                                                                        " "
                                                                    )}
                                                                </span>
                                                            </Badge>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {issue.location_address ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-4 h-4 mr-1" />
                                                                    {new Date(
                                                                        issue.created_at
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                                <Badge variant="outline">
                                                                    {getCategoryLabel(
                                                                        issue.category
                                                                    )}
                                                                </Badge>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>
                                                                        Progress
                                                                    </span>
                                                                    <span>
                                                                        {getProgressPercentage(
                                                                            issue.status.replace(
                                                                                "_",
                                                                                "-"
                                                                            )
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <Progress
                                                                    value={getProgressPercentage(
                                                                        issue.status.replace(
                                                                            "_",
                                                                            "-"
                                                                        )
                                                                    )}
                                                                    className="h-2"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="resolved" className="space-y-4">
                                {resolvedIssues.map((issue) => (
                                    <Card
                                        key={issue.id}
                                        className={`responsive-card cursor-pointer transition-all hover:shadow-md ${
                                            selectedIssue === issue.id
                                                ? "ring-2 ring-accent"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setSelectedIssue(issue.id)
                                        }
                                    >
                                        <CardContent className="responsive-card-content">
                                            {/* Mobile Layout: Stacked */}
                                            <div className="block sm:hidden space-y-3">
                                                {/* Image at top for mobile */}
                                                <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                                                    <img
                                                        src={
                                                            issue.image_url ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt={issue.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Content below image */}
                                                <div className="space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                                                                {issue.title}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                ID:{" "}
                                                                {issue.id.slice(
                                                                    0,
                                                                    8
                                                                )}
                                                                ...
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            className={`${getStatusColor(
                                                                issue.status
                                                            )} text-xs`}
                                                        >
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            <span className="text-xs">
                                                                Resolved
                                                            </span>
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {issue.location_address ||
                                                                    "N/A"}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            <span>
                                                                Resolved{" "}
                                                                {new Date(
                                                                    issue.updated_at ||
                                                                        issue.created_at
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop Layout: Side by side */}
                                            <div className="hidden sm:flex gap-4">
                                                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={
                                                            issue.image_url ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt={issue.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-semibold">
                                                                {issue.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                ID: {issue.id}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            className={getStatusColor(
                                                                issue.status
                                                            )}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Resolved
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <div className="flex items-center">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            {issue.location_address ||
                                                                "N/A"}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            Resolved{" "}
                                                            {new Date(
                                                                issue.updated_at ||
                                                                    issue.created_at
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Issue Details */}
                    <div className="lg:col-span-1">
                        {selectedIssueData ? (
                            <Card className="responsive-card sticky top-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="responsive-heading-3">
                                            Issue Details
                                        </span>
                                        <Badge
                                            className={getStatusColor(
                                                selectedIssueData.status.replace(
                                                    "_",
                                                    "-"
                                                )
                                            )}
                                        >
                                            {getStatusIcon(
                                                selectedIssueData.status
                                            )}
                                            <span className="ml-1 capitalize text-xs sm:text-sm">
                                                {selectedIssueData.status.replace(
                                                    /[_-]/g,
                                                    " "
                                                )}
                                            </span>
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {selectedIssueData.id}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="responsive-card-content space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-sm sm:text-base">
                                            {selectedIssueData.title}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            {selectedIssueData.description}
                                        </p>
                                    </div>

                                    <div className="w-full h-32 sm:h-48 bg-muted rounded-lg overflow-hidden">
                                        <img
                                            src={
                                                selectedIssueData.image_url ||
                                                "/placeholder.svg"
                                            }
                                            alt={selectedIssueData.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Location:
                                            </span>
                                            <span className="text-right max-w-[60%] truncate">
                                                {selectedIssueData.location_address ||
                                                    "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Category:
                                            </span>
                                            <span>
                                                {getCategoryLabel(
                                                    selectedIssueData.category
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Reported:
                                            </span>
                                            <span>
                                                {new Date(
                                                    selectedIssueData.created_at
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Last Updated:
                                            </span>
                                            <span>
                                                {new Date(
                                                    selectedIssueData.updated_at ||
                                                        selectedIssueData.created_at
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="responsive-card">
                                <CardContent className="responsive-card-content text-center">
                                    <Eye className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                                        Select an Issue
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Click on any issue to view detailed
                                        information and timeline.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
