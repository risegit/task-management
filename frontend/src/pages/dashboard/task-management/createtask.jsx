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

  // Sample options for dropdowns
  const assignedByOptions = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "teamlead", label: "Team Lead" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (field, selected) => {
    setTaskData({ ...taskData, [field]: selected });
    
    // Clear error when user selects something
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

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
    const baseClasses = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none";
    
    if (errors[fieldName] && touched[fieldName]) {
      return `${baseClasses} border-red-500`;
    }
    
    return baseClasses;
  };

  const getSelectClassName = (fieldName) => {
    if (errors[fieldName] && touched[fieldName]) {
      return "react-select-container error";
    }
    return "react-select-container";
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

        // Assigned To = ALL users EXCEPT logged-in user
        const assignedToUsers = data.data
          .filter(user => user.id !== userId)   // ⬅️ remove logged-in user
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
    // Mark all fields as touched
    const allTouched = {
      name: true,
      assignedTo: true,
      deadline: true,
      remarks: true,
    };
    setTouched(allTouched);

    // Validate form
    const isValid = validateForm();
    
    if (!isValid) {
      // Show first error
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
      form.append("assignedBy", userId);  // logged-in user
      form.append(
        "assignedTo",
        JSON.stringify(taskData.assignedTo.map(u => u.value))
      );
      form.append("deadline", taskData.deadline);
      form.append("remarks", taskData.remarks);

      // 🔍 EXACT CONSOLE OUTPUT LIKE YOU WANT
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
        // Show SweetAlert2 success message
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
          assignedBy: null,
          assignedTo: [],
          deadline: "",
          remarks: "",
        });
        setErrors({});
        setTouched({});
      } else {
        // Show SweetAlert2 error for API failure
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
      // Show SweetAlert2 error for network/exception
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
    <div className="w-full min-h-screen flex justify-center py-10 bg-gray-50">
      <div className="w-full bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6">Create Task</h2>

        {/* Task Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Task Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={taskData.name}
            onChange={handleChange}
            onBlur={() => handleBlur("name")}
            className={getInputClassName("name")}
            placeholder="Enter task name"
          />
          {errors.name && touched.name && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>Required field</span>
            <span>{taskData.name.length}/100 characters</span>
          </div>
        </div>

        {/* Assigned By / Assigned To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Assigned To <span className="text-red-500">*</span>
            </label>
            <Select
              isMulti
              options={allAssignedTo}
              value={taskData.assignedTo}
              onChange={(selected) => handleSelectChange("assignedTo", selected)}
              onBlur={() => handleBlur("assignedTo")}
              classNamePrefix="react-select"
              className={getSelectClassName("assignedTo")}
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                control: (provided, state) => ({
                  ...provided,
                  borderColor: errors.assignedTo && touched.assignedTo ? "#ef4444" : "#d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.125rem",
                  boxShadow: state.isFocused ? (errors.assignedTo && touched.assignedTo ? "0 0 0 2px rgba(239, 68, 68, 0.2)" : "0 0 0 2px rgba(59, 130, 246, 0.2)") : "none",
                  "&:hover": {
                    borderColor: errors.assignedTo && touched.assignedTo ? "#ef4444" : "#9ca3af",
                  },
                }),
              }}
              placeholder="Select multiple..."
            />
            {errors.assignedTo && touched.assignedTo && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.assignedTo}
              </p>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {taskData.assignedTo.length} user(s) selected
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Deadline <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="deadline"
                value={taskData.deadline}
                onChange={handleChange}
                onBlur={() => handleBlur("deadline")}
                min={new Date().toISOString().split('T')[0]}
                className={getInputClassName("deadline") + " pl-10"}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className={`w-5 h-5 ${errors.deadline && touched.deadline ? 'text-red-500' : 'text-blue-500'}`}
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
            {errors.deadline && touched.deadline ? (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.deadline}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
            )}
          </div>
        </div>

        {/* Remarks */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Remarks
          </label>
          <textarea
            name="remarks"
            rows="3"
            value={taskData.remarks}
            onChange={handleChange}
            onBlur={() => handleBlur("remarks")}
            className={getInputClassName("remarks")}
            placeholder="Enter any additional remarks (optional)"
          ></textarea>
          {errors.remarks && touched.remarks && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.remarks}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-1 flex justify-end">
            <span className={taskData.remarks.length > 500 ? "text-red-500" : ""}>
              {taskData.remarks.length}/500 characters
            </span>
          </div>
        </div>

        {/* Button - Small, Right Bottom Corner */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}