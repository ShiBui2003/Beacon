"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  Building2,
  RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WorkflowState {
  id: string;
  status: string;
  notes?: string;
  estimated_completion?: string;
  created_at: string;
  department?: { name: string };
  assigned_user?: { full_name: string; email: string };
  created_by_user?: { full_name: string; email: string };
}

interface IssueStatusTrackerProps {
  issueId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const statusConfig = {
  submitted: { 
    label: "Submitted", 
    color: "bg-blue-500", 
    icon: FileText,
    description: "Your issue has been submitted and is awaiting review."
  },
  assigned: { 
    label: "Assigned", 
    color: "bg-yellow-500", 
    icon: User,
    description: "Your issue has been assigned to the appropriate department."
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-orange-500", 
    icon: Clock,
    description: "Work has started on resolving your issue."
  },
  resolved: { 
    label: "Resolved", 
    color: "bg-green-500", 
    icon: CheckCircle,
    description: "Your issue has been resolved."
  },
  closed: { 
    label: "Closed", 
    color: "bg-gray-500", 
    icon: CheckCircle,
    description: "This issue has been closed."
  }
};

const statusOrder = ["submitted", "assigned", "in_progress", "resolved", "closed"];

export default function IssueStatusTracker({ 
  issueId, 
  currentStatus, 
  onStatusUpdate 
}: IssueStatusTrackerProps) {
  const [workflow, setWorkflow] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/workflow`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow || []);
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkflow();
  };

  useEffect(() => {
    fetchWorkflow();

    // Set up real-time subscription for workflow updates
    const supabase = createClient();
    const channel = supabase
      .channel(`issue-workflow-${issueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_workflow_states',
          filter: `issue_id=eq.${issueId}`
        },
        () => {
          fetchWorkflow();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues',
          filter: `id=eq.${issueId}`
        },
        (payload) => {
          if (payload.new.status !== currentStatus && onStatusUpdate) {
            onStatusUpdate(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, currentStatus, onStatusUpdate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status Timeline
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Progress Bar */}
        <div className="space-y-4">
          {statusOrder.map((status, index) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const Icon = config.icon;
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = status === currentStatus;
            
            return (
              <div key={status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? config.color 
                        : 'bg-gray-200'
                    } text-white`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < statusOrder.length - 1 && (
                    <div 
                      className={`w-0.5 h-8 mt-2 ${
                        isCompleted ? 'bg-gray-300' : 'bg-gray-200'
                      }`} 
                    />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                      {config.label}
                    </h3>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {config.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow History */}
        {workflow.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Activity History
            </h4>
            <div className="space-y-4">
              {workflow.map((state) => (
                <div key={state.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {statusConfig[state.status as keyof typeof statusConfig]?.label || state.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(state.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {state.department && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="w-3 h-3" />
                      {state.department.name}
                    </div>
                  )}
                  
                  {state.assigned_user && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <User className="w-3 h-3" />
                      Assigned to: {state.assigned_user.full_name}
                    </div>
                  )}
                  
                  {state.estimated_completion && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      Expected completion: {new Date(state.estimated_completion).toLocaleDateString()}
                    </div>
                  )}
                  
                  {state.notes && (
                    <p className="text-sm bg-gray-50 p-2 rounded mt-2">
                      {state.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
