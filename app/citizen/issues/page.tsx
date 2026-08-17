"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    ArrowUpRight,
    TrendingUp,
    FileText,
    Image as ImageIcon,
    ExternalLink,
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
    upvotes: number;
    created_at: string;
    updated_at: string;
    user_id: string;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "submitted":
            return "bg-blue-500 hover:bg-blue-600 text-white";
        case "in-review":
            return "bg-yellow-500 hover:bg-yellow-600 text-white";
        case "in-progress":
            return "bg-orange-500 hover:bg-orange-600 text-white";
        case "resolved":
            return "bg-green-500 hover:bg-green-600 text-white";
        default:
            return "bg-gray-500 hover:bg-gray-600 text-white";
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
    const labels: Record<string, string> = {
        Roads: "Roads & Infrastructure",
        Lighting: "Street Lighting",
        Sanitation: "Sanitation & Waste",
        Water: "Water & Sewage",
        Traffic: "Traffic & Safety",
        pothole: "Pothole",
        streetlight: "Streetlight",
        garbage: "Garbage",
    };
    return labels[category] || "Other";
};

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        Roads: "bg-red-100 text-red-800 shadow-sm",
        Lighting: "bg-yellow-100 text-yellow-800 shadow-sm",
        Sanitation: "bg-green-100 text-green-800 shadow-sm",
        Water: "bg-blue-100 text-blue-800 shadow-sm",
        Traffic: "bg-purple-100 text-purple-800 shadow-sm",
        pothole: "bg-red-100 text-red-800 shadow-sm",
        streetlight: "bg-yellow-100 text-yellow-800 shadow-sm",
        garbage: "bg-green-100 text-green-800 shadow-sm",
    };
    return colors[category] || "bg-gray-100 text-gray-800 shadow-sm";
};

const LoadingSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3].map((i) => (
            <Card key={i}>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                            <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

export default function MyIssuesPage() {
    const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();

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
                .filter((i) => i.status !== "resolved")
                .sort((a, b) => {
                    const upvoteDiff = (b.upvotes || 0) - (a.upvotes || 0);
                    if (upvoteDiff !== 0) return upvoteDiff;
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
                    const upvoteDiff = (b.upvotes || 0) - (a.upvotes || 0);
                    if (upvoteDiff !== 0) return upvoteDiff;
                    return (
                        new Date(b.updated_at || b.created_at).getTime() -
                        new Date(a.updated_at || a.created_at).getTime()
                    );
                }),
        [issues]
    );

    const selectedIssueData =
        issues.find((issue) => issue.id === selectedIssue) || null;

    const handleIssueClick = (issueId: string) => {
        router.push(`/citizen/issues/${issueId}`);
    };

    const totalUpvotes = issues.reduce(
        (sum, issue) => sum + (issue.upvotes || 0),
        0
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Enhanced Header with Stats - Mobile Responsive */}
            <div className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                \n{" "}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="hover:bg-gray-100 flex-shrink-0"
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
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                    My Issues
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                    Track the progress of your reported issues
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md w-full sm:w-auto"
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

                    {/* Stats Cards - Mobile Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md border-0 transition-all duration-200 hover:shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">
                                            <span className="hidden sm:inline">
                                                Total Issues
                                            </span>
                                            <span className="sm:hidden">
                                                Total
                                            </span>
                                        </p>
                                        <p className="text-lg sm:text-2xl font-bold text-blue-900">
                                            {issues.length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md border-0 transition-all duration-200 hover:shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-orange-600 truncate">
                                            Active
                                        </p>
                                        <p className="text-lg sm:text-2xl font-bold text-orange-900">
                                            {activeIssues.length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-green-50 border-green-200 transition-all duration-200 hover:shadow-md">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-green-600 truncate">
                                            Resolved
                                        </p>
                                        <p className="text-lg sm:text-2xl font-bold text-green-900">
                                            {resolvedIssues.length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-purple-50 border-purple-200 transition-all duration-200 hover:shadow-md col-span-2 sm:col-span-2 lg:col-span-1">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">
                                            <span className="hidden sm:inline">
                                                Total Upvotes
                                            </span>
                                            <span className="sm:hidden">
                                                Upvotes
                                            </span>
                                        </p>
                                        <p className="text-lg sm:text-2xl font-bold text-purple-900">
                                            {totalUpvotes}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Enhanced Issues List */}
                    <div className="lg:col-span-2">
                        <Tabs
                            defaultValue="active"
                            className="space-y-4 sm:space-y-6"
                        >
                            <TabsList className="grid w-full grid-cols-2 bg-white border shadow-sm h-12 sm:h-auto">
                                <TabsTrigger
                                    value="active"
                                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-sm sm:text-base px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] sm:min-h-auto"
                                >
                                    <span className="hidden sm:inline">
                                        Active Issues ({activeIssues.length})
                                    </span>
                                    <span className="sm:hidden">
                                        Active ({activeIssues.length})
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="resolved"
                                    className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 text-sm sm:text-base px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] sm:min-h-auto"
                                >
                                    <span className="hidden sm:inline">
                                        Resolved ({resolvedIssues.length})
                                    </span>
                                    <span className="sm:hidden">
                                        Done ({resolvedIssues.length})
                                    </span>
                                </TabsTrigger>
                            </TabsList>{" "}
                            <TabsContent value="active" className="space-y-4">
                                {loading && <LoadingSkeleton />}

                                {error && (
                                    <Card className="border-red-200 bg-red-50">
                                        <CardContent className="p-6 text-center">
                                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                            <p className="text-red-700 font-medium">
                                                {error}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {!loading &&
                                !error &&
                                activeIssues.length === 0 ? (
                                    <Card className="border-dashed border-2 border-gray-300">
                                        <CardContent className="p-12 text-center">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <AlertTriangle className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                No Active Issues
                                            </h3>
                                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                                You don't have any active issues
                                                at the moment. Help improve your
                                                community by reporting problems
                                                you encounter.
                                            </p>
                                            <Button
                                                asChild
                                                size="lg"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Link href="/citizen/report">
                                                    <Plus className="w-5 h-5 mr-2" />
                                                    Report Your First Issue
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    activeIssues.map((issue) => (
                                        <Card
                                            key={issue.id}
                                            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white border-gray-200 overflow-hidden w-full max-w-full"
                                            onClick={() =>
                                                handleIssueClick(issue.id)
                                            }
                                        >
                                            <CardContent className="p-0 w-full">
                                                {/* Mobile Layout: Instagram-style stacked layout */}
                                                <div className="block sm:hidden w-full">
                                                    {/* Full-width image at top for mobile */}
                                                    <div className="w-full h-48 bg-gray-100 overflow-hidden">
                                                        {issue.image_url ? (
                                                            <img
                                                                src={
                                                                    issue.image_url
                                                                }
                                                                alt={
                                                                    issue.title
                                                                }
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="w-12 h-12 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content stacked below image */}
                                                    <div className="p-3 sm:p-4 space-y-3 w-full overflow-hidden">
                                                        <div className="flex items-start justify-between gap-2 w-full">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2 leading-tight break-words">
                                                                    {
                                                                        issue.title
                                                                    }
                                                                </h3>
                                                                <p className="text-xs text-gray-500 font-mono truncate">
                                                                    #
                                                                    {issue.id.slice(
                                                                        0,
                                                                        8
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                className={`${getStatusColor(
                                                                    issue.status.replace(
                                                                        "_",
                                                                        "-"
                                                                    )
                                                                )} flex-shrink-0 text-xs whitespace-nowrap`}
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

                                                        {issue.upvotes > 0 && (
                                                            <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit">
                                                                <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                <span className="whitespace-nowrap">
                                                                    {
                                                                        issue.upvotes
                                                                    }{" "}
                                                                    upvotes
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2 w-full">
                                                            <div className="flex items-start text-xs text-gray-600 w-full">
                                                                <MapPin className="w-3 h-3 mr-2 flex-shrink-0 text-gray-400 mt-0.5" />
                                                                <span className="break-words line-clamp-2 flex-1">
                                                                    {issue.location_address ||
                                                                        "Location not specified"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between text-xs gap-2 w-full">
                                                                <div className="flex items-center text-gray-600 flex-shrink-0">
                                                                    <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                                                    <span className="whitespace-nowrap">
                                                                        {new Date(
                                                                            issue.created_at
                                                                        ).toLocaleDateString(
                                                                            "en-US",
                                                                            {
                                                                                month: "short",
                                                                                day: "numeric",
                                                                                year: "numeric",
                                                                            }
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`${getCategoryColor(
                                                                        issue.category
                                                                    )} text-xs flex-shrink-0 whitespace-nowrap`}
                                                                >
                                                                    {getCategoryLabel(
                                                                        issue.category
                                                                    )}
                                                                </Badge>
                                                            </div>

                                                            <div className="space-y-2 w-full">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-600 font-medium">
                                                                        Progress
                                                                    </span>
                                                                    <span className="text-gray-900 font-semibold">
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
                                                                    className="h-1.5 w-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Desktop/Tablet Layout: Side-by-side layout */}
                                                <div className="hidden sm:block p-6">
                                                    <div className="flex gap-4">
                                                        <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border">
                                                            {issue.image_url ? (
                                                                <img
                                                                    src={
                                                                        issue.image_url
                                                                    }
                                                                    alt={
                                                                        issue.title
                                                                    }
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1 min-w-0 pr-4">
                                                                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                                                                        {
                                                                            issue.title
                                                                        }
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 font-mono">
                                                                        #
                                                                        {issue.id.slice(
                                                                            0,
                                                                            8
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
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
                                                                        <span className="ml-2 capitalize">
                                                                            {issue.status.replace(
                                                                                /[_-]/g,
                                                                                " "
                                                                            )}
                                                                        </span>
                                                                    </Badge>
                                                                    {issue.upvotes >
                                                                        0 && (
                                                                        <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                                            <TrendingUp className="w-3 h-3 mr-1" />
                                                                            {
                                                                                issue.upvotes
                                                                            }{" "}
                                                                            upvotes
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                                                                    <span className="truncate">
                                                                        {issue.location_address ||
                                                                            "Location not specified"}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center text-gray-600">
                                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                                        {new Date(
                                                                            issue.created_at
                                                                        ).toLocaleDateString(
                                                                            "en-US",
                                                                            {
                                                                                month: "short",
                                                                                day: "numeric",
                                                                                year: "numeric",
                                                                            }
                                                                        )}
                                                                    </div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={getCategoryColor(
                                                                            issue.category
                                                                        )}
                                                                    >
                                                                        {getCategoryLabel(
                                                                            issue.category
                                                                        )}
                                                                    </Badge>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-gray-600 font-medium">
                                                                            Progress
                                                                        </span>
                                                                        <span className="text-gray-900 font-semibold">
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

                                                        <div className="flex-shrink-0 ml-2">
                                                            <ArrowUpRight className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>
                            <TabsContent value="resolved" className="space-y-4">
                                {resolvedIssues.length === 0 ? (
                                    <Card className="border-dashed border-2 border-gray-300">
                                        <CardContent className="p-12 text-center">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <CheckCircle className="w-10 h-10 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                No Resolved Issues Yet
                                            </h3>
                                            <p className="text-gray-600 max-w-md mx-auto">
                                                Once your reported issues are
                                                resolved, they will appear here.
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    resolvedIssues.map((issue) => (
                                        <Card
                                            key={issue.id}
                                            className="cursor-pointer transition-all duration-200 hover:shadow-md bg-white border-green-200 overflow-hidden w-full max-w-full"
                                            onClick={() =>
                                                handleIssueClick(issue.id)
                                            }
                                        >
                                            <CardContent className="p-0 w-full">
                                                {/* Mobile Layout: Instagram-style stacked layout */}
                                                <div className="block sm:hidden w-full">
                                                    {/* Full-width image at top for mobile */}
                                                    <div className="w-full h-48 bg-gray-100 overflow-hidden">
                                                        {issue.image_url ? (
                                                            <img
                                                                src={
                                                                    issue.image_url
                                                                }
                                                                alt={
                                                                    issue.title
                                                                }
                                                                className="w-full h-full object-cover opacity-75"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="w-12 h-12 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content stacked below image */}
                                                    <div className="p-3 sm:p-4 space-y-3 w-full overflow-hidden">
                                                        <div className="flex items-start justify-between gap-2 w-full">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2 leading-tight break-words">
                                                                    {
                                                                        issue.title
                                                                    }
                                                                </h3>
                                                                <p className="text-xs text-gray-500 font-mono truncate">
                                                                    #
                                                                    {issue.id.slice(
                                                                        0,
                                                                        8
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs flex-shrink-0 whitespace-nowrap">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Resolved
                                                            </Badge>
                                                        </div>

                                                        {issue.upvotes > 0 && (
                                                            <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit">
                                                                <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                <span className="whitespace-nowrap">
                                                                    {
                                                                        issue.upvotes
                                                                    }{" "}
                                                                    upvotes
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2 w-full">
                                                            <div className="flex items-start text-xs text-gray-600 w-full">
                                                                <MapPin className="w-3 h-3 mr-2 flex-shrink-0 text-gray-400 mt-0.5" />
                                                                <span className="break-words line-clamp-2 flex-1">
                                                                    {issue.location_address ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center text-xs text-green-600 w-full">
                                                                <Calendar className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                                                                <span className="font-medium break-words">
                                                                    Resolved{" "}
                                                                    {new Date(
                                                                        issue.updated_at ||
                                                                            issue.created_at
                                                                    ).toLocaleDateString(
                                                                        "en-US",
                                                                        {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Desktop/Tablet Layout: Side-by-side layout */}
                                                <div className="hidden sm:block p-6">
                                                    <div className="flex gap-4">
                                                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border">
                                                            {issue.image_url ? (
                                                                <img
                                                                    src={
                                                                        issue.image_url
                                                                    }
                                                                    alt={
                                                                        issue.title
                                                                    }
                                                                    className="w-full h-full object-cover opacity-75"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                                                                        {
                                                                            issue.title
                                                                        }
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 font-mono">
                                                                        #
                                                                        {issue.id.slice(
                                                                            0,
                                                                            8
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                        Resolved
                                                                    </Badge>
                                                                    {issue.upvotes >
                                                                        0 && (
                                                                        <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                                            <TrendingUp className="w-3 h-3 mr-1" />
                                                                            {
                                                                                issue.upvotes
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between text-sm text-gray-600">
                                                                <div className="flex items-center">
                                                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                                                    <span className="truncate">
                                                                        {issue.location_address ||
                                                                            "N/A"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                                    <span className="text-green-600 font-medium">
                                                                        Resolved{" "}
                                                                        {new Date(
                                                                            issue.updated_at ||
                                                                                issue.created_at
                                                                        ).toLocaleDateString(
                                                                            "en-US",
                                                                            {
                                                                                month: "short",
                                                                                day: "numeric",
                                                                            }
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-shrink-0 ml-2">
                                                            <ExternalLink className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Enhanced Issue Details Sidebar */}
                    <div className="lg:col-span-1">
                        {selectedIssueData ? (
                            <Card className="sticky top-6 shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Issue Details
                                        </CardTitle>
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
                                            <span className="ml-2 capitalize">
                                                {selectedIssueData.status.replace(
                                                    /[_-]/g,
                                                    " "
                                                )}
                                            </span>
                                        </Badge>
                                    </div>
                                    <CardDescription className="font-mono">
                                        #{selectedIssueData.id.slice(0, 8)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">
                                            {selectedIssueData.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {selectedIssueData.description}
                                        </p>
                                    </div>

                                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden border">
                                        {selectedIssueData.image_url ? (
                                            <img
                                                src={
                                                    selectedIssueData.image_url
                                                }
                                                alt={selectedIssueData.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600 font-medium">
                                                Location
                                            </span>
                                            <span className="text-gray-900 text-right flex-1 ml-4">
                                                {selectedIssueData.location_address ||
                                                    "Not specified"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600 font-medium">
                                                Category
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={getCategoryColor(
                                                    selectedIssueData.category
                                                )}
                                            >
                                                {getCategoryLabel(
                                                    selectedIssueData.category
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600 font-medium">
                                                Reported
                                            </span>
                                            <span className="text-gray-900">
                                                {new Date(
                                                    selectedIssueData.created_at
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-600 font-medium">
                                                Last Updated
                                            </span>
                                            <span className="text-gray-900">
                                                {new Date(
                                                    selectedIssueData.updated_at ||
                                                        selectedIssueData.created_at
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={() =>
                                            handleIssueClick(
                                                selectedIssueData.id
                                            )
                                        }
                                    >
                                        View Full Details
                                        <ArrowUpRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="sticky top-6 shadow-lg">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Eye className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Select an Issue
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Click on any issue from the list to view
                                        detailed information, timeline, and
                                        updates.
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
