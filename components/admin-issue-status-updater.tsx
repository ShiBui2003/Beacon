"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  Building2, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  X,
  Play,
  Pause
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminIssueStatusUpdaterProps {
  issueId: string;
  currentStatus: string;
  currentAssignedTo?: string;
  departmentId?: string;
  onStatusUpdate?: (newStatus: string, assignedTo?: string) => void;
}

const statusOptions = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "assigned", label: "Assigned", color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-800" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" }
];

export default function AdminIssueStatusUpdater({
  issueId,
  currentStatus,
  currentAssignedTo,
  departmentId,
  onStatusUpdate
}: AdminIssueStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [assignedTo, setAssignedTo] = useState(currentAssignedTo || "");
  const [notes, setNotes] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatus = async () => {
    if (!status) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/simple-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          assigned_to: assignedTo || null,
          notes: notes.trim() || null,
          estimated_completion: estimatedCompletion || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Issue status updated successfully",
        });
        
        // Clear form
        setNotes("");
        setEstimatedCompletion("");
        
        // Notify parent component
        if (onStatusUpdate) {
          onStatusUpdate(status, assignedTo);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStatusConfig = statusOptions.find(opt => opt.value === currentStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Update Issue Status
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current Status:</span>
          <Badge className={currentStatusConfig?.color}>
            {currentStatusConfig?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="status">New Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <Label htmlFor="assigned-to" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Assign To (User ID)
          </Label>
          <Input
            id="assigned-to"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Enter user ID to assign"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to unassign. You can find user IDs in the admin panel.
          </p>
        </div>

        {/* Estimated Completion */}
        <div className="space-y-2">
          <Label htmlFor="estimated-completion" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Estimated Completion
          </Label>
          <Input
            id="estimated-completion"
            type="datetime-local"
            value={estimatedCompletion}
            onChange={(e) => setEstimatedCompletion(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Update Notes
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this status update (optional)"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            These notes will be visible to the citizen who reported the issue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleUpdateStatus} 
            disabled={loading || status === currentStatus}
            className="flex-1"
          >
            {loading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
        </div>

        {/* Status Change Preview */}
        {status !== currentStatus && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Status Change Preview:</span>
            </div>
            <div className="mt-2 text-sm text-blue-800">
              <span className="font-medium">{currentStatusConfig?.label}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">{statusOptions.find(opt => opt.value === status)?.label}</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              The citizen will receive a notification about this status change.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
