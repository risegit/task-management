import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";

// CreateTask Modal Component (keep as is)
const CreateTask = ({ onClose, onSubmitSuccess }) => {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = getCurrentUser();
  
  // Function to format employee name: first word full, second word only first letter
  const formatEmployeeName = (fullName) => {
    if (!fullName) return '';
    
    const parts = fullName.trim().split(' ');
    
    if (parts.length === 1) {
      return parts[0];
    } else if (parts.length === 2) {
      return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
    } else if (parts.length > 2) {
      // Handle cases with middle names
      return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
    }
    
    return fullName;
  };

  // Function to parse name and extract color
  const parseEmployeeName = (employeeString) => {
    if (!employeeString) return { name: '', formattedName: '', color: '#6366F1' };
    
    // Check if string contains color code
    if (employeeString.includes('||#')) {
      const parts = employeeString.split('||#');
      if (parts.length >= 2) {
        const originalName = parts[0].trim();
        const formattedName = formatEmployeeName(originalName);
        return {
          name: originalName,
          formattedName: formattedName,
          color: `#${parts[1]}`
        };
      }
    }
    
    // No color code found
    const formattedName = formatEmployeeName(employeeString);
    return {
      name: employeeString,
      formattedName: formattedName,
      color: '#6366F1' // Default indigo color
    };
  };

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
    time: "",
    created_date: "",
    created_time: "",
    remarks: "",
    priority: "",
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

  // Validation function
  const validate = () => {
    let newErrors = {};

    if (!taskData.name.trim()) {
      newErrors.name = "Task name is required";
    } else if (taskData.name.trim().length < 3) {
      newErrors.name = "Task name must be at least 3 characters";
    } else if (taskData.name.trim().length > 100) {
      newErrors.name = "Task name cannot exceed 100 characters";
    }

    if (taskData.assignedTo.length === 0) {
      newErrors.assignedTo = "Please select at least one assignee";
    }

    if (!taskData.priority) {
      newErrors.priority = "Priority is required";
    }

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

    if (taskData.remarks && taskData.remarks.length > 500) {
      newErrors.remarks = "Remarks cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to get better color combination
  const getColorStyles = (color) => {
    const colorMap = {
      '#6366F1': {
        bg: 'rgba(99, 102, 241, 0.1)',
        border: 'rgba(99, 102, 241, 0.2)',
        text: '#4F46E5',
        hover: 'rgba(99, 102, 241, 0.15)'
      },
      '#EC4899': {
        bg: 'rgba(236, 72, 153, 0.1)',
        border: 'rgba(236, 72, 153, 0.2)',
        text: '#DB2777',
        hover: 'rgba(236, 72, 153, 0.15)'
      },
      '#10B981': {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)',
        text: '#059669',
        hover: 'rgba(16, 185, 129, 0.15)'
      },
      '#F59E0B': {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.2)',
        text: '#D97706',
        hover: 'rgba(245, 158, 11, 0.15)'
      },
      '#8B5CF6': {
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.2)',
        text: '#7C3AED',
        hover: 'rgba(139, 92, 246, 0.15)'
      },
      '#EF4444': {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.2)',
        text: '#DC2626',
        hover: 'rgba(239, 68, 68, 0.15)'
      },
      '#06B6D4': {
        bg: 'rgba(6, 182, 212, 0.1)',
        border: 'rgba(6, 182, 212, 0.2)',
        text: '#0891B2',
        hover: 'rgba(6, 182, 212, 0.15)'
      },
      '#84CC16': {
        bg: 'rgba(132, 204, 22, 0.1)',
        border: 'rgba(132, 204, 22, 0.2)',
        text: '#65A30D',
        hover: 'rgba(132, 204, 22, 0.15)'
      }
    };

    if (colorMap[color]) {
      return colorMap[color];
    }

    return {
      bg: `${color}15`,
      border: `${color}30`,
      text: color,
      hover: `${color}20`
    };
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

        const data = response.data;
        let usersList = [];
        
        if (data.status === "success") {
          if (data.data && Array.isArray(data.data)) {
            usersList = data.data;
          } else if (data.data123 && Array.isArray(data.data123)) {
            usersList = data.data123;
          }
          
          // Process each user to extract formatted name and color
          const assignedToUsers = usersList
            .filter(taskUser => taskUser.id !== user?.id)
            .map(taskUser => {
              // Parse the assigned_to_names field
              if (taskUser.assigned_to_names) {
                const parsedEmployee = parseEmployeeName(taskUser.assigned_to_names);
                return {
                  value: taskUser.id,
                  label: parsedEmployee.formattedName || parsedEmployee.name || `User ${taskUser.id}`,
                  originalName: parsedEmployee.name,
                  color: parsedEmployee.color
                };
              } else {
                // Fallback if no assigned_to_names
                return {
                  value: taskUser.id,
                  label: taskUser.assigned_to_names || taskUser.name || `User ${taskUser.id}`,
                  originalName: taskUser.assigned_to_names || taskUser.name || `User ${taskUser.id}`,
                  color: '#6366F1'
                };
              }
            });

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
      form.append("priority", taskData.priority.value);
      form.append("create_task", "true");

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
    
        setTaskData({
          name: "",
          assignedTo: [],
          deadline: "",
          time: "",
          created_date: "",
          created_time: "",
          remarks: "",
          priority: "",
        });
        setErrors({});
        
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        
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

  // Custom format option label for assigned users
  const formatAssignedOptionLabel = ({ label, color }) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );

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

  // Custom styles for assigned to dropdown
  const assignedToCustomStyles = {
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
    multiValue: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color ? getColorStyles(state.data.color).bg : '#e0f2fe',
      borderRadius: '0.5rem',
      border: `1px solid ${state.data.color ? getColorStyles(state.data.color).border : '#bae6fd'}`,
    }),
    multiValueLabel: (provided, state) => ({
      ...provided,
      color: state.data.color ? getColorStyles(state.data.color).text : '#0369a1',
      fontWeight: '500',
    }),
    multiValueRemove: (provided, state) => ({
      ...provided,
      color: state.data.color ? getColorStyles(state.data.color).text : '#0369a1',
      '&:hover': {
        backgroundColor: state.data.color ? getColorStyles(state.data.color).hover : '#bae6fd',
        color: state.data.color ? getColorStyles(state.data.color).text : '#0c4a6e',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? (state.data.color ? getColorStyles(state.data.color).bg : '#e0f2fe') : 'white',
      color: state.data.color ? getColorStyles(state.data.color).text : '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      borderLeft: state.isSelected ? `4px solid ${state.data.color ? state.data.color : '#3b82f6'}` : '4px solid transparent',
      '&:hover': {
        backgroundColor: state.data.color ? getColorStyles(state.data.color).hover : '#f1f5f9',
      },
    }),
  };

  // Custom format option label for priority
  const formatPriorityOptionLabel = ({ value, label, color }) => (
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
                  styles={assignedToCustomStyles}
                  formatOptionLabel={formatAssignedOptionLabel}
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
                  formatOptionLabel={formatPriorityOptionLabel}
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
  const location = useLocation();
  
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // New state for employee and status filters in the active filters box
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [selectedDeadlineFilter, setSelectedDeadlineFilter] = useState(null);
  
  // Get user from JWT
  const user = getCurrentUser();
  const userRole = user?.role || 'staff';
  
  // Get stable primitive values for dependencies
  const userId = user?.id;
  const userCode = user?.user_code;
  const userName = user?.name;
  
  // Use ref to track if data has been fetched
  const hasFetched = useRef(false);
  
  // Pagination size options
  const paginationSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 250, label: "250 per page" },
  ];
  
  // Status options for dropdown
  const statusOptions = [
    { value: "all", label: "All Status", color: "#6b7280" },
    { value: "not-acknowledge", label: "Not-Acknowledge", color: "#ef4444" },
    { value: "acknowledge", label: "Acknowledge", color: "#3b82f6" },
    { value: "in-progress", label: "In-progress", color: "#f59e0b" },
    { value: "completed", label: "Completed", color: "#10b981" },
    { value: "overdue", label: "Overdue", color: "#dc2626" },
  ];
  
  // Deadline filter options
  const deadlineOptions = [
    { value: "all", label: "All Deadlines", color: "#6b7280" },
    { value: "currentAndFuture", label: "Current & Future", color: "#10b981" },
    { value: "overdueOnly", label: "Overdue Only", color: "#dc2626" },
  ];

  // Parse filter parameters from location state
  useEffect(() => {
    if (location.state) {
      const filterBy = location.state.filterBy || null;
      const employeeName = location.state.employeeName || null;
      const employeeId = location.state.employeeId || null;
      const statusFilter = location.state.statusFilter || null;
      const deadlineFilter = location.state.deadlineFilter || null;
      
      // Clear the location state to prevent persistence on refresh
      navigate(location.pathname, { replace: true, state: {} });
      
      // Update search query with employee name if filtering by employee
      if (filterBy === "employee" && employeeName) {
        setSearchQuery(employeeName);
      }
      
      // Update status filter if provided
      if (statusFilter) {
        const statusOption = statusOptions.find(opt => 
          opt.value.toLowerCase() === statusFilter.toLowerCase() ||
          opt.label.toLowerCase() === statusFilter.toLowerCase()
        );
        if (statusOption) {
          setSelectedStatusFilter(statusOption);
        }
      }
      
      // Update deadline filter if provided
      if (deadlineFilter) {
        const deadlineOption = deadlineOptions.find(opt => 
          opt.value.toLowerCase() === deadlineFilter.toLowerCase()
        );
        if (deadlineOption) {
          setSelectedDeadlineFilter(deadlineOption);
        }
      }
    }
  }, [location.state]);

  // Function to format employee name: first word full, second word only first letter
  const formatEmployeeName = (fullName) => {
    if (!fullName) return '';
    
    const parts = fullName.trim().split(' ');
    
    if (parts.length === 1) {
      return parts[0];
    } else if (parts.length === 2) {
      return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
    } else if (parts.length > 2) {
      // Handle cases with middle names
      return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
    }
    
    return fullName;
  };

  // Function to parse name and extract color
  const parseEmployeeName = (employeeString) => {
    if (!employeeString) return { name: '', formattedName: '', color: '#6366F1' };
    
    // Check if string contains color code
    if (employeeString.includes('||#')) {
      const parts = employeeString.split('||#');
      if (parts.length >= 2) {
        const originalName = parts[0].trim();
        const formattedName = formatEmployeeName(originalName);
        return {
          name: originalName,
          formattedName: formattedName,
          color: `#${parts[1]}`
        };
      }
    }
    
    // No color code found
    const formattedName = formatEmployeeName(employeeString);
    return {
      name: employeeString,
      formattedName: formattedName,
      color: '#6366F1' // Default indigo color
    };
  };

  // Function to parse multiple employees from comma-separated string
  const parseMultipleEmployees = (employeesString) => {
    if (!employeesString) return [];
    
    // Split by comma to get individual employee entries
    const employeeEntries = employeesString.split(', ');
    
    return employeeEntries.map(entry => {
      return parseEmployeeName(entry.trim());
    });
  };

  // Helper function to get better color combination
  const getColorStyles = (color) => {
    const colorMap = {
      '#6366F1': {
        bg: 'rgba(99, 102, 241, 0.1)',
        border: 'rgba(99, 102, 241, 0.2)',
        text: '#4F46E5',
        hover: 'rgba(99, 102, 241, 0.15)'
      },
      '#EC4899': {
        bg: 'rgba(236, 72, 153, 0.1)',
        border: 'rgba(236, 72, 153, 0.2)',
        text: '#DB2777',
        hover: 'rgba(236, 72, 153, 0.15)'
      },
      '#10B981': {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)',
        text: '#059669',
        hover: 'rgba(16, 185, 129, 0.15)'
      },
      '#F59E0B': {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.2)',
        text: '#D97706',
        hover: 'rgba(245, 158, 11, 0.15)'
      },
      '#8B5CF6': {
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.2)',
        text: '#7C3AED',
        hover: 'rgba(139, 92, 246, 0.15)'
      },
      '#EF4444': {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.2)',
        text: '#DC2626',
        hover: 'rgba(239, 68, 68, 0.15)'
      },
      '#06B6D4': {
        bg: 'rgba(6, 182, 212, 0.1)',
        border: 'rgba(6, 182, 212, 0.2)',
        text: '#0891B2',
        hover: 'rgba(6, 182, 212, 0.15)'
      },
      '#84CC16': {
        bg: 'rgba(132, 204, 22, 0.1)',
        border: 'rgba(132, 204, 22, 0.2)',
        text: '#65A30D',
        hover: 'rgba(132, 204, 22, 0.15)'
      }
    };

    if (colorMap[color]) {
      return colorMap[color];
    }

    return {
      bg: `${color}15`,
      border: `${color}30`,
      text: color,
      hover: `${color}20`
    };
  };

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

  // Helper function to convert 24-hour format to 12-hour AM/PM format
  const formatTimeTo12Hour = (time24) => {
    if (!time24 || !time24.includes(':')) return time24;
    
    try {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      if (isNaN(hour) || isNaN(minute)) return time24;
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const formattedMinutes = minute.toString().padStart(2, '0');
      
      return `${hour12}:${formattedMinutes} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time24;
    }
  };

  // Check if deadline is upcoming or overdue
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "text-slate-500";
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 font-semibold";
    if (diffDays <= 7) return "text-black-600 font-semibold";
    return "text-green-600 font-medium";
  };

  // Check if task is overdue - FIXED: Compare dates without time
  const isTaskOverdue = (deadline) => {
    if (!deadline) return false;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    
    // Set both dates to start of day (midnight) to ignore time differences
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    
    return deadlineStart < todayStart;
  };

  // Check if task deadline matches filter criteria
  const checkDeadlineFilter = (taskDeadline, filterType) => {
    if (!taskDeadline || !filterType) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(taskDeadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    switch(filterType) {
      case "currentAndFuture":
        // Show tasks with today's date or future dates
        return deadlineDate >= today;
      case "overdueOnly":
        // Show tasks with past dates
        return deadlineDate < today;
      default:
        return true;
    }
  };

  // Get task status badge color
  const getTaskStatusBadge = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch(normalizedStatus) {
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

  // Custom styles for all dropdown filters
  const filterDropdownStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      padding: '4px 8px',
      backgroundColor: 'white',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      "&:hover": {
        borderColor: '#94a3b8',
      },
      width: '100%',
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color || '#1e293b',
      fontWeight: '500',
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : state.data.color || '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      fontSize: '14px',
      borderLeft: state.isSelected ? '4px solid #3b82f6' : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '14px',
    }),
  };

  // Custom styles for client filter dropdown
  const clientFilterStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
      "&:hover": {
        borderColor: '#94a3b8',
      },
      width: '100%',
      maxWidth: '250px',
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '600',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      borderLeft: state.isSelected ? '4px solid #3b82f6' : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    }),
  };

  // Custom styles for pagination size dropdown
  const paginationSizeStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      padding: '4px 8px',
      backgroundColor: 'white',
      minHeight: '40px',
      minWidth: '140px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      "&:hover": {
        borderColor: '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      fontSize: '14px',
      borderLeft: state.isSelected ? '4px solid #3b82f6' : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    }),
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedClient(null);
    setSelectedEmployeeFilter(null);
    setSelectedStatusFilter(null);
    setSelectedDeadlineFilter(null);
    setCurrentPage(1);
    
    // Clear any location state
    navigate(location.pathname, { replace: true, state: {} });
  };
  
  // Clear client filter
  const clearClientFilter = () => {
    setSelectedClient(null);
    setCurrentPage(1);
  };

  // Clear employee filter
  const clearEmployeeFilter = () => {
    setSelectedEmployeeFilter(null);
    setCurrentPage(1);
  };

  // Clear status filter
  const clearStatusFilter = () => {
    setSelectedStatusFilter(null);
    setCurrentPage(1);
  };

  // Clear deadline filter
  const clearDeadlineFilter = () => {
    setSelectedDeadlineFilter(null);
    setCurrentPage(1);
  };

  // Handle employee filter change
  const handleEmployeeFilterChange = (selected) => {
    setSelectedEmployeeFilter(selected);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (selected) => {
    setSelectedStatusFilter(selected);
    setCurrentPage(1);
  };

  // Handle deadline filter change
  const handleDeadlineFilterChange = (selected) => {
    setSelectedDeadlineFilter(selected);
    setCurrentPage(1);
  };

  // Handle pagination size change
  const handlePaginationSizeChange = (selected) => {
    setItemsPerPage(selected.value);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Check if current user is assigned to the task
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

  // Enhanced filter function that searches in assignedTo array
  const filterTasks = (task) => {
    // Apply employee filter if specified
    if (selectedEmployeeFilter && selectedEmployeeFilter.value !== "all") {
      // Check if this task belongs to the specified employee
      const isEmployeeTask = task.assignedToOriginal && 
        task.assignedToOriginal.toLowerCase().includes(selectedEmployeeFilter.label.toLowerCase());
      
      if (!isEmployeeTask) return false;
    }
    
    // Apply status filter if specified
    if (selectedStatusFilter && selectedStatusFilter.value !== "all") {
      const normalizedTaskStatus = task.taskStatus ? task.taskStatus.toLowerCase().replace("-", "") : "";
      const normalizedFilterStatus = selectedStatusFilter.value.toLowerCase().replace("-", "");
      
      // Special handling for "overdue" status - check both status and deadline
      if (normalizedFilterStatus === "overdue") {
        if (!isTaskOverdue(task.deadline) || normalizedTaskStatus === "completed") {
          return false;
        }
      } else {
        // Regular status filter
        if (normalizedFilterStatus !== normalizedTaskStatus) {
          return false;
        }
      }
    }
    
    // Apply deadline filter if specified
    if (selectedDeadlineFilter && selectedDeadlineFilter.value !== "all" && task.deadline) {
      if (!checkDeadlineFilter(task.deadline, selectedDeadlineFilter.value)) {
        return false;
      }
    }
    
    // Apply search query filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in task name
    if (task.name && task.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in client name
    if (task.clientName && task.clientName.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in assigned by
    if (task.assignedBy && task.assignedBy.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in assignedTo array
    if (task.assignedTo && Array.isArray(task.assignedTo)) {
      for (const assignedUser of task.assignedTo) {
        if (assignedUser.toLowerCase().includes(query)) {
          return true;
        }
      }
    }
    
    // Search in assignedToString (concatenated version)
    if (task.assignedToString && task.assignedToString.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in description
    if (task.description && task.description.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in remarks
    if (task.remark && task.remark.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in task status
    if (task.taskStatus && task.taskStatus.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in formatted date
    if (task.deadline) {
      const formattedDate = formatDate(task.deadline).toLowerCase();
      if (formattedDate.includes(query)) {
        return true;
      }
    }
    
    // Search in formatted time
    if (task.time) {
      const formattedTime = formatTimeTo12Hour(task.time).toLowerCase();
      if (formattedTime.includes(query)) {
        return true;
      }
    }
    
    return false;
  };

  // Fetch employees for filter dropdown
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      console.log("Fetching employees for filter...");
      
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
      console.log("Employees API Response:", result);

      if (result.status === "success") {
        let usersList = [];
        
        if (result.data && Array.isArray(result.data)) {
          usersList = result.data;
        } else if (result.data123 && Array.isArray(result.data123)) {
          usersList = result.data123;
        }
        
        // Extract unique employees from tasks
        const employeeMap = new Map();
        
        usersList.forEach(user => {
          if (user.assigned_to_names) {
            const parsedEmployee = parseEmployeeName(user.assigned_to_names);
            const employeeName = parsedEmployee.name;
            
            if (!employeeMap.has(employeeName)) {
              employeeMap.set(employeeName, {
                value: user.id || employeeName,
                label: employeeName,
                formattedName: parsedEmployee.formattedName,
                color: parsedEmployee.color
              });
            }
          }
        });
        
        // Convert map to array and add "All Employees" option
        const employeeOptions = Array.from(employeeMap.values());
        const allEmployeesOption = {
          value: "all",
          label: "All Employees",
          color: "#3b82f6"
        };
        
        setEmployees([allEmployeesOption, ...employeeOptions]);
        console.log("Employee options:", [allEmployeesOption, ...employeeOptions]);
      } else {
        console.warn("No employees found in API response");
        // Set default "All Employees" option
        setEmployees([{
          value: "all",
          label: "All Employees",
          color: "#3b82f6"
        }]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Set default "All Employees" option
      setEmployees([{
        value: "all",
        label: "All Employees",
        color: "#3b82f6"
      }]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      console.log("Fetching clients...");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/project.php`,
        {
          params: { 
            user_id: userId,
            user_code: userCode,
            view_active_clients: "'active'"
          }
        }
      );
      
      const result = response.data;
      console.log("Clients API Response:", result);

      if (result.status === "success" && result.project && Array.isArray(result.project)) {
        // Transform API data to match react-select format
        const clientOptions = result.project.map(client => ({
          value: client.client_id,
          label: client.client_name,
          clientCode: client.client_code,
          description: client.description,
          startDate: client.start_date
        }));
        
        // Add "All Clients" option
        const allClientsOption = {
          value: "all",
          label: "All Clients",
          color: "#3b82f6"
        };
        
        setClients([allClientsOption, ...clientOptions]);
        console.log("Client options:", [allClientsOption, ...clientOptions]);
      } else {
        console.warn("No clients found in API response");
        // Set default "All Clients" option
        setClients([{
          value: "all",
          label: "All Clients",
          color: "#3b82f6"
        }]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      // Set default "All Clients" option
      setClients([{
        value: "all",
        label: "All Clients",
        color: "#3b82f6"
      }]);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Clients',
        text: 'Failed to load clients. Showing all tasks.',
        timer: 3000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch tasks from API
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
          const transformedTasks = tasksData.map(task => {
            // Parse assigned by name
            const assignedByParsed = parseEmployeeName(task.assigned_by_name || "Unknown");
            
            // Parse assigned to names (could be array or string with multiple users)
            let assignedToArray = [];
            let assignedToColors = [];
            
            if (task.assigned_to_names) {
              // Check if it contains multiple users (comma-separated)
              if (task.assigned_to_names.includes(',')) {
                const parsedEmployees = parseMultipleEmployees(task.assigned_to_names);
                assignedToArray = parsedEmployees.map(emp => emp.formattedName || emp.name);
                assignedToColors = parsedEmployees.map(emp => emp.color);
              } else {
                // Single user
                const parsedEmployee = parseEmployeeName(task.assigned_to_names);
                assignedToArray = [parsedEmployee.formattedName || parsedEmployee.name];
                assignedToColors = [parsedEmployee.color];
              }
            }
            
            // Store original data for searching
            const assignedToString = Array.isArray(task.assigned_to_names) ? 
              task.assigned_to_names.join(', ') : 
              (task.assigned_to_names || "");
            
            return {
              id: task.id,
              clientName: task.client_name || "Unknown Client",
              clientId: task.client_id,
              name: task.task_name || "Unnamed Task",
              description: task.remarks || "No description",
              assignedBy: assignedByParsed.formattedName || assignedByParsed.name || "Unknown",
              assignedByOriginal: task.assigned_by_name || "Unknown",
              assignedByColor: assignedByParsed.color,
              assignedTo: assignedToArray,
              assignedToOriginal: task.assigned_to_names || "",
              assignedToColors: assignedToColors,
              assignedToString: assignedToString,
              assignedToIds: task.assigned_to_ids ? 
                (Array.isArray(task.assigned_to_ids) ? task.assigned_to_ids : task.assigned_to_ids.split(',')) : 
                [],
              deadline: task.deadline,
              time: task.time,
              created_date: task.created_date,
              created_time: task.created_time,
              remark: task.remarks,
              taskStatus: task.task_status || "not-acknowledge",
              createdBy: task.created_by,
              // Store raw API data for reference
              rawAssignedTo: task.assigned_to || "",
              rawAssignedToNames: task.assigned_to_names || ""
            };
          });
          
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
    fetchClients();
    fetchEmployees();
  }, [userId, userCode]); // Only depend on primitive values

  // Handle client filter change
  const handleClientFilterChange = (selected) => {
    setSelectedClient(selected);
    setCurrentPage(1);
  };

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

  // Filter tasks based on search query AND client filter AND custom filters
  const filteredTasks = tasks.filter(task => {
    // Apply client filter first
    const clientFilterPass = !selectedClient || 
                            selectedClient.value === "all" || 
                            task.clientId === selectedClient.value;
    
    // Apply custom filters (employee, status, deadline, search)
    const customFilterPass = filterTasks(task);
    
    return clientFilterPass && customFilterPass;
  });

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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);

  // Function to generate pagination range
  // Function to generate pagination range with ellipsis
