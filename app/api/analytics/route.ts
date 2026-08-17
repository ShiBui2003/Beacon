export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userRole = user.user_metadata?.role || user.role || "citizen";
        const isAdmin = userRole !== "citizen";
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get("timeRange") || "7d";

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case "24h":
                startDate.setHours(now.getHours() - 24);
                break;
            case "7d":
                startDate.setDate(now.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(now.getDate() - 30);
                break;
            case "90d":
                startDate.setDate(now.getDate() - 90);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }

        // Get overview stats
        const { data: totalIssues } = await (supabase as any)
            .from("issues")
            .select("*", { count: "exact", head: true });

        const { data: recentIssues } = await (supabase as any)
            .from("issues")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startDate.toISOString());

        const { data: resolvedIssues } = await (supabase as any)
            .from("issues")
            .select("*", { count: "exact", head: true })
            .eq("status", "resolved");

        const { data: pendingIssues } = await (supabase as any)
            .from("issues")
            .select("*", { count: "exact", head: true })
            .eq("status", "submitted");

        const { data: inProgressIssues } = await (supabase as any)
            .from("issues")
            .select("*", { count: "exact", head: true })
            .eq("status", "in_progress");

        // Get issues by category
        const { data: categoryStats } = await (supabase as any)
            .from("issues")
            .select("category")
            .gte("created_at", startDate.toISOString());

        const categoryCounts =
            categoryStats?.reduce((acc: any, issue: any) => {
                acc[issue.category] = (acc[issue.category] || 0) + 1;
                return acc;
            }, {}) || {};

        // Get monthly trends
        const { data: monthlyData } = await (supabase as any)
            .from("issues")
            .select("created_at, status")
            .gte(
                "created_at",
                new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString()
            );

        const monthlyTrends =
            monthlyData?.reduce((acc: any, issue: any) => {
                const month = new Date(issue.created_at).toLocaleDateString(
                    "en-US",
                    { month: "short" }
                );
                if (!acc[month]) {
                    acc[month] = { reported: 0, resolved: 0 };
                }
                acc[month].reported++;
                if (issue.status === "resolved") {
                    acc[month].resolved++;
                }
                return acc;
            }, {}) || {};

        // Get department performance (mock data for now)
        const departmentPerformance = [
            {
                department: "Road Maintenance",
                assigned: 45,
                completed: 38,
                efficiency: 84,
            },
            {
                department: "Electrical Services",
                assigned: 32,
                completed: 29,
                efficiency: 91,
            },
            {
                department: "Sanitation",
                assigned: 28,
                completed: 26,
                efficiency: 93,
            },
            {
                department: "Water & Sewage",
                assigned: 21,
                completed: 18,
                efficiency: 86,
            },
            {
                department: "Traffic Management",
                assigned: 15,
                completed: 12,
                efficiency: 80,
            },
        ];

        const analytics = {
            overview: {
                totalIssues: totalIssues?.length || 0,
                recentIssues: recentIssues?.length || 0,
                resolvedIssues: resolvedIssues?.length || 0,
                pendingIssues: pendingIssues?.length || 0,
                inProgressIssues: inProgressIssues?.length || 0,
                resolutionRate: totalIssues?.length
                    ? Math.round(
                          ((resolvedIssues?.length || 0) / totalIssues.length) *
                              100
                      )
                    : 0,
                averageResolutionTime: 4.2, // This would need to be calculated from actual data
                citizenSatisfaction: 87, // This would come from feedback system
            },
            categories: Object.entries(categoryCounts).map(([name, value]) => ({
                name,
                value,
                color: getCategoryColor(name),
            })),
            monthlyTrends: Object.entries(monthlyTrends).map(
                ([month, data]: [string, any]) => ({
                    month,
                    reported: data.reported,
                    resolved: data.resolved,
                })
            ),
            departmentPerformance,
        };

        return NextResponse.json({ analytics });
    } catch (error) {
        console.error("Error in GET /api/analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
        Roads: "#8b5cf6",
        Lighting: "#06b6d4",
        Sanitation: "#10b981",
        Water: "#f59e0b",
        Traffic: "#ef4444",
        Other: "#6b7280",
    };
    return colors[category] || "#6b7280";
}
