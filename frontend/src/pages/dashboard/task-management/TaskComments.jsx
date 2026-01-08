// TaskComments.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";

export default function TaskComments() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();
  const userId = Number(user?.id);
  const userName = user?.name || "User";
  const { id } = useParams();
  const taskId = id;

  // Helper functions
  const getAvatarColor = (id) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500"];
    return colors[parseInt(id) % colors.length];
  };

  const getUserInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch comments on mount and when taskId changes
  useEffect(() => {
    if (!taskId || !userId) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}api/task-comments.php?task_id=${taskId}&id=${userId}`
        );
        const data = await res.json();

        if (data.status === "success") {
          const structured = buildCommentTree(data.data);
          setComments(structured);
        }
      } catch (err) {
        console.error("Failed to load comments", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load comments"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [taskId, userId]);

  const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];

    comments.forEach(c => {
      const timestamp = c.created_date && c.created_time 
        ? `${c.created_date} ${c.created_time}`
        : c.created_at || new Date().toISOString();

      map[c.id] = { 
        ...c, 
        userId: Number(c.user_id),
        userName: c.name,
        text: c.comment,
        timestamp: timestamp,
        replies: [] 
      };
    });

    comments.forEach(c => {
      if (c.parent_id) {
        if (map[c.parent_id]) {
          map[c.parent_id].replies.push(map[c.id]);
        }
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  };

  // Refresh comments
  const refreshComments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}api/task-comments.php?task_id=${taskId}&id=${userId}`
      );
      const data = await res.json();

      if (data.status === "success") {
        const structured = buildCommentTree(data.data);
        setComments(structured);
      }
    } catch (err) {
      console.error("Failed to refresh comments", err);
    }
  };

  // Comment CRUD operations
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const params = new FormData();
      params.append('task_id', taskId);
      params.append('comment', newComment);
      params.append('user_id', userId);
      params.append('parent_id', replyingTo ? replyingTo.id : null);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}api/task-comments.php?id=${userId}`,
        params
      );

      if (res.data.status === "success") {
        // Refresh comments to get the latest
        await refreshComments();
        
        setNewComment("");
        setReplyingTo(null);
        
        Swal.fire({
          icon: "success",
          title: "Success",
          text: replyingTo ? "Reply added!" : "Comment added!",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(res.data.message || "Failed to add comment");
      }
    } catch (err) {
      console.error("Comment failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add comment"
      });
    }
  };

  const handleEditComment = (commentId) => {
    let foundComment = null;
    
    const findComment = (commentList) => {
      for (const comment of commentList) {
        if (comment.id === commentId) {
          foundComment = comment;
          return true;
        }
        if (comment.replies && comment.replies.length > 0) {
          if (findComment(comment.replies)) {
            return true;
          }
        }
      }
      return false;
    };

    findComment(comments);

    if (foundComment && foundComment.userId === userId) {
      setEditingComment(commentId);
      setEditText(foundComment.text);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/task-comments.php?comment_id=${editingComment}&id=${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `comment=${encodeURIComponent(editText)}`
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        // Refresh comments to get the latest
        await refreshComments();
        
        setEditingComment(null);
        setEditText("");
        
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Comment updated!",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || "Failed to update comment");
      }
    } catch (err) {
      console.error("Edit failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update comment"
      });
    }
  };

  const handleDeleteComment = (commentId) => {
    Swal.fire({
      title: "Delete Comment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}api/task-comments.php?comment_id=${commentId}&id=${userId}`,
          { method: "DELETE" }
        );

        const data = await response.json();

        if (data.status === "success") {
          // Refresh comments to get the latest
          await refreshComments();
          
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Comment has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          throw new Error(data.message || "Failed to delete comment");
        }
      } catch (err) {
        console.error("Delete failed", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete comment"
        });
      }
    });
  };

  // Render individual comment
  const renderComment = (comment, isReply = false) => {
    const isOwner = comment.userId === userId;
    const isEditing = editingComment === comment.id;

    return (
      <div key={comment.id} className={isReply ? "ml-10 mt-3" : "mb-4"}>
        <div className="flex gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(comment.userId)} flex items-center justify-center text-white text-xs font-bold`}>
            {getUserInitials(comment.userName)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{comment.userName}</span>
                {isOwner && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">You</span>
                )}
                <span className="text-xs text-slate-500">{formatDate(comment.timestamp)}</span>
              </div>
              
              {isOwner && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                    className="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  {comment.text}
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    {replyingTo?.id === comment.id ? "Cancel Reply" : "Reply"}
                  </button>
                  
                  {comment.replies && comment.replies.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>
              </>
            )}

            {replyingTo?.id === comment.id && (
              <div className="mt-3 flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Reply to ${comment.userName}...`}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-start"
                >
                  Reply
                </button>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Count total comments
  const totalComments = comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800">Comments</h3>
          <div className="animate-pulse w-20 h-6 bg-slate-200 rounded"></div>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800">Comments</h3>
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {totalComments}
        </span>
      </div>

      <div className="space-y-4 max-h-130 overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No comments yet. Start the conversation!</p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>

      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(userId)} flex items-center justify-center text-white font-bold`}>
          {getUserInitials(userName)}
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `Replying to ${replyingTo.userName}...` : "Add a comment..."}
            className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows="3"
          />
          <div className="flex justify-between items-center mt-2">
            {replyingTo && (
              <span className="text-sm text-blue-600">
                Replying to {replyingTo.userName}
                <button onClick={() => setReplyingTo(null)} className="ml-2 text-slate-500 hover:text-slate-700">
                  × Cancel
                </button>
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setNewComment("")}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Clear
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${newComment.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {replyingTo ? 'Reply' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}