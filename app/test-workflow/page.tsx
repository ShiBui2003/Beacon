"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import AuthDebugPanel from "@/components/auth-debug-panel";
import { useAuth } from "@/contexts/auth-context";

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function TestWorkflowPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testIssue, setTestIssue] = useState({
    title: 'Test Workflow Issue',
    description: 'Testing the automated workflow system',
    category: 'potholes',
    location_address: '123 Test Street, Test City',
    location_lat: 40.7128,
    location_lng: -74.0060
  });
  const { user } = useAuth();

  const addResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { step, status, message, data }]);
  };

  const runWorkflowTest = async () => {
    if (!user) {
      addResult('Auth Check', 'error', 'User not authenticated');
      return;
    }

    setLoading(true);
    setTestResults([]);

    try {
      // Step 1: Check if departments exist
      addResult('Database Check', 'pending', 'Checking if departments exist...');
      
      const deptResponse = await fetch('/api/departments');
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        addResult('Database Check', 'success', `Found ${deptData.departments?.length || 0} departments`, deptData.departments);
      } else {
        addResult('Database Check', 'error', 'Failed to fetch departments');
        return;
      }

      // Step 2: Create test issue
      addResult('Issue Creation', 'pending', 'Creating test issue...');
      
      const issueResponse = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testIssue),
      });

      if (issueResponse.ok) {
        const issueData = await issueResponse.json();
        addResult('Issue Creation', 'success', 'Issue created successfully', issueData.issue);
        
        // Step 3: Check if issue was auto-assigned
        const issue = issueData.issue;
        if (issue.department_id) {
          addResult('Auto Assignment', 'success', `Issue auto-assigned to department: ${issue.department?.name || 'Unknown'}`, issue.department);
        } else {
          addResult('Auto Assignment', 'error', 'Issue was not auto-assigned to a department');
        }

        // Step 4: Check if notification was created
        addResult('Notification Check', 'pending', 'Checking for notifications...');
        
        const notifResponse = await fetch('/api/notifications?limit=5');
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          const recentNotif = notifData.notifications?.find((n: any) => 
            n.issue_id === issue.id || n.message.includes(issue.title)
          );
          
          if (recentNotif) {
            addResult('Notification Check', 'success', 'Notification created successfully', recentNotif);
          } else {
            addResult('Notification Check', 'error', 'No notification found for the created issue');
          }
        } else {
          addResult('Notification Check', 'error', 'Failed to fetch notifications');
        }

        // Step 5: Test status update
        addResult('Status Update', 'pending', 'Testing status update...');
        
        const statusResponse = await fetch(`/api/issues/${issue.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in_progress',
            notes: 'Test status update from workflow test'
          }),
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          addResult('Status Update', 'success', 'Status updated successfully', statusData.issue);
          
          // Step 6: Check for new notification after status update
          setTimeout(async () => {
            const newNotifResponse = await fetch('/api/notifications?limit=5');
            if (newNotifResponse.ok) {
              const newNotifData = await newNotifResponse.json();
              const statusNotif = newNotifData.notifications?.find((n: any) => 
                n.issue_id === issue.id && n.message.includes('Work has started')
              );
              
              if (statusNotif) {
                addResult('Status Notification', 'success', 'Status update notification created', statusNotif);
              } else {
                addResult('Status Notification', 'error', 'No status update notification found');
              }
            }
          }, 1000);
        } else {
          addResult('Status Update', 'error', 'Failed to update status');
        }

        // Step 7: Check workflow history
        addResult('Workflow History', 'pending', 'Checking workflow history...');
        
        const workflowResponse = await fetch(`/api/issues/${issue.id}/workflow`);
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          addResult('Workflow History', 'success', `Found ${workflowData.workflow?.length || 0} workflow entries`, workflowData.workflow);
        } else {
          addResult('Workflow History', 'error', 'Failed to fetch workflow history');
        }

      } else {
        const errorData = await issueResponse.json();
        addResult('Issue Creation', 'error', errorData.error || 'Failed to create issue');
      }

    } catch (error) {
      addResult('Test Error', 'error', `Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow Test Page</h1>
        <p className="text-muted-foreground">
          Test the automated issue workflow system and debug authentication issues.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={testIssue.title}
                  onChange={(e) => setTestIssue(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={testIssue.description}
                  onChange={(e) => setTestIssue(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={testIssue.category}
                  onValueChange={(value) => setTestIssue(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potholes">Potholes</SelectItem>
                    <SelectItem value="streetlights">Street Lights</SelectItem>
                    <SelectItem value="garbage">Garbage</SelectItem>
                    <SelectItem value="water">Water Issues</SelectItem>
                    <SelectItem value="parks">Parks</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={runWorkflowTest} 
                disabled={loading || !user}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  'Run Workflow Test'
                )}
              </Button>

              {!user && (
                <p className="text-sm text-red-500">
                  Please log in to run the workflow test.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{result.step}</h4>
                          <Badge 
                            variant={
                              result.status === 'success' ? 'default' : 
                              result.status === 'error' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-blue-600">
                              View Data
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Auth Debug Panel */}
        <div>
          <AuthDebugPanel />
        </div>
      </div>
    </div>
  );
}
