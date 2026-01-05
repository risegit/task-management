import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";

export default function CreateTask() {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const userName = user?.name || "User";

  const { id } = useParams();
  const taskId = id;


  const priorityOptions = [
    { value: "low", label: "Low", color: "#10b981" },
    { value: "medium", label: "Medium", color: "#f59e0b" },
    { value: "high", label: "High", color: "#ef4444" },
  ];

  const [taskData, setTaskData] = useState({
    name: "",
    assignedTo: [],
    deadline: "",
    remarks: "",
    priority: "",
  });

  useEffect(() => {
  if (!taskId || !userId) return;

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}api/task-management.php?task_id=${taskId}&id=${userId}`
      );
      const data = await res.json();

      if (data.status === "success") {
        const structured = buildCommentTree(data.data);
        setComments(structured);
      }
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  fetchComments();
}, [taskId, userId]);

const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c.id] = { 
      ...c, 
      userId: c.user_id,
      userName: c.name,
      text: c.comment,
      timestamp: c.created_at,
      replies: [] 
    };
  });

  comments.forEach(c => {
    if (c.parent_id) {
      map[c.parent_id]?.replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
};


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

  // Comment functionn
const handleAddComment = async () => {
  if (!newComment.trim()) return;

  try {
    const payload = {
      task_id: taskId,
      comment: newComment,
      user_id: userId,
      parent_id: replyingTo?.id || null,
    };

    // Add comment
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}api/task-comments.php?id=${userId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data.status === "success") {
      setNewComment("");
      setReplyingTo(null);

      // Reload comments
      const refresh = await axios.get(
        `${import.meta.env.VITE_API_URL}api/task-management.php`,
        {
          params: {
            task_id: taskId,
            id: userId,
          },
        }
      );

      setComments(buildCommentTree(refresh.data.data));
    }
  } catch (err) {
    console.error("Comment failed", err);
  }
};



  const handleEditComment = (commentId) => {
    // Find comment in main list or replies
    let foundComment = null;
    
    comments.forEach(comment => {
      if (comment.id === commentId) {
        foundComment = comment;
      }
      comment.replies.forEach(reply => {
        if (reply.id === commentId) {
          foundComment = reply;
        }
      });
    });

    if (foundComment && foundComment.userId === userId) {
      setEditingComment(commentId);
      setEditText(foundComment.text);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}api/task-management.php?comment_id=${editingComment}&id=${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `comment=${encodeURIComponent(editText)}`
        }
      );

      setEditingComment(null);
      setEditText("");

      // Reload
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}api/task-management.php?task_id=${taskId}&id=${userId}`
      );
      const data = await res.json();
      setComments(buildCommentTree(data.data));

    } catch (err) {
      console.error("Edit failed", err);
    }
  };


  const handleDeleteComment = (commentId) => {
    Swal.fire({
      title: "Delete Comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33"
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await fetch(
          `${import.meta.env.VITE_API_URL}api/task-management.php?comment_id=${commentId}&id=${userId}`,
          { method: "DELETE" }
        );

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}api/task-management.php?task_id=${taskId}&id=${userId}`
        );
        const data = await res.json();
        setComments(buildCommentTree(data.data));

      } catch (err) {
        console.error("Delete failed", err);
      }
    });
  };


  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSelectChange = (field, selected) => {
    setTaskData({ ...taskData, [field]: selected });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  // Validation
  const validate = () => {
    let newErrors = {};

    if (!taskData.name.trim()) newErrors.name = "Task name is required";
    else if (taskData.name.trim().length < 3) newErrors.name = "Task name must be at least 3 characters";
    else if (taskData.name.trim().length > 100) newErrors.name = "Task name cannot exceed 100 characters";

    if (taskData.assignedTo.length === 0) newErrors.assignedTo = "Please select at least one assignee";
    if (!taskData.priority) newErrors.priority = "Priority is required";

    if (!taskData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else if (new Date(taskData.deadline) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.deadline = "Deadline cannot be in the past";
    }

    if (taskData.remarks && taskData.remarks.length > 500) newErrors.remarks = "Remarks cannot exceed 500 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-comments.php`);
        const data = await response.json();
        
        const assignedToUsers = data.data
          .filter(user => user.id !== userId)
          .map(user => ({ value: user.id, label: user.name }));

        setAssignedTo(assignedToUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [userId]);

  // Submit form
  const handleSubmit = async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: firstError });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("task_name", taskData.name);
      form.append("assignedBy", userId);
      form.append("assignedTo", JSON.stringify(taskData.assignedTo.map(u => u.value)));
      form.append("deadline", taskData.deadline);
      form.append("remarks", taskData.remarks);
      // form.append("comments", JSON.stringify(comments));
      form.append("priority", taskData.priority.value);

      const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-management.php?id=${user?.id}`, {
        method: "POST",
        body: form,
      });

      const result = await response.json();

      if (result.status === "success") {
        Swal.fire({ icon: 'success', title: 'Task Created!', timer: 2000, showConfirmButton: false });
        
        // Reset form
        setTaskData({ name: "", assignedTo: [], deadline: "", remarks: "", priority: "" });
        setComments([]);
        setNewComment("");
        setReplyingTo(null);
        setEditingComment(null);
        setErrors({});
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: result.message || "Failed to create task" });
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while creating the task.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a comment with replies
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
                
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {replyingTo?.id === comment.id ? "Cancel Reply" : "Reply"}
                  </button>
                )}
              </>
            )}

            {/* Reply input */}
            {replyingTo?.id === comment.id && !isReply && (
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            )}

            {/* Render replies */}
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

  // Count total comments including replies
  const totalComments = comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="mx-auto ">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Edit Task
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details to Edit a task</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-6">
              
              {/* Task Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Task Name *</label>
                <input
                  type="text"
                  name="name"
                  value={taskData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${errors.name ? "border-red-300" : "border-slate-200"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
                  placeholder="Enter task name"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              {/* Assigned To & Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Assigned To *</label>
                  <Select
                    isMulti
                    options={allAssignedTo}
                    value={taskData.assignedTo}
                    onChange={(selected) => handleSelectChange("assignedTo", selected)}
                    classNamePrefix="react-select"
                    placeholder="Select users..."
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: `2px solid ${errors.assignedTo ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.75rem',
                        padding: '8px 4px',
                      }),
                    }}
                  />
                  {errors.assignedTo && <p className="text-red-500 text-sm">{errors.assignedTo}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Priority *</label>
                  <Select
                    options={priorityOptions}
                    value={taskData.priority}
                    onChange={(selected) => handleSelectChange("priority", selected)}
                    placeholder="Select priority..."
                    isSearchable={false}
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: `2px solid ${errors.priority ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.75rem',
                        padding: '8px 4px',
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        color: state.data.color,
                        fontWeight: '500',
                      }),
                      singleValue: (provided, state) => ({
                        ...provided,
                        color: state.data.color,
                        fontWeight: '600',
                      }),
                    }}
                  />
                  {errors.priority && <p className="text-red-500 text-sm">{errors.priority}</p>}
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Deadline *</label>
                <div className="relative">
                  <input
                    type="date"
                    name="deadline"
                    value={taskData.deadline}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 ${errors.deadline ? "border-red-300" : "border-slate-200"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {errors.deadline && <p className="text-red-500 text-sm">{errors.deadline}</p>}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Remarks</label>
                <textarea
                  name="remarks"
                  rows="3"
                  value={taskData.remarks}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${errors.remarks ? "border-red-300" : "border-slate-200"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none`}
                  placeholder="Enter any additional remarks (optional)"
                />
                {errors.remarks && <p className="text-red-500 text-sm">{errors.remarks}</p>}
              </div>

              {/* Comments Section */}
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

                {/* Comments List */}
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {comments.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No comments yet. Start the conversation!</p>
                  ) : (
                    comments.map(comment => renderComment(comment))
                  )}
                </div>

                {/* New Comment Input */}
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                onClick={() => {
                  setTaskData({ name: "", assignedTo: [], deadline: "", remarks: "", priority: "" });
                  setComments([]);
                  setNewComment("");
                  setReplyingTo(null);
                  setEditingComment(null);
                  setErrors({});
                }}
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2 ${isSubmitting ? 'opacity-50' : 'hover:shadow-lg'}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Update Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}