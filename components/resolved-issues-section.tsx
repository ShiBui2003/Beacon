"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Eye, 
  ThumbsUp,
  MessageCircle,
  ArrowRight
} from "lucide-react";

interface ResolvedIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  location_address: string;
  image_url?: string;
  upvotes: number; // Added for upvote-based ranking
  ai_urgency?: "low" | "medium" | "high" | null;
  ai_confidence?: number | null;
  created_at: string;
  updated_at: string;
  votes_count?: number;
  comments_count?: number;
}

interface ResolvedIssuesSectionProps {
  category?: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "pothole":
      return "Pothole";
    case "streetlight":
      return "Streetlight";
    case "garbage":
      return "Garbage";
    case "water-leakage":
      return "Water Leakage";
    default:
      return "Other";
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "pothole":
      return "bg-orange-100 text-orange-800";
    case "streetlight":
      return "bg-yellow-100 text-yellow-800";
    case "garbage":
      return "bg-green-100 text-green-800";
    case "water-leakage":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ResolvedIssuesSection({ 
  category, 
  limit = 6, 
  showHeader = true,
  className = ""
}: ResolvedIssuesSectionProps) {
  const [issues, setIssues] = useState<ResolvedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResolvedIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          page: "1",
          limit: limit.toString(),
          status: "resolved"
        });
        
        if (category) {
          params.append("category", category);
        }
        
        const response = await fetch(`/api/issues?${params.toString()}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch resolved issues');
        }
        
        const data = await response.json();
        setIssues(data.issues || []);
      } catch (err) {
        console.error('Error fetching resolved issues:', err);
        setError(err instanceof Error ? err.message : 'Failed to load resolved issues');
      } finally {
        setLoading(false);
      }
    };

    fetchResolvedIssues();
  }, [category, limit]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Recently Resolved Issues
              {category && ` - ${getCategoryLabel(category)}`}
            </h2>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recently Resolved Issues
            {category && ` - ${getCategoryLabel(category)}`}
          </h2>
        )}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recently Resolved Issues
            {category && ` - ${getCategoryLabel(category)}`}
          </h2>
        )}
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Resolved Issues Yet</h3>
            <p className="text-muted-foreground">
              {category 
                ? `No ${getCategoryLabel(category).toLowerCase()} issues have been resolved yet.`
                : "No issues have been resolved yet."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recently Resolved Issues
            {category && ` - ${getCategoryLabel(category)}`}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/citizen/dashboard?status=resolved">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {issues
          .sort((a, b) => {
            // Calculate combined scores using AI urgency and upvotes
            const getCombinedScore = (issue: ResolvedIssue) => {
              const upvotes = issue.upvotes || 0;
              const urgency = issue.ai_urgency || 'medium';
              
              // AI urgency weight: low=1, medium=2, high=3
              const urgencyWeight = urgency === 'high' ? 3 : urgency === 'medium' ? 2 : 1;
              const upvoteScore = Math.log(1 + upvotes);
              
              // Combined score: 0.7 * AI urgency + 0.3 * log(1 + upvotes)
              return 0.7 * urgencyWeight + 0.3 * upvoteScore;
            };
            
            const scoreA = getCombinedScore(a);
            const scoreB = getCombinedScore(b);
            const scoreDiff = scoreB - scoreA;
            
            if (scoreDiff !== 0) return scoreDiff;
            
            // Secondary sort: by creation date (descending) for stable sorting
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map((issue) => (
          <Card key={issue.id} className="hover:shadow-md transition-shadow group">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header with status badge */}
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolved
                  </Badge>
                  <Badge variant="outline" className={getCategoryColor(issue.category)}>
                    {getCategoryLabel(issue.category)}
                  </Badge>
                </div>

                {/* Title and description */}
                <div>
                  <Link 
                    href={`/citizen/issues/${issue.id}`}
                    className="block hover:underline"
                  >
                    <h3 className="font-medium line-clamp-2 group-hover:text-green-600 transition-colors">
                      {issue.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {issue.description}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{issue.location_address}</span>
                </div>

                {/* Footer with stats and date */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {issue.votes_count || 0}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {issue.comments_count || 0}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(issue.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {/* View button */}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href={`/citizen/issues/${issue.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