const getPaginationRange = () => {
  const maxPagesToShow = 3; // Number of page numbers to show around current page
  const pages = [];
  
  // Always show first page
  pages.push(1);
  
  // Calculate start and end of visible pages
  let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));
  
  // Adjust if we're near the beginning
  if (currentPage <= Math.floor(maxPagesToShow / 2) + 1) {
    endPage = Math.min(totalPages - 1, maxPagesToShow);
  }
  
  // Adjust if we're near the end
  if (currentPage >= totalPages - Math.floor(maxPagesToShow / 2)) {
    startPage = Math.max(2, totalPages - maxPagesToShow + 1);
  }
  
  // Add ellipsis after first page if needed
  if (startPage > 2) {
    pages.push('...');
  }
  
  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  // Add ellipsis before last page if needed
  if (endPage < totalPages - 1) {
    pages.push('...');
  }
  
  // Always show last page if there is more than 1 page
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
};

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };
  
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

  // Open CreateTask modal
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
          
          const transformedTasks = tasksData.map(task => {
            // Parse assigned by name
            const assignedByParsed = parseEmployeeName(task.assigned_by_name || "Unknown");
            
            // Parse assigned to names (could be array or string with multiple users)
            let assignedToArray = [];
            let assignedToColors = [];
            
            if (task.assigned_to_names) {
              // Check if it contains multiple users (comma-separated)
              if (task.assigned_to_names.includes(',')) {
                const parsedEmployees = parseMultipleEmployees(task.assigned_to_names);
                assignedToArray = parsedEmployees.map(emp => emp.formattedName || emp.name);
                assignedToColors = parsedEmployees.map(emp => emp.color);
              } else {
                // Single user
                const parsedEmployee = parseEmployeeName(task.assigned_to_names);
                assignedToArray = [parsedEmployee.formattedName || parsedEmployee.name];
                assignedToColors = [parsedEmployee.color];
              }
            }
            
            // Store original data for searching
            const assignedToString = Array.isArray(task.assigned_to_names) ? 
              task.assigned_to_names.join(', ') : 
              (task.assigned_to_names || "");
            
            return {
              id: task.id,
              clientName: task.client_name || "Unknown Client",
              clientId: task.client_id,
              name: task.task_name || "Unnamed Task",
              description: task.remarks || "No description",
              assignedBy: assignedByParsed.formattedName || assignedByParsed.name || "Unknown",
              assignedByOriginal: task.assigned_by_name || "Unknown",
              assignedByColor: assignedByParsed.color,
              assignedTo: assignedToArray,
              assignedToOriginal: task.assigned_to_names || "",
              assignedToColors: assignedToColors,
              assignedToString: assignedToString,
              assignedToIds: task.assigned_to_ids ? 
                (Array.isArray(task.assigned_to_ids) ? task.assigned_to_ids : task.assigned_to_ids.split(',')) : 
                [],
              deadline: task.deadline,
              time: task.time,
              remark: task.remarks,
              taskStatus: task.task_status || "not-acknowledge",
              createdBy: task.created_by,
              // Store raw API data for reference
              rawAssignedTo: task.assigned_to || "",
              rawAssignedToNames: task.assigned_to_names || ""
            };
          });
          
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
      form.append("taskId", taskId);
      form.append("userName", user?.name);
      form.append("status", newStatus);
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

  // Show filter indicator
  const hasActiveFilters = (selectedEmployeeFilter && selectedEmployeeFilter.value !== "all") || 
                          (selectedStatusFilter && selectedStatusFilter.value !== "all") || 
                          (selectedDeadlineFilter && selectedDeadlineFilter.value !== "all") || 
                          (selectedClient && selectedClient.value !== "all") || 
                          searchQuery;

  // Calculate total tasks for display
  const totalTasksCount = tasks.length;
  const filteredTasksCount = filteredTasks.length;

  // Get current pagination size option
  const currentPaginationSize = paginationSizeOptions.find(opt => opt.value === itemsPerPage) || paginationSizeOptions[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5">
      {/* Main Card */}
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-visible">
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
                  {selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" && (
                    <span className="text-blue-100 text-lg font-normal">
                      - Filtered by: {selectedEmployeeFilter.label}
                    </span>
                  )}
                </h2>
                <p className="text-blue-100 mt-2">View and manage all tasks with task assignments</p>
                <p className="text-blue-100 text-sm mt-1">
                  Found {filteredTasksCount} task{filteredTasksCount !== 1 ? 's' : ''}
                  {selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" && 
                    ` for ${selectedEmployeeFilter.label}`}
                  {selectedStatusFilter && selectedStatusFilter.value !== "all" && 
                    ` with status: ${selectedStatusFilter.label}`}
                  {selectedStatusFilter?.value === "overdue" && " (overdue)"}
                </p>
              </div>
              
              {/* Search Box and Client Filter */}
              <div className="w-full lg:w-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Client Filter Dropdown - Available for all users */}
                  <div className="w-full md:w-64">
                    <div className="relative">
                      <Select
                        options={clients}
                        value={selectedClient}
                        onChange={handleClientFilterChange}
                        classNamePrefix="react-select"
                        styles={clientFilterStyles}
                        placeholder="Filter by client..."
                        isLoading={loadingClients}
                        isClearable={true}
                        isSearchable={true}
                        formatOptionLabel={(option) => (
                          <div className="flex items-center gap-2">
                            {option.value === "all" && (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            )}
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
                    </div>
                    {selectedClient && selectedClient.value !== "all" && (
                      <p className="text-xs text-blue-100 mt-1 ml-1">
                        Showing tasks for: {selectedClient.label}
                      </p>
                    )}
                  </div>
                  
                  {/* Search Box */}
                  <div className="w-full md:w-96">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by task name, client, assigned by, or status..."
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
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {/* Active Filters Box */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-blue-700">Active Filters:</h2>
                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Employee Filter Dropdown - Only for Admins and Managers */}
                {(userRole === 'admin' || userRole === 'manager') && (
                  <div className="w-full md:w-48">
                    <Select
                      options={employees}
                      value={selectedEmployeeFilter}
                      onChange={handleEmployeeFilterChange}
                      classNamePrefix="react-select"
                      styles={filterDropdownStyles}
                      placeholder="Select Employee"
                      isLoading={loadingEmployees}
                      isClearable={true}
                      isSearchable={true}
                      formatOptionLabel={(option) => (
                        <div className="flex items-center gap-2">
                          {option.value === "all" && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                          <span>{option.label}</span>
                        </div>
                      )}
                    />
                  </div>
                )}
                
                {/* Status Filter Dropdown - Available for all users */}
                <div className="w-full md:w-48">
                  <Select
                    options={statusOptions}
                    value={selectedStatusFilter}
                    onChange={handleStatusFilterChange}
                    classNamePrefix="react-select"
                    styles={filterDropdownStyles}
                    placeholder="Select Status"
                    isClearable={true}
                    isSearchable={true}
                    formatOptionLabel={(option) => (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{option.label}</span>
                      </div>
                    )}
                  />
                </div>
                
                {/* Deadline Filter Dropdown - Only for Admins and Managers */}
                {(userRole === 'admin' || userRole === 'manager') && (
                  <div className="w-full md:w-48">
                    <Select
                      options={deadlineOptions}
                      value={selectedDeadlineFilter}
                      onChange={handleDeadlineFilterChange}
                      classNamePrefix="react-select"
                      styles={filterDropdownStyles}
                      placeholder="Select Deadline"
                      isClearable={true}
                      isSearchable={true}
                      formatOptionLabel={(option) => (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                          <span>{option.label}</span>
                        </div>
                      )}
                    />
                  </div>
                )}
                
                {/* Pagination Size Dropdown - Available for all users */}
                <div className="w-full md:w-48">
                  <Select
                    options={paginationSizeOptions}
                    value={currentPaginationSize}
                    onChange={handlePaginationSizeChange}
                    classNamePrefix="react-select"
                    styles={filterDropdownStyles}
                    placeholder="Items per page"
                    isSearchable={false}
                  />
                </div>
              </div>
              
              {/* Active Filter Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium">Employee: {selectedEmployeeFilter.label}</span>
                    <button
                      onClick={clearEmployeeFilter}
                      className="ml-1 hover:text-blue-900"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {selectedStatusFilter && selectedStatusFilter.value !== "all" && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Status: {selectedStatusFilter.label}</span>
                    <button
                      onClick={clearStatusFilter}
                      className="ml-1 hover:text-blue-900"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {selectedDeadlineFilter && selectedDeadlineFilter.value !== "all" && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Deadline: {selectedDeadlineFilter.label}</span>
                    <button
                      onClick={clearDeadlineFilter}
                      className="ml-1 hover:text-blue-900"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {selectedClient && selectedClient.value !== "all" && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">Client: {selectedClient.label}</span>
                    <button
                      onClick={clearClientFilter}
                      className="ml-1 hover:text-blue-900"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {searchQuery && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-medium">Search: "{searchQuery}"</span>
                    <button
                      onClick={clearSearch}
                      className="ml-1 hover:text-blue-900"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-sm text-blue-600">
                Showing {filteredTasksCount} of {totalTasksCount} total tasks
              </div>
            </div>

            {currentTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">
                  {hasActiveFilters ? 
                    `No tasks found matching your filters` 
                    : "No tasks found"}
                </p>
                <p className="text-slate-500 text-sm">
                  {hasActiveFilters ? "Try adjusting your filters" : "No tasks available in the system"}
                </p>
                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 mx-auto"
                  >
                    Clear All Filters
                  </button>
                )}
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
                        const isOverdue = isTaskOverdue(task.deadline) && task.taskStatus !== "completed";
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
                                  <span className="text-slate-600 text-sm block mt-1 line-clamp-1">
                                    ({task.clientName || "N/A"})
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor: getColorStyles(task.assignedByColor).bg,
                                    border: `1px solid ${getColorStyles(task.assignedByColor).border}`
                                  }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span 
                                  className="font-medium"
                                  style={{ color: getColorStyles(task.assignedByColor).text }}
                                  title={task.assignedByOriginal}
                                >
                                  {task.assignedBy}<br/>
                                </span>
                              </div>
                              <span className="font-medium block text-sm mt-1 text-black">{formatDate(task.created_date)}</span>
                              <span className="font-medium block text-sm mt-1 text-black">{formatTimeTo12Hour(task.created_time)}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                  task.assignedTo.map((person, index) => {
                                    const color = task.assignedToColors[index] || '#6366F1';
                                    const colorStyles = getColorStyles(color);
                                    return (
                                      <span 
                                        key={index}
                                        className="px-2.5 overdue-badge py-1 rounded-lg text-xs font-medium border"
                                        style={{
                                          backgroundColor: colorStyles.text,
                                          borderColor: colorStyles.border,
                                          color: "#fff"
                                        }}
                                        title={task.assignedToOriginal}
                                      >
                                        {person}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-slate-500 text-sm">No assignments</span>
                                )}
                                {task.assignedTo && task.assignedTo.length > 4 && (
                                  <span className="px-2.5 pulse py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                    +{task.assignedTo.length - 4} more
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
                                  {formatDate(task.deadline)}<br/>
                                  {task.time && (
                                    <span className="block text-sm mt-1">
                                      {formatTimeTo12Hour(task.time)}
                                    </span>
                                  )}
                                </span>
                                {isOverdue && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                    Overdue
                                  </span>
                                )}
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
                                  {task.remark 
                                    ? task.remark.split(' ').slice(0, 15).join(' ') + (task.remark.split(' ').length > 15 ? '...' : '')
                                    : "No remarks"
                                  }
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
                    const isOverdue = isTaskOverdue(task.deadline) && task.taskStatus !== "completed";
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
                              {isOverdue && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                {task.clientName || "No Client"}
                              </span>
                              {isAssigned && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  Assigned to you
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Assigned By:</span>
                              <span 
                                className="font-medium ml-2"
                                style={{ color: getColorStyles(task.assignedByColor).text }}
                                title={task.assignedByOriginal}
                              >
                                {task.assignedBy}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-700">Assigned To:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                  task.assignedTo.slice(0, 3).map((person, index) => {
                                    const color = task.assignedToColors[index] || '#6366F1';
                                    const colorStyles = getColorStyles(color);
                                    return (
                                      <span 
                                        key={index}
                                        className="px-2 py-1 rounded-lg text-xs font-medium border"
                                        style={{
                                          backgroundColor: colorStyles.bg,
                                          borderColor: colorStyles.border,
                                          color: colorStyles.text
                                        }}
                                        title={task.assignedToOriginal}
                                      >
                                        {person}
                                        {isAssigned && person.includes(userName) && (
                                          <span className="ml-1 text-xs text-green-600">(You)</span>
                                        )}
                                      </span>
                                    );
                                  })
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
                                {task.remark 
                                  ? task.remark.split(' ').slice(0, 10).join(' ') + (task.remark.split(' ').length > 10 ? '...' : '')
                                  : "No remarks"
                                }
                                {task.remark && task.remark.split(' ').length > 10 && (
                                  <span className="text-xs text-slate-500 block mt-1">
                                    {task.remark.split(' ').length} words total
                                  </span>
                                )}
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

          {/* Pagination - Fixed with smart page range */}
{/* Pagination - Fixed with smart page range */}
{sortedTasks.length > 0 && (
  <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-600 font-medium">
          Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, sortedTasks.length)}</span> of <span className="font-bold text-slate-900">{sortedTasks.length}</span> tasks
          {hasActiveFilters && (
            <span className="text-blue-600 ml-2">
              (Filtered from {tasks.length} total)
            </span>
          )}
        </p>
        
        {/* Pagination Size Dropdown in Footer */}
        <div className="hidden sm:block">
          <Select
            options={paginationSizeOptions}
            value={currentPaginationSize}
            onChange={handlePaginationSizeChange}
            classNamePrefix="react-select"
            styles={paginationSizeStyles}
            isSearchable={false}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={goToPrevious} 
          disabled={currentPage === 1} 
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
            currentPage === 1 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>
        
        {/* Smart pagination with ellipsis (dot dot) */}
        <div className="flex items-center gap-1">
          {getPaginationRange().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <button 
                key={page} 
                onClick={() => goToPage(page)} 
                className={`min-w-8 h-8 px-2 rounded-lg font-medium transition-all ${
                  currentPage === page 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm" 
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        <button 
          onClick={goToNext} 
          disabled={currentPage === totalPages} 
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
            currentPage === totalPages 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
    
    {/* Mobile pagination size dropdown */}
    <div className="block sm:hidden mt-4">
      <Select
        options={paginationSizeOptions}
        value={currentPaginationSize}
        onChange={handlePaginationSizeChange}
        classNamePrefix="react-select"
        styles={paginationSizeStyles}
        isSearchable={false}
      />
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
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Client</h4>
                      <p className="text-slate-800 font-medium flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        {selectedTask.clientName || "No Client"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Assigned By</h4>
                      <p className="text-slate-800 font-medium flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: getColorStyles(selectedTask.assignedByColor).bg,
                            border: `1px solid ${getColorStyles(selectedTask.assignedByColor).border}`
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span style={{ color: getColorStyles(selectedTask.assignedByColor).text }}>
                          {selectedTask.assignedBy}
                        </span>
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
                        <div>
                          <span>{formatDate(selectedTask.deadline)}</span>
                          {selectedTask.time && (
                            <div className="text-sm mt-1">
                              {formatTimeTo12Hour(selectedTask.time)}
                            </div>
                          )}
                        </div>
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Assigned To</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
                          selectedTask.assignedTo.map((person, index) => {
                            const color = selectedTask.assignedToColors[index] || '#6366F1';
                            const colorStyles = getColorStyles(color);
                            return (
                              <span 
                                key={index}
                                className="px-3 py-1 rounded-lg text-sm font-medium border"
                                style={{
                                  backgroundColor: colorStyles.bg,
                                  borderColor: colorStyles.border,
                                  color: colorStyles.text
                                }}
                                title={selectedTask.assignedToOriginal}
                              >
                                {person}
                                {isUserAssignedToTask(selectedTask) && person.includes(userName) && (
                                  <span className="ml-1 text-xs text-green-600">(You)</span>
                                )}
                              </span>
                            );
                          })
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