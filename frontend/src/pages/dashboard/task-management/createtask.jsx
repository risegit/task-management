import React, { useState, useEffect } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";

export default function CreateTask() {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [allProjects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  const [assignedUsersDetails, setAssignedUsersDetails] = useState([]); // Store user details including department

  const user = getCurrentUser();
  const userId = user?.id;

  // Priority options for dropdown
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
    graphicType: "", // New field for graphic type
  });

  const graphicOptions = [
    { value: "Logo Design", label: "Logo Design" },
    { value: "Flyer Design", label: "Flyer Design" },
    { value: "Brochure Design", label: "Brochure Design" },
    { value: "Social Media Graphics", label: "Social Media Graphics" },
    { value: "Banner Design", label: "Banner Design" },
    { value: "Infographic Design", label: "Infographic Design" },
    { value: "Packaging Design", label: "Packaging Design" },
    { value: "Icon Design", label: "Icon Design" },
    { value: "Post", label: "Post" },
    { value: "Reels", label: "Reels" },
  ];

  // Check if any assigned user is from Graphic Design department
  const hasGraphicDesignMember = () => {
    if (taskData.assignedTo.length === 0) return false;
    
    // Get the IDs of selected users
    const selectedUserIds = taskData.assignedTo.map(user => user.value);
    
    // Check if any selected user is from Graphic Design department
    return assignedUsersDetails.some(user => 
      selectedUserIds.includes(user.emp_id || user.id) && 
      user.dept_name === "Graphic Design / Video Editor"
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (field, selected) => {
    setTaskData({ ...taskData, [field]: selected });
    
    // Clear graphicType if no graphic design members are selected anymore
    if (field === "assignedTo" && !hasGraphicDesignMember() && taskData.graphicType) {
      setTaskData(prev => ({ ...prev, graphicType: "" }));
    }
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Updated validation function to include graphicType
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

    // Graphic Type validation (only if graphic design member is selected)
    if (hasGraphicDesignMember() && !taskData.graphicType) {
      newErrors.graphicType = "Graphic type is required for Graphic Design members";
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

    // Remarks validation
    if (taskData.remarks && taskData.remarks.length > 500) {
      newErrors.remarks = "Remarks cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch data from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: {
              id: user?.id,
              user_code: user?.user_code,
            }
          }
        );

        const data = response.data;
        console.log("API response:", data);

        // Projects dropdown
        const projects = data.data
          .filter(user => user.emp_id !== userId || user.id !== userId)
          .map(user => ({
            value: user.emp_id || user.id,
            label: user.name
          }));

        setProjects(projects);

      } catch (error) {
        console.error(
          "Error fetching team members:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch users when project changes
  useEffect(() => {
    if (!selectedProject) {
      setAssignedTo([]);
      setAssignedUsersDetails([]);
      return;
    }

    const fetchProjectUsers = async () => {
      if (!selectedProject) {
        setAssignedTo([]);
        setAssignedUsersDetails([]);
        return;
      }

      try {
        setLoadingAssignedUsers(true);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { project_id: selectedProject.value }
          }
        );

        const users = response.data?.data || [];
        
        // Store user details including department
        setAssignedUsersDetails(users);
        
        // Create options for dropdown
        const assignedUsers = users
          .map(user => ({
            value: user.emp_id || user.id,
            label: user.name + (user.is_poc == 1 ? " (POC)" : ""),
            department: user.dept_name // Include department in option
          }));

        setAssignedTo(assignedUsers);
        
        // Filter out any previously selected users not in new list
        const currentAssignedUserIds = taskData.assignedTo.map(u => u.value);
        const availableUserIds = assignedUsers.map(u => u.value);
        
        const filteredAssignedTo = taskData.assignedTo.filter(user => 
          availableUserIds.includes(user.value)
        );
        
        if (filteredAssignedTo.length !== taskData.assignedTo.length) {
          setTaskData(prev => ({ ...prev, assignedTo: filteredAssignedTo }));
        }

        // Clear graphicType if graphic design members are no longer available
        if (!hasGraphicDesignMember() && taskData.graphicType) {
          setTaskData(prev => ({ ...prev, graphicType: "" }));
        }

      } catch (error) {
        console.error("Error fetching project team members:", error);
        setAssignedTo([]);
        setAssignedUsersDetails([]);
        setTaskData(prev => ({ ...prev, assignedTo: [] }));
        
        Swal.fire({
          icon: 'error',
          title: 'Failed to load team members',
          text: 'Could not fetch team members for this project',
          timer: 3000,
          showConfirmButton: false
        });
      } finally {
        setLoadingAssignedUsers(false);
      }
    };

    fetchProjectUsers();
  }, [selectedProject, userId]);

  const handleSubmit = async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: firstError,
          confirmButtonText: "OK",
          confirmButtonColor: "#d33 !important"
        });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();

      const assignedToPayload = taskData.assignedTo.map(selectedUser => {
        const userDetails = assignedUsersDetails.find(
          u => (u.emp_id || u.id) === selectedUser.value
        );

        return {
          user_id: selectedUser.value,
          dept_name: userDetails?.dept_name || null
        };
      });

      form.append("project_id", selectedProject.value);
      form.append("task_name", taskData.name);
      form.append("assignedBy", userId);
      form.append("assignedTo", JSON.stringify(assignedToPayload));
      form.append("deadline", taskData.deadline);
      form.append("remarks", taskData.remarks);
      form.append("priority", taskData.priority.value);
      
      // Add graphicType if it exists
      if (taskData.graphicType) {
        form.append("graphic_type", taskData.graphicType.value);
      }

      console.log("Submitting form data...");
      for (let pair of form.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/task-management.php`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: {
              id: user?.id,
              user_code: user?.user_code,
            }
        }
      );

      const result = response.data;
      console.log("API result:", result);

      if (result.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Task Created Successfully!",
          text: result.message || "Task has been created successfully.",
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
          graphicType: "",
        });
        setErrors({});
        setSelectedProject(null);
        setAssignedUsersDetails([]);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Create Task",
          text: result.message || "Failed to create task",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33 !important"
        });
      }
    } catch (error) {
      console.error(
        "Submit Error:",
        error.response?.data || error.message
      );

      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "An error occurred while creating the task.",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33 !important"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
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

          <div className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Select Project */}
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
                          ? "No other team members available" 
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
                        : "No other team members available"
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
                      {loadingAssignedUsers 
                        ? "Fetching team members..." 
                        : taskData.assignedTo.length === 0 
                          ? "Select team members (current user excluded)" 
                          : `${taskData.assignedTo.length} team member(s) selected`}
                    </span>
                    {allAssignedTo.length > 0 && (
                      <span>{allAssignedTo.length} team member(s) available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Conditional Graphic Type Field */}
              {hasGraphicDesignMember() && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task Name (half width when graphic type is shown) */}
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

                  {/* Graphic Type Dropdown */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      For Graphic (Creative Type)
                      <span className="text-red-500">*</span>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                        Graphic Design Only
                      </span>
                    </label>
                    <Select
                      options={graphicOptions}
                      value={taskData.graphicType}
                      onChange={(selected) => handleSelectChange("graphicType", selected)}
                      classNamePrefix="react-select"
                      className={`react-select-container ${errors.graphicType ? 'error' : ''}`}
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
                          border: `2px solid ${errors.graphicType ? '#fca5a5' : state.isFocused ? '#8b5cf6' : '#e2e8f0'}`,
                          borderRadius: '0.75rem',
                          padding: '8px 4px',
                          backgroundColor: errors.graphicType ? '#fef2f2' : 'white',
                          minHeight: '52px',
                          boxShadow: state.isFocused ? (errors.graphicType ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(139, 92, 246, 0.1)') : 'none',
                          "&:hover": {
                            borderColor: errors.graphicType ? '#f87171' : '#94a3b8',
                          },
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: '#94a3b8',
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#7c3aed',
                          fontWeight: '500',
                        }),
                      }}
                      placeholder="Select graphic type..."
                    />
                    {errors.graphicType && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.graphicType}
                      </p>
                    )}
                    <p className="text-xs text-purple-600">
                      Only shown when Graphic Design members are selected
                    </p>
                  </div>
                </div>
              )}

              {/* Regular Task Name (full width when no graphic type) */}
              {!hasGraphicDesignMember() && (
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
              )}

              {/* Second Row: Priority and Deadline */}
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
                    priority: "",
                    graphicType: "",
                  });
                  setErrors({});
                  setSelectedProject(null);
                  setAssignedUsersDetails([]);
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