"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Search,
  Eye,
  Edit,
  MapPin,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Building2,
    Shield,
    ThumbsUp,
    Filter,
    X,
    TrendingUp,
    Users,
} from "lucide-react";
import SimpleAdminActions from "@/components/simple-admin-actions";
import { useAuth } from "@/contexts/auth-context";
import AIUrgencyBadge from "@/components/ai-urgency-badge";

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
    upvotes: number;
    ai_urgency?: "low" | "medium" | "high";
    ai_confidence?: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  department?: {
    name: string;
    email: string;
  };
  assigned_profile?: {
    full_name: string;
    email: string;
  };
  comments_count?: number;
  votes_count?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
            return "bg-blue-500 hover:bg-blue-600 text-white";
    case "assigned":
            return "bg-amber-500 hover:bg-amber-600 text-white";
    case "in_progress":
            return "bg-orange-500 hover:bg-orange-600 text-white";
    case "resolved":
            return "bg-emerald-500 hover:bg-emerald-600 text-white";
    case "closed":
            return "bg-slate-500 hover:bg-slate-600 text-white";
    default:
            return "bg-gray-100 text-gray-700";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
            return "bg-red-50 text-red-700 border-red-200";
    case "medium":
            return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "low":
            return "bg-green-50 text-green-700 border-green-200";
    default:
            return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "submitted":
            return <Clock className="w-4 h-4" />;
    case "assigned":
            return <User className="w-4 h-4" />;
    case "in_progress":
            return <AlertTriangle className="w-4 h-4" />;
    case "resolved":
            return <CheckCircle className="w-4 h-4" />;
    case "closed":
            return <CheckCircle className="w-4 h-4" />;
    default:
            return <Clock className="w-4 h-4" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "roads":
            return "Roads & Infrastructure";
    case "potholes":
            return "Potholes";
    case "streetlights":
            return "Street Lighting";
    case "garbage":
            return "Waste Management";
    case "water":
            return "Water Supply";
    case "drainage":
            return "Drainage";
    case "parks":
            return "Parks & Recreation";
    case "traffic":
            return "Traffic Management";
    default:
            return "Other";
    }
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case "roads":
        case "potholes":
            return "🛣️";
        case "streetlights":
            return "💡";
        case "garbage":
            return "🗑️";
        case "water":
            return "💧";
        case "drainage":
            return "🌊";
        case "parks":
            return "🌳";
        case "traffic":
            return "🚦";
        default:
            return "📋";
    }
};

export default function AdminIssuesPage() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [allIssues, setAllIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingIssue, setProcessingIssue] = useState<string | null>(null);
    const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(
        new Set()
    );
    const [showFilters, setShowFilters] = useState(false);

  // Fetch issues from API
  useEffect(() => {
    const fetchIssues = async () => {
      try {
                setLoading(true);

                const response = await fetch("/api/issues?limit=100", {
                    credentials: "include",
                });
        if (response.ok) {
                    const data = await response.json();
                    let issues = data.issues || [];

                    console.log("Total issues loaded:", issues.length);

                    setAllIssues(issues);
        } else {
                    setError("Failed to fetch issues");
        }
      } catch (error) {
                console.error("Error fetching issues:", error);
                setError("Error loading issues");
      } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchIssues();
        }
    }, [user]);

    // Filtered issues
    const filteredIssues = allIssues
        .filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.location_address
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (issue.profiles?.full_name || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || issue.status === statusFilter;
            const matchesPriority =
                priorityFilter === "all" || issue.priority === priorityFilter;
            const matchesCategory =
                categoryFilter === "all" || issue.category === categoryFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesCategory
            );
        })
        .sort((a, b) => {
            // Sort by upvotes (descending) then by creation date
            const aUpvotes = Number(a.upvotes) || 0;
            const bUpvotes = Number(b.upvotes) || 0;
            const upvoteDiff = bUpvotes - aUpvotes;
            if (upvoteDiff !== 0) return upvoteDiff;

            return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
        });

  const statusCounts = {
    all: allIssues.length,
    submitted: allIssues.filter((i) => i.status === "submitted").length,
    assigned: allIssues.filter((i) => i.status === "assigned").length,
    in_progress: allIssues.filter((i) => i.status === "in_progress").length,
    resolved: allIssues.filter((i) => i.status === "resolved").length,
    closed: allIssues.filter((i) => i.status === "closed").length,
    };

    // Get unique categories from issues
    const categories = Array.from(
        new Set(allIssues.map((issue) => issue.category))
    ).sort();

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPriorityFilter("all");
        setCategoryFilter("all");
    };

    const hasActiveFilters =
        searchTerm ||
        statusFilter !== "all" ||
        priorityFilter !== "all" ||
        categoryFilter !== "all";

  const handleBulkAction = (action: string) => {
        setSelectedIssues([]);
    };

    const handleStatusUpdate = async (
        issueId: string,
        newStatus: string,
        notes?: string
    ) => {
        try {
            const response = await fetch(
                `/api/issues/${issueId}/simple-status`,
                {
                    method: "PUT",
        headers: {
                        "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
                        notes:
                            notes || `Status changed to ${newStatus} by admin`,
        }),
                }
            );

      if (response.ok) {
                setAllIssues((prevIssues) =>
                    prevIssues.map((issue) =>
            issue.id === issueId 
                            ? {
                                  ...issue,
                                  status: newStatus,
                                  updated_at: new Date().toISOString(),
                              }
              : issue
          )
        );
        
        const statusMessages = {
                    assigned: "Issue accepted and assigned",
                    in_progress: "Work started on issue",
                    resolved: "Issue marked as resolved",
                    closed: "Issue closed",
                };

                const message =
                    statusMessages[newStatus as keyof typeof statusMessages] ||
                    `Status updated to ${newStatus}`;

                const toast = document.createElement("div");
                toast.className =
                    "fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2";
                toast.innerHTML = `<CheckCircle class="w-4 h-4" /> <span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      } else {
                throw new Error("Failed to update status");
      }
    } catch (error) {
            console.error("Error updating status:", error);
            const errorToast = document.createElement("div");
            errorToast.className =
                "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2";
            errorToast.innerHTML = `<AlertTriangle class="w-4 h-4" /> <span>Failed to update issue status</span>`;
      document.body.appendChild(errorToast);
      setTimeout(() => document.body.removeChild(errorToast), 3000);
    }
  };

    const handleIssueAction = async (
        action: string,
        issueId: string,
        currentStatus: string
    ) => {
    if (processingIssue) return;
    
    try {
      setProcessingIssue(issueId);
      
      switch (action) {
                case "accept":
                    await handleStatusUpdate(
                        issueId,
                        "assigned",
                        "Issue accepted and assigned to department"
                    );
          break;
                case "reject":
                    await handleStatusUpdate(
                        issueId,
                        "closed",
                        "Issue rejected by admin"
                    );
          break;
                case "in_progress":
                    await handleStatusUpdate(
                        issueId,
                        "in_progress",
                        "Work started on this issue"
                    );
          break;
                case "resolve":
                    await handleStatusUpdate(
                        issueId,
                        "resolved",
                        "Issue has been resolved"
                    );
          break;
                case "close":
                    await handleStatusUpdate(
                        issueId,
                        "closed",
                        "Issue closed by admin"
                    );
          break;
                case "view":
          setProcessingIssue(null);
          window.location.href = `/admin/issues/${issueId}`;
          return;
                case "edit":
          setProcessingIssue(null);
          window.location.href = `/admin/issues/${issueId}`;
          return;
                case "assign":
          setProcessingIssue(null);
          window.location.href = `/admin/issues/${issueId}`;
          return;
                case "priority":
          setProcessingIssue(null);
          window.location.href = `/admin/issues/${issueId}`;
          return;
        default:
                    break;
      }
      
            await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
            console.error("Error performing action:", error);
    } finally {
      setProcessingIssue(null);
    }
  };

    const handleUserIdClick = (issueId: string) => {
        setExpandedUserIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(issueId)) {
                newSet.delete(issueId);
            } else {
                newSet.add(issueId);
            }
            return newSet;
        });
  };

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Enhanced Header */}
            <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
                <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
              </Link>
              <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Issue Management
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Track, assign, and manage all civic issues
                                </p>
              </div>
            </div>
                        <div className="flex items-center space-x-3">
              {selectedIssues.length > 0 && (
                                <Button variant="secondary" size="sm">
                                    <Users className="w-4 h-4 mr-2" />
                  Bulk Actions ({selectedIssues.length})
                                </Button>
              )}
              <Link href="/admin/issues/map">
                                <Button>
                  <MapPin className="w-4 h-4 mr-2" />
                  Map View
                                </Button>
              </Link>
            </div>
          </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
                        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-blue-700">
                                    {statusCounts.all}
                                </div>
                                <div className="text-sm text-blue-600">
                                    Total Issues
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-yellow-50 to-amber-100 border-amber-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-amber-700">
                                    {statusCounts.submitted}
                                </div>
                                <div className="text-sm text-amber-600">
                                    New
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-orange-700">
                                    {statusCounts.assigned}
                                </div>
                                <div className="text-sm text-orange-600">
                                    Assigned
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-purple-700">
                                    {statusCounts.in_progress}
                                </div>
                                <div className="text-sm text-purple-600">
                                    In Progress
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-700">
                                    {statusCounts.resolved}
                                </div>
                                <div className="text-sm text-emerald-600">
                                    Resolved
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-slate-700">
                                    {statusCounts.closed}
                                </div>
                                <div className="text-sm text-slate-600">
                                    Closed
                                </div>
                            </CardContent>
                        </Card>
                    </div>
        </div>
      </div>

            <div className="responsive-container py-6">
                {/* Enhanced Filters */}
                <Card className="mb-6 shadow-sm">
                    <CardContent className="responsive-card-content">
                        {/* Search and Filter Toggle */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                                    placeholder="Search issues, locations, or reporter names..."
                  value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 h-12"
                />
              </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={
                                        showFilters ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                    {hasActiveFilters && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-2"
                                        >
                                            {
                                                [
                                                    searchTerm,
                                                    statusFilter !== "all",
                                                    priorityFilter !== "all",
                                                    categoryFilter !== "all",
                                                ].filter(Boolean).length
                                            }
                                        </Badge>
                                    )}
                                </Button>

                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Collapsible Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Status
                                    </label>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={setStatusFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                                            <SelectItem value="all">
                                                All Status
                                            </SelectItem>
                                            <SelectItem value="submitted">
                                                📝 Submitted
                                            </SelectItem>
                                            <SelectItem value="assigned">
                                                👤 Assigned
                                            </SelectItem>
                                            <SelectItem value="in_progress">
                                                ⚡ In Progress
                                            </SelectItem>
                                            <SelectItem value="resolved">
                                                ✅ Resolved
                                            </SelectItem>
                                            <SelectItem value="closed">
                                                🔒 Closed
                                            </SelectItem>
                  </SelectContent>
                </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Priority
                                    </label>
                                    <Select
                                        value={priorityFilter}
                                        onValueChange={setPriorityFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                                            <SelectItem value="all">
                                                All Priority
                                            </SelectItem>
                                            <SelectItem value="high">
                                                🔴 High
                                            </SelectItem>
                                            <SelectItem value="medium">
                                                🟡 Medium
                                            </SelectItem>
                                            <SelectItem value="low">
                                                🟢 Low
                                            </SelectItem>
                  </SelectContent>
                </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Category
                                    </label>
                                    <Select
                                        value={categoryFilter}
                                        onValueChange={setCategoryFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                                            <SelectItem value="all">
                                                All Categories
                                            </SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category}
                                                    value={category}
                                                >
                                                    {getCategoryIcon(category)}{" "}
                                                    {getCategoryLabel(category)}
                                                </SelectItem>
                                            ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
                        )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
                    <Card className="shadow-sm">
                        <CardContent className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-lg">Loading issues...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
                    <Card className="shadow-sm">
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">
                                Error Loading Issues
                            </h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

                {/* Enhanced Status Tabs */}
        {!loading && !error && (
                    <Tabs
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        className="space-y-6"
                    >
                        <div className="overflow-x-auto">
                            <TabsList className="grid w-full grid-cols-6 h-12">
                                <TabsTrigger value="all" className="text-sm">
                                    All ({statusCounts.all})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="submitted"
                                    className="text-sm"
                                >
                                    📝 New ({statusCounts.submitted})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="assigned"
                                    className="text-sm"
                                >
                                    👤 Assigned ({statusCounts.assigned})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="in_progress"
                                    className="text-sm"
                                >
                                    ⚡ Progress ({statusCounts.in_progress})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="resolved"
                                    className="text-sm"
                                >
                                    ✅ Resolved ({statusCounts.resolved})
                                </TabsTrigger>
                                <TabsTrigger value="closed" className="text-sm">
                                    🔒 Closed ({statusCounts.closed})
                                </TabsTrigger>
            </TabsList>
                        </div>

                        <TabsContent value={statusFilter} className="space-y-6">
                            <Card
                                className="shadow-sm"
                                style={{ overflow: "visible" }}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl">
                                                Issues ({filteredIssues.length})
                                            </CardTitle>
                <CardDescription>
                                                {statusFilter === "all"
                                                    ? "All issues sorted by community votes"
                                                    : `Issues with status: ${statusFilter.replace(
                                                          "_",
                                                          " "
                                                      )}`}
                </CardDescription>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <TrendingUp className="w-4 h-4 mr-1" />
                                            Sorted by upvotes
                                        </div>
                                    </div>
              </CardHeader>
                                <CardContent
                                    className="p-0"
                                    style={{ overflow: "visible" }}
                                >
                                    {/* Enhanced Desktop Table */}
                                    <div className="hidden lg:block">
                                        <div className="responsive-table-container">
                                            <Table className="responsive-table">
                    <TableHeader>
                                                    <TableRow className="bg-gray-50">
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                                                                checked={
                                                                    selectedIssues.length ===
                                                                        filteredIssues.length &&
                                                                    filteredIssues.length >
                                                                        0
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        setSelectedIssues(
                                                                            filteredIssues.map(
                                                                                (
                                                                                    issue
                                                                                ) =>
                                                                                    issue.id
                                                                            )
                                                                        );
                              } else {
                                                                        setSelectedIssues(
                                                                            []
                                                                        );
                              }
                            }}
                            className="rounded"
                          />
                        </TableHead>
                                                        <TableHead className="min-w-[350px] font-semibold">
                                                            Issue Details
                                                        </TableHead>
                                                        <TableHead className="w-28 font-semibold">
                                                            Status
                                                        </TableHead>
                                                        <TableHead className="w-24 font-semibold">
                                                            Priority
                                                        </TableHead>
                                                        <TableHead className="w-28 font-semibold">
                                                            AI Urgency
                                                        </TableHead>
                                                        <TableHead className="w-32 font-semibold">
                                                            Category
                                                        </TableHead>
                                                        <TableHead className="min-w-[150px] font-semibold">
                                                            Assignment
                                                        </TableHead>
                                                        <TableHead className="min-w-[120px] font-semibold">
                                                            Reporter
                                                        </TableHead>
                                                        <TableHead className="w-20 font-semibold text-center">
                                                            <ThumbsUp className="w-4 h-4 mx-auto" />
                                                        </TableHead>
                                                        <TableHead className="w-20 font-semibold text-center">
                                                            Actions
                                                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                                                    {filteredIssues.map(
                                                        (issue, index) => (
                                                            <TableRow
                                                                key={issue.id}
                                                                className={`hover:bg-gray-50 ${
                                                                    index === 0
                                                                        ? "bg-blue-50/50 border-l-4 border-l-blue-500"
                                                                        : ""
                                                                }`}
                                                            >
                          <TableCell>
                            <input
                              type="checkbox"
                                                                        checked={selectedIssues.includes(
                                                                            issue.id
                                                                        )}
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                setSelectedIssues(
                                                                                    [
                                                                                        ...selectedIssues,
                                                                                        issue.id,
                                                                                    ]
                                                                                );
                                } else {
                                                                                setSelectedIssues(
                                                                                    selectedIssues.filter(
                                                                                        (
                                                                                            id
                                                                                        ) =>
                                                                                            id !==
                                                                                            issue.id
                                                                                    )
                                                                                );
                                }
                              }}
                              className="rounded"
                            />
                          </TableCell>
                                                                <TableCell className="py-4">
                                                                    <div className="space-y-2">
                                                                        <Link
                                                                            href={`/admin/issues/${issue.id}`}
                                                                        >
                                                                            <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-1">
                                                                                {index ===
                                                                                    0 && (
                                                                                    <span className="inline-flex items-center mr-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                                                        Most
                                                                                        Voted
                                                                                    </span>
                                                                                )}
                                                                                {
                                                                                    issue.title
                                                                                }
                              </div>
                                                                        </Link>
                                                                        <div className="flex items-center text-sm text-gray-500">
                                                                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                                                            <span
                                                                                className="truncate"
                                                                                title={
                                                                                    issue.location_address
                                                                                }
                                                                            >
                                                                                {
                                                                                    issue.location_address
                                                                                }
                                                                            </span>
                              </div>
                                                                        <div
                                                                            className="text-xs text-gray-400 cursor-pointer hover:text-blue-500 transition-colors font-mono"
                                                                            onClick={() =>
                                                                                handleUserIdClick(
                                                                                    issue.id
                                                                                )
                                                                            }
                                                                            title="Click to show/hide full ID"
                                                                        >
                                                                            ID:{" "}
                                                                            {issue.id.slice(
                                                                                0,
                                                                                8
                                                                            )}
                                                                            ...
                                                                        </div>
                                                                        {expandedUserIds.has(
                                                                            issue.id
                                                                        ) && (
                                                                            <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded border mt-1">
                                                                                {
                                                                                    issue.id
                                                                                }
                                                                            </div>
                                                                        )}
                            </div>
                          </TableCell>
                          <TableCell>
                                                                    <Badge
                                                                        className={`${getStatusColor(
                                                                            issue.status
                                                                        )} shadow-sm`}
                                                                    >
                                                                        {getStatusIcon(
                                                                            issue.status
                                                                        )}
                                                                        <span className="ml-1 capitalize hidden sm:inline">
                                                                            {issue.status.replace(
                                                                                "_",
                                                                                " "
                                                                            )}
                                                                        </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                                                                    <Badge
                                                                        className={`${getPriorityColor(
                                                                            issue.priority
                                                                        )} border`}
                                                                        variant="outline"
                                                                    >
                                                                        {issue.priority
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase() +
                                                                            issue.priority.slice(
                                                                                1
                                                                            )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                                                                    <AIUrgencyBadge
                                                                        urgency={
                                                                            issue.ai_urgency
                                                                        }
                                                                        confidence={
                                                                            issue.ai_confidence
                                                                        }
                                                                        className="shadow-sm"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center space-x-1">
                                                                        <span>
                                                                            {getCategoryIcon(
                                                                                issue.category
                                                                            )}
                                                                        </span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs border-gray-200"
                                                                        >
                                                                            {getCategoryLabel(
                                                                                issue.category
                                                                            )}
                                                                        </Badge>
                                                                    </div>
                          </TableCell>
                          <TableCell>
                            {issue.assigned_profile ? (
                              <div className="space-y-1">
                                                                            <div className="font-medium text-sm text-gray-900">
                                                                                {
                                                                                    issue
                                                                                        .assigned_profile
                                                                                        .full_name
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {
                                                                                    issue
                                                                                        .department
                                                                                        ?.name
                                                                                }
                                                                            </div>
                              </div>
                            ) : issue.department ? (
                              <div className="space-y-1">
                                                                            <div className="text-sm font-medium text-amber-700">
                                                                                Department
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {
                                                                                    issue
                                                                                        .department
                                                                                        .name
                                                                                }
                                                                            </div>
                              </div>
                            ) : (
                                                                        <span className="text-gray-400 text-sm italic">
                                                                            Unassigned
                                                                        </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                                                                        <div className="text-sm flex items-center text-gray-600">
                                                                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                            {new Date(
                                                                                issue.created_at
                                                                            ).toLocaleDateString()}
                              </div>
                                                                        <div className="text-xs text-gray-500 flex items-center">
                                                                            <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                            <span
                                                                                className="truncate"
                                                                                title={
                                                                                    issue
                                                                                        .profiles
                                                                                        ?.full_name ||
                                                                                    "Unknown"
                                                                                }
                                                                            >
                                                                                {issue
                                                                                    .profiles
                                                                                    ?.full_name ||
                                                                                    "Unknown"}
                                                                            </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                                                                    <div className="flex items-center justify-center">
                                                                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-full">
                                                                            <ThumbsUp className="w-4 h-4 text-green-600" />
                                                                            <span className="font-semibold text-green-700">
                                                                                {issue.upvotes ||
                                                                                    0}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell
                                                                    className="relative"
                                                                    style={{
                                                                        zIndex: 30,
                                                                    }}
                                                                >
                                                                    <div className="flex justify-center relative">
                            <SimpleAdminActions
                              issue={{
                                id: issue.id,
                                status: issue.status,
                                                                                title: issue.title,
                                                                            }}
                                                                            onAction={
                                                                                handleIssueAction
                                                                            }
                                                                            processing={
                                                                                processingIssue ===
                                                                                issue.id
                                                                            }
                                                                        />
                                                                    </div>
                          </TableCell>
                        </TableRow>
                                                        )
                                                    )}
                    </TableBody>
                  </Table>
                                        </div>
                </div>

                                    {/* Enhanced Mobile Card View */}
                                    <div className="block lg:hidden responsive-spacing-sm">
                                        <div className="responsive-grid">
                                            {filteredIssues.map(
                                                (issue, index) => (
                                                    <Card
                                                        key={issue.id}
                                                        className={`responsive-card ${
                                                            index === 0
                                                                ? "border-l-4 border-l-blue-500 bg-blue-50/30"
                                                                : ""
                                                        }`}
                                                    >
                                                        <CardContent className="responsive-card-content">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-start space-x-3 flex-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedIssues.includes(
                                                                            issue.id
                                                                        )}
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                setSelectedIssues(
                                                                                    [
                                                                                        ...selectedIssues,
                                                                                        issue.id,
                                                                                    ]
                                                                                );
                                                                            } else {
                                                                                setSelectedIssues(
                                                                                    selectedIssues.filter(
                                                                                        (
                                                                                            id
                                                                                        ) =>
                                                                                            id !==
                                                                                            issue.id
                                                                                    )
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="rounded mt-1"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        {index ===
                                                                            0 && (
                                                                            <div className="mb-2">
                                                                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                                                    Most
                                                                                    Voted
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                        <Link
                                                                            href={`/admin/issues/${issue.id}`}
                                                                        >
                                                                            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-1">
                                                                                {
                                                                                    issue.title
                                                                                }
                                                                            </h3>
                                                                        </Link>
                                                                        <div
                                                                            className="text-xs text-gray-400 cursor-pointer hover:text-blue-500 transition-colors font-mono mb-2"
                                                                            onClick={() =>
                                                                                handleUserIdClick(
                                                                                    issue.id
                                                                                )
                                                                            }
                                                                            title="Click to show/hide full ID"
                                                                        >
                                                                            ID:{" "}
                                                                            {issue.id.slice(
                                                                                0,
                                                                                8
                                                                            )}
                                                                            ...
                                                                        </div>
                                                                        {expandedUserIds.has(
                                                                            issue.id
                                                                        ) && (
                                                                            <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded border mb-2">
                                                                                {
                                                                                    issue.id
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-full">
                                                                        <ThumbsUp className="w-3 h-3 text-green-600" />
                                                                        <span className="text-xs font-semibold text-green-700">
                                                                            {issue.upvotes ||
                                                                                0}
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        className="relative"
                                                                        style={{
                                                                            zIndex: 30,
                                                                        }}
                                                                    >
                                                                        <SimpleAdminActions
                                                                            issue={{
                                                                                id: issue.id,
                                                                                status: issue.status,
                                                                                title: issue.title,
                                                                            }}
                                                                            onAction={
                                                                                handleIssueAction
                                                                            }
                                                                            processing={
                                                                                processingIssue ===
                                                                                issue.id
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Mobile Info Grid */}
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-1">
                                                                        Status
                                                                    </div>
                                                                    <Badge
                                                                        className={`${getStatusColor(
                                                                            issue.status
                                                                        )} text-xs`}
                                                                    >
                                                                        {getStatusIcon(
                                                                            issue.status
                                                                        )}
                                                                        <span className="ml-1 capitalize">
                                                                            {issue.status.replace(
                                                                                "_",
                                                                                " "
                                                                            )}
                                                                        </span>
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-1">
                                                                        Priority
                                                                    </div>
                                                                    <Badge
                                                                        className={`${getPriorityColor(
                                                                            issue.priority
                                                                        )} border text-xs`}
                                                                        variant="outline"
                                                                    >
                                                                        {issue.priority
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase() +
                                                                            issue.priority.slice(
                                                                                1
                                                                            )}
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-1">
                                                                        AI
                                                                        Urgency
                                                                    </div>
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
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-1">
                                                                        Category
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <span>
                                                                            {getCategoryIcon(
                                                                                issue.category
                                                                            )}
                                                                        </span>
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

                                                            <div className="mt-3 pt-3 border-t space-y-2">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-500">
                                                                        Assigned
                                                                        to
                                                                    </span>
                                                                    <span>
                                                                        {issue.assigned_profile ? (
                                                                            <div className="text-right">
                                                                                <div className="font-medium text-gray-900">
                                                                                    {
                                                                                        issue
                                                                                            .assigned_profile
                                                                                            .full_name
                                                                                    }
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {
                                                                                        issue
                                                                                            .department
                                                                                            ?.name
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        ) : issue.department ? (
                                                                            <div className="text-right">
                                                                                <div className="text-amber-700 font-medium">
                                                                                    Department
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {
                                                                                        issue
                                                                                            .department
                                                                                            .name
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-400 italic">
                                                                                Unassigned
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-500">
                                                                        Reported
                                                                        by
                                                                    </span>
                                                                    <div className="text-right">
                                                                        <div className="flex items-center text-gray-600">
                                                                            <Calendar className="w-3 h-3 mr-1" />
                                                                            {new Date(
                                                                                issue.created_at
                                                                            ).toLocaleDateString()}
                                                                        </div>
                                                                        <div className="flex items-center text-gray-500 text-xs">
                                                                            <User className="w-3 h-3 mr-1" />
                                                                            {issue
                                                                                .profiles
                                                                                ?.full_name ||
                                                                                "Unknown"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 pt-3 border-t">
                                                                <div className="flex items-center text-sm text-gray-500">
                                                                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                                                    <span className="truncate">
                                                                        {
                                                                            issue.location_address
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Empty State */}
                {filteredIssues.length === 0 && (
                                        <div className="text-center py-12 px-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <AlertTriangle className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                No Issues Found
                                            </h3>
                                            <p className="text-gray-500 mb-4">
                                                No issues match your current
                                                filters. Try adjusting your
                                                search criteria or clearing
                                                filters.
                                            </p>
                                            {hasActiveFilters && (
                                                <Button
                                                    variant="outline"
                                                    onClick={clearFilters}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Clear All Filters
                                                </Button>
                                            )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
    );
}
