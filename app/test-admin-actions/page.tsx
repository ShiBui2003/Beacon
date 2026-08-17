"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Building2,
  RefreshCw
} from "lucide-react";

export default function TestAdminActionsPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const handleTestAction = async (action: string) => {
    setProcessing(true);
    setTestResult(`Testing action: ${action}...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTestResult(`✅ Action "${action}" completed successfully!`);
    setProcessing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Admin Actions</h1>
        <p className="text-muted-foreground">
          Test the admin dropdown menu actions to ensure they're working properly.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Dropdown */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions Dropdown Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Sample Issue</h3>
                <p className="text-sm text-muted-foreground">Test issue for dropdown actions</p>
                <Badge variant="outline" className="mt-1">submitted</Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    disabled={processing}
                  >
                    {processing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => handleTestAction('view')}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTestAction('edit')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Issue
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status Actions</DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => handleTestAction('accept')}
                    className="text-green-600 focus:text-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Issue
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleTestAction('reject')}
                    className="text-red-600 focus:text-red-600"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reject Issue
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleTestAction('in_progress')}
                    className="text-blue-600 focus:text-blue-600"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Work
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Management</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleTestAction('assign')}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Assign Department
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {testResult && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{testResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click the 3-dot menu button (⋯) above</li>
              <li>Try different actions from the dropdown</li>
              <li>Verify each action shows a success message</li>
              <li>Check that the button shows a loading spinner during processing</li>
              <li>If this works, the admin issues page dropdown should work too</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If this test dropdown works but the admin issues page doesn't, 
                there might be a JavaScript error or missing component import in the admin page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>If dropdown doesn't open:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Check browser console for JavaScript errors</li>
                  <li>Verify all UI components are properly imported</li>
                  <li>Make sure Radix UI dropdown components are installed</li>
                </ul>
              </div>
              
              <div>
                <strong>If actions don't work:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Check if API endpoints exist and are working</li>
                  <li>Verify authentication is working properly</li>
                  <li>Look for network errors in browser dev tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
