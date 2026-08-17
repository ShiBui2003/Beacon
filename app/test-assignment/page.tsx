"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface TestResult {
  category: string;
  expectedDepartment: string;
  actualDepartment?: string;
  status: 'pending' | 'success' | 'error';
  issueId?: string;
}

const categoryMappings = [
  { category: 'roads', expectedDepartment: 'Road Maintenance' },
  { category: 'potholes', expectedDepartment: 'Road Maintenance' },
  { category: 'streetlights', expectedDepartment: 'Electrical Services' },
  { category: 'traffic-lights', expectedDepartment: 'Electrical Services' },
  { category: 'garbage', expectedDepartment: 'Sanitation' },
  { category: 'water', expectedDepartment: 'Water & Sewage' },
  { category: 'drainage', expectedDepartment: 'Water & Sewage' },
  { category: 'parks', expectedDepartment: 'Parks & Recreation' },
  { category: 'traffic', expectedDepartment: 'Traffic Management' },
];

export default function TestAssignmentPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const testAutoAssignment = async () => {
    if (!user) {
      alert('Please log in to test auto-assignment');
      return;
    }

    setLoading(true);
    setTestResults([]);

    for (const mapping of categoryMappings) {
      const result: TestResult = {
        category: mapping.category,
        expectedDepartment: mapping.expectedDepartment,
        status: 'pending'
      };
      
      setTestResults(prev => [...prev, result]);

      try {
        // Create test issue
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Test Auto-Assignment: ${mapping.category}`,
            description: `Testing automatic department assignment for category: ${mapping.category}`,
            category: mapping.category,
            priority: 'medium',
            location_address: '123 Test Street, Test City',
            location_lat: 40.7128,
            location_lng: -74.0060
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const issue = data.issue;
          
          result.issueId = issue.id;
          result.actualDepartment = issue.department?.name || 'Not Assigned';
          result.status = issue.department?.name === mapping.expectedDepartment ? 'success' : 'error';
        } else {
          result.status = 'error';
          result.actualDepartment = 'API Error';
        }
      } catch (error) {
        result.status = 'error';
        result.actualDepartment = 'Network Error';
      }

      setTestResults(prev => 
        prev.map(r => r.category === mapping.category ? result : r)
      );

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Auto-Assignment Test</h1>
        <p className="text-muted-foreground">
          Test the automatic department assignment system for different issue categories.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Department Auto-Assignment Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This test will create issues for each category and verify they are automatically assigned to the correct department.
              </p>
              
              <Button 
                onClick={testAutoAssignment} 
                disabled={loading || !user}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing Auto-Assignment...
                  </>
                ) : (
                  'Run Auto-Assignment Test'
                )}
              </Button>

              {!user && (
                <p className="text-sm text-red-500">
                  Please log in to run the auto-assignment test.
                </p>
              )}
            </div>
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
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium text-sm capitalize">
                          {result.category.replace('-', ' ')}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Expected: {result.expectedDepartment}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={
                          result.status === 'success' ? 'default' : 
                          result.status === 'error' ? 'destructive' : 'secondary'
                        }
                        className="text-xs mb-1"
                      >
                        {result.actualDepartment || 'Testing...'}
                      </Badge>
                      {result.issueId && (
                        <p className="text-xs text-muted-foreground">
                          ID: {result.issueId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              {testResults.length > 0 && !loading && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Test Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.filter(r => r.status === 'success').length}
                      </div>
                      <div className="text-muted-foreground">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {testResults.filter(r => r.status === 'error').length}
                      </div>
                      <div className="text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {testResults.length}
                      </div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Category Mappings Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Category → Department Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryMappings.map((mapping, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium capitalize">
                    {mapping.category.replace('-', ' ')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {mapping.expectedDepartment}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
