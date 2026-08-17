"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

type MonthlyData = {
    month: string;
    submitted: number;
    resolved: number;
};

type CategoryData = {
    category: string;
    count: number;
    color: string;
};

type ResponseTimeData = {
    department: string;
    avgHours: number;
};

type ResolutionTrendData = {
    week: string;
    resolved: number;
    target: number;
};

type AnalyticsChartsProps = {
    monthlyData?: MonthlyData[];
    categoryData?: CategoryData[];
    responseTimeData?: ResponseTimeData[];
    resolutionTrendData?: ResolutionTrendData[];
};

export default function AnalyticsCharts({
    monthlyData = [],
    categoryData = [],
    responseTimeData = [],
    resolutionTrendData = [],
}: AnalyticsChartsProps) {
    const EmptyState = ({ title }: { title: string }) => (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{title}</p>
                <p className="text-xs mt-1">
                    Data will appear as issues are reported
                </p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Issues by Month */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Issues Submitted vs Resolved
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="submitted"
                                    fill="#3b82f6"
                                    name="Submitted"
                                />
                                <Bar
                                    dataKey="resolved"
                                    fill="#10b981"
                                    name="Resolved"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No monthly data available" />
                    )}
                </CardContent>
            </Card>

            {/* Issues by Category */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Issues by Category Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="count"
                                    label={({ category, count }) =>
                                        `${category}: ${count}`
                                    }
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No category data available" />
                    )}
                </CardContent>
            </Card>

            {/* Response Time by Department */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Average Response Time (Hours)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {responseTimeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={responseTimeData}
                                layout="horizontal"
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="department"
                                    type="category"
                                    width={80}
                                />
                                <Tooltip />
                                <Bar dataKey="avgHours" fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No response time data available" />
                    )}
                </CardContent>
            </Card>

            {/* Resolution Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Weekly Resolution Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {resolutionTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={resolutionTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="resolved"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.3}
                                    name="Resolved"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    name="Target"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No resolution trend data available" />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
