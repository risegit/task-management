import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import Select from "react-select";
import { toast } from 'react-toastify';
import Swal from "sweetalert2";

export default function CreateTask() {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const [taskData, setTaskData] = useState({
    name: "",
    assignedBy: null,
    assignedTo: [],
    deadline: "",
    remarks: "",
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
  const validateForm = () => {
    const newErrors = {};

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

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  const validateField = (field) => {
    let error = "";

    switch (field) {
      case "name":
        if (!taskData.name.trim()) {
          error = "Task name is required";
        } else if (taskData.name.trim().length < 3) {
          error = "Task name must be at least 3 characters";
        } else if (taskData.name.trim().length > 100) {
          error = "Task name cannot exceed 100 characters";
        }
        break;

      case "assignedTo":
        if (taskData.assignedTo.length === 0) {
          error = "Please select at least one assignee";
        }
        break;

      case "deadline":
        if (!taskData.deadline) {
          error = "Deadline is required";
        } else {
          const selectedDate = new Date(taskData.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate < today) {
            error = "Deadline cannot be in the past";
          }
        }
        break;

      case "remarks":
        if (taskData.remarks && taskData.remarks.length > 500) {
          error = "Remarks cannot exceed 500 characters";
        }
        break;

      default:
        break;
    }

    setErrors({ ...errors, [field]: error });
  };

  // Helper function for input styling
  const getInputClassName = (fieldName) => {
    const baseClasses = "w-full px-4 py-3 rounded-xl border-2 focus:ring-4 outline-none transition-all";
    
    if (errors[fieldName] && touched[fieldName]) {
      return `${baseClasses} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100`;
    }
    
    return `${baseClasses} border-slate-200 focus:border-blue-500 focus:ring-blue-100`;
  };

  // Check if form is valid for button enabling
  const isFormValid = () => {
    const hasErrors = Object.values(errors).some(error => error && error.trim() !== "");
    return !hasErrors;
  };

  // 🔹 Fetch data from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-management.php`);
        const data = await response.json();

        console.log("API response:", data);

        const assignedToUsers = data.data
          .filter(user => user.id !== userId)
          .map(user => ({
            value: user.id,
            label: user.name
          }));

        setAssignedTo(assignedToUsers);

      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId]);

  const handleSubmit = async () => {
    const allTouched = {
      name: true,
      assignedTo: true,
      deadline: true,
      remarks: true,
    };
    setTouched(allTouched);

    const isValid = validateForm();
    
    if (!isValid) {
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

    setLoading(true);

    try {
      const form = new FormData();

      form.append("task_name", taskData.name);
      form.append("assignedBy", userId);
      form.append(
        "assignedTo",
        JSON.stringify(taskData.assignedTo.map(u => u.value))
      );
      form.append("deadline", taskData.deadline);
      form.append("remarks", taskData.remarks);

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
          assignedBy: null,
          assignedTo: [],
          deadline: "",
          remarks: "",
        });
        setErrors({});
        setTouched({});
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
      setLoading(false);
    }
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H9a4 4 0 014 4v6a4 4 0 004 4h.5M21 21l-5.2-5.2" />
                </svg>
              </div>
              Create New Task
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details to create a new task for your team</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
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
                  onBlur={() => handleBlur("name")}
                  className={getInputClassName("name")}
                  placeholder="Enter task name"
                  maxLength="100"
                />
                {errors.name && touched.name && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{taskData.name.length}/100 characters</span>
                  {taskData.name.length >= 3 && taskData.name.length <= 100 && (
                    <span className="text-green-600 font-medium">✓ Valid length</span>
                  )}
                </div>
              </div>

              {/* Grid Layout for Assigned To and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onBlur={() => handleBlur("assignedTo")}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        borderColor: errors.assignedTo && touched.assignedTo ? "#ef4444" : "#d1d5db",
                        borderRadius: "0.75rem",
                        padding: "0.375rem",
                        minHeight: "48px",
                        borderWidth: "2px",
                        backgroundColor: errors.assignedTo && touched.assignedTo ? "#fef2f2" : "white",
                        boxShadow: state.isFocused ? (errors.assignedTo && touched.assignedTo ? "0 0 0 4px rgba(239, 68, 68, 0.1)" : "0 0 0 4px rgba(59, 130, 246, 0.1)") : "none",
                        "&:hover": {
                          borderColor: errors.assignedTo && touched.assignedTo ? "#ef4444" : "#9ca3af",
                        },
                      }),
                      menu: (provided) => ({
                        ...provided,
                        borderRadius: "0.75rem",
                        border: "2px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        zIndex: 9999,
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f1f5f9" : "white",
                        color: state.isSelected ? "white" : "#1e293b",
                        padding: "12px 16px",
                        fontSize: "0.875rem",
                        "&:active": {
                          backgroundColor: "#3b82f6",
                          color: "white",
                        },
                      }),
                      multiValue: (provided) => ({
                        ...provided,
                        backgroundColor: "#e0f2fe",
                        borderRadius: "0.5rem",
                      }),
                      multiValueLabel: (provided) => ({
                        ...provided,
                        color: "#0369a1",
                        fontWeight: "500",
                      }),
                      multiValueRemove: (provided) => ({
                        ...provided,
                        color: "#0369a1",
                        "&:hover": {
                          backgroundColor: "#bae6fd",
                          color: "#0c4a6e",
                        },
                      }),
                    }}
                    placeholder="Select assignees..."
                    isLoading={loading}
                    loadingMessage={() => "Loading users..."}
                  />
                  {errors.assignedTo && touched.assignedTo && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.assignedTo}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{taskData.assignedTo.length} user(s) selected</span>
                    {taskData.assignedTo.length > 0 && (
                      <span className="text-green-600 font-medium">✓ Assigned</span>
                    )}
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
                      onBlur={() => handleBlur("deadline")}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 pl-12 rounded-xl border-2 focus:ring-4 outline-none transition-all ${
                        errors.deadline && touched.deadline 
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className={`w-5 h-5 ${errors.deadline && touched.deadline ? 'text-red-500' : 'text-blue-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                  {errors.deadline && touched.deadline ? (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.deadline}
                    </p>
                  ) : (
                    <div className="text-xs text-slate-500">
                      {taskData.deadline ? `Selected: ${taskData.deadline}` : "Select a future date"}
                    </div>
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
                  onBlur={() => handleBlur("remarks")}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 outline-none transition-all resize-none ${
                    errors.remarks && touched.remarks 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                  placeholder="Enter any additional remarks (optional)"
                  maxLength="500"
                />
                {errors.remarks && touched.remarks && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.remarks}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{taskData.remarks.length}/500 characters</span>
                  {taskData.remarks.length > 0 && taskData.remarks.length <= 500 && (
                    <span className="text-green-600 font-medium">✓ Valid</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all border-2 border-slate-200"
                onClick={() => {
                  setTaskData({
                    name: "",
                    assignedBy: null,
                    assignedTo: [],
                    deadline: "",
                    remarks: "",
                  });
                  setErrors({});
                  setTouched({});
                }}
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid() || loading}
                className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center gap-2 ${
                  !isFormValid() || loading
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-lg hover:shadow-blue-200 hover:scale-105'
                }`}
              >
                {loading ? (
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