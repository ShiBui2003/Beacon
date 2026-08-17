"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    Key,
    Trash2,
    Eye,
    EyeOff,
    AlertTriangle,
    Shield,
    Lock,
} from "lucide-react";

interface AccountManagementProps {
    userType: "citizen" | "admin";
}

export default function AccountManagement({
    userType,
}: AccountManagementProps) {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    // Password reset states
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Account deletion states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState("");

    const handlePasswordReset = async () => {
        if (!newPassword || !confirmPassword) {
            toast({
                title: "Error",
                description: "All fields are required",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: "Error",
                description: "New password must be at least 6 characters long",
                variant: "destructive",
            });
            return;
        }

        setPasswordLoading(true);
        try {
            console.log("Sending password reset request:", {
                newPassword: newPassword ? "***" : "missing",
            });

            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    newPassword,
                }),
            });

            console.log("Password reset response status:", response.status);
            const data = await response.json();
            console.log("Password reset response data:", data);

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Password updated successfully",
                });
                setShowPasswordReset(false);
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to update password",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update password. Please try again.",
                variant: "destructive",
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleAccountDeletion = async () => {
        if (!deletePassword) {
            toast({
                title: "Error",
                description: "Password is required to delete account",
                variant: "destructive",
            });
            return;
        }

        if (confirmDelete !== "DELETE") {
            toast({
                title: "Error",
                description: "Please type 'DELETE' to confirm account deletion",
                variant: "destructive",
            });
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await fetch("/api/auth/delete-account", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    password: deletePassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Account Deleted",
                    description:
                        "Your account and all data have been permanently deleted. You will be redirected to create a new account.",
                });

                // Wait a moment for the toast to show, then sign out and redirect to signup
                setTimeout(async () => {
                    await signOut();
                    router.push("/auth?mode=signup");
                }, 2000);
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete account",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete account. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Password Reset Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Change Password
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Update Password</p>
                            <p className="text-sm text-muted-foreground">
                                Change your account password for better security
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPasswordReset(true)}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Account Deletion Section */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="w-5 h-5" />
                        Delete Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 sm:mb-0">
                            <h3 className="font-semibold text-red-600">
                                Permanently Delete Your Account
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                This action is final and cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            className="self-start sm:self-center"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Request Account Deletion
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Password Reset Dialog */}
            <Dialog
                open={showPasswordReset}
                onOpenChange={setShowPasswordReset}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Change Password
                        </DialogTitle>
                        <DialogDescription>
                            Choose a new password for your account
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    placeholder="Enter new password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                    }
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Confirm new password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPasswordReset(false);
                                setNewPassword("");
                                setConfirmPassword("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePasswordReset}
                            disabled={passwordLoading}
                        >
                            {passwordLoading
                                ? "Updating..."
                                : "Update Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account Deletion Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Account
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All your data will be
                            permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div className="text-sm text-red-800">
                                    <p className="font-medium">
                                        Warning: This action is irreversible
                                    </p>
                                    <p className="mt-1">
                                        All your data including profile, issues,
                                        comments, and votes will be permanently
                                        deleted.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="delete-password">
                                Enter Password to Confirm
                            </Label>
                            <div className="relative">
                                <Input
                                    id="delete-password"
                                    type={
                                        showDeletePassword ? "text" : "password"
                                    }
                                    value={deletePassword}
                                    onChange={(e) =>
                                        setDeletePassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        setShowDeletePassword(
                                            !showDeletePassword
                                        )
                                    }
                                >
                                    {showDeletePassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-delete">
                                Type "DELETE" to confirm
                            </Label>
                            <Input
                                id="confirm-delete"
                                value={confirmDelete}
                                onChange={(e) =>
                                    setConfirmDelete(e.target.value)
                                }
                                placeholder="Type DELETE to confirm"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setDeletePassword("");
                                setConfirmDelete("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleAccountDeletion}
                            disabled={
                                deleteLoading ||
                                !deletePassword ||
                                confirmDelete !== "DELETE"
                            }
                        >
                            {deleteLoading
                                ? "Deleting..."
                                : "I understand, delete my account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
