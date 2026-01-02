import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";

export default function CreateTask() {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [allProjects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const userName = user?.name || "User";
  const { id } = useParams();

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

  // Custom styles for priority dropdown
  const priorityCustomStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? state.data.color + '20' : 'white',
      color: state.data.color,
      fontWeight: '500',
      borderLeft: state.isSelected ? `4px solid ${state.data.color}` : '4px solid transparent',
      '&:hover': {
        backgroundColor: state.data.color + '10',
      },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color,
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
    }),
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${errors.priority ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: errors.priority ? '#fef2f2' : 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? (errors.priority ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
      "&:hover": {
        borderColor: errors.priority ? '#f87171' : '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
  };

  // Custom format option label for priority
  const formatOptionLabel = ({ value, label, color }) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );

  // Comment functions
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      userId,
      userName,
      text: newComment,
      timestamp: new Date().toISOString(),
      replies: [],
    };

    if (replyingTo) {
      // Add as reply
      setComments(comments.map(comment => {
        if (comment.id === replyingTo.id) {
          return {
            ...comment,
            replies: [...comment.replies, {
              ...comment,
              id: Date.now(),
              text: newComment,
              timestamp: new Date().toISOString(),
            }]
          };
        }
        return comment;
      }));
      setReplyingTo(null);
    } else {
      // Add as new comment
      setComments([...comments, comment]);
    }
    
    setNewComment("");
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

  const handleSaveEdit = () => {
    if (!editText.trim()) return;

    setComments(comments.map(comment => {
      if (comment.id === editingComment) {
        return { ...comment, text: editText };
      }
      // Check replies
      if (comment.replies.some(reply => reply.id === editingComment)) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === editingComment ? { ...reply, text: editText } : reply
          )
        };
      }
      return comment;
    }));

    setEditingComment(null);
    setEditText("");
  };

  const handleDeleteComment = (commentId) => {
    Swal.fire({
      title: 'Delete Comment?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove from top-level comments
        let updatedComments = comments.filter(comment => comment.id !== commentId);
        
        // Remove from replies
        updatedComments = updatedComments.map(comment => ({
          ...comment,
          replies: comment.replies.filter(reply => reply.id !== commentId)
        }));

        setComments(updatedComments);
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
    if (!id) return;

    const fetchDepartment = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              id: id,
              user_code: user?.user_code,
            },
          }
        );
        
        const data = response.data;

      console.log("API response:", data);

      // Assigned To = ALL users EXCEPT logged-in user
      // In your first useEffect (fetchUsers):
      const projects = data.data
        .filter(user => user.emp_id !== userId || user.id !== userId) // Check both emp_id and id
        .map(user => ({
          value: user.emp_id || user.id, // Use emp_id if available, otherwise id
          label: user.name
      }));

      setProjects(projects);
        
      } catch (error) {
        console.error("Axios error:", error);
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Failed to fetch department data.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartment();
  }, [id]);

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
      form.append("comments", JSON.stringify(comments));
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
      {/* Main Form Card */}
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Create Task
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details to create a new task</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assigned To */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Select Project
                    <span className="text-red-500">*</span>
                    {loading && (
                      <span className="text-xs text-blue-500 font-normal animate-pulse">
                        Loading...
                      </span>
                    )}
                  </label>
                  <Select
                    options={allProjects}
                    onChange={setSelectedProject}
                    value={selectedProject}
                    classNamePrefix="react-select"
                    className={`react-select-container ${errors.poc ? 'error' : ''}`}
                    styles={{
                      menu: (provided) => ({ 
                        ...provided, 
                        zIndex: 9999,
                        borderRadius: '0.75rem',
                        marginTop: '4px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                      }),
                      control: (provided, state) => ({
                        ...provided,
                        border: `2px solid ${errors.poc ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.75rem',
                        padding: '8px 4px',
                        backgroundColor: errors.poc ? '#fef2f2' : 'white',
                        minHeight: '52px',
                        boxShadow: state.isFocused ? (errors.poc ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                        "&:hover": {
                          borderColor: errors.poc ? '#f87171' : '#94a3b8',
                        },
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#94a3b8',
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#1e293b',
                        fontWeight: '500',
                      }),
                    }}
                    placeholder="Select Project..."
                    isLoading={loading}
                    loadingMessage={() => "Loading projects..."}
                    isDisabled={loading}
                  />
                  {selectedProject && loadingAssignedUsers && (
                    <p className="text-blue-500 text-sm flex items-center gap-1 animate-pulse">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Fetching team members for {selectedProject.label}...
                    </p>
                  )}
                  {errors.poc && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.poc}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Assigned To
                    <span className="text-red-500">*</span>
                    {loadingAssignedUsers && (
                      <span className="text-xs text-blue-500 font-normal animate-pulse">
                        Loading...
                      </span>
                    )}
                  </label>
                  
                  <Select
                    isMulti
                    options={allAssignedTo}
                    value={taskData.assignedTo}
                    onChange={(selected) => handleSelectChange("assignedTo", selected)}
                    classNamePrefix="react-select"
                    className={`react-select-container ${errors.assignedTo ? 'error' : ''}`}
                    styles={{
                      menu: (provided) => ({ 
                        ...provided, 
                        zIndex: 9999,
                        borderRadius: '0.75rem',
                        marginTop: '4px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                      }),
                      control: (provided, state) => ({
                        ...provided,
                        border: `2px solid ${errors.assignedTo ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.75rem',
                        padding: '8px 4px',
                        backgroundColor: errors.assignedTo ? '#fef2f2' : 'white',
                        minHeight: '52px',
                        boxShadow: state.isFocused ? (errors.assignedTo ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                        "&:hover": {
                          borderColor: errors.assignedTo ? '#f87171' : '#94a3b8',
                        },
                        opacity: loadingAssignedUsers ? 0.7 : 1,
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: loadingAssignedUsers ? '#94a3b8' : '#94a3b8',
                      }),
                      loadingIndicator: (provided) => ({
                        ...provided,
                        color: '#3b82f6',
                      }),
                      loadingMessage: (provided) => ({
                        ...provided,
                        color: '#64748b',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }),
                      multiValue: (provided) => ({
                        ...provided,
                        backgroundColor: '#e0f2fe',
                        borderRadius: '0.5rem',
                      }),
                      multiValueLabel: (provided) => ({
                        ...provided,
                        color: '#0369a1',
                        fontWeight: '500',
                      }),
                      multiValueRemove: (provided) => ({
                        ...provided,
                        color: '#0369a1',
                        '&:hover': {
                          backgroundColor: '#bae6fd',
                          color: '#0c4a6e',
                        },
                      }),
                    }}
                    placeholder={
                      loadingAssignedUsers 
                        ? "Fetching team members..." 
                        : allAssignedTo.length === 0 
                          ? "No team members available" 
                          : "Select multiple team members..."
                    }
                    isDisabled={loading || loadingAssignedUsers || allAssignedTo.length === 0}
                    isLoading={loadingAssignedUsers}
                    loadingMessage={() => (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading team members...</span>
                      </div>
                    )}
                    noOptionsMessage={() => 
                      loadingAssignedUsers 
                        ? "Loading team members..." 
                        : "No team members available"
                    }
                    isClearable={true}
                  />
                  {errors.assignedTo && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.assignedTo}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>
                      {loadingAssignedUsers ? "Fetching team members..." : `${taskData.assignedTo.length} team member(s) selected`}
                    </span>
                    {allAssignedTo.length > 0 && (
                      <span>{allAssignedTo.length} team member(s) available</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Task Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Task Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={taskData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.name 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all`}
                  placeholder="Enter task name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Required field</span>
                  <span className="text-slate-500">{taskData.name.length}/100 characters</span>
                </div>
              </div>

              {/* Second Row: Assigned To and Deadline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Priority
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={priorityOptions}
                      value={taskData.priority}
                      onChange={(selected) => handleSelectChange("priority", selected)}
                      classNamePrefix="react-select"
                      styles={priorityCustomStyles}
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Select priority..."
                      isSearchable={false}
                    />
                    {errors.priority && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.priority}
                      </p>
                    )}
                  </div>
                  {/* Deadline */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Deadline
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="deadline"
                        value={taskData.deadline}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 pl-12 rounded-xl border-2 ${
                          errors.deadline 
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                        } focus:ring-4 outline-none transition-all`}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className={`w-5 h-5 ${errors.deadline ? 'text-red-500' : 'text-blue-500'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    {errors.deadline ? (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.deadline}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Cannot select past dates</p>
                    )}
                  </div>
                
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  rows="3"
                  value={taskData.remarks}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.remarks 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all resize-none`}
                  placeholder="Enter any additional remarks (optional)"
                ></textarea>
                {errors.remarks && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.remarks}
                  </p>
                )}
                <div className="flex items-center justify-end text-xs">
                  <span className={taskData.remarks.length > 500 ? "text-red-500" : "text-slate-500"}>
                    {taskData.remarks.length}/500 characters
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                onClick={() => {
                  setTaskData({
                    name: "",
                    assignedTo: [],
                    deadline: "",
                    remarks: "",
                    priority: "", // Reset priority
                  });
                  setErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center gap-2 ${
                  isSubmitting 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-lg hover:shadow-blue-200 hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Task...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Task
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