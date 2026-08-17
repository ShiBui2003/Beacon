"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    CheckCircle,
    Construction,
    Lightbulb,
    Trash2,
    Droplets,
} from "lucide-react";
import ResolvedIssuesSection from "@/components/resolved-issues-section";

const categories = [
    {
        id: "all",
        label: "All Categories",
        icon: CheckCircle,
        description: "View all resolved issues across all categories",
    },
    {
        id: "pothole",
        label: "Potholes",
        icon: Construction,
        description: "Road repairs and pothole fixes",
    },
    {
        id: "streetlight",
        label: "Street Lights",
        icon: Lightbulb,
        description: "Street lighting repairs and installations",
    },
    {
        id: "garbage",
        label: "Garbage",
        icon: Trash2,
        description: "Waste management and cleanup",
    },
    {
        id: "water-leakage",
        label: "Water Issues",
        icon: Droplets,
        description: "Water leaks and drainage problems",
    },
];

export default function ResolvedIssuesPage() {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/citizen/dashboard">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    Resolved Issues
                                </h1>
                                <p className="text-muted-foreground">
                                    See how your community issues have been
                                    successfully resolved
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Success Stats */}
                <Card className="mb-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 shadow-lg border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center text-center">
                            <div>
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-green-800 mb-2">
                                    Community Success Stories
                                </h2>
                                <p className="text-green-700">
                                    These issues have been successfully resolved
                                    thanks to community reporting and government
                                    action. Your voice makes a difference!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <TabsTrigger
                                    key={category.id}
                                    value={category.id}
                                    className="flex items-center gap-2 text-xs sm:text-sm"
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                        {category.label}
                                    </span>
                                    <span className="sm:hidden">
                                        {category.label.split(" ")[0]}
                                    </span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {categories.map((category) => (
                        <TabsContent
                            key={category.id}
                            value={category.id}
                            className="space-y-6"
                        >
                            {/* Category Description */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <category.icon className="w-6 h-6 text-green-600" />
                                        <div>
                                            <h3 className="font-semibold">
                                                {category.label}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resolved Issues */}
                            <ResolvedIssuesSection
                                category={
                                    category.id === "all"
                                        ? undefined
                                        : category.id
                                }
                                limit={12}
                                showHeader={false}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}
