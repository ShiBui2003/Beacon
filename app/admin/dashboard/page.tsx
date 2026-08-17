"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    Bell,
    FileText,
    Loader2,
    LayoutDashboard,
    Map,
    Building,
    Users,
    Settings,
    Search,
    BarChart3,
    PieChart,
    LineChartIcon,
    Menu,
    X,
    Download,
    Gavel,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isIssueForDepartment, getDepartmentName } from "@/lib/departments";
import { Input } from "@/components/ui/input";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart as RechartsLineChart,
    Line,
} from "recharts";

type Issue = {
    id: string;
    title: string;
    category: string;
    status: string;
    priority: string | null;
    location_address: string | null;
    created_at: string;
    updated_at: string | null;
    profiles?: {
        full_name: string;
        email: string;
    };
};

type DashboardStats = {
    totalIssues: number;
    pendingIssues: number;
    inProgressIssues: number;
    resolvedIssues: number;
    newThisWeek: number;
    resolvedThisWeek: number;
    averageResolutionTime: number;
    citizenSatisfaction: number;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "submitted":
            return "bg-status-submitted text-white";
        case "in-review":
            return "bg-status-review text-white";
        case "in-progress":
            return "bg-status-progress text-white";
        case "resolved":
            return "bg-status-resolved text-white";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "high":
            return "bg-destructive text-destructive-foreground";
        case "medium":
            return "bg-status-review text-white";
        case "low":
            return "bg-muted text-muted-foreground";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const AdminDashboard = () => {
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const supabase = createClient();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [userDepartment, setUserDepartment] = useState<string | null>(null);
    const [userDepartmentName, setUserDepartmentName] = useState<string>("");
    const [userRole, setUserRole] = useState<string>("");

    const [overviewStats, setOverviewStats] = useState<DashboardStats>({
        totalIssues: 0,
        pendingIssues: 0,
        inProgressIssues: 0,
        resolvedIssues: 0,
        newThisWeek: 0,
        resolvedThisWeek: 0,
        averageResolutionTime: 0,
        citizenSatisfaction: 0,
    });
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
    const [departmentPerformance, setDepartmentPerformance] = useState<any[]>(
        []
    );
    const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
    const [notifications, setNotifications] = useState(0);

    const navItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            badge: null,
            route: "/admin/dashboard",
        },
        {
            id: "reports",
            label: "Reports",
            icon: FileText,
            badge: "23",
            route: "/admin/reports",
        },
        {
            id: "bidding",
            label: "Bidding",
            icon: Gavel,
            badge: "3",
            route: "/admin/bidding",
        },
        {
            id: "zones",
            label: "Zones",
            icon: Map,
            badge: "2",
            route: "/admin/zones",
        },
        {
            id: "wards",
            label: "Wards",
            icon: Map,
            badge: "5",
            route: "/admin/wards",
        },
        {
            id: "departments",
            label: "Departments",
            icon: Building,
            badge: null,
            route: "/admin/departments",
        },
        {
            id: "export",
            label: "Export Report",
            icon: Download,
            badge: null,
            route: "/admin/export",
        },
        {
            id: "settings",
            label: "Settings",
            icon: Settings,
            badge: null,
            route: "/admin/settings",
        },
    ];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (error || !user) {
                router.push("/admin/login");
                return;
            }

            const role = user.user_metadata?.role || user.role || "citizen";
            setUserRole(role);
            if (role === "citizen") {
                router.push("/citizen/dashboard");
                return;
            }

            setCurrentUser(user);

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setCurrentUserProfile(profile);

            const department = user.user_metadata?.department;
            setUserDepartment(department);

            if (department) {
                const departmentName = await getDepartmentName(department);
                setUserDepartmentName(departmentName);
            }

            await loadDashboardData();
        };

        checkAuth();
    }, [router]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                statsResult,
                categoriesResult,
                trendsResult,
                departmentsResult,
                recentResult,
                notificationsResult,
            ] = await Promise.all([
                fetchOverviewStats(),
                fetchCategoryData(),
                fetchMonthlyTrends(),
                fetchDepartmentPerformance(),
                fetchRecentIssues(),
                fetchNotificationCount(),
            ]);

            setOverviewStats(statsResult);
            setCategoryData(categoriesResult);
            setMonthlyTrends(trendsResult);
            setDepartmentPerformance(departmentsResult);
            setRecentIssues(recentResult);
            setNotifications(notificationsResult);
        } catch (err: any) {
            console.error("Error loading dashboard data:", err);
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchOverviewStats = async (): Promise<DashboardStats> => {
        const { data: allIssues, error } = await supabase
            .from("issues")
            .select(
                "status, created_at, updated_at, title, description, category"
            );

        if (error) throw error;

        let typedIssues = (allIssues || []) as any[];

        if (userDepartment) {
            const departmentFilteredIssues = [];
            for (const issue of typedIssues) {
                if (await isIssueForDepartment(issue, userDepartment)) {
                    departmentFilteredIssues.push(issue);
                }
            }
            typedIssues = departmentFilteredIssues;
        }

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const totalIssues = typedIssues.length || 0;
        const pendingIssues =
            typedIssues.filter((i) => i.status === "submitted").length || 0;
        const inProgressIssues =
            typedIssues.filter((i) =>
                ["in-review", "in-progress"].includes(i.status)
            ).length || 0;
        const resolvedIssues =
            typedIssues.filter((i) => i.status === "resolved").length || 0;

        const newThisWeek =
            typedIssues.filter((i) => new Date(i.created_at) >= oneWeekAgo)
                .length || 0;

        const resolvedThisWeek =
            typedIssues.filter(
                (i) =>
                    i.status === "resolved" &&
                    i.updated_at &&
                    new Date(i.updated_at) >= oneWeekAgo
            ).length || 0;

        const resolvedWithTimes =
            typedIssues.filter(
                (i) => i.status === "resolved" && i.updated_at
            ) || [];

        const avgResolutionTime =
            resolvedWithTimes.length > 0
                ? resolvedWithTimes.reduce((sum, issue) => {
                      const created = new Date(issue.created_at);
                      const resolved = new Date(issue.updated_at);
                      const days =
                          (resolved.getTime() - created.getTime()) /
                          (1000 * 60 * 60 * 24);
                      return sum + days;
                  }, 0) / resolvedWithTimes.length
                : 0;

        const citizenSatisfaction =
            resolvedIssues > 0
                ? Math.min(95, 70 + (resolvedIssues / totalIssues) * 25)
                : 0;

        return {
            totalIssues,
            pendingIssues,
            inProgressIssues,
            resolvedIssues,
            newThisWeek,
            resolvedThisWeek,
            averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
            citizenSatisfaction: Math.round(citizenSatisfaction),
        };
    };

    const fetchCategoryData = async () => {
        const { data: issues, error } = await supabase
            .from("issues")
            .select("category");

        if (error) throw error;

        const categoryColors: { [key: string]: string } = {
            pothole: "#059669",
            streetlight: "#0891b2",
            garbage: "#16a34a",
            "water-leakage": "#f59e0b",
            traffic: "#ef4444",
            other: "#6b7280",
        };

        const typedIssues = (issues || []) as { category: string }[];
        const categoryCounts = typedIssues.reduce(
            (acc: { [key: string]: number }, issue) => {
                const category = issue.category || "other";
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            },
            {}
        );

        return Object.entries(categoryCounts).map(([category, count]) => ({
            name:
                category.charAt(0).toUpperCase() +
                category.slice(1).replace("-", " "),
            value: count,
            color: categoryColors[category] || categoryColors.other,
        }));
    };

    const fetchMonthlyTrends = async () => {
        const { data: issues, error } = await supabase
            .from("issues")
            .select("created_at, updated_at, status");

        if (error) throw error;

        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                date,
                name: date.toLocaleDateString("en-US", { month: "short" }),
            });
        }

        const typedIssues = (issues || []) as any[];

        return months.map((month) => {
            const nextMonth = new Date(
                month.date.getFullYear(),
                month.date.getMonth() + 1,
                1
            );

            const reported =
                typedIssues.filter((issue) => {
                    const created = new Date(issue.created_at);
                    return created >= month.date && created < nextMonth;
                }).length || 0;

            const resolved =
                typedIssues.filter((issue) => {
                    if (issue.status !== "resolved" || !issue.updated_at)
                        return false;
                    const updated = new Date(issue.updated_at);
                    return updated >= month.date && updated < nextMonth;
                }).length || 0;

            return {
                month: month.name,
                reported,
                resolved,
            };
        });
    };

    const fetchDepartmentPerformance = async () => {
        const { data: issues, error } = await supabase
            .from("issues")
            .select("category, status");

        if (error) throw error;

        const departmentMap: { [key: string]: string } = {
            pothole: "Road Maintenance",
            streetlight: "Electrical Services",
            garbage: "Sanitation",
            "water-leakage": "Water & Sewage",
            traffic: "Traffic Management",
        };

        const deptStats: {
            [key: string]: { assigned: number; completed: number };
        } = {};

        const typedIssues = (issues || []) as any[];
        typedIssues.forEach((issue) => {
            const dept = departmentMap[issue.category] || "General Services";
            if (!deptStats[dept]) {
                deptStats[dept] = { assigned: 0, completed: 0 };
            }

            if (
                ["in-progress", "resolved", "assigned"].includes(issue.status)
            ) {
                deptStats[dept].assigned++;
                if (issue.status === "resolved") {
                    deptStats[dept].completed++;
                }
            }
        });

        return Object.entries(deptStats).map(([department, stats]) => ({
            department,
            assigned: stats.assigned,
            completed: stats.completed,
            efficiency:
                stats.assigned > 0
                    ? Math.round((stats.completed / stats.assigned) * 100)
                    : 0,
        }));
    };

    const fetchRecentIssues = async (): Promise<Issue[]> => {
        const { data: issues, error } = await supabase
            .from("issues")
            .select(
                `
        *,
        profiles!user_id (
          full_name,
          email
        )
      `
            )
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        let filteredIssues = (issues || []) as Issue[];

        if (userDepartment) {
            const departmentFilteredIssues = [];
            for (const issue of filteredIssues) {
                if (await isIssueForDepartment(issue, userDepartment)) {
                    departmentFilteredIssues.push(issue);
                }
            }
            filteredIssues = departmentFilteredIssues;
        }

        return filteredIssues.slice(0, 8);
    };

    const fetchNotificationCount = async (): Promise<number> => {
        const { data: newIssues, error } = await supabase
            .from("issues")
            .select("id")
            .eq("status", "submitted")
            .gte(
                "created_at",
                new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            );

        if (error) return 0;
        return newIssues?.length || 0;
    };

    const navigateTo = (route: string) => {
        setMobileMenuOpen(false);
        router.push(route as any);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
                    <p className="text-muted-foreground">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Mobile Menu Toggle */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-xl font-bold text-accent">
                        JanPath Admin
                    </h1>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            <div className="flex h-full md:h-screen gap-0 md:gap-6 md:p-6 pt-16 md:pt-0">
                {/* Sidebar Navigation */}
                <div
                    className={`${
                        mobileMenuOpen ? "block" : "hidden"
                    } md:block fixed md:relative top-14 md:top-0 left-0 right-0 md:w-64 bg-white dark:bg-slate-950 border-r shadow-lg md:shadow-none transition-all duration-300 z-40 md:z-auto`}
                >
                    <div className="p-4 md:p-6 space-y-6">
                        {/* Sidebar Header */}
                        <div className="hidden md:block">
                            <h2 className="text-2xl font-bold text-accent mb-2">
                                JanPath
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Admin Panel
                            </p>
                        </div>

                        {/* Navigation Items */}
                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => navigateTo(item.route)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                                            isActive
                                                ? "bg-accent text-white shadow-md"
                                                : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={20} />
                                            <span className="font-medium">
                                                {item.label}
                                            </span>
                                        </div>
                                        {item.badge && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-red-500 text-white"
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* User Section */}
                        <div className="pt-6 border-t">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                                    {currentUserProfile?.full_name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "A"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {currentUserProfile?.full_name ||
                                            "Admin User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {userDepartmentName || "Super Admin"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-slate-950 border-b p-4 md:p-6 flex items-center justify-between z-30 md:z-10">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold">
                                Dashboard Overview
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Welcome back! Here's your real-time analytics
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-10 w-64 bg-slate-50 dark:bg-slate-900 border-0"
                                />
                            </div>
                            <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Bell size={20} />
                                {notifications > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 md:p-6 space-y-6">
                        {error && (
                            <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                                <CardContent className="p-4">
                                    <p className="text-red-800 dark:text-red-200">
                                        {error}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    title: "Total Issues",
                                    value: overviewStats.totalIssues.toLocaleString(),
                                    icon: AlertTriangle,
                                    color: "bg-orange-50 dark:bg-orange-950",
                                    textColor: "text-orange-600",
                                    change: `+${overviewStats.newThisWeek} this week`,
                                },
                                {
                                    title: "Pending",
                                    value: overviewStats.pendingIssues.toLocaleString(),
                                    icon: Clock,
                                    color: "bg-yellow-50 dark:bg-yellow-950",
                                    textColor: "text-yellow-600",
                                    change: "Awaiting review",
                                },
                                {
                                    title: "In Progress",
                                    value: overviewStats.inProgressIssues.toLocaleString(),
                                    icon: Eye,
                                    color: "bg-blue-50 dark:bg-blue-950",
                                    textColor: "text-blue-600",
                                    change: "Being worked on",
                                },
                                {
                                    title: "Resolved",
                                    value: overviewStats.resolvedIssues.toLocaleString(),
                                    icon: CheckCircle,
                                    color: "bg-green-50 dark:bg-green-950",
                                    textColor: "text-green-600",
                                    change: `+${overviewStats.resolvedThisWeek} this week`,
                                },
                            ].map((kpi, idx) => {
                                const Icon = kpi.icon;
                                return (
                                    <Card
                                        key={idx}
                                        className="hover:shadow-lg transition-shadow"
                                    >
                                        <CardContent
                                            className={`p-4 md:p-6 rounded-lg ${kpi.color}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        {kpi.title}
                                                    </p>
                                                    <p
                                                        className={`text-2xl md:text-3xl font-bold ${kpi.textColor}`}
                                                    >
                                                        {kpi.value}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {kpi.change}
                                                    </p>
                                                </div>
                                                <Icon
                                                    className={`w-8 h-8 ${kpi.textColor} opacity-50`}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Monthly Trends */}
                            <Card className="lg:col-span-2">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <LineChartIcon className="w-5 h-5" />
                                                Monthly Trends
                                            </CardTitle>
                                        </div>
                                        <select className="text-sm border rounded px-2 py-1 bg-background">
                                            <option>Last 12 Months</option>
                                            <option>Last 6 Months</option>
                                            <option>Last 3 Months</option>
                                        </select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <RechartsLineChart data={monthlyTrends}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e5e7eb"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#666"
                                            />
                                            <YAxis stroke="#666" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="reported"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                dot={{ fill: "#f59e0b", r: 4 }}
                                                activeDot={{ r: 6 }}
                                                name="Reported"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="resolved"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                dot={{ fill: "#10b981", r: 4 }}
                                                activeDot={{ r: 6 }}
                                                name="Resolved"
                                            />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Category Distribution */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="w-5 h-5" />
                                        Issues by Category
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {categoryData.length > 0 ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <RechartsPieChart>
                                                <Pie
                                                    data={categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, value }) =>
                                                        `${name}: ${value}`
                                                    }
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {categoryData.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    entry.color
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>
                                                <Tooltip />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Department Performance */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Department Performance & Efficiency
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {departmentPerformance.map((dept, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        {dept.department}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {dept.completed} of{" "}
                                                        {dept.assigned} resolved
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-accent">
                                                        {dept.efficiency}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Efficiency
                                                    </p>
                                                </div>
                                            </div>
                                            <Progress
                                                value={dept.efficiency}
                                                className="h-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Issues */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Recent Issues
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="bg-transparent"
                                    >
                                        <a href="/admin/issues">View All</a>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {recentIssues.map((issue) => (
                                        <div
                                            key={issue.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {issue.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {issue.location_address ||
                                                        "No location"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Badge
                                                    className={getStatusColor(
                                                        issue.status
                                                    )}
                                                >
                                                    {issue.status}
                                                </Badge>
                                                {issue.priority && (
                                                    <Badge
                                                        className={getPriorityColor(
                                                            issue.priority
                                                        )}
                                                    >
                                                        {issue.priority}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
