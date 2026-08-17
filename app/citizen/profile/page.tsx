"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import LocationPicker from "@/components/location-picker";
import PhoneInput from "@/components/phone-input";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Mail,
    Calendar,
    MapPin,
    Phone,
    Edit,
    Save,
    X,
    Camera,
    Upload,
    Settings,
    Bell,
    Shield,
    Eye,
    EyeOff,
    Trash2,
    RefreshCw,
} from "lucide-react";
import AccountManagement from "@/components/account-management";
import { getDepartmentName } from "@/lib/departments";

interface ProfileData {
    full_name: string;
    email: string;
    phone?: string;
    bio?: string;
    location?: string;
    location_coordinates?: { lat: number; lng: number };
    avatar_url?: string;
    email_notifications: boolean;
    push_notifications: boolean;
    privacy_public_profile: boolean;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userRole, setUserRole] = useState<string>("");
    const [userDepartment, setUserDepartment] = useState<string>("");
    const [userDepartmentName, setUserDepartmentName] = useState<string>("");
    const [profileData, setProfileData] = useState<ProfileData>({
        full_name: "",
        email: "",
        phone: "",
        bio: "",
        location: "",
        location_coordinates: undefined,
        avatar_url: "",
        email_notifications: true,
        push_notifications: true,
        privacy_public_profile: true,
    });
    const [issueStats, setIssueStats] = useState({
        reported: 0,
        resolved: 0,
        in_progress: 0,
        submitted: 0,
        assigned: 0,
        closed: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            // Set user role and department from metadata
            const role = user.user_metadata?.role || user.role || "citizen";
            const department = user.user_metadata?.department;
            setUserRole(role);
            setUserDepartment(department || "");

            // Get department name
            if (department) {
                getDepartmentName(department).then(setUserDepartmentName);
            }

            fetchProfileData();
            fetchIssueStats();
        }
    }, [user]);

    const fetchProfileData = async () => {
        try {
            const response = await fetch("/api/profile", {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setProfileData({
                    full_name:
                        data.profile?.full_name ||
                        user?.user_metadata?.full_name ||
                        "",
                    email: user?.email || "",
                    phone: data.profile?.phone || "",
                    bio: data.profile?.bio || "",
                    location: data.profile?.location || "",
                    location_coordinates:
                        data.profile?.location_coordinates || undefined,
                    avatar_url: data.profile?.avatar_url || "",
                    email_notifications:
                        data.profile?.email_notifications ?? true,
                    push_notifications:
                        data.profile?.push_notifications ?? true,
                    privacy_public_profile:
                        data.profile?.privacy_public_profile ?? true,
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchIssueStats = async () => {
        try {
            setStatsLoading(true);
            const response = await fetch("/api/profile/stats", {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Stats data received:", data.stats); // Debug log
                setIssueStats(
                    data.stats || {
                        reported: 0,
                        resolved: 0,
                        in_progress: 0,
                        submitted: 0,
                        assigned: 0,
                        closed: 0,
                    }
                );
            } else {
                console.error(
                    "Stats API error:",
                    response.status,
                    response.statusText
                );
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(profileData),
            });

            if (response.ok) {
                toast({
                    title: "Profile updated",
                    description: "Your profile has been successfully updated.",
                });
                setIsEditing(false);
            } else {
                throw new Error("Failed to update profile");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/avatar", {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProfileData((prev) => ({ ...prev, avatar_url: data.url }));
                toast({
                    title: "Avatar updated",
                    description: "Your profile picture has been updated.",
                });
            } else {
                throw new Error("Failed to upload avatar");
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to upload avatar. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const displayName =
        profileData.full_name || user?.email?.split("@")[0] || "User";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                    <p className="text-gray-600">
                        Manage your account information and settings
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Overview */}
                    <div className="lg:col-span-1">
                        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <Avatar className="w-24 h-24">
                                        {profileData.avatar_url ? (
                                            <AvatarImage
                                                src={profileData.avatar_url}
                                                alt={displayName}
                                            />
                                        ) : (
                                            <AvatarFallback className="text-2xl">
                                                {displayName
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    {isEditing && (
                                        <div className="absolute -bottom-2 -right-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file =
                                                        e.target.files?.[0];
                                                    if (file)
                                                        handleAvatarUpload(
                                                            file
                                                        );
                                                }}
                                                className="hidden"
                                                id="avatar-upload"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#2E6A56] to-emerald-600 text-white rounded-full cursor-pointer hover:shadow-lg transition-all duration-300"
                                            >
                                                {uploading ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Camera className="w-4 h-4" />
                                                )}
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <h2 className="text-xl font-semibold mb-2 text-gray-900">
                                    {displayName}
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {profileData.email}
                                </p>

                                {/* Role and Department Display */}
                                <div className="flex flex-col gap-2 mb-4">
                                    <Badge
                                        variant="secondary"
                                        className="w-fit bg-gradient-to-r from-[#2E6A56]/10 to-emerald-100 text-[#2E6A56] border-0"
                                    >
                                        {userRole === "admin"
                                            ? "Administrator"
                                            : "Citizen"}
                                    </Badge>
                                    {userDepartmentName && (
                                        <Badge
                                            variant="outline"
                                            className="w-fit border-[#2E6A56]/30 text-[#2E6A56]"
                                        >
                                            {userDepartmentName}
                                        </Badge>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        size="sm"
                                        className="border-[#2E6A56]/30 text-[#2E6A56] hover:bg-[#2E6A56]/10"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSave}
                                            disabled={loading}
                                            size="sm"
                                            className="bg-gradient-to-r from-[#2E6A56] to-emerald-600 hover:from-[#1f4a3a] hover:to-emerald-700"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {loading ? "Saving..." : "Save"}
                                        </Button>
                                        <Button
                                            onClick={() => setIsEditing(false)}
                                            variant="outline"
                                            size="sm"
                                            className="border-[#2E6A56]/30 text-[#2E6A56] hover:bg-[#2E6A56]/10"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enhanced Activity Summary */}
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    📊 Activity Summary
                                    {statsLoading && (
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    )}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchIssueStats}
                                    disabled={statsLoading}
                                    className="h-8 w-8 p-0"
                                    title="Refresh stats"
                                >
                                    <RefreshCw
                                        className={`w-4 h-4 ${
                                            statsLoading ? "animate-spin" : ""
                                        }`}
                                    />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center"
                                        >
                                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                            <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-blue-900">
                                                Total Reported
                                            </span>
                                        </div>
                                        <Badge className="bg-blue-500 text-white">
                                            {issueStats.reported}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-yellow-900">
                                                Submitted
                                            </span>
                                        </div>
                                        <Badge className="bg-yellow-500 text-white">
                                            {issueStats.submitted}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center p-2 rounded-lg bg-orange-50 border border-orange-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-orange-900">
                                                In Progress
                                            </span>
                                        </div>
                                        <Badge className="bg-orange-500 text-white">
                                            {issueStats.in_progress}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50 border border-purple-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-purple-900">
                                                Assigned
                                            </span>
                                        </div>
                                        <Badge className="bg-purple-500 text-white">
                                            {issueStats.assigned}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-green-900">
                                                Resolved
                                            </span>
                                        </div>
                                        <Badge className="bg-green-500 text-white">
                                            {issueStats.resolved}
                                        </Badge>
                                    </div>

                                    {issueStats.closed > 0 && (
                                        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    Closed
                                                </span>
                                            </div>
                                            <Badge className="bg-gray-500 text-white">
                                                {issueStats.closed}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!statsLoading && issueStats.reported === 0 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        📝
                                    </div>
                                    <p className="text-sm font-medium">
                                        No issues reported yet
                                    </p>
                                    <p className="text-xs mt-1">
                                        Start by reporting your first civic
                                        issue!
                                    </p>
                                </div>
                            )}

                            {!statsLoading && issueStats.reported > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Success Rate:</span>
                                        <span className="font-medium">
                                            {issueStats.reported > 0
                                                ? Math.round(
                                                      (issueStats.resolved /
                                                          issueStats.reported) *
                                                          100
                                                  )
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    {isEditing ? (
                                        <Input
                                            id="full_name"
                                            value={profileData.full_name}
                                            onChange={(e) =>
                                                setProfileData((prev) => ({
                                                    ...prev,
                                                    full_name: e.target.value,
                                                }))
                                            }
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <p className="text-muted-foreground">
                                            {profileData.full_name ||
                                                "Not provided"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <p className="text-muted-foreground">
                                        {profileData.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Email cannot be changed here
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {isEditing ? (
                                        <PhoneInput
                                            value={profileData.phone || ""}
                                            onChange={(value) =>
                                                setProfileData((prev) => ({
                                                    ...prev,
                                                    phone: value,
                                                }))
                                            }
                                            label="Phone Number"
                                            placeholder="Enter 10-digit mobile number"
                                        />
                                    ) : (
                                        <>
                                            <Label htmlFor="phone">
                                                Phone Number
                                            </Label>
                                            <p className="text-muted-foreground">
                                                {profileData.phone
                                                    ? `+91 ${profileData.phone}`
                                                    : "Not provided"}
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {isEditing ? (
                                        <div>
                                            <Label htmlFor="location">
                                                Location
                                            </Label>
                                            <LocationPicker
                                                value={
                                                    profileData.location || ""
                                                }
                                                onChange={(
                                                    location,
                                                    coordinates
                                                ) =>
                                                    setProfileData((prev) => ({
                                                        ...prev,
                                                        location,
                                                        location_coordinates:
                                                            coordinates,
                                                    }))
                                                }
                                                placeholder="Enter your city/area"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Label htmlFor="location">
                                                Location
                                            </Label>
                                            <p className="text-muted-foreground">
                                                {profileData.location ||
                                                    "Not provided"}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                {isEditing ? (
                                    <Textarea
                                        id="bio"
                                        value={profileData.bio}
                                        onChange={(e) =>
                                            setProfileData((prev) => ({
                                                ...prev,
                                                bio: e.target.value,
                                            }))
                                        }
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">
                                        {profileData.bio || "No bio provided"}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notification Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        Email Notifications
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive updates about your issues via
                                        email
                                    </p>
                                </div>
                                <Switch
                                    checked={profileData.email_notifications}
                                    onCheckedChange={(checked) =>
                                        setProfileData((prev) => ({
                                            ...prev,
                                            email_notifications: checked,
                                        }))
                                    }
                                    disabled={!isEditing}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        Push Notifications
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive instant notifications in your
                                        browser
                                    </p>
                                </div>
                                <Switch
                                    checked={profileData.push_notifications}
                                    onCheckedChange={(checked) =>
                                        setProfileData((prev) => ({
                                            ...prev,
                                            push_notifications: checked,
                                        }))
                                    }
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Privacy Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        Public Profile
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Allow others to see your profile
                                        information
                                    </p>
                                </div>
                                <Switch
                                    checked={profileData.privacy_public_profile}
                                    onCheckedChange={(checked) =>
                                        setProfileData((prev) => ({
                                            ...prev,
                                            privacy_public_profile: checked,
                                        }))
                                    }
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Management */}
                    <AccountManagement userType="citizen" />
                </div>
            </div>
        </div>
        </div>
    );
}
