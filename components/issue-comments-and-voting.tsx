"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  MessageSquare, 
  Send,
  Flag,
  User,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  is_admin: boolean;
  is_dispute: boolean;
  dispute_reason?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface VoteCounts {
  up: number;
  down: number;
  dispute: number;
  total: number;
}

interface IssueCommentsAndVotingProps {
  issueId: string;
  issueTitle: string;
  issueStatus: string;
  isOwner?: boolean;
}

export default function IssueCommentsAndVoting({
  issueId,
  issueTitle,
  issueStatus,
  isOwner = false
}: IssueCommentsAndVotingProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({ up: 0, down: 0, dispute: 0, total: 0 });
  const [userVote, setUserVote] = useState<string>('none');
  const [newComment, setNewComment] = useState('');
  const [isDispute, setIsDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/vote`);
      if (response.ok) {
        const data = await response.json();
        setVoteCounts(data.votes);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleVote = async (voteType: 'up' | 'down' | 'dispute') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on issues",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (response.ok) {
        setUserVote(voteType);
        await fetchVotes();
        
        if (voteType === 'dispute') {
          toast({
            title: "Dispute Reported",
            description: "Your dispute has been reported to the admin team for review",
          });
        } else {
          toast({
            title: "Vote Recorded",
            description: `Your ${voteType === 'up' ? 'support' : 'feedback'} has been recorded`,
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record vote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to comment on issues",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: newComment.trim(),
          is_dispute: isDispute,
          dispute_reason: isDispute ? disputeReason : null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        setIsDispute(false);
        setDisputeReason('');
        
        toast({
          title: "Comment Added",
          description: isDispute ? "Your dispute comment has been sent to the admin team" : "Your comment has been added",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchVotes();
  }, [issueId]);

  return (
    <div className="space-y-6">
      {/* Voting Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5" />
            Community Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={userVote === 'up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('up')}
                disabled={loading}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {voteCounts.up}
              </Button>
              
              <Button
                variant={userVote === 'down' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('down')}
                disabled={loading}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                {voteCounts.down}
              </Button>
            </div>
            
            {/* Dispute Button - only show if issue has been updated by admin */}
            {(issueStatus !== 'submitted' && isOwner) && (
              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant={userVote === 'dispute' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleVote('dispute')}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Dispute ({voteCounts.dispute})
                </Button>
              </div>
            )}
          </div>
          
          {voteCounts.dispute > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Status Disputed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {voteCounts.dispute} citizen{voteCounts.dispute > 1 ? 's have' : ' has'} disputed the current status of this issue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          {user && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isDispute ? "Explain why you disagree with the current status..." : "Add a comment..."}
                  rows={3}
                  className="flex-1"
                />
              </div>
              
              {/* Dispute Toggle - only for issue owners */}
              {isOwner && issueStatus !== 'submitted' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dispute-toggle"
                    checked={isDispute}
                    onChange={(e) => setIsDispute(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="dispute-toggle" className="text-sm text-red-600 font-medium">
                    This is a dispute about the current status
                  </label>
                </div>
              )}
              
              {isDispute && (
                <Textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Please explain why you believe the status update is incorrect..."
                  rows={2}
                  className="border-red-200 focus:border-red-500"
                />
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isDispute ? 'Submit Dispute' : 'Add Comment'}
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                  comment.is_dispute ? 'bg-red-50 border border-red-200' : 'bg-white border'
                }`}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {comment.is_admin ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.profiles?.full_name || 'Anonymous'}
                      </span>
                      {comment.is_admin && (
                        <Badge variant="secondary" className="text-xs">
                          Staff
                        </Badge>
                      )}
                      {comment.is_dispute && (
                        <Badge variant="destructive" className="text-xs">
                          Dispute
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    
                    {comment.dispute_reason && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                        <strong>Dispute Reason:</strong> {comment.dispute_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
