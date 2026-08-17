"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, User, Clock } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_admin: boolean;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface CitizenCommentsProps {
  issueId: string;
}

export default function CitizenComments({ issueId }: CitizenCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim(),
          is_admin: true // Mark as admin comment
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      } else {
        const errorData = await response.json();
        console.error('Failed to submit comment:', errorData.error);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [issueId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Admin Comment */}
      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
          <MessageCircle className="w-4 h-4" />
          Respond to Citizen
        </div>
        <Textarea
          placeholder="Add a response or update for the citizen..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] bg-white"
        />
        <Button 
          onClick={handleSubmitComment} 
          disabled={!newComment.trim() || submitting}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Sending...' : 'Send Response'}
        </Button>
        <p className="text-xs text-blue-700">
          This response will be visible to the citizen who reported the issue.
        </p>
      </div>

      <Separator />

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet.</p>
            <p className="text-xs mt-1">Be the first to respond to this citizen's issue.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  {(comment.profiles?.full_name || 'U')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className={`rounded-lg p-3 ${
                  comment.is_admin 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.profiles?.full_name || 'User'}
                      </span>
                      <Badge 
                        variant={comment.is_admin ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {comment.is_admin ? 'Staff' : 'Citizen'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                      {comment.updated_at && comment.updated_at !== comment.created_at && (
                        <span className="ml-1 italic">(edited)</span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  {comment.profiles?.email && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {comment.profiles.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {comments.length > 0 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchComments}
            className="text-xs"
          >
            Refresh Comments
          </Button>
        </div>
      )}
    </div>
  );
}
