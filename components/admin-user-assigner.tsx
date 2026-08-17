"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserOption = { id: string; full_name: string | null; email: string };

export default function AdminUserAssigner({
    issueId,
    departmentId,
    currentAssignee,
    onAssigned,
}: {
    issueId: string;
    departmentId?: string | null;
    currentAssignee?: { full_name: string | null; email: string } | null;
    onAssigned?: (user: UserOption | null) => void;
}) {
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const load = async () => {
            if (!departmentId) return;
            try {
                const res = await fetch(
                    `/api/departments/${departmentId}/users`,
                    {
                        credentials: "include",
                    }
                );
                const json = await res.json();
                if (!res.ok)
                    throw new Error(json.error || "Failed to load users");
                setUsers(json.users || []);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [departmentId]);

    const assign = async () => {
        if (!issueId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/issues/${issueId}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ assigned_to: selected || null }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to assign");
            const assigned = users.find((u) => u.id === selected) || null;
            toast({
                title: "Assigned",
                description: assigned
                    ? `Assigned to ${assigned.full_name || assigned.email}`
                    : "Unassigned",
            });
            onAssigned?.(assigned);
        } catch (e: any) {
            toast({
                title: "Assign failed",
                description: e.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" /> Assign to User
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <Label className="mb-1 block">Current Assignee</Label>
                    {currentAssignee ? (
                        <div className="text-sm text-muted-foreground">
                            {currentAssignee.full_name || currentAssignee.email}
                            <div className="text-xs">
                                {currentAssignee.email}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Not assigned
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Select user in department</Label>
                    <Select value={selected} onValueChange={setSelected}>
                        <SelectTrigger className="w-full">
                            <SelectValue
                                placeholder={
                                    users.length
                                        ? "Choose user"
                                        : departmentId
                                        ? "Loading…"
                                        : "No department"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassign">Unassign</SelectItem>
                            {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                    {u.full_name || u.email} — {u.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={assign} disabled={loading} className="w-full">
                    {loading ? "Assigning…" : "Assign"}
                </Button>
            </CardContent>
        </Card>
    );
}
