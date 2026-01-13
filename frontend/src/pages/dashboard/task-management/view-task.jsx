import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";

// CreateTask Modal Component
const CreateTask = ({ onClose, onSubmitSuccess }) => {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = getCurrentUser();

  // Priority options for dropdown
  const priorityOptions = [
    { value: "low", label: "Low", color: "#10b981" }, // Green
    { value: "medium", label: "Medium", color: "#f59e0b" }, // Amber
    { value: "high", label: "High", color: "#ef4444" }, // Red
  ];

  const [taskData, setTaskData] = useState({
    name: "",
    assignedTo: [],
    deadline: "",
    remarks: "",
    priority: "", // New priority field
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (field, selected) => {
    setTaskData({ ...taskData, [field]: selected });
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Validation function - Updated to include priority
  const validate = () => {
    let newErrors = {};

    // Task Name validation
    if (!taskData.name.trim()) {
      newErrors.name = "Task name is required";
    } else if (taskData.name.trim().length < 3) {
      newErrors.name = "Task name must be at least 3 characters";
    } else if (taskData.name.trim().length > 100) {
      newErrors.name = "Task name cannot exceed 100 characters";
    }

    // Assigned To validation
    if (taskData.assignedTo.length === 0) {
      newErrors.assignedTo = "Please select at least one assignee";
    }

    // Priority validation
    if (!taskData.priority) {
      newErrors.priority = "Priority is required";
    }

    // Deadline validation
    if (!taskData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const selectedDate = new Date(taskData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.deadline = "Deadline cannot be in the past";
      }
    }

    // Remarks validation (optional but with max length)
    if (taskData.remarks && taskData.remarks.length > 500) {
      newErrors.remarks = "Remarks cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              id: user?.id,
              user_code: user?.user_code,
              view_task: true
            }
          }
        );

        console.log("API response for users:", response.data);

        // Extract users from the API response
        const data = response.data;
        let usersList = [];
        
        if (data.status === "success") {
          // Check different possible response structures
          if (data.data && Array.isArray(data.data)) {
            usersList = data.data;
          } else if (data.data123 && Array.isArray(data.data123)) {
            usersList = data.data123;
          }
          
          // Filter out current user and map to select options
          const assignedToUsers = usersList
            .filter(taskUser => taskUser.id !== user?.id)
            .map(taskUser => ({
              value: taskUser.id,
              label: taskUser.assigned_to_names || taskUser.name || `User ${taskUser.id}`
            }));

          setAssignedTo(assignedToUsers);
          console.log("Assigned to users:", assignedToUsers);
        }

      } catch (error) {
        console.error("Error fetching users:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load users. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchUsers();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: firstError,
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();

      form.append("task_name", taskData.name);
      form.append("userName", user?.name);
      form.append("assignedBy", user?.id);
      form.append(
        "assignedTo",
        JSON.stringify(taskData.assignedTo.map(u => u.value))
      );
      form.append("deadline", taskData.deadline);
      form.append("remarks", taskData.remarks);
      form.append("priority", taskData.priority.value); // Add priority to form data
      form.append("create_task", "true"); // Add flag for creating task

      console.log("Submitting form data...");
      for (let pair of form.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-management.php?id=${user?.id}`,
        {
          method: "POST",
          body: form,
        }
      );

      const result = await response.json();
      console.log("API result:", result);

      if (result.status === "success") {
        Swal.fire({
          icon: 'success',
          title: 'Task Created Successfully!',
          text: result.message || 'Task has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        });
    
        // Reset form
        setTaskData({
          name: "",
          assignedTo: [],
          deadline: "",
          remarks: "",
          priority: "",
        });
        setErrors({});
        
        // Call success callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        
        // Close modal
        if (onClose) {
          onClose();
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Create Task',
          text: result.message || "Failed to create task",
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text: 'An error occurred while creating the task.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Modal Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Create Task
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-blue-100 mt-2">Fill in the details to create a new task</p>
        </div>

        {/* Form Content */}
        <div className="p-6 md:p-8">
          <div className="space-y-6">
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
              {/* Assigned To */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Assigned To
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  isMulti
                  options={allAssignedTo}
                  value={taskData.assignedTo}
                  onChange={(selected) => handleSelectChange("assignedTo", selected)}
                  classNamePrefix="react-select"
                  className={`react-select-container ${
                    errors.assignedTo ? 'error' : ''
                  }`}
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
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#94a3b8',
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
                  placeholder="Select multiple users..."
                  isDisabled={loading}
                />
                {errors.assignedTo && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.assignedTo}
                  </p>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  {taskData.assignedTo.length} user(s) selected
                </div>
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

            {/* Third Row: Priority and Remarks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Field */}
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
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
            <button 
              type="button"
              className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all border-2 border-slate-200"
              onClick={onClose}
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
  );
};

// Main ManageDepartment Component
const ManageDepartment = () => {
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  
  // Get user from JWT
  const user = getCurrentUser();
  
  // Get stable primitive values for dependencies
  const userId = user?.id;
  const userCode = user?.user_code;
  const userName = user?.name;
  
  // Use ref to track if data has been fetched
  const hasFetched = useRef(false);
  
  const itemsPerPage = 10;

  // NEW FUNCTION: Check if current user is assigned to the task
  const isUserAssignedToTask = (task) => {
    if (!task || !userId || !userName) return false;
    
    // Check if assignedTo is an array and contains current user
    if (Array.isArray(task.assignedTo)) {
      return task.assignedTo.some(assignedUser => {
        // Check if assigned user name contains current user's name or ID
        return assignedUser.includes(userName) || 
               assignedUser.includes(userId?.toString()) ||
               (task.assignedToIds && task.assignedToIds.includes(userId));
      });
    }
    
    // Check if assignedTo is a string and contains current user
    if (typeof task.assignedTo === 'string') {
      return task.assignedTo.includes(userName) || 
             task.assignedTo.includes(userId?.toString());
    }
    
    return false;
  };

  useEffect(() => {
    // Prevent multiple API calls
    if (hasFetched.current) return;
    
    const fetchTasks = async () => {
      if (!userId || !userCode) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        hasFetched.current = true; // Mark as fetched
        
        console.log("Fetching tasks...");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              id: userId,
              user_code: userCode,
              view_task: true
            }
          }
        );
        
        const result = response.data;
        console.log("Tasks API Response:", result);

        if (result.status === "success") {
          let tasksData = [];
          
          // Handle different response structures
          if (result.data && Array.isArray(result.data)) {
            tasksData = result.data;
          } else if (result.data123 && Array.isArray(result.data123)) {
            tasksData = result.data123;
          }
          
          // Transform API data to match our component structure
          const transformedTasks = tasksData.map(task => ({
            id: task.id,
            clientName: task.client_name || "Unknown Client",
            name: task.task_name || "Unnamed Task",
            description: task.remarks || "No description",
            assignedBy: task.assigned_by_name || "Unknown",
            assignedTo: task.assigned_to_names ? 
              (Array.isArray(task.assigned_to_names) ? task.assigned_to_names : [task.assigned_to_names]) : 
              [],
            assignedToIds: task.assigned_to_ids ? 
              (Array.isArray(task.assigned_to_ids) ? task.assigned_to_ids : task.assigned_to_ids.split(',')) : 
              [],
            deadline: task.deadline,
            remark: task.remarks,
            taskStatus: task.task_status || "not-acknowledge",
            clientId: task.client_id,
            createdBy: task.created_by,
            // Store raw API data for reference
            rawAssignedTo: task.assigned_to || "",
            rawAssignedToNames: task.assigned_to_names || ""
          }));
          
          setTasks(transformedTasks);
          console.log("Transformed tasks:", transformedTasks);
        } else {
          console.warn("API returned error:", result.message);
          setTasks([]);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId, userCode]); // Only depend on primitive values

  // Handle sorting
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Sort arrow component
  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className={`w-4 h-4 text-blue-600 ${sortConfig.direction === "descending" ? "rotate-180" : ""} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.assignedBy && task.assignedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.remark && task.remark.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.taskStatus && task.taskStatus.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Apply sorting to filtered results
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  const clearSearch = () => setSearchQuery("");
  
  // Navigate to edit task page
  const handleEdit = (id) => {
    navigate(`/dashboard/task-management/edit-task/${id}`);
  };
  
  // Open view modal
  const handleView = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  // Close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedTask(null);
  };

  // Open CreateTask modal (eye button click)
  const handleCreateTaskModal = () => {
    setShowCreateTaskModal(true);
  };

  // Close CreateTask modal
  const closeCreateTaskModal = () => {
    setShowCreateTaskModal(false);
  };

  // Handle successful task creation
  const handleTaskCreated = () => {
    // Reset the fetch flag to allow refresh
    hasFetched.current = false;
    
    // Refresh the tasks list
    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              id: userId,
              user_code: userCode,
              view_task: true
            }
          }
        );
        
        const result = response.data;
        if (result.status === "success") {
          let tasksData = [];
          
          if (result.data && Array.isArray(result.data)) {
            tasksData = result.data;
          } else if (result.data123 && Array.isArray(result.data123)) {
            tasksData = result.data123;
          }
          
          const transformedTasks = tasksData.map(task => ({
            id: task.id,
            name: task.task_name || "Unnamed Task",
            description: task.remarks || "No description",
            assignedBy: task.assigned_by_name || "Unknown",
            assignedTo: task.assigned_to_names ? 
              (Array.isArray(task.assigned_to_names) ? task.assigned_to_names : [task.assigned_to_names]) : 
              [],
            assignedToIds: task.assigned_to_ids ? 
              (Array.isArray(task.assigned_to_ids) ? task.assigned_to_ids : task.assigned_to_ids.split(',')) : 
              [],
            deadline: task.deadline,
            remark: task.remarks,
            taskStatus: task.task_status || "not-acknowledge",
            clientId: task.client_id,
            createdBy: task.created_by,
            rawAssignedTo: task.assigned_to || "",
            rawAssignedToNames: task.assigned_to_names || ""
          }));
          
          setTasks(transformedTasks);
        }
      } catch (error) {
        console.error("Error refreshing tasks:", error);
      }
    };

    fetchTasks();
    
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Task created successfully!',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (id) => {
    setStatusDropdownOpen(statusDropdownOpen === id ? null : id);
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const form = new FormData();
      form.append("task_id", taskId);
      form.append("userName", user?.name);
      form.append("task_status", newStatus);
      form.append("update_status", "true");
      form.append("userId", userId);
      form.append("_method", "PUT");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/task-management.php`,
        form,
        {
          params: {
            id: userId
          }
        }
      );

      // ✅ Axios auto-parses JSON
      const result = response.data;
      console.log("Update Status Response:", result);
      if (result.status === "success") {
        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, taskStatus: newStatus }
              : task
          )
        );

        setStatusDropdownOpen(null);

        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Task status updated to ${newStatus}`,
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });
      } else {
        throw new Error(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error(
        "Error updating task status:",
        error.response?.data || error.message
      );

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to update task status",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    }
  };
  
  const goToPage = (page) => setCurrentPage(page);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if deadline is upcoming or overdue
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "text-slate-500";
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 font-semibold";
    if (diffDays <= 7) return "text-amber-600 font-semibold";
    return "text-green-600 font-medium";
  };

  // Get task status badge color
  const getTaskStatusBadge = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch(normalizedStatus) {
      case "not-acknowledge":
      case "not-acknowledge":
        return "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200";
      case "acknowledge":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200";
      case "in-progress":
        return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200";
      case "completed":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200";
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200";
    }
  };

  // Format task status for display
  const formatTaskStatus = (status) => {
    if (!status) return "Not-Acknowledge";
    
    const normalizedStatus = status.toLowerCase();
    
    switch(normalizedStatus) {
      case "not-acknowledge":
        return "Not-Acknowledge";
      case "acknowledge":
        return "Acknowledge";
      case "in-progress":
        return "In-progress";
      case "completed":
        return "Completed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading tasks...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Main Card */}
      <div className="mx-auto">
        {/* <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"> */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  View All Tasks
                </h2>
                <p className="text-blue-100 mt-2">View and manage all tasks with task assignments</p>
              </div>
              
              {/* Search Box */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by task name, assigned by, or status..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-blue-100 focus:border-white focus:bg-white/20 focus:ring-4 focus:ring-white/30 outline-none transition-all"
                  />
                  <svg className="w-5 h-5 text-blue-100 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button 
                      onClick={clearSearch} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-100 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {currentTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">No tasks found</p>
                <p className="text-slate-500 text-sm">
                  {searchQuery ? "Try adjusting your search terms" : "No tasks available in the system"}
                </p>
                <button 
                  onClick={handleCreateTaskModal}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Task
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group rounded-tl-xl"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Task Name
                            <SortArrow columnKey="name" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("assignedBy")}
                        >
                          <div className="flex items-center gap-2">
                            Assigned By
                            <SortArrow columnKey="assignedBy" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            Assigned To
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("deadline")}
                        >
                          <div className="flex items-center gap-2">
                            Deadline
                            <SortArrow columnKey="deadline" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("taskStatus")}
                        >
                          <div className="flex items-center gap-2">
                            Task Status
                            <SortArrow columnKey="taskStatus" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            Remark
                          </div>
                        </th>
                        <th className="py-4 px-4 text-right font-semibold text-slate-700 rounded-tr-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTasks.map((task) => {
                        const isAssigned = isUserAssignedToTask(task);
                        return (
                          <tr 
                            key={task.id} 
                            className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 group"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="font-semibold text-slate-900 block">
                                    {task.name || "Unnamed Task"}
                                  </span>
                                  <span className="font-normal text-slate-900 block">
                                    ({task.clientName})
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="font-medium text-slate-800">
                                  {task.assignedBy || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                  task.assignedTo.slice(0, 2).map((person, index) => (
                                    <span 
                                      key={index}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                        isAssigned && person.includes(userName) 
                                          ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-100" 
                                          : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-100"
                                      }`}
                                    >
                                      {person}
                                      {/* {isAssigned && person.includes(userName) && (
                                        <span className="ml-1 text-xs text-green-600">(You)</span>
                                      )} */}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 text-sm">No assignments</span>
                                )}
                                {Array.isArray(task.assignedTo) && task.assignedTo.length > 2 && (
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                    +{task.assignedTo.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <svg className={`w-4 h-4 ${getDeadlineStatus(task.deadline)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className={`${getDeadlineStatus(task.deadline)}`}>
                                  {formatDate(task.deadline)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 relative">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${getTaskStatusBadge(task.taskStatus)}`}>
                                  {formatTaskStatus(task.taskStatus)}
                                </span>
                                {isAssigned ? (
                                  <button 
                                    onClick={() => toggleStatusDropdown(task.id)}
                                    className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                                    title="Change Status"
                                  >
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                ) : (
                                  <div className="w-6 h-6 opacity-0 cursor-default">
                                    {/* Empty div for alignment */}
                                  </div>
                                )}
                              </div>
                              
                              {/* Status Dropdown - Only show if user is assigned */}
                              {isAssigned && statusDropdownOpen === task.id && (
                                <div className="absolute z-10 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-visible">
                                  <div className="py-1">
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "not-acknowledge")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      Not-Acknowledge
                                    </button>
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "acknowledge")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      Acknowledge
                                    </button>
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "in-progress")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                      In-progress
                                    </button>
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "completed")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Completed
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="max-w-xs">
                                <span className="text-sm text-slate-700 line-clamp-2">
                                  {task.remark || "No remarks"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleView(task)} 
                                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2"
                                  title="View Details"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleEdit(task.id)} 
                                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2"
                                  title="Edit Task"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-4">
                  {currentTasks.map((task) => {
                    const isAssigned = isUserAssignedToTask(task);
                    return (
                      <div key={task.id} className="border-2 border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 hover:border-blue-300 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                            <span className="text-white font-bold text-lg">
                              {task.name ? task.name.charAt(0).toUpperCase() : "T"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-lg mb-1">
                              {task.name || "Unnamed Task"}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${getTaskStatusBadge(task.taskStatus)}`}>
                                {formatTaskStatus(task.taskStatus)}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className={`${getDeadlineStatus(task.deadline)}`}>
                                  {formatDate(task.deadline)}
                                </span>
                              </div>
                            </div>
                            {isAssigned && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  Assigned to you
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Assigned By:</span>
                              <span className="text-slate-800 font-medium ml-2">{task.assignedBy || "N/A"}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-700">Assigned To:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                  task.assignedTo.slice(0, 3).map((person, index) => (
                                    <span 
                                      key={index}
                                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                                        isAssigned && person.includes(userName) 
                                          ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-100" 
                                          : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-100"
                                      }`}
                                    >
                                      {person}
                                      {isAssigned && person.includes(userName) && (
                                        <span className="ml-1 text-xs text-green-600">(You)</span>
                                      )}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 text-sm">No assignments</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Description:</span>
                              <span className="text-slate-700 text-sm ml-2 block mt-1">
                                {task.description || "No description available"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Remark:</span>
                              <span className="text-slate-700 text-sm ml-2 block mt-1">
                                {task.remark || "No remarks"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile Status Dropdown - Only show if user is assigned */}
                        {isAssigned ? (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-slate-700">Update Status:</span>
                              <span className="text-xs text-green-600 font-medium">You can update status</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => updateTaskStatus(task.id, "not-acknowledge")}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold ${task.taskStatus === "not-acknowledge" ? "ring-2 ring-red-500" : ""} bg-red-50 text-red-700 border border-red-200`}
                              >
                                Not-Acknowledge
                              </button>
                              <button 
                                onClick={() => updateTaskStatus(task.id, "acknowledge")}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold ${task.taskStatus === "acknowledge" ? "ring-2 ring-blue-500" : ""} bg-blue-50 text-blue-700 border border-blue-200`}
                              >
                                Acknowledge
                              </button>
                              <button 
                                onClick={() => updateTaskStatus(task.id, "in-progress")}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold ${task.taskStatus === "in-progress" ? "ring-2 ring-amber-500" : ""} bg-amber-50 text-amber-700 border border-amber-200`}
                              >
                                In-progress
                              </button>
                              <button 
                                onClick={() => updateTaskStatus(task.id, "completed")}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold ${task.taskStatus === "completed" ? "ring-2 ring-green-500" : ""} bg-green-50 text-green-700 border border-green-200`}
                              >
                                Completed
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-slate-600">
                                Only assigned users can update status
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                          <button 
                            onClick={() => handleView(task)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-slate-200 transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button 
                            onClick={() => handleEdit(task.id)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {sortedTasks.length > 0 && (
            <div className="px-6 py-5 border-t-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, sortedTasks.length)}</span> of <span className="font-bold text-slate-900">{sortedTasks.length}</span> tasks
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goToPrevious} 
                    disabled={currentPage === 1} 
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      currentPage === 1 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm border-2 border-slate-200"
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button 
                      key={index + 1} 
                      onClick={() => goToPage(index + 1)} 
                      className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                        currentPage === index + 1 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200" 
                          : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm border-2 border-slate-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button 
                    onClick={goToNext} 
                    disabled={currentPage === totalPages} 
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      currentPage === totalPages 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm border-2 border-slate-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Task Details
                </h2>
                <button 
                  onClick={closeViewModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {selectedTask.name ? selectedTask.name.charAt(0).toUpperCase() : "T"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedTask.name}</h3>
                    <p className="text-slate-600 mt-1">{selectedTask.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Assigned By</h4>
                      <p className="text-slate-800 font-medium flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        {selectedTask.assignedBy}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Status</h4>
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-block ${getTaskStatusBadge(selectedTask.taskStatus)}`}>
                        {formatTaskStatus(selectedTask.taskStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Deadline</h4>
                      <p className={`flex items-center gap-2 ${getDeadlineStatus(selectedTask.deadline)}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(selectedTask.deadline)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Assigned To</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedTask.assignedTo) && selectedTask.assignedTo.length > 0 ? (
                          selectedTask.assignedTo.map((person, index) => (
                            <span 
                              key={index}
                              className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                                isUserAssignedToTask(selectedTask) && person.includes(userName) 
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-100" 
                                  : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-100"
                              }`}
                            >
                              {person}
                              {isUserAssignedToTask(selectedTask) && person.includes(userName) && (
                                <span className="ml-1 text-xs text-green-600">(You)</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">No assignments</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Remarks</h4>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-700">{selectedTask.remark || "No remarks"}</p>
                  </div>
                </div>

                {/* Show permission message in view modal */}
                {isUserAssignedToTask(selectedTask) ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-700 font-medium">
                        You are assigned to this task and can update its status.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-slate-600">
                        You are not assigned to this task. Only assigned users can update the status.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal - Shows the CreateTask form */}
      {showCreateTaskModal && (
        <CreateTask 
          onClose={closeCreateTaskModal}
          onSubmitSuccess={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default ManageDepartment;