"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MapPin,
    Plus,
    Search,
    Map as MapIcon,
    List,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    ThumbsUp,
    MessageCircle,
    Shield,
} from "lucide-react";
import { GoogleMap } from "@/components/ui/google-map";
import { FallbackMap } from "@/components/ui/fallback-map";
import { createClient } from "@/lib/supabase/client";
import AIUrgencyBadge from "@/components/ai-urgency-badge";

type Issue = {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    location_address: string | null;
    location_lat: number | null;
    location_lng: number | null;
    image_url: string | null;
    created_at: string;
    upvotes?: number | null;
    ai_urgency?: "low" | "medium" | "high" | null;
    ai_confidence?: number | null;
};

interface Department {
    id: string;
    name: string;
    email: string;
    description?: string;
    created_at: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "submitted":
            return "bg-status-submitted text-white";
        case "in-review":
            return "bg-status-review text-white";
        case "in-progress":
            return "bg-status-progress text-white";
        case "resolved":
            return "bg-status-resolved text-white";
        default:
            return "bg-muted text-muted-foreground";
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

const getCategoryLabel = (category: string) => {
    switch (category) {
        case "pothole":
            return "Pothole";
        case "streetlight":
            return "Streetlight";
        case "garbage":
            return "Garbage";
        case "water-leakage":
            return "Water Leakage";
        default:
            return "Other";
    }
};

export default function CitizenDashboard() {
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [issues, setIssues] = useState<Issue[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Map-related state
    const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const supabase = createClient();
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco

    // Get user's current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by this browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                setLocationError(null);
            },
            (error) => {
                console.error("Error getting location:", error);
                setLocationError("Unable to get your location");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
            }
        );
    };

    // Fetch issues function (extracted so it can be called from realtime updates)
    const fetchIssues = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch issues with profiles
            const { data, error: fetchError } = await (supabase as any)
                .from("issues")
                .select(
                    `
                    *,
                    profiles:user_id (
                        full_name,
                        email
                    )
                `
                )
                .order("created_at", { ascending: false })
                .limit(50);

            if (fetchError) {
                throw fetchError;
            }

            // Type assertion for issues data
            type IssueWithProfile = Issue & {
                profiles?: {
                    full_name: string;
                    email: string;
                };
            };
            const typedIssues = (data || []) as IssueWithProfile[];

            // Get vote and comment counts for each issue
            const issuesWithCounts = await Promise.all(
                typedIssues.map(async (issue) => {
                    const [{ count: votesCount }, { count: commentsCount }] =
                        await Promise.all([
                            supabase
                                .from("issue_votes")
                                .select("*", { count: "exact", head: true })
                                .eq("issue_id", issue.id),
                            supabase
                                .from("comments")
                                .select("*", { count: "exact", head: true })
                                .eq("issue_id", issue.id),
                        ]);

                    return {
                        ...issue,
                        votes_count: votesCount || 0,
                        comments_count: commentsCount || 0,
                        upvotes: votesCount || 0, // For backward compatibility
                    };
                })
            );

            setIssues(issuesWithCounts);
        } catch (e: any) {
            setError(e.message || "Failed to fetch issues");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
        getCurrentLocation();

        // Subscribe to realtime changes for AI urgency updates
        const channel = supabase
            .channel("issues-ai-urgency")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "issues",
                    filter: "ai_urgency=neq.null",
                },
                (payload) => {
                    console.log("AI urgency updated:", payload);
                    // Update the specific issue in the list
                    setIssues((prevIssues) =>
                        prevIssues.map((issue) =>
                            issue.id === payload.new.id
                                ? {
                                      ...issue,
                                      ai_urgency: payload.new.ai_urgency,
                                      ai_confidence: payload.new.ai_confidence,
                                  }
                                : issue
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fetch departments for the filter
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch("/api/departments");
                if (response.ok) {
                    const data = await response.json();
                    if (data.departments && Array.isArray(data.departments)) {
                        setDepartments(data.departments);
                    }
                }
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchDepartments();
    }, []);

    const filteredIssues = useMemo(() => {
        return issues
            .filter((issue) => {
                const loc = (issue.location_address || "").toLowerCase();
                const matchesSearch =
                    issue.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    loc.includes(searchTerm.toLowerCase());
                const matchesStatus =
                    statusFilter === "all" || issue.status === statusFilter;
                const matchesCategory =
                    categoryFilter === "all" ||
                    issue.category === categoryFilter;
                return matchesSearch && matchesStatus && matchesCategory;
            })
            .sort((a, b) => {
                // Calculate combined scores using AI urgency and upvotes
                const getCombinedScore = (issue: Issue) => {
                    const upvotes = issue.upvotes || 0;
                    const urgency = issue.ai_urgency || "medium";

                    // AI urgency weight: low=1, medium=2, high=3
                    const urgencyWeight =
                        urgency === "high" ? 3 : urgency === "medium" ? 2 : 1;
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
            });
    }, [issues, searchTerm, statusFilter, categoryFilter]);

    const stats = useMemo(() => {
        const total = issues.length;
        const inProgress = issues.filter(
            (i) => i.status === "in_progress" || i.status === "in-progress"
        ).length;
        const resolved = issues.filter((i) => i.status === "resolved").length;
        const createdThisMonth = issues.filter((i) => {
            const d = new Date(i.created_at);
            const now = new Date();
            return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
            );
        }).length;
        return { total, inProgress, resolved, createdThisMonth };
    }, [issues]);

    // Map-related calculations
    const calculateDistance = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
    ) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Get nearby issues (within 5km of user location for citizens)
    const nearbyIssues = useMemo(() => {
        if (!userLocation) return filteredIssues;

        return filteredIssues.filter((issue) => {
            if (!issue.location_lat || !issue.location_lng) return false;
            const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                issue.location_lat,
                issue.location_lng
            );
            return distance <= 5; // 5km radius for citizens
        });
    }, [filteredIssues, userLocation]);

    // Calculate map center - prioritize user location, then nearby issues, then all issues
    const mapCenter = useMemo(() => {
        if (userLocation) {
            return userLocation;
        }

        if (nearbyIssues.length > 0) {
            return {
                lat:
                    nearbyIssues.reduce(
                        (sum, issue) => sum + (issue.location_lat || 0),
                        0
                    ) / nearbyIssues.length,
                lng:
                    nearbyIssues.reduce(
                        (sum, issue) => sum + (issue.location_lng || 0),
                        0
                    ) / nearbyIssues.length,
            };
        }

        if (filteredIssues.length > 0) {
            return {
                lat:
                    filteredIssues.reduce(
                        (sum, issue) => sum + (issue.location_lat || 0),
                        0
                    ) / filteredIssues.length,
                lng:
                    filteredIssues.reduce(
                        (sum, issue) => sum + (issue.location_lng || 0),
                        0
                    ) / filteredIssues.length,
            };
        }

        return defaultCenter;
    }, [userLocation, nearbyIssues, filteredIssues, defaultCenter]);

    // Determine zoom level based on context
    const mapZoom = useMemo(() => {
        if (userLocation) return 15; // Street level for user location
        if (nearbyIssues.length > 0) return 13; // Neighborhood level for nearby issues
        if (filteredIssues.length > 0) return 11; // City level for all issues
        return 4; // Country level for no issues
    }, [userLocation, nearbyIssues, filteredIssues]);

    // Prepare issues for map component
    const mapIssues = useMemo(() => {
        return filteredIssues
            .filter((issue) => issue.location_lat && issue.location_lng)
            .map((issue) => ({
                id: issue.id,
                title: issue.title,
                status: issue.status,
                priority: "medium", // Default priority since it's not in the Issue type
                location_lat: issue.location_lat!,
                location_lng: issue.location_lng!,
                category: issue.category,
            }));
    }, [filteredIssues]);

    const selectedIssueData = useMemo(() => {
        return issues.find((issue) => issue.id === selectedIssue);
    }, [issues, selectedIssue]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-[#2E6A56]/5 to-emerald-400/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-40 left-20 w-80 h-80 bg-gradient-to-br from-green-300/5 to-teal-400/5 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="bg-white/95 backdrop-blur-md shadow-lg relative z-10">
                <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2E6A56] to-emerald-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                                    Civic Issues Dashboard
                                </h1>
                                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                                    Track and report community issues
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button
                                asChild
                                className="w-full sm:w-auto h-10 sm:h-11 bg-gradient-to-r from-[#2E6A56] to-emerald-600 hover:from-[#1f4a3a] hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Link href="/citizen/report">
                                    <Plus className="w-4 h-4 mr-2" />
                                    <span className="xs:hidden">
                                        Report Issue
                                    </span>
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                                className="w-full sm:w-auto h-10 sm:h-11 bg-white shadow-sm text-[#2E6A56] hover:bg-[#2E6A56]/5 hover:shadow-md"
                            >
                                <Link href="/citizen/issues/map">
                                    <MapIcon className="w-4 h-4 mr-2" />
                                    Map
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                                className="w-full sm:w-auto h-10 sm:h-11 bg-transparent"
                            >
                                <Link href="/citizen/issues">My Issues</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                    <Card className="bg-gradient-to-br from-white to-gray-50/50 shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:scale-105 transform">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-600 truncate font-medium">
                                        Total Issues
                                    </p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:scale-105 transform">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-blue-700 truncate font-medium">
                                        In Progress
                                    </p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                                        {stats.inProgress}
                                    </p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-green-100/50 shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:scale-105 transform">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-emerald-700 truncate font-medium">
                                        Resolved
                                    </p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">
                                        {stats.resolved}
                                    </p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-200 to-green-300 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#2E6A56]/10 to-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:scale-105 transform">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-[#2E6A56] truncate font-medium">
                                        This Month
                                    </p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#2E6A56]">
                                        {stats.createdThisMonth}
                                    </p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2E6A56]/20 to-emerald-200 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#2E6A56]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="mb-4 sm:mb-6 bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3 sm:space-y-4">
                            {/* Search - Full width on mobile */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-[#2E6A56]" />
                                <Input
                                    placeholder="Search issues or locations..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 h-11 sm:h-10 text-sm bg-gradient-to-r from-gray-50 to-emerald-50/30 shadow-sm focus:shadow-md text-gray-900"
                                />
                            </div>

                            {/* Filters - Stacked on mobile, row on desktop */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="h-11 sm:h-10 sm:w-40 text-sm">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="submitted">
                                            Submitted
                                        </SelectItem>
                                        <SelectItem value="in-review">
                                            In Review
                                        </SelectItem>
                                        <SelectItem value="in-progress">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="resolved">
                                            Resolved
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={categoryFilter}
                                    onValueChange={setCategoryFilter}
                                >
                                    <SelectTrigger className="h-11 sm:h-10 sm:w-40 text-sm">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                <span>All Categories</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="pothole">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                <span>Pothole</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="streetlight">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                <span>Streetlight</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="garbage">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                <span>Garbage</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="water-leakage">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                <span>Water Leakage</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* View toggle - Right aligned on desktop, full width on mobile */}
                                <div className="flex sm:ml-auto">
                                    <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-100 to-emerald-50/50 p-1 rounded-lg w-full sm:w-auto shadow-sm">
                                        <Button
                                            variant={
                                                viewMode === "list"
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                            className={`h-9 px-3 flex-1 sm:flex-none ${
                                                viewMode === "list"
                                                    ? "bg-gradient-to-r from-[#2E6A56] to-emerald-600 text-white shadow-md"
                                                    : "text-gray-600 hover:text-[#2E6A56]"
                                            }`}
                                        >
                                            <List className="w-4 h-4 mr-1 sm:mr-0" />
                                            <span className="sm:hidden">
                                                List
                                            </span>
                                        </Button>
                                        <Button
                                            variant={
                                                viewMode === "map"
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size="sm"
                                            onClick={() => setViewMode("map")}
                                            className="h-9 px-3 flex-1 sm:flex-none"
                                        >
                                            <MapIcon className="w-4 h-4 mr-1 sm:mr-0" />
                                            <span className="sm:hidden">
                                                Map
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content */}
                {viewMode === "list" ? (
                    <div className="w-full grid gap-3 sm:gap-4">
                        {loading && (
                            <div className="text-sm text-gray-600 p-4 text-center">
                                Loading issues...
                            </div>
                        )}
                        {error && (
                            <div className="text-sm text-red-600 p-4 text-center bg-red-50 rounded-lg">
                                {error}
                            </div>
                        )}
                        {!loading &&
                            !error &&
                            filteredIssues.map((issue) => (
                                <Card
                                    key={issue.id}
                                    className="w-full bg-white shadow-md hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden border-0"
                                >
                                    <CardContent className="p-0 w-full">
                                        {/* Mobile: Instagram-like feed layout */}
                                        <div className="block md:hidden w-full">
                                            {/* Full-width image at top - ensures no horizontal overflow */}
                                            <div className="w-full h-48 sm:h-56 bg-gray-100 overflow-hidden">
                                                <img
                                                    src={
                                                        issue.image_url ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={issue.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Content below image - safe padding that won't cause overflow */}
                                            <div className="px-4 py-3 space-y-3 w-full">
                                                {/* Title and urgency badges */}
                                                <div className="space-y-2">
                                                    <Link
                                                        href={`/citizen/issues/${issue.id}`}
                                                        className="hover:underline block"
                                                    >
                                                        <h3 className="font-semibold text-base line-clamp-2 text-balance leading-tight">
                                                            {issue.title}
                                                        </h3>
                                                    </Link>

                                                    {/* Status and AI urgency badges */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge
                                                            className={`${getStatusColor(
                                                                issue.status
                                                            )} text-xs h-6`}
                                                        >
                                                            {getStatusIcon(
                                                                issue.status
                                                            )}
                                                            <span className="ml-1 capitalize">
                                                                {issue.status.replace(
                                                                    "-",
                                                                    " "
                                                                )}
                                                            </span>
                                                        </Badge>
                                                        <AIUrgencyBadge
                                                            urgency={
                                                                issue.ai_urgency
                                                            }
                                                            confidence={
                                                                issue.ai_confidence
                                                            }
                                                            className="text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                                                    {issue.description}
                                                </p>

                                                {/* Location and category */}
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <div className="flex items-center min-w-0 flex-1">
                                                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {issue.location_address ||
                                                                "N/A"}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs flex-shrink-0"
                                                    >
                                                        {getCategoryLabel(
                                                            issue.category
                                                        )}
                                                    </Badge>
                                                </div>

                                                {/* Stats and actions */}
                                                <div className="flex items-center justify-between pt-3 mt-3 shadow-inner">
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            <span>
                                                                {new Date(
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
                                                        <div className="flex items-center">
                                                            <ThumbsUp className="w-3 h-3 mr-1" />
                                                            {(issue as any)
                                                                .votes_count ??
                                                                issue.upvotes ??
                                                                0}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <MessageCircle className="w-3 h-3 mr-1" />
                                                            {(issue as any)
                                                                .comments_count ??
                                                                0}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 px-3 text-xs"
                                                    >
                                                        <Link
                                                            href={`/citizen/issues/${issue.id}`}
                                                        >
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tablet & Desktop: Side-by-side layout */}
                                        <div className="hidden md:block w-full">
                                            <div className="p-4 lg:p-6 w-full">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex gap-4">
                                                        {/* Image on the left */}
                                                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={
                                                                    issue.image_url ||
                                                                    "/placeholder.svg"
                                                                }
                                                                alt={
                                                                    issue.title
                                                                }
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Content on the right */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <Link
                                                                    href={`/citizen/issues/${issue.id}`}
                                                                    className="hover:underline min-h-[44px] flex items-start"
                                                                >
                                                                    <h3 className="font-semibold text-base lg:text-lg line-clamp-2 text-balance leading-tight">
                                                                        {
                                                                            issue.title
                                                                        }
                                                                    </h3>
                                                                </Link>
                                                                <div className="flex flex-col gap-1 items-end">
                                                                    <Badge
                                                                        className={`${getStatusColor(
                                                                            issue.status
                                                                        )} flex-shrink-0 text-xs h-6`}
                                                                    >
                                                                        {getStatusIcon(
                                                                            issue.status
                                                                        )}
                                                                        <span className="ml-1 hidden sm:inline capitalize">
                                                                            {issue.status.replace(
                                                                                "-",
                                                                                " "
                                                                            )}
                                                                        </span>
                                                                    </Badge>
                                                                    <AIUrgencyBadge
                                                                        urgency={
                                                                            issue.ai_urgency
                                                                        }
                                                                        confidence={
                                                                            issue.ai_confidence
                                                                        }
                                                                        className="text-xs"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">
                                                                {
                                                                    issue.description
                                                                }
                                                            </p>

                                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                                    <div className="flex items-center">
                                                                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                        <span className="truncate">
                                                                            {issue.location_address ||
                                                                                "N/A"}
                                                                        </span>
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
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 mt-3 shadow-inner">
                                                        <div className="flex items-center gap-4 text-xs text-gray-600">
                                                            <div className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                <span>
                                                                    {new Date(
                                                                        issue.created_at
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <ThumbsUp className="w-3 h-3 mr-1" />
                                                                {(issue as any)
                                                                    .votes_count ??
                                                                    issue.upvotes ??
                                                                    0}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                                {(issue as any)
                                                                    .comments_count ??
                                                                    0}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-9 px-3"
                                                        >
                                                            <Link
                                                                href={`/citizen/issues/${issue.id}`}
                                                            >
                                                                View Details
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Map Controls */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={getCurrentLocation}
                                            disabled={loading}
                                        >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {userLocation
                                                ? "Update Location"
                                                : "Find My Location"}
                                        </Button>
                                        <Button size="sm" asChild>
                                            <Link href="/citizen/report">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Report Issue
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {userLocation ? (
                                            <>
                                                Showing {nearbyIssues.length}{" "}
                                                nearby issues (within 5km) of{" "}
                                                {filteredIssues.length} total
                                            </>
                                        ) : (
                                            <>
                                                Showing {filteredIssues.length}{" "}
                                                issues on map{" "}
                                                {locationError && (
                                                    <span className="text-red-500">
                                                        ({locationError})
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid lg:grid-cols-4 gap-6">
                            {/* Map */}
                            <div className="lg:col-span-3">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="h-[50vh] sm:h-[60vh] rounded-lg overflow-hidden">
                                            {googleMapsApiKey ? (
                                                <GoogleMap
                                                    apiKey={googleMapsApiKey}
                                                    center={mapCenter}
                                                    zoom={mapZoom}
                                                    issues={mapIssues}
                                                    onMarkerClick={
                                                        setSelectedIssue
                                                    }
                                                    selectedIssueId={
                                                        selectedIssue
                                                    }
                                                    userLocation={userLocation}
                                                />
                                            ) : (
                                                <FallbackMap
                                                    center={mapCenter}
                                                    zoom={mapZoom}
                                                    issues={mapIssues}
                                                    onMarkerClick={
                                                        setSelectedIssue
                                                    }
                                                    selectedIssueId={
                                                        selectedIssue
                                                    }
                                                    userLocation={userLocation}
                                                />
                                            )}
                                        </div>

                                        {/* Map Legend */}
                                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                                                <span>Submitted</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                                                <span>In Review</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
                                                <span>In Progress</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                                                <span>Resolved</span>
                                            </div>
                                            {userLocation && (
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-blue-400 mr-2 animate-pulse" />
                                                    <span>Your Location</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Selected Issue Details */}
                                {selectedIssueData ? (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="font-semibold text-sm">
                                                        {
                                                            selectedIssueData.title
                                                        }
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {selectedIssueData.id}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={getStatusColor(
                                                            selectedIssueData.status
                                                        )}
                                                        variant="secondary"
                                                    >
                                                        {selectedIssueData.status.replace(
                                                            "-",
                                                            " "
                                                        )}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {getCategoryLabel(
                                                            selectedIssueData.category
                                                        )}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-2 text-xs">
                                                    <div className="flex items-center">
                                                        <MapPin className="w-3 h-3 mr-2 text-gray-600" />
                                                        <span>
                                                            {selectedIssueData.location_address ||
                                                                "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-2 text-gray-600" />
                                                        <span>
                                                            {new Date(
                                                                selectedIssueData.created_at
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {selectedIssueData.description && (
                                                    <div>
                                                        <p className="text-xs text-gray-700 line-clamp-3">
                                                            {
                                                                selectedIssueData.description
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <ThumbsUp className="w-3 h-3 mr-1" />
                                                        <span>
                                                            {(
                                                                selectedIssueData as any
                                                            ).votes_count || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <MessageCircle className="w-3 h-3 mr-1" />
                                                        <span>
                                                            {(
                                                                selectedIssueData as any
                                                            ).comments_count ||
                                                                0}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/citizen/issues/${selectedIssueData.id}`}
                                                    >
                                                        <Eye className="w-3 h-3 mr-2" />
                                                        View Details
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card>
                                        <CardContent className="p-6 text-center">
                                            <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                            <h3 className="font-semibold mb-1">
                                                Select an Issue
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Click on a marker to view
                                                details.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Issues List */}
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold mb-3 text-sm">
                                            Issues on Map (
                                            {filteredIssues.length})
                                            {userLocation &&
                                                nearbyIssues.length !==
                                                    filteredIssues.length && (
                                                    <span className="text-xs font-normal text-gray-600 ml-2">
                                                        ({nearbyIssues.length}{" "}
                                                        nearby)
                                                    </span>
                                                )}
                                        </h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {filteredIssues.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <p className="text-xs text-muted-foreground">
                                                        No issues found with
                                                        current filters.
                                                    </p>
                                                </div>
                                            ) : (
                                                // Show nearby issues first, then others
                                                [
                                                    ...nearbyIssues,
                                                    ...filteredIssues.filter(
                                                        (issue) =>
                                                            !nearbyIssues.includes(
                                                                issue
                                                            )
                                                    ),
                                                ].map((issue) => (
                                                    <div
                                                        key={issue.id}
                                                        className={`p-2 rounded cursor-pointer transition-colors shadow-sm hover:bg-muted/50 hover:shadow-md ${
                                                            selectedIssue ===
                                                            issue.id
                                                                ? "ring-2 ring-accent"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            setSelectedIssue(
                                                                issue.id
                                                            )
                                                        }
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-start justify-between">
                                                                <h4 className="font-medium text-xs line-clamp-1">
                                                                    {
                                                                        issue.title
                                                                    }
                                                                </h4>
                                                                <Badge
                                                                    className={getStatusColor(
                                                                        issue.status
                                                                    )}
                                                                    variant="secondary"
                                                                >
                                                                    {issue.status.replace(
                                                                        "-",
                                                                        " "
                                                                    )}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-600">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                <span className="line-clamp-1">
                                                                    {issue.location_address ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <div className="flex items-center">
                                                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                                                    <span>
                                                                        {(
                                                                            issue as any
                                                                        )
                                                                            .votes_count ||
                                                                            0}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <MessageCircle className="w-3 h-3 mr-1" />
                                                                    <span>
                                                                        {(
                                                                            issue as any
                                                                        )
                                                                            .comments_count ||
                                                                            0}
                                                                    </span>
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
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
