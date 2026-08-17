"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    ThumbsUp,
    MessageCircle,
    Share2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    Send,
    Heart,
    Flag,
    Building2,
} from "lucide-react";
import MapPicker from "@/components/map-picker";
import GoogleMapsEmbed from "@/components/google-maps-embed";
import InteractiveGoogleMap from "@/components/interactive-google-map";

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

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "low":
            return "bg-green-100 text-green-800 shadow-sm";
        case "medium":
            return "bg-yellow-100 text-yellow-800 shadow-sm";
        case "high":
            return "bg-red-100 text-red-800 shadow-sm";
        default:
            return "bg-gray-100 text-gray-800 shadow-sm";
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

export default function IssueDetailPage() {
    const params = useParams();
    const [issue, setIssue] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [upvotes, setUpvotes] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        const id = Array.isArray(params?.id)
            ? params?.id[0]
            : (params as any)?.id;
        if (!id) return;
        const fetchIssue = async () => {
            try {
                setLoading(true);
                setError(null);
                const [issueRes, voteRes, commentsRes, timelineRes] =
                    await Promise.all([
                        fetch(`/api/issues?id=${id}`, {
                            credentials: "include",
                        }),
                        fetch(`/api/issues/${id}/vote`, {
                            credentials: "include",
                        }),
                        fetch(`/api/issues/${id}/comments`, {
                            credentials: "include",
                        }),
                        fetch(`/api/issues/${id}/timeline`, {
                            credentials: "include",
                        }),
                    ]);
                const issueJson = await issueRes.json();
                const voteJson = await voteRes.json();
                const commentsJson = await commentsRes.json();
                const timelineJson = await timelineRes.json();

                if (!issueRes.ok)
                    throw new Error(issueJson.error || "Failed to load issue");

                setIssue(issueJson.issue);
                setTimeline(timelineJson.timeline || []);
                setUpvotes(
                    voteJson && typeof voteJson.votesCount === "number"
                        ? voteJson.votesCount
                        : issueJson.issue.upvotes || 0
                );
                setHasUpvoted(!!(voteJson && voteJson.hasVoted));
                setComments(commentsJson.comments || []);
            } catch (e: any) {
                setError(e.message || "Failed to load issue");
            } finally {
                setLoading(false);
            }
        };
        fetchIssue();
    }, [params]);

    const handleUpvote = async () => {
        if (!issue?.id) return;
        try {
            if (hasUpvoted) {
                const res = await fetch(`/api/issues/${issue.id}/vote`, {
                    method: "DELETE",
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to remove vote");
                setHasUpvoted(false);
                setUpvotes((prev) => Math.max(0, prev - 1));
            } else {
                const res = await fetch(`/api/issues/${issue.id}/vote`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ vote_type: "up" }),
                });
                if (!res.ok) throw new Error("Failed to add vote");
                setHasUpvoted(true);
                setUpvotes((prev) => prev + 1);
            }
        } catch (e) {
            // Optionally show a toast
            console.error(e);
        }
    };

    const handleFollow = () => {
        if (isFollowing) {
            setFollowers((prev) => prev - 1);
            setIsFollowing(false);
        } else {
            setFollowers((prev) => prev + 1);
            setIsFollowing(true);
        }
    };

    const handleSubmitComment = async () => {
        if (!issue?.id) return;
        const content = newComment.trim();
        if (!content) return;
        try {
            const res = await fetch(`/api/issues/${issue.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ content, is_admin: false }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to add comment");
            setComments((prev) => [...prev, json.comment]);
            setNewComment("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!issue?.id) return;
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
            const res = await fetch(
                `/api/issues/${issue.id}/comments/${commentId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to delete comment");
            }
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (e) {
            console.error(e);
            alert("Failed to delete comment: " + (e as Error).message);
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!issue?.id) return;
        const content = editContent.trim();
        if (!content) return;
        try {
            const res = await fetch(
                `/api/issues/${issue.id}/comments/${commentId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ content }),
                }
            );
            const json = await res.json();
            if (!res.ok)
                throw new Error(json.error || "Failed to update comment");
            setComments((prev) =>
                prev.map((c) => (c.id === commentId ? json.comment : c))
            );
            setEditingComment(null);
            setEditContent("");
        } catch (e) {
            console.error(e);
        }
    };

    const startEditing = (comment: any) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Mobile-first header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/citizen/dashboard">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                                <Flag className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Issue Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-balance">
                                {issue?.title ||
                                    (loading ? "Loading…" : "Issue")}
                            </h1>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {issue && (
                                    <Badge
                                        className={getStatusColor(
                                            String(issue.status).replace(
                                                "_",
                                                "-"
                                            )
                                        )}
                                    >
                                        {getStatusIcon(issue.status)}
                                        <span className="ml-1 capitalize">
                                            {String(issue.status).replace(
                                                /[_-]/g,
                                                " "
                                            )}
                                        </span>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons - mobile optimized */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Button
                            variant={hasUpvoted ? "default" : "outline"}
                            onClick={handleUpvote}
                            className="flex-1 sm:flex-none"
                        >
                            <ThumbsUp
                                className={`w-4 h-4 mr-2 ${
                                    hasUpvoted ? "fill-current" : ""
                                }`}
                            />
                            {hasUpvoted ? "Upvoted" : "Upvote"} ({upvotes})
                        </Button>
                        <Button
                            variant={isFollowing ? "default" : "outline"}
                            onClick={handleFollow}
                            className="flex-1 sm:flex-none"
                        >
                            <Heart
                                className={`w-4 h-4 mr-2 ${
                                    isFollowing ? "fill-current" : ""
                                }`}
                            />
                            {isFollowing ? "Following" : "Follow"} ({followers})
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Issue Image */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                    <img
                                        src={
                                            issue?.image_url ||
                                            "/placeholder.svg"
                                        }
                                        alt={issue?.title || "Issue image"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Issue Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {issue?.description || "No description"}
                                </p>

                                {issue?.audio_url && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-medium mb-2">
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
                            </CardContent>
                        </Card>

                        {/* Assignment info for citizens */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Assignment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {issue?.assigned_profile ? (
                                    <div className="text-sm text-muted-foreground">
                                        <div>
                                            {issue.assigned_profile.full_name ||
                                                issue.assigned_profile.email}
                                        </div>
                                        <div className="text-xs">
                                            {issue.assigned_profile.email}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        Not assigned
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Enhanced Progress Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Progress Timeline</span>
                                    {issue && (
                                        <Badge
                                            className={getStatusColor(
                                                String(issue.status).replace(
                                                    "_",
                                                    "-"
                                                )
                                            )}
                                        >
                                            {getStatusIcon(issue.status)}
                                            <span className="ml-1 capitalize">
                                                {String(issue.status).replace(
                                                    /[_-]/g,
                                                    " "
                                                )}
                                            </span>
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {timeline.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            No updates yet.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            You'll receive notifications when
                                            there are updates on your issue.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {timeline.map(
                                            (ev: any, idx: number) => {
                                                const isLatest = idx === 0;
                                                const getTimelineIcon = (
                                                    type: string,
                                                    status?: string
                                                ) => {
                                                    switch (type) {
                                                        case "created":
                                                            return (
                                                                <Clock className="w-4 h-4" />
                                                            );
                                                        case "status_update":
                                                            switch (status) {
                                                                case "assigned":
                                                                    return (
                                                                        <User className="w-4 h-4" />
                                                                    );
                                                                case "in_progress":
                                                                    return (
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                    );
                                                                case "resolved":
                                                                    return (
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    );
                                                                case "closed":
                                                                    return (
                                                                        <Flag className="w-4 h-4" />
                                                                    );
                                                                default:
                                                                    return (
                                                                        <Clock className="w-4 h-4" />
                                                                    );
                                                            }
                                                        case "admin_action":
                                                            return (
                                                                <Building2 className="w-4 h-4" />
                                                            );
                                                        case "workflow_update":
                                                            return (
                                                                <MessageCircle className="w-4 h-4" />
                                                            );
                                                        case "current_status":
                                                            return (
                                                                <Eye className="w-4 h-4" />
                                                            );
                                                        default:
                                                            return (
                                                                <Clock className="w-4 h-4" />
                                                            );
                                                    }
                                                };

                                                const getTimelineColor = (
                                                    type: string,
                                                    status?: string
                                                ) => {
                                                    switch (type) {
                                                        case "created":
                                                            return "bg-blue-500 text-white";
                                                        case "status_update":
                                                            switch (status) {
                                                                case "assigned":
                                                                    return "bg-yellow-500 text-white";
                                                                case "in_progress":
                                                                    return "bg-orange-500 text-white";
                                                                case "resolved":
                                                                    return "bg-green-500 text-white";
                                                                case "closed":
                                                                    return "bg-gray-500 text-white";
                                                                default:
                                                                    return "bg-blue-400 text-white";
                                                            }
                                                        case "admin_action":
                                                            return "bg-purple-500 text-white";
                                                        case "workflow_update":
                                                            return "bg-indigo-500 text-white";
                                                        case "current_status":
                                                            return "bg-emerald-500 text-white";
                                                        default:
                                                            return "bg-gray-400 text-white";
                                                    }
                                                };

                                                return (
                                                    <div
                                                        key={ev.id || idx}
                                                        className={`flex gap-4 ${
                                                            isLatest
                                                                ? "bg-blue-50 -mx-4 px-4 py-3 rounded-lg border-l-4 border-blue-400"
                                                                : ""
                                                        }`}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${getTimelineColor(
                                                                    ev.type,
                                                                    ev.status
                                                                )} ${
                                                                    isLatest
                                                                        ? "ring-2 ring-blue-200 shadow-lg"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {getTimelineIcon(
                                                                    ev.type,
                                                                    ev.status
                                                                )}
                                                            </div>
                                                            {idx <
                                                                timeline.length -
                                                                    1 && (
                                                                <div className="w-px h-12 bg-border mt-3" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                                                    <h4 className="font-semibold text-base">
                                                                        {
                                                                            ev.title
                                                                        }
                                                                        {isLatest && (
                                                                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                                                                Latest
                                                                            </span>
                                                                        )}
                                                                    </h4>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {ev.created_at
                                                                            ? new Date(
                                                                                  ev.created_at
                                                                              ).toLocaleString()
                                                                            : ""}
                                                                    </span>
                                                                </div>

                                                                <p className="text-sm text-gray-600">
                                                                    {
                                                                        ev.description
                                                                    }
                                                                </p>

                                                                {ev.comment && (
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 mt-2">
                                                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                                                            📝
                                                                            Admin
                                                                            Note:
                                                                        </p>
                                                                        <p className="text-sm text-gray-700">
                                                                            {
                                                                                ev.comment
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {ev.metadata
                                                                    ?.estimated_completion && (
                                                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                                                                        <p className="text-sm font-medium text-orange-900 mb-1">
                                                                            ⏰
                                                                            Estimated
                                                                            Completion:
                                                                        </p>
                                                                        <p className="text-sm text-orange-800">
                                                                            {new Date(
                                                                                ev.metadata.estimated_completion
                                                                            ).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {ev.metadata
                                                                    ?.department && (
                                                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                                                                        <p className="text-sm font-medium text-purple-900 mb-1">
                                                                            🏢
                                                                            Department:
                                                                        </p>
                                                                        <p className="text-sm text-purple-800">
                                                                            {
                                                                                ev
                                                                                    .metadata
                                                                                    .department
                                                                                    .name
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {ev.user && (
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <User className="w-3 h-3" />
                                                                        <span>
                                                                            by{" "}
                                                                            {ev
                                                                                .user
                                                                                .full_name ||
                                                                                "User"}
                                                                        </span>
                                                                        {ev.user
                                                                            .email && (
                                                                            <>
                                                                                <span>
                                                                                    •
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        ev
                                                                                            .user
                                                                                            .email
                                                                                    }
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Comments Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Comments ({comments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Add Comment */}
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) =>
                                            setNewComment(e.target.value)
                                        }
                                        className="min-h-[80px]"
                                    />
                                    <Button
                                        onClick={handleSubmitComment}
                                        disabled={!newComment.trim()}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Post Comment
                                    </Button>
                                </div>

                                <Separator />

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">
                                            No comments yet.
                                        </div>
                                    ) : (
                                        comments.map((c: any) => (
                                            <div
                                                key={c.id}
                                                className="flex gap-3"
                                            >
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage
                                                        src={"/placeholder.svg"}
                                                    />
                                                    <AvatarFallback>
                                                        {
                                                            (c.profiles
                                                                ?.full_name ||
                                                                "U")[0]
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-2">
                                                    <div className="bg-muted rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium text-sm">
                                                                {c.profiles
                                                                    ?.full_name ||
                                                                    "User"}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant={
                                                                        c.is_admin
                                                                            ? "default"
                                                                            : "secondary"
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {c.is_admin
                                                                        ? "staff"
                                                                        : "citizen"}
                                                                </Badge>
                                                                {/* Only show edit/delete for own comments */}
                                                                {c.user_id ===
                                                                    issue
                                                                        ?.profiles
                                                                        ?.id && (
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 px-2 text-xs"
                                                                            onClick={() =>
                                                                                startEditing(
                                                                                    c
                                                                                )
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                                                            onClick={() =>
                                                                                handleDeleteComment(
                                                                                    c.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {editingComment ===
                                                        c.id ? (
                                                            <div className="space-y-2">
                                                                <Textarea
                                                                    value={
                                                                        editContent
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditContent(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="min-h-[60px]"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleEditComment(
                                                                                c.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !editContent.trim()
                                                                        }
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setEditingComment(
                                                                                null
                                                                            );
                                                                            setEditContent(
                                                                                ""
                                                                            );
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm">
                                                                {c.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {new Date(
                                                                c.created_at
                                                            ).toLocaleString()}
                                                            {c.updated_at &&
                                                                c.updated_at !==
                                                                    c.created_at && (
                                                                    <span className="ml-2 italic">
                                                                        (edited)
                                                                    </span>
                                                                )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Issue Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Issue Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center text-sm">
                                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>
                                        {issue?.location_address || "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>
                                        Reported{" "}
                                        {issue
                                            ? new Date(
                                                  issue.created_at
                                              ).toLocaleDateString()
                                            : "-"}
                                    </span>
                                </div>
                                {issue?.category && (
                                    <div className="flex items-center text-sm">
                                        <AlertTriangle className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <span>
                                            Category:{" "}
                                            {issue.category.replace(
                                                /[_-]/g,
                                                " "
                                            )}
                                        </span>
                                    </div>
                                )}
                                {issue?.priority && (
                                    <div className="flex items-center text-sm">
                                        <Flag className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <Badge
                                            className={getPriorityColor(
                                                issue.priority
                                            )}
                                            variant="outline"
                                        >
                                            {issue.priority} Priority
                                        </Badge>
                                    </div>
                                )}
                                {issue?.landmark && (
                                    <div className="flex items-center text-sm">
                                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <span>Landmark: {issue.landmark}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Department & Assignment Info */}
                        {(issue?.department || issue?.assigned_profile) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <User className="w-5 h-5 mr-2" />
                                        Assignment Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {issue?.department && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-center text-sm font-medium text-blue-900 mb-1">
                                                <User className="w-4 h-4 mr-2" />
                                                Assigned Department
                                            </div>
                                            <p className="text-sm text-blue-800">
                                                {issue.department.name}
                                            </p>
                                            {issue.department.email && (
                                                <p className="text-xs text-blue-700 mt-1">
                                                    {issue.department.email}
                                                </p>
                                            )}
                                            {issue.department.description && (
                                                <p className="text-xs text-blue-700 mt-1">
                                                    {
                                                        issue.department
                                                            .description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {issue?.assigned_profile && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center text-sm font-medium text-green-900 mb-1">
                                                <User className="w-4 h-4 mr-2" />
                                                Point of Contact
                                            </div>
                                            <p className="text-sm text-green-800">
                                                {
                                                    issue.assigned_profile
                                                        .full_name
                                                }
                                            </p>
                                            {issue.assigned_profile.email && (
                                                <p className="text-xs text-green-700 mt-1">
                                                    {
                                                        issue.assigned_profile
                                                            .email
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {issue?.estimated_completion && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <div className="flex items-center text-sm font-medium text-orange-900 mb-1">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Estimated Completion
                                            </div>
                                            <p className="text-sm text-orange-800">
                                                {new Date(
                                                    issue.estimated_completion
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}

                                    {issue?.completed_at && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center text-sm font-medium text-green-900 mb-1">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Completed On
                                            </div>
                                            <p className="text-sm text-green-800">
                                                {new Date(
                                                    issue.completed_at
                                                ).toLocaleDateString()}{" "}
                                                at{" "}
                                                {new Date(
                                                    issue.completed_at
                                                ).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Reporter Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Reported By</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarImage src={"/placeholder.svg"} />
                                        <AvatarFallback>
                                            {
                                                (issue?.profiles?.full_name ||
                                                    "U")[0]
                                            }
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {issue?.profiles?.full_name ||
                                                "User"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {issue?.profiles?.email || ""}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Map */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-3">
                                    {issue?.location_lat &&
                                    issue?.location_lng ? (
                                        <InteractiveGoogleMap
                                            lat={issue.location_lat}
                                            lng={issue.location_lng}
                                            address={issue.location_address}
                                            height={320}
                                            zoom={16}
                                        />
                                    ) : (
                                        <div className="h-80 bg-gray-100 flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <MapPin className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-sm">
                                                    Location not available
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
