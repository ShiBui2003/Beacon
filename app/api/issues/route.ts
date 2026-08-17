export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const id = searchParams.get("id");
        const category = searchParams.get("category");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        // If id is provided, return a single issue with relations
        if (id) {
            const { data: issue, error } = await (supabase as any)
                .from("issues")
                .select(
                    `
          *,
          profiles:user_id(full_name, email),
          department:department_id(id, name, email, description)
        `
                )
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching issue by id:", error);
                return NextResponse.json(
                    { error: "Issue not found" },
                    { status: 404 }
                );
            }

            // Optionally, fetch counts for comments and votes
            const [commentsAgg, votesAgg, timelineRes] = await Promise.all([
                supabase
                    .from("comments")
                    .select("*", { count: "exact", head: true })
                    .eq("issue_id", id),
                supabase
                    .from("issue_votes")
                    .select("*", { count: "exact", head: true })
                    .eq("issue_id", id),
                supabase
                    .from("issue_updates")
                    .select(`*, profiles:user_id(full_name, email)`) // who made the update
                    .eq("issue_id", id)
                    .order("created_at", { ascending: true }),
            ]);

            const commentsCount = (commentsAgg as any).count || 0;
            const votesCount = (votesAgg as any).count || 0;
            const timeline = (timelineRes as any).data || [];

            // Derive assigned_profile from mapping
            let assigned_profile: {
                full_name: string | null;
                email: string;
            } | null = null;
            const { data: activeAssign } = await (supabase as any)
                .from("issue_assignments")
                .select("user_id")
                .eq("issue_id", id)
                .is("ended_at", null)
                .maybeSingle();
            if (activeAssign?.user_id) {
                const { data: prof } = await (supabase as any)
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", activeAssign.user_id)
                    .single();
                if (prof)
                    assigned_profile = {
                        full_name: prof.full_name || null,
                        email: prof.email,
                    };
            }

            return NextResponse.json({
                issue: { ...(issue as any), assigned_profile },
                meta: { commentsCount, votesCount, timeline },
            });
        }

        // Get current user for role-based filtering
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();

        let query = supabase
            .from("issues")
            .select(
                `
        *,
        profiles:user_id(full_name, email),
        department:department_id(id, name, email, description),
        comments:comments(count),
        issue_votes:issue_votes(count)
      `
            )
            .order("created_at", { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // Get user profile for role-based filtering
        let userProfile: any = null;
        if (user) {
            // Get user's profile information with role from roles table
            const { data: profile } = await (supabase as any)
                .from("profiles")
                .select(
                    `
                    role_id,
                    department_id,
                    roles:role_id (
                        id,
                        name,
                        level,
                        permissions
                    )
                `
                )
                .eq("id", user.id)
                .single();

            userProfile = profile;

            console.log("=== ROLE-BASED FILTERING DEBUG ===");
            console.log("User ID:", user.id);
            console.log("Profile:", JSON.stringify(profile, null, 2));

            // Check if user has admin-type role (level > 0, as citizens have level 0)
            const p = profile as any;
            let isAdminType = false;

            if (p?.roles && p.roles.level > 0) {
                isAdminType = true;
                console.log(
                    `User role: ${p.roles.name} (level ${p.roles.level})`
                );
            } else if (p?.role && p.role !== "citizen") {
                isAdminType = true;
                console.log(`User role (fallback): ${p.role}`);
            } else if (
                user.user_metadata?.role &&
                user.user_metadata.role !== "citizen"
            ) {
                isAdminType = true;
                console.log(`User role (metadata): ${user.user_metadata.role}`);
            }

            // Admin-type roles should only see issues that are:
            // 1. Unassigned (department_id is null)
            // 2. Assigned to their department
            if (isAdminType && p?.department_id) {
                const deptId = p.department_id;
                console.log(
                    `Applying role-based filter: department_id.is.null OR department_id.eq.${deptId}`
                );
                query = query.or(
                    `department_id.is.null,department_id.eq.${deptId}`
                );
            } else if (isAdminType) {
                console.log(
                    "Admin user without department - showing only unassigned issues"
                );
                query = query.is("department_id", null);
            } else {
                console.log("No filtering applied - user is citizen");
            }
            console.log("====================================");
        }

        if (category && category !== "all") {
            query = query.eq("category", category);
        }

        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        if (search) {
            query = query.or(
                `title.ilike.%${search}%,description.ilike.%${search}%,location_address.ilike.%${search}%`
            );
        }

        const { data: issues, error } = await query;

        if (error) {
            console.error("Error fetching issues:", error);
            return NextResponse.json(
                { error: "Failed to fetch issues" },
                { status: 500 }
            );
        }

        // Get total count for pagination
        let countQuery = supabase
            .from("issues")
            .select("*", { count: "exact", head: true });

        // Apply same role-based filtering for count
        if (userProfile) {
            const p = userProfile as any;
            let isAdminType = false;

            if (p?.roles && p.roles.level > 0) {
                isAdminType = true;
            } else if (p?.role && p.role !== "citizen") {
                isAdminType = true;
            } else if (
                user?.user_metadata?.role &&
                user.user_metadata.role !== "citizen"
            ) {
                isAdminType = true;
            }

            if (isAdminType && p?.department_id) {
                const deptId = p.department_id;
                countQuery = countQuery.or(
                    `department_id.is.null,department_id.eq.${deptId}`
                );
            } else if (isAdminType) {
                countQuery = countQuery.is("department_id", null);
            }
        }

        if (category && category !== "all")
            countQuery = countQuery.eq("category", category);
        if (status && status !== "all")
            countQuery = countQuery.eq("status", status);
        if (search)
            countQuery = countQuery.or(
                `title.ilike.%${search}%,description.ilike.%${search}%,location_address.ilike.%${search}%`
            );

        const { count } = await countQuery;

        // Merge explicit counts (robust across FK metadata) into top-level fields
        const issueList = issues || [];
        // Attach assigned_profile from mapping table in bulk
        if (issueList.length > 0) {
            const ids = issueList.map((i: any) => i.id);
            const { data: activeAssignments } = await (supabase as any)
                .from("issue_assignments")
                .select("issue_id, user_id")
                .in("issue_id", ids)
                .is("ended_at", null);
            const byIssue = new Map<string, string>();
            (activeAssignments || []).forEach((row: any) =>
                byIssue.set(row.issue_id, row.user_id)
            );
            const userIds = Array.from(
                new Set((activeAssignments || []).map((r: any) => r.user_id))
            );
            let profilesMap = new Map<
                string,
                { full_name: string | null; email: string }
            >();
            if (userIds.length > 0) {
                const { data: profs } = await (supabase as any)
                    .from("profiles")
                    .select("id, full_name, email")
                    .in("id", userIds);
                (profs || []).forEach((p: any) =>
                    profilesMap.set(p.id, {
                        full_name: p.full_name || null,
                        email: p.email,
                    })
                );
            }
            issueList.forEach((it: any) => {
                const uid = byIssue.get(it.id);
                it.assigned_profile = uid ? profilesMap.get(uid) || null : null;
            });
        }
        const ids = issueList.map((i: any) => i.id);
        if (ids.length > 0) {
            const [commentsAgg, votesAgg] = await Promise.all([
                supabase
                    .from("comments")
                    .select("issue_id, count:issue_id", { count: "exact" })
                    .in("issue_id", ids),
                supabase
                    .from("issue_votes")
                    .select("issue_id, count:issue_id", { count: "exact" })
                    .in("issue_id", ids),
            ]);

            const commentsCountMap = new Map<string, number>();
            if ((commentsAgg as any).data) {
                for (const row of (commentsAgg as any).data) {
                    // row has issue_id; count returned separately via header; for reliability compute manually below if needed
                    // We'll fall back to filtering length if needed
                }
            }

            // Calculate counts per issue including specific upvotes count
            await Promise.all(
                issueList.map(async (it: any) => {
                    const [
                        { count: cCount },
                        { count: vCount },
                        { count: upCount },
                    ] = await Promise.all([
                        supabase
                            .from("comments")
                            .select("*", { count: "exact", head: true })
                            .eq("issue_id", it.id),
                        supabase
                            .from("issue_votes")
                            .select("*", { count: "exact", head: true })
                            .eq("issue_id", it.id),
                        supabase
                            .from("issue_votes")
                            .select("*", { count: "exact", head: true })
                            .eq("issue_id", it.id)
                            .eq("vote_type", "up"),
                    ]);
                    it.comments_count = cCount || 0;
                    it.votes_count = vCount || 0;
                    it.upvotes = upCount || 0;
                })
            );
        }

        return NextResponse.json({
            issues: issueList,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Error in GET /api/issues:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
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

        const body = await request.json();

        const {
            title,
            description,
            category,
            priority,
            location_address,
            location_lat,
            location_lng,
            landmark,
            image_url,
            audio_url,
        } = body;

        // Check if at least one of description or audio_url is provided
        if (!title || !category) {
            return NextResponse.json(
                { error: "Title and category are required" },
                { status: 400 }
            );
        }

        // Ensure at least one of description or audio_url is provided
        if (!description && !audio_url) {
            return NextResponse.json(
                {
                    error: "Either description text or audio recording is required",
                },
                { status: 400 }
            );
        }

        // Enforce location required: address and coordinates must be present and valid
        const latNum =
            typeof location_lat === "string"
                ? parseFloat(location_lat)
                : Number(location_lat);
        const lngNum =
            typeof location_lng === "string"
                ? parseFloat(location_lng)
                : Number(location_lng);
        const addressStr = (location_address || "").toString().trim();

        if (
            !addressStr ||
            !Number.isFinite(latNum) ||
            !Number.isFinite(lngNum)
        ) {
            return NextResponse.json(
                {
                    error: "Location is required. Please use the map to set a valid location.",
                },
                { status: 400 }
            );
        }

        // Find the department that matches the category (since categories are now department names)
        const { data: departments } = await (supabase as any)
            .from("departments")
            .select("id, name")
            .eq("name", category);

        const departmentId =
            departments && departments.length > 0
                ? (departments[0] as any).id
                : null;

        // Insert the issue with automatic department assignment
        const { data: issue, error } = await (supabase as any)
            .from("issues")
            .insert({
                title,
                description,
                category,
                priority: priority || "medium",
                location_address: addressStr,
                location_lat: latNum,
                location_lng: lngNum,
                landmark,
                image_url,
                audio_url,
                user_id: user.id,
                department_id: departmentId, // Assign to matching department
            })
            .select(
                `
        *,
        profiles:user_id(full_name, email),
        department:department_id(id, name, email, description)
      `
            )
            .single();

        if (issue && !error) {
            // Trigger AI urgency detection asynchronously (non-blocking)
            const aiUrl = `${
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            }/api/issues/${(issue as any).id}/ai-urgency`;

            console.log("Triggering AI urgency detection:", aiUrl);

            fetch(aiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((res) => {
                    console.log("AI urgency response:", res.status);
                    return res.json();
                })
                .then((data) => {
                    console.log("AI urgency result:", data);
                })
                .catch((err) => {
                    console.error(
                        "Failed to trigger AI urgency detection:",
                        err
                    );
                    // Don't fail the issue creation if AI detection fails
                });

            return NextResponse.json({ issue }, { status: 201 });
        }

        if (error) {
            console.error("Error creating issue:", error);
            return NextResponse.json(
                { error: "Failed to create issue" },
                { status: 500 }
            );
        }

        return NextResponse.json({ issue }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/issues:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
