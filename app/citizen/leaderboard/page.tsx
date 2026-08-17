"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Trophy, Medal, Award, Star, TrendingUp, Calendar, MapPin, Users } from "lucide-react"

// Mock leaderboard data
const topContributors = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    totalReports: 47,
    resolvedReports: 42,
    points: 890,
    rank: 1,
    badge: "Community Champion",
    joinedDate: "2023-06-15",
    location: "Downtown District",
    recentActivity: "Reported 3 issues this week",
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    totalReports: 38,
    resolvedReports: 35,
    points: 720,
    rank: 2,
    badge: "Civic Hero",
    joinedDate: "2023-08-22",
    location: "Riverside Area",
    recentActivity: "5 issues resolved this month",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    totalReports: 31,
    resolvedReports: 28,
    points: 650,
    rank: 3,
    badge: "Problem Solver",
    joinedDate: "2023-05-10",
    location: "Westside",
    recentActivity: "Helped resolve 2 duplicate reports",
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    totalReports: 29,
    resolvedReports: 26,
    points: 580,
    rank: 4,
    badge: "Active Reporter",
    joinedDate: "2023-09-05",
    location: "North End",
    recentActivity: "Consistent reporting for 4 months",
  },
  {
    id: "5",
    name: "Lisa Thompson",
    avatar: "/placeholder.svg?height=40&width=40",
    totalReports: 25,
    resolvedReports: 23,
    points: 520,
    rank: 5,
    badge: "Community Helper",
    joinedDate: "2023-07-18",
    location: "Central Park Area",
    recentActivity: "Quality reports with detailed photos",
  },
]

const currentUser = {
  id: "current",
  name: "John Doe",
  avatar: "/placeholder.svg?height=40&width=40",
  totalReports: 12,
  resolvedReports: 8,
  points: 240,
  rank: 23,
  badge: "New Contributor",
  joinedDate: "2024-01-01",
  location: "East District",
  nextBadgeProgress: 60, // Progress towards next badge (0-100)
  nextBadge: "Active Reporter",
  pointsToNext: 60,
}

const achievements = [
  {
    id: "1",
    title: "First Report",
    description: "Submit your first civic issue report",
    icon: <Star className="w-6 h-6" />,
    earned: true,
    earnedDate: "2024-01-02",
    points: 10,
  },
  {
    id: "2",
    title: "Problem Spotter",
    description: "Report 5 different types of issues",
    icon: <Award className="w-6 h-6" />,
    earned: true,
    earnedDate: "2024-01-15",
    points: 25,
  },
  {
    id: "3",
    title: "Community Helper",
    description: "Have 10 reports successfully resolved",
    icon: <Users className="w-6 h-6" />,
    earned: false,
    progress: 80, // 8/10
    points: 50,
  },
  {
    id: "4",
    title: "Consistency King",
    description: "Report issues for 30 consecutive days",
    icon: <Calendar className="w-6 h-6" />,
    earned: false,
    progress: 20, // 6/30 days
    points: 100,
  },
  {
    id: "5",
    title: "Neighborhood Watch",
    description: "Report 25 issues in your local area",
    icon: <MapPin className="w-6 h-6" />,
    earned: false,
    progress: 48, // 12/25
    points: 75,
  },
]

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-yellow-500" />
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />
    case 3:
      return <Award className="w-6 h-6 text-amber-600" />
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{rank}</div>
      )
  }
}

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case "Community Champion":
      return "bg-yellow-500 text-white"
    case "Civic Hero":
      return "bg-blue-500 text-white"
    case "Problem Solver":
      return "bg-green-500 text-white"
    case "Active Reporter":
      return "bg-purple-500 text-white"
    case "Community Helper":
      return "bg-orange-500 text-white"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState("all-time")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/citizen/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Community Leaderboard</h1>
              <p className="text-muted-foreground">Celebrating our most active community contributors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current User Stats */}
            <Card className="border-accent">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                    <AvatarFallback>
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getBadgeColor(currentUser.badge)}>{currentUser.badge}</Badge>
                      <span className="text-sm text-muted-foreground">Rank #{currentUser.rank}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentUser.totalReports} reports • {currentUser.points} points
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {currentUser.nextBadge}</span>
                    <span>{currentUser.pointsToNext} points to go</span>
                  </div>
                  <Progress value={currentUser.nextBadgeProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>Community members making the biggest impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div
                    key={contributor.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0">{getRankIcon(contributor.rank)}</div>

                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contributor.avatar || "/placeholder.svg"} alt={contributor.name} />
                      <AvatarFallback>
                        {contributor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{contributor.name}</h4>
                        <Badge className={getBadgeColor(contributor.badge)} variant="secondary">
                          {contributor.badge}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contributor.location} • {contributor.recentActivity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg">{contributor.points}</div>
                      <div className="text-sm text-muted-foreground">
                        {contributor.resolvedReports}/{contributor.totalReports} resolved
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Achievements Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Unlock badges by contributing to your community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${achievement.earned ? "bg-accent/5 border-accent" : "bg-muted/30"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${achievement.earned ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>

                        {achievement.earned ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              +{achievement.points} pts
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Earned {new Date(achievement.earnedDate!).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{achievement.progress}%</span>
                            </div>
                            <Progress value={achievement.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">1,247</div>
                  <div className="text-sm text-muted-foreground">Total Issues Reported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-status-resolved">892</div>
                  <div className="text-sm text-muted-foreground">Issues Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-status-progress">355</div>
                  <div className="text-sm text-muted-foreground">Active Contributors</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
