"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient();

export default function DebugIssuesPage() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from("issues")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error:", error);
                } else {
                    setIssues(data || []);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Debug: Issues Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p>
                            <strong>Total Issues:</strong> {issues.length}
                        </p>
                        <p>
                            <strong>Issues with Coordinates:</strong>{" "}
                            {
                                issues.filter(
                                    (i) => i.location_lat && i.location_lng
                                ).length
                            }
                        </p>

                        {issues.length === 0 ? (
                            <div className="p-4 bg-yellow-100 rounded">
                                <p>
                                    <strong>
                                        No issues found in database!
                                    </strong>
                                </p>
                                <p>
                                    This is why the map is showing the default
                                    location.
                                </p>
                                <p>
                                    You need to create some issues first through
                                    the citizen portal.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Sample Issues:
                                </h3>
                                {issues.slice(0, 5).map((issue) => (
                                    <div
                                        key={issue.id}
                                        className="p-2 border rounded mb-2"
                                    >
                                        <p>
                                            <strong>Title:</strong>{" "}
                                            {issue.title}
                                        </p>
                                        <p>
                                            <strong>Location:</strong>{" "}
                                            {issue.location_address ||
                                                "No address"}
                                        </p>
                                        <p>
                                            <strong>Coordinates:</strong>{" "}
                                            {issue.location_lat
                                                ? `${issue.location_lat}, ${issue.location_lng}`
                                                : "No coordinates"}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>{" "}
                                            {issue.status}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
