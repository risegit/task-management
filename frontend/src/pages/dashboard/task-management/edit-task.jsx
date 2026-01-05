import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import Swal from "sweetalert2";
import axios from "axios";

export default function CreateTask() {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [assignedUsersStatus, setAssignedUsersStatus] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  const [loggedInUserStatus, setLoggedInUserStatus] = useState(null);
  const [isTaskCreator, setIsTaskCreator] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const userName = user?.name || "User";
  const { id } = useParams();
  const navigate = useNavigate();

  const priorityOptions = [
    { value: "Low", label: "Low", color: "#10b981" },
    { value: "Medium", label: "Medium", color: "#f59e0b" },
    { value: "High", label: "High", color: "#ef4444" },
  ];

  // Status options with colors
  const statusOptions = [
    { value: "not-acknowledge", label: "Not Acknowledge", color: "#9ca3af", bgColor: "#f3f4f6" },
    { value: "acknowledge", label: "Acknowledge", color: "#3b82f6", bgColor: "#dbeafe" },
    { value: "in-progress", label: "In Progress", color: "#f59e0b", bgColor: "#fef3c7" },
    { value: "completed", label: "Completed", color: "#10b981", bgColor: "#d1fae5" },
  ];

  const [taskData, setTaskData] = useState({
    name: "",
    projectName: "",
    assignedBy: "",
    assignedTo: [],
    deadline: "",
    remarks: "",
    priority: "",
    status: "",
    taskStatus: ""
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

  // Check if user status prevents removal
  const isUserRemovable = (userId) => {
    const status = assignedUsersStatus[userId];
    return !(status === "in-progress" || status === "completed");
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

  // Custom styles for status dropdown
  const statusCustomStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? state.data.bgColor : 'white',
      color: state.data.color,
      fontWeight: '500',
      borderLeft: state.isSelected ? `4px solid ${state.data.color}` : '4px solid transparent',
      '&:hover': {
        backgroundColor: state.data.bgColor,
      },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color,
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${errors.status ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: errors.status ? '#fef2f2' : 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? (errors.status ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
      "&:hover": {
        borderColor: errors.status ? '#f87171' : '#94a3b8',
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

  // Custom format option label for status
  const formatStatusOptionLabel = ({ value, label, color, bgColor }) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );

  // Custom format value for status
  const formatStatusValue = (option) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: option.color }}
      />
      <span>{option.label}</span>
    </div>
  );

  // Custom MultiValueRemove component
  const CustomMultiValueRemove = (props) => {
    const { data } = props;
    const isRemovable = isUserRemovable(data.value);
    
    if (!isRemovable) {
      return null;
    }
    
    return <components.MultiValueRemove {...props} />;
  };

  // Custom MultiValue component - FIXED VERSION
  const CustomMultiValue = (props) => {
    const { data } = props;
    const isRemovable = isUserRemovable(data.value);
    
    // Get display name - use originalName if available, otherwise label
    let displayName = data.originalName || data.label || '';
    
    // Remove (POC) suffix from display name if present
    if (displayName.includes(' (POC)')) {
      displayName = displayName.replace(' (POC)', '');
    }
    
    return (
      <components.MultiValue {...props}>
        <div className="flex items-center gap-1 px-1">
          <span className="font-medium">{displayName}</span>
          {!isRemovable && data.status && (
            <span className="text-xs text-gray-600 italic ml-1">({data.status})</span>
          )}
          {data.isPOC && (
            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-1">POC</span>
          )}
        </div>
        {isRemovable && <components.MultiValueRemove {...props} />}
      </components.MultiValue>
    );
  };

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
    // For assignedTo, we need to prevent removal of certain users
    if (field === "assignedTo") {
      // Get current non-removable users
      const nonRemovableUsers = taskData.assignedTo.filter(user => 
        !isUserRemovable(user.value)
      );
      
      // Merge non-removable users with new selection
      const newSelection = [
        ...nonRemovableUsers,
        ...selected.filter(newUser => 
          isUserRemovable(newUser.value) && 
          !nonRemovableUsers.some(nr => nr.value === newUser.value)
        )
      ];
      
      setTaskData({ ...taskData, [field]: newSelection });
    } else {
      setTaskData({ ...taskData, [field]: selected });
    }
    
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
    if (!taskData.status) newErrors.status = "Status is required";

    if (!taskData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(taskData.deadline);
      const today = new Date().setHours(0, 0, 0, 0);
      
      // If we have created_date from the API response, check against it
      if (taskData.created_date) {
        const createdDate = new Date(taskData.created_date).setHours(0, 0, 0, 0);
        if (deadlineDate <= createdDate) {
          newErrors.deadline = `Deadline cannot be before the task creation date (${taskData.created_date})`;
        }
      }
    }

    if (taskData.remarks && taskData.remarks.length > 500) newErrors.remarks = "Remarks cannot exceed 500 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch task data for editing
  useEffect(() => {
    // Only fetch if we have an ID (edit mode)
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTaskData = async () => {
      setLoading(true);
      setLoadingAssignedUsers(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              task_id: id,
              user_id: userId,
              user_code: user?.user_code,
              'edit-task': true
            },
          }
        );
        
        const data = response.data;

        console.log("API response:", data);
        console.log("Logged-in user ID:", userId);
        
        if (data.status === "success" && data.data && data.data.length > 0) {
          const task = data.data[0];
          
          // Check if logged-in user is the task creator
          const isCreator = task.assigned_by === userId;
          setIsTaskCreator(isCreator);
          console.log("Is task creator:", isCreator, "Task assigned_by:", task.assigned_by, "User ID:", userId);
          
          // Create a map of user statuses
          const userStatusMap = {};
          let loggedInUserAssignment = null;
          
          if (data.assignedTo) {
            data.assignedTo.forEach(user => {
              userStatusMap[user.user_id] = user.status;
              
              // Check if this is the logged-in user
              if (user.user_id === userId) {
                loggedInUserAssignment = user;
              }
            });
          }
          
          setAssignedUsersStatus(userStatusMap);
          
          // Store the logged-in user's status
          if (loggedInUserAssignment) {
            console.log("Logged-in user found in assignedTo:", loggedInUserAssignment);
            setLoggedInUserStatus(loggedInUserAssignment.status);
          } else {
            console.log("Logged-in user NOT found in assignedTo");
            setLoggedInUserStatus(null);
          }
          
          // Format assignedTo data for react-select
          const assignedUsers = data.assignedTo?.map(user => {
            // Find if this user is POC in the userBelongsToProject array
            const userInfo = data.userBelongsToProject?.find(u => u.emp_id === user.user_id);
            const isPOC = userInfo?.is_poc === "1";
            
            return {
              value: user.user_id,
              label: user.name + (isPOC ? " (POC)" : ""),
              originalName: user.name,
              status: user.status,
              isPOC: isPOC,
              isRemovable: !(user.status === "in-progress" || user.status === "completed")
            };
          }) || [];

          // Get all available users for dropdown
          const allUsers = data.userBelongsToProject || [];
          const formattedUsers = allUsers
            .filter(user => user.emp_id !== userId)
            .map(user => ({
              value: user.emp_id,
              label: user.name + (user.is_poc === "1" ? " (POC)" : ""),
              originalName: user.name,
              isPOC: user.is_poc === "1"
            }));
          
          setAssignedTo(formattedUsers);

          // Set selected project
          setSelectedProject({
            value: task.client_id,
            label: task.name || "Unknown Project"
          });

          // Determine task status based on who is viewing:
          // 1. If user is task creator: Use task.task_status from API
          // 2. If user is assignee: Use their assigned status
          // 3. Default: "not-acknowledge"
          let determinedStatus = "not-acknowledge"; // default
          
          if (isCreator && task.task_status) {
            // User is task creator - show task_status from API
            determinedStatus = task.task_status.toLowerCase().replace(/\s+/g, '-');
            console.log("Task creator - using task_status from API:", determinedStatus);
          } else if (loggedInUserAssignment && loggedInUserAssignment.status) {
            // User is assignee (not creator) - show their assigned status
            determinedStatus = loggedInUserAssignment.status.toLowerCase().replace(/\s+/g, '-');
            console.log("Assignee - using logged-in user's status:", determinedStatus);
          } else {
            // Default for non-assignees
            console.log("Using default status:", determinedStatus);
          }

          console.log("Final determined status:", determinedStatus);

          // Find status option
          const statusOption = statusOptions.find(opt => opt.value === determinedStatus) || 
                              statusOptions.find(opt => opt.value === "not-acknowledge");

          // Set task data
          setTaskData({
            name: task.task_name || "",
            projectName: task.name || "",
            assignedBy: task.assigned_by || "",
            assignedTo: assignedUsers,
            deadline: task.deadline || "",
            remarks: task.remarks || "",
            priority: priorityOptions.find(p => p.value === task.priority) || "",
            status: statusOption, // Use determined status
            created_date: task.created_date || "",
            taskStatus: task.task_status || ""
          });

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Task not found',
            confirmButtonText: 'OK',
            confirmButtonColor: '#d33',
          }).then(() => {
            navigate(-1);
          });
        }
        
      } catch (error) {
        console.error("Axios error:", error);
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Failed to fetch task data.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        }).then(() => {
          navigate(-1);
        });
      } finally {
        setLoading(false);
        setLoadingAssignedUsers(false);
      }
    };
    
    fetchTaskData();
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
      // Create form data
      const formData = new FormData();
      
      // Basic task information
      formData.append("taskName", taskData.name.trim());
      formData.append("assignedBy", taskData.assignedBy);
      formData.append("priority", taskData.priority.value);
      formData.append("status", taskData.status.value); // Add status
      formData.append("deadline", taskData.deadline);
      formData.append("remarks", taskData.remarks.trim());
      
      // Assigned users - send as comma-separated string
      const assignedUserIds = taskData.assignedTo.map(emp => emp.value);
      formData.append("assignedTo", assignedUserIds.join(","));
      
      // Add project/client ID if available
      if (selectedProject && selectedProject.value) {
        formData.append("client_id", selectedProject.value);
      }
      
      // Add comments if any
      if (comments.length > 0) {
        formData.append("comments", JSON.stringify(comments));
      }
      
      // For editing mode
      if (id) {
        formData.append("taskId", id);
        formData.append("_method", "PUT");
      }
      
      // Add user information for tracking
      formData.append("userId", userId);
      formData.append("userCode", user?.user_code || "");
      
      console.log("Submitting task data:", {
        task_name: taskData.name,
        assigned_by: taskData.assignedBy,
        assigned_to: assignedUserIds,
        priority: taskData.priority?.value,
        status: taskData.status?.value, // Log status
        deadline: taskData.deadline,
        remarks: taskData.remarks,
        task_id: id || "new",
        is_task_creator: isTaskCreator
      });

      // Send the request using Axios
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/task-management.php`,
        formData,
        {
          params: {
            id: userId,
            user_code: user?.user_code
          }
        }
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status === "success") {
        await Swal.fire({ 
          icon: 'success', 
          title: id ? 'Task Updated!' : 'Task Created!', 
          text: result.message || (id ? 'Task has been updated successfully.' : 'Task has been created successfully.'),
          timer: 2000, 
          showConfirmButton: false 
        });
        
        // Navigate back after success
        // navigate(-1);
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Operation Failed', 
          text: result.message || result.error || "Failed to save task. Please try again." 
        });
      }
    } catch (error) {
      console.error("Submit Error Details:", error);
      
      let errorMessage = 'An error occurred while saving the task.';
      let errorTitle = 'Error';
      
      if (error.response) {
        console.error("Server Error Response:", error.response);
        
        if (error.response.data) {
          errorMessage = error.response.data.message || 
                        error.response.data.error || 
                        `Server error: ${error.response.status} - ${error.response.statusText}`;
        } else {
          errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        }
        
        errorTitle = 'Server Error';
        
      } else if (error.request) {
        console.error("No Response Received:", error.request);
        errorMessage = 'No response from server. Please check your internet connection and try again.';
        errorTitle = 'Connection Error';
        
      } else {
        console.error("Request Setup Error:", error.message);
        errorMessage = `Error: ${error.message}`;
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: errorTitle, 
        text: errorMessage,
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom components for react-select
  const customComponents = {
    MultiValue: CustomMultiValue,
    MultiValueRemove: CustomMultiValueRemove
  };

  // If we're in create mode (no id), don't show loading
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Card Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Create Task
              </h2>
              <p className="text-blue-100 mt-2">
                Fill in the details to create a new task
              </p>
            </div>

            {/* Form Content for Create Mode */}
            <div className="p-8">
              <div className="space-y-6">
                {/* Project Selection for Create Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <div className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50">
                    <p className="text-slate-600 italic">Select a project first (implementation needed)</p>
                  </div>
                </div>

                {/* Assigned To */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Assigned To <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isMulti
                    options={[]}
                    value={taskData.assignedTo}
                    onChange={(selected) => handleSelectChange("assignedTo", selected)}
                    classNamePrefix="react-select"
                    placeholder="Select project first to see team members..."
                    isDisabled={true}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Select a project to see available team members
                  </div>
                </div>

                {/* Task Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={taskData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Enter task name"
                  />
                </div>

                {/* Priority and Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Priority <span className="text-red-500">*</span>
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
                  </div>

                  {/* Status - For create mode, default to "not-acknowledge" */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={statusOptions}
                      value={taskData.status || statusOptions.find(opt => opt.value === "not-acknowledge")}
                      onChange={(selected) => handleSelectChange("status", selected)}
                      classNamePrefix="react-select"
                      styles={statusCustomStyles}
                      formatOptionLabel={formatStatusOptionLabel}
                      formatOptionValue={formatStatusValue}
                      placeholder="Select status..."
                      isSearchable={false}
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="deadline"
                      value={taskData.deadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-blue-500"
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
                  <p className="text-xs text-slate-500">
                    Cannot select past dates
                  </p>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    rows="3"
                    value={taskData.remarks}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                    placeholder="Enter any additional remarks (optional)"
                  ></textarea>
                  <div className="flex items-center justify-end text-xs">
                    <span className="text-slate-500">
                      {taskData.remarks.length}/500 characters
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                  <button 
                    type="button"
                    className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center gap-2 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-blue-200 hover:scale-105'
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
      </div>
    );
  }

  // Edit mode - show loading or form
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Edit Task
            </h2>
            <p className="text-blue-100 mt-2">
              {isTaskCreator ? "You can edit all task details" : "You can only update your task status"}
            </p>
            {!isTaskCreator && (
              <div className="mt-2 text-yellow-100 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Only the task creator can modify task details
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600">Loading task details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Project Name (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Project
                      <span className="text-red-500">*</span>
                    </label>
                    <div className={`px-4 py-3 rounded-xl border-2 ${isTaskCreator ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <p className={`font-medium ${isTaskCreator ? 'text-slate-800' : 'text-slate-600'}`}>{taskData.projectName}</p>
                    </div>
                    <p className="text-xs text-slate-500">Project is read-only</p>
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Assigned To
                      <span className="text-red-500">*</span>
                      {loadingAssignedUsers && (
                        <span className="text-xs text-blue-500 font-normal animate-pulse">
                          Loading...
                        </span>
                      )}
                      {!isTaskCreator && (
                        <span className="text-xs text-amber-600 font-normal">
                          (Read-only)
                        </span>
                      )}
                    </label>
                    
                    <Select
                      isMulti
                      options={allAssignedTo}
                      value={taskData.assignedTo}
                      onChange={isTaskCreator ? (selected) => handleSelectChange("assignedTo", selected) : undefined}
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
                          border: `2px solid ${errors.assignedTo ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                          borderRadius: '0.75rem',
                          padding: '8px 4px',
                          backgroundColor: errors.assignedTo ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                          minHeight: '52px',
                          boxShadow: state.isFocused && isTaskCreator ? (errors.assignedTo ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                          "&:hover": {
                            borderColor: errors.assignedTo ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                          },
                          opacity: loadingAssignedUsers || !isTaskCreator ? 0.7 : 1,
                          cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                        }),
                        multiValue: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.data.status === 'in-progress' ? '#fef3c7' : 
                                         state.data.status === 'completed' ? '#d1fae5' : 
                                         state.data.status === 'acknowledge' ? '#dbeafe' : 
                                         '#e0f2fe',
                          borderRadius: '0.5rem',
                          border: state.data.status === 'in-progress' ? '1px solid #f59e0b' : 
                                 state.data.status === 'completed' ? '1px solid #10b981' : 
                                 state.data.status === 'acknowledge' ? '1px solid #3b82f6' : 
                                 '1px solid #0369a1',
                          opacity: !isTaskCreator ? 0.8 : 1,
                        }),
                        multiValueLabel: (provided, state) => ({
                          ...provided,
                          color: state.data.status === 'in-progress' ? '#92400e' : 
                                state.data.status === 'completed' ? '#065f46' : 
                                state.data.status === 'acknowledge' ? '#1e40af' : 
                                '#0369a1',
                          fontWeight: '500',
                          paddingRight: '4px',
                        }),
                        multiValueRemove: (provided, state) => {
                          const isRemovable = !(state.data.status === 'in-progress' || 
                                               state.data.status === 'completed');
                          
                          return {
                            ...provided,
                            color: isRemovable && isTaskCreator ? '#0369a1' : '#9ca3af',
                            cursor: isRemovable && isTaskCreator ? 'pointer' : 'not-allowed',
                            '&:hover': {
                              backgroundColor: isRemovable && isTaskCreator ? '#bae6fd' : 'transparent',
                              color: isRemovable && isTaskCreator ? '#0c4a6e' : '#9ca3af',
                            },
                            display: isRemovable && isTaskCreator ? 'flex' : 'none',
                          };
                        },
                        indicatorSeparator: (provided) => ({
                          ...provided,
                          display: isTaskCreator ? 'flex' : 'none',
                        }),
                        dropdownIndicator: (provided) => ({
                          ...provided,
                          display: isTaskCreator ? 'flex' : 'none',
                        }),
                      }}
                      placeholder={
                        loadingAssignedUsers 
                          ? "Loading team members..." 
                          : allAssignedTo.length === 0 
                            ? "No team members available" 
                            : isTaskCreator 
                              ? "Select multiple team members..."
                              : "Assigned users (read-only)"
                      }
                      isDisabled={loading || loadingAssignedUsers || allAssignedTo.length === 0 || !isTaskCreator}
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
                      isClearable={isTaskCreator}
                      components={isTaskCreator ? customComponents : {
                        ...customComponents,
                        DropdownIndicator: () => null,
                        ClearIndicator: () => null,
                      }}
                    />
                    {errors.assignedTo && isTaskCreator && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.assignedTo}
                      </p>
                    )}
                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                      {allAssignedTo.length > 0 && (
                        <span>{allAssignedTo.length} team member(s) available</span>
                      )}
                      {!isTaskCreator && (
                        <span className="text-amber-600">Field is read-only</span>
                      )}
                    </div>
                    {taskData.assignedTo.some(user => 
                      user.status === 'in-progress' || 
                      user.status === 'completed'
                    ) && isTaskCreator && (
                      <div className="mt-2 text-xs text-amber-600">
                        <span className="font-medium">Note:</span> Users with status "in-progress" or "completed" cannot be removed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Task Name
                    <span className="text-red-500">*</span>
                    {!isTaskCreator && (
                      <span className="text-xs text-amber-600 font-normal">
                        (Read-only)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={taskData.name}
                    onChange={isTaskCreator ? handleChange : undefined}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.name 
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                        : isTaskCreator 
                          ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                          : "border-slate-100 bg-slate-50/50"
                    } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all`}
                    placeholder="Enter task name"
                    readOnly={!isTaskCreator}
                  />
                  {errors.name && isTaskCreator && (
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
                    {!isTaskCreator && (
                      <span className="text-amber-600">Read-only</span>
                    )}
                  </div>
                </div>

                {/* Second Row: Priority, Status and Deadline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Priority
                      <span className="text-red-500">*</span>
                      {!isTaskCreator && (
                        <span className="text-xs text-amber-600 font-normal">
                          (Read-only)
                        </span>
                      )}
                    </label>
                    <Select
                      options={priorityOptions}
                      value={taskData.priority}
                      onChange={isTaskCreator ? (selected) => handleSelectChange("priority", selected) : undefined}
                      classNamePrefix="react-select"
                      styles={{
                        ...priorityCustomStyles,
                        control: (provided, state) => ({
                          ...provided,
                          border: `2px solid ${errors.priority ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                          borderRadius: '0.75rem',
                          padding: '8px 4px',
                          backgroundColor: errors.priority ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                          minHeight: '52px',
                          boxShadow: state.isFocused && isTaskCreator ? (errors.priority ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                          "&:hover": {
                            borderColor: errors.priority ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                          },
                          opacity: !isTaskCreator ? 0.7 : 1,
                          cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                        }),
                        indicatorSeparator: (provided) => ({
                          ...provided,
                          display: isTaskCreator ? 'flex' : 'none',
                        }),
                        dropdownIndicator: (provided) => ({
                          ...provided,
                          display: isTaskCreator ? 'flex' : 'none',
                        }),
                      }}
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Select priority..."
                      isSearchable={false}
                      isDisabled={!isTaskCreator}
                    />
                    {errors.priority && isTaskCreator && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.priority}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Status
                      <span className="text-red-500">*</span>
                      {isTaskCreator && taskData.taskStatus && (
                        <span className="text-xs font-normal text-blue-500 italic">
                          (Task status: {taskData.taskStatus})
                        </span>
                      )}
                      {!isTaskCreator && loggedInUserStatus && (
                        <span className="text-xs font-normal text-blue-500 italic">
                          (Your status: {loggedInUserStatus})
                        </span>
                      )}
                    </label>
                    <Select
                      options={statusOptions}
                      value={taskData.status}
                      onChange={(selected) => handleSelectChange("status", selected)}
                      classNamePrefix="react-select"
                      styles={statusCustomStyles}
                      formatOptionLabel={formatStatusOptionLabel}
                      placeholder="Select status..."
                      isSearchable={false}
                      isDisabled={loading}
                    />
                    {errors.status && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.status}
                      </p>
                    )}
                    {/* <div className="text-xs text-slate-500 mt-1">
                      {isTaskCreator ? (
                        <span>
                          {taskData.taskStatus ? (
                            <span>Task status loaded from API: <span className="font-medium">{taskData.taskStatus}</span></span>
                          ) : (
                            <span>Update task status</span>
                          )}
                        </span>
                      ) : loggedInUserStatus ? (
                        <span>
                          You can update your task status. 
                          {taskData.assignedTo.length > 1 && (
                            <span className="ml-1">Other assignees may have different statuses.</span>
                          )}
                        </span>
                      ) : (
                        <span>You are not assigned to this task. Status cannot be updated.</span>
                      )}
                    </div> */}
                  </div>
                  
                  {/* Deadline */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Deadline
                      <span className="text-red-500">*</span>
                      {!isTaskCreator && (
                        <span className="text-xs text-amber-600 font-normal">
                          (Read-only)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="deadline"
                        value={taskData.deadline}
                        onChange={isTaskCreator ? handleChange : undefined}
                        min={taskData.created_date ? taskData.created_date : new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 pl-12 rounded-xl border-2 ${
                          errors.deadline 
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                            : isTaskCreator 
                              ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                              : "border-slate-100 bg-slate-50/50"
                        } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all`}
                        readOnly={!isTaskCreator}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className={`w-5 h-5 ${errors.deadline ? 'text-red-500' : isTaskCreator ? 'text-blue-500' : 'text-slate-400'}`}
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
                    {errors.deadline && isTaskCreator ? (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.deadline}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        {taskData.created_date 
                          ? `Cannot select dates before ${taskData.created_date}` 
                          : 'Cannot select past dates'}
                        {!isTaskCreator && ' (Read-only)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Remarks
                    {!isTaskCreator && (
                      <span className="text-xs text-amber-600 font-normal">
                        (Read-only)
                      </span>
                    )}
                  </label>
                  <textarea
                    name="remarks"
                    rows="3"
                    value={taskData.remarks}
                    onChange={isTaskCreator ? handleChange : undefined}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.remarks 
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                        : isTaskCreator 
                          ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                          : "border-slate-100 bg-slate-50/50"
                    } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all resize-none`}
                    placeholder="Enter any additional remarks (optional)"
                    readOnly={!isTaskCreator}
                  ></textarea>
                  {errors.remarks && isTaskCreator && (
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
                    {!isTaskCreator && (
                      <span className="text-amber-600 ml-2">Read-only</span>
                    )}
                  </div>
                </div>

                {/* Permission Notice */}
                {!isTaskCreator && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800">Limited Editing Permission</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You are not the creator of this task. You can only update your task status.
                          Only the task creator 
                          {/* (<span className="font-medium">User ID: {taskData.assignedBy}</span>)  */}
                          &nbsp;can modify other task details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                onClick={() => {
                  navigate(-1);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center gap-2 ${
                  isSubmitting || loading
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
                    Updating Task...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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