"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Ban,
    CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    joinDate?: string;
    status?: string;
    issuesReported?: number;
    issuesResolved?: number;
    reputation?: number;
    avatar?: string;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "active":
            return "bg-green-500 text-white";
        case "suspended":
            return "bg-red-500 text-white";
        case "pending":
            return "bg-yellow-500 text-white";
        default:
            return "bg-gray-500 text-white";
    }
};

const getReputationColor = (reputation: number) => {
    if (reputation >= 80) return "text-green-600";
    if (reputation >= 60) return "text-yellow-600";
    return "text-red-600";
};

export default function UsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");

    // Fetch users from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);

            // Fetch profiles with issue counts
            const { data: profiles, error: profilesError } = await (
                supabase as any
            ).from("profiles").select(`
                    *,
                    reported_issues:issues!user_id(count)
                `);

            if (profilesError) {
                console.error("Error fetching users:", profilesError);
                setLoading(false);
                return;
            }

            // Type assertion for profiles data
            type ProfileData = {
                id: string;
                full_name: string | null;
                email: string;
                phone: string | null;
                address: string | null;
                created_at: string;
                avatar_url?: string | null;
                reported_issues?: { count: number }[];
                resolved_issues?: { count: number }[];
            };
            const typedProfiles = (profiles || []) as ProfileData[];

            // Transform the data to match our User type
            const transformedUsers: User[] = typedProfiles.map((profile) => ({
                id: profile.id,
                name: profile.full_name || "Unknown",
                email: profile.email,
                phone: profile.phone || undefined,
                location: profile.address || undefined,
                joinDate: new Date(profile.created_at).toLocaleDateString(),
                status: "active", // Default status
                issuesReported: profile.reported_issues?.[0]?.count || 0,
                issuesResolved: 0,
                reputation: (profile.reported_issues?.[0]?.count || 0) * 10,
                avatar: profile.avatar_url || undefined,
            }));

            setUsers(transformedUsers);
            setLoading(false);
        };

        fetchUsers();
    }, [supabase]);

    // Filtering + sorting
    const filteredUsers = users
        .filter((user) => {
            const matchesSearch =
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.location?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name?.localeCompare(b.name || "") || 0;
                case "joinDate":
                    return (
                        new Date(b.joinDate || "").getTime() -
                        new Date(a.joinDate || "").getTime()
                    );
                case "reputation":
                    return (b.reputation || 0) - (a.reputation || 0);
                case "issues":
                    return (b.issuesReported || 0) - (a.issuesReported || 0);
                default:
                    return 0;
            }
        });

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Users className="w-8 h-8 text-accent" />
                    <div>
                        <h1 className="text-2xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">
                            Manage citizen accounts and activity
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="px-3 py-1">
                        Total Users: {users.length}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                        Active:{" "}
                        {users.filter((u) => u.status === "active").length}
                    </Badge>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name, email, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">
                                    Suspended
                                </SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="joinDate">
                                    Join Date
                                </SelectItem>
                                <SelectItem value="reputation">
                                    Reputation
                                </SelectItem>
                                <SelectItem value="issues">
                                    Issues Reported
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Grid */}
            {loading ? (
                <p>Loading users...</p>
            ) : filteredUsers.length > 0 ? (
                <div className="grid gap-4">
                    {filteredUsers.map((user) => (
                        <Card
                            key={user.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    {/* User Info */}
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage
                                                src={
                                                    user.avatar ||
                                                    "/placeholder.svg"
                                                }
                                                alt={user.name}
                                            />
                                            <AvatarFallback>
                                                {user.name
                                                    ?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold">
                                                    {user.name}
                                                </h3>
                                                <Badge
                                                    className={getStatusColor(
                                                        user.status || "pending"
                                                    )}
                                                >
                                                    {user.status || "pending"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                {user.email && (
                                                    <span className="flex items-center">
                                                        <Mail className="w-4 h-4 mr-1" />
                                                        {user.email}
                                                    </span>
                                                )}
                                                {user.phone && (
                                                    <span className="flex items-center">
                                                        <Phone className="w-4 h-4 mr-1" />
                                                        {user.phone}
                                                    </span>
                                                )}
                                                {user.location && (
                                                    <span className="flex items-center">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        {user.location}
                                                    </span>
                                                )}
                                                {user.joinDate && (
                                                    <span className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        Joined{" "}
                                                        {new Date(
                                                            user.joinDate
                                                        ).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats + Actions */}
                                    <div className="flex items-center space-x-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">
                                                {user.issuesReported || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Reported
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">
                                                {user.issuesResolved || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Resolved
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p
                                                className={`text-2xl font-bold ${getReputationColor(
                                                    user.reputation || 0
                                                )}`}
                                            >
                                                {user.reputation || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Reputation
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm">
                                                <Mail className="w-4 h-4 mr-1" />
                                                Contact
                                            </Button>
                                            {user.status === "active" ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 bg-transparent"
                                                >
                                                    <Ban className="w-4 h-4 mr-1" />
                                                    Suspend
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700 bg-transparent"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Activate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No users found
                        </h3>
                        <p className="text-muted-foreground">
                            Try adjusting your search or filter criteria.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
