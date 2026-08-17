"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    User,
    CheckCircle,
    AlertCircle,
    Clock,
    Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSuggestedDepartments, type Department } from "@/lib/departments";

interface AdminDepartmentAssignerProps {
    issueId: string;
    issueCategory: string;
    currentDepartment?: {
        id: string;
        name: string;
    };
    onDepartmentAssigned?: (department: Department) => void;
}

// This will now be fetched from the database

export default function AdminDepartmentAssigner({
    issueId,
    issueCategory,
    currentDepartment,
    onDepartmentAssigned,
}: AdminDepartmentAssignerProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(
        currentDepartment?.id || ""
    );
    const [loading, setLoading] = useState(false);
    const [fetchingDepartments, setFetchingDepartments] = useState(true);
    const { toast } = useToast();

    // Fetch departments on component mount
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await fetch("/api/departments");
            if (response.ok) {
                const data = await response.json();
                if (data.departments && data.departments.length > 0) {
                    setDepartments(data.departments);
                } else {
                    console.warn(
                        "No departments returned from API, using defaults"
                    );
                    setDepartments(getDefaultDepartments());
                }
            } else {
                console.error(
                    "Failed to fetch departments, status:",
                    response.status
                );
                // Fallback to default departments if API fails
                setDepartments(getDefaultDepartments());
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
            // Fallback to default departments
            setDepartments(getDefaultDepartments());
        } finally {
            setFetchingDepartments(false);
        }
    };

    // Default departments based on common municipal departments
    const getDefaultDepartments = (): Department[] => [
        {
            id: "public-works",
            name: "Public Works",
            description: "Roads, infrastructure, and general maintenance",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: "utilities",
            name: "Utilities",
            description: "Water, electricity, and utility services",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: "sanitation",
            name: "Sanitation",
            description: "Waste management and cleaning services",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: "transportation",
            name: "Transportation",
            description: "Traffic management and public transport",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: "public-safety",
            name: "Public Safety",
            description: "Safety and emergency services",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: "environmental",
            name: "Environmental Services",
            description: "Environmental and health services",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: "general",
            name: "General Services",
            description: "General municipal services",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    const handleAssignDepartment = async () => {
        if (!selectedDepartmentId) {
            toast({
                title: "Error",
                description: "Please select a department",
                variant: "destructive",
            });
            return;
        }

        console.log("Assigning department:", {
            issueId,
            selectedDepartmentId,
            departments: departments.length,
        });

        setLoading(true);
        try {
            const response = await fetch(
                `/api/issues/${issueId}/assign-department`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        department_id: selectedDepartmentId,
                    }),
                }
            );

            const data = await response.json();
            console.log("Assignment response:", {
                status: response.status,
                data,
            });

            if (response.ok) {
                const assignedDepartment = departments.find(
                    (d) => d.id === selectedDepartmentId
                );

                toast({
                    title: "Success",
                    description: `Issue assigned to ${assignedDepartment?.name}`,
                });

                // Notify parent component
                if (onDepartmentAssigned && assignedDepartment) {
                    onDepartmentAssigned(assignedDepartment);
                }
            } else {
                console.error("Assignment failed:", data);
                throw new Error(data.error || "Failed to assign department");
            }
        } catch (error) {
            console.error("Error assigning department:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to assign department",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const [suggestedDepartments, setSuggestedDepartments] = useState<
        Department[]
    >([]);

    // Fetch suggested departments when component mounts or category changes
    useEffect(() => {
        const fetchSuggested = async () => {
            try {
                const suggested = await getSuggestedDepartments(issueCategory);
                setSuggestedDepartments(suggested);
            } catch (error) {
                console.error("Error fetching suggested departments:", error);
                setSuggestedDepartments([]);
            }
        };

        if (issueCategory && departments.length > 0) {
            fetchSuggested();
        }
    }, [issueCategory, departments]);

    if (fetchingDepartments) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Assign Department
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 animate-spin" />
                        Loading departments...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-visible">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Assign Department
                </CardTitle>
                {currentDepartment && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Currently assigned to:
                        </span>
                        <Badge variant="outline">
                            {currentDepartment.name}
                        </Badge>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4 overflow-visible">
                {/* Category-based suggestions */}
                {suggestedDepartments.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                                Suggested for "{issueCategory}" category:
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {suggestedDepartments.map((dept) => (
                                <Badge
                                    key={dept.id}
                                    variant="secondary"
                                    className="text-xs cursor-pointer hover:bg-blue-100"
                                    onClick={() =>
                                        setSelectedDepartmentId(dept.id)
                                    }
                                >
                                    {dept.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Department Selection */}
                <div className="space-y-2">
                    <Label htmlFor="department">Select Department</Label>
                    <Select
                        value={selectedDepartmentId}
                        onValueChange={setSelectedDepartmentId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a department" />
                        </SelectTrigger>
                        <SelectContent className="w-full min-w-[300px] max-w-[400px]">
                            {departments.map((department) => (
                                <SelectItem
                                    key={department.id}
                                    value={department.id}
                                    className="w-full"
                                >
                                    <div className="flex items-start space-x-2 w-full">
                                        <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col w-full">
                                            <span className="font-medium">
                                                {department.name}
                                            </span>
                                            {department.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {department.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Department Head Info */}
                {selectedDepartmentId && (
                    <div className="space-y-2">
                        {(() => {
                            const selectedDept = departments.find(
                                (d) => d.id === selectedDepartmentId
                            );
                            return (
                                selectedDept && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm mb-1">
                                            <User className="w-4 h-4" />
                                            <span className="font-medium">
                                                Department Details
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            {selectedDept.head && (
                                                <p>
                                                    Head:{" "}
                                                    {
                                                        selectedDept.head
                                                            .full_name
                                                    }
                                                </p>
                                            )}
                                            {selectedDept.email && (
                                                <p>
                                                    Email: {selectedDept.email}
                                                </p>
                                            )}
                                            {selectedDept.description && (
                                                <p>
                                                    {selectedDept.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            );
                        })()}
                    </div>
                )}

                {/* Action Button */}
                <div className="flex gap-2 pt-4">
                    <Button
                        onClick={handleAssignDepartment}
                        disabled={
                            loading ||
                            !selectedDepartmentId ||
                            selectedDepartmentId === currentDepartment?.id
                        }
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {currentDepartment
                                    ? "Reassign Department"
                                    : "Assign Department"}
                            </>
                        )}
                    </Button>
                </div>

                {/* Assignment Preview */}
                {selectedDepartmentId &&
                    selectedDepartmentId !== currentDepartment?.id && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-900">
                                    Assignment Preview:
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-green-800">
                                {currentDepartment ? (
                                    <>
                                        <span className="font-medium">
                                            {currentDepartment.name}
                                        </span>
                                        <span className="mx-2">→</span>
                                        <span className="font-medium">
                                            {
                                                departments.find(
                                                    (d) =>
                                                        d.id ===
                                                        selectedDepartmentId
                                                )?.name
                                            }
                                        </span>
                                    </>
                                ) : (
                                    <span className="font-medium">
                                        Will be assigned to{" "}
                                        {
                                            departments.find(
                                                (d) =>
                                                    d.id ===
                                                    selectedDepartmentId
                                            )?.name
                                        }
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                                The department will receive a notification about
                                this assignment.
                            </p>
                        </div>
                    )}
            </CardContent>
        </Card>
    );
}
