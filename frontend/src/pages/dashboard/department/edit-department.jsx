import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { getCurrentUser } from "../../../utils/api";

export default function EditDepartment() {
  const { id } = useParams(); // Get department ID from URL
  const user = getCurrentUser();
  const user_id = user?.id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "",
    status: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [usedColors, setUsedColors] = useState([]); // Store used colors from API
  const [currentDepartmentColor, setCurrentDepartmentColor] = useState(""); // Store current department's original color

  // Predefined color options
  const colorOptions = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#64748B", // Slate
  ];

  useEffect(() => {
    if (!id) return;

    const fetchDepartment = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/department.php`,
          {
            params: { id }, 
          }
        );
        
        const result = response.data;

        if (result.status === "success") {
          // Extract used colors from colorCodeData
          if (result.colorCodeData && Array.isArray(result.colorCodeData)) {
            const colorsInUse = result.colorCodeData
              .map(item => item.color_code)
              .filter(color => color && color !== "");
            setUsedColors(colorsInUse);
          }

          if (result.data?.length > 0) {
            const departmentData = result.data[0];
            const currentColor = departmentData.color_code || "";
            
            setCurrentDepartmentColor(currentColor);
            
            setFormData({
              name: departmentData.name || "",
              description: departmentData.description || "",
              color: currentColor,
              status: departmentData.status === "active" || departmentData.status === 1,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Department Not Found',
              text: 'The department you are trying to edit does not exist.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#d33',
            });
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'Failed to fetch department data.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#d33',
          });
        }
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

  // Check if a color is used by other departments (excluding current department)
  const isColorUsedByOthers = (color) => {
    if (!color || color === "") return false; // Empty color is not considered used
    if (color === currentDepartmentColor) {
      return false; // Current department's color is always allowed
    }
    return usedColors.includes(color);
  };

  // Check if current color is available (either it's the current department's color or not used by others)
  const isCurrentColorAvailable = (color) => {
    if (!color || color === "") return true; // Empty color is always available
    return color === currentDepartmentColor || !usedColors.includes(color);
  };

  // Get color status text
  const getColorStatus = (color) => {
    if (!color || color === "") {
      return "No color selected (optional)";
    }
    if (color === currentDepartmentColor) {
      return "Current department color";
    }
    if (isColorUsedByOthers(color)) {
      return "Already used by another department";
    }
    return "Available";
  };

  // Get color opacity and cursor class
  const getColorOpacityClass = (color) => {
    if (isColorUsedByOthers(color)) {
      return "opacity-40 cursor-not-allowed";
    }
    return "hover:scale-110 cursor-pointer";
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name cannot exceed 50 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    // Color is optional, but if provided, validate format and availability
    if (formData.color && formData.color !== "") {
      const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
      if (!colorRegex.test(formData.color)) {
        newErrors.color = "Please enter a valid hex color code";
      } else if (!isCurrentColorAvailable(formData.color)) {
        newErrors.color = "This color is already used by another department";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error on typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      status: e.target.checked,
    });
  };

  const handleColorChange = (color) => {
    // Don't allow selection of colors used by other departments
    if (isColorUsedByOthers(color)) {
      Swal.fire({
        icon: 'warning',
        title: 'Color Already Used',
        text: 'This color is already used by another department. Please select a different color.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }
    
    setFormData({ ...formData, color });
    setShowColorPicker(false);
    
    if (errors.color) {
      setErrors({ ...errors, color: "" });
    }
  };

  const handleColorInputChange = (e) => {
    const value = e.target.value;
    // Allow empty value (to clear color)
    if (value === "") {
      setFormData({ ...formData, color: "" });
      if (errors.color) {
        setErrors({ ...errors, color: "" });
      }
      return;
    }
    
    // Only update if it's a valid hex color
    if (value.match(/^#[0-9A-F]{6}$/i)) {
      // Check if the manually entered color is already used by other departments
      if (isColorUsedByOthers(value) && value !== currentDepartmentColor) {
        Swal.fire({
          icon: 'warning',
          title: 'Color Already Used',
          text: 'This color is already used by another department. Please select a different color.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f59e0b',
        });
        return;
      }
      
      setFormData({ ...formData, color: value });
      
      if (errors.color) {
        setErrors({ ...errors, color: "" });
      }
    } else if (value.length <= 7) {
      // Allow partial input (e.g., "#3B8")
      setFormData({ ...formData, color: value });
    }
  };

  const handleRemoveColor = () => {
    setFormData({ ...formData, color: "" });
    if (errors.color) {
      setErrors({ ...errors, color: "" });
    }
  };

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

    // Double-check if color is already used by other departments
    if (formData.color && formData.color !== "" && !isCurrentColorAvailable(formData.color)) {
      Swal.fire({
        icon: 'error',
        title: 'Color Already Used',
        text: 'This color is already used by another department. Please select a different color.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API submission
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Only append color if it has a value
        if (key === 'color' && (!value || value === "")) {
          form.append(key, ""); // Send empty string to clear color
        } else if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });

      form.append('id', id);
      form.append('_method', 'PUT');
      
      // Send PUT request to update department
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/department.php?id=${user_id}`, {
        method: "POST",
        body: form,
      });

      const result = await response.json();
      
      if (result.status === "success") {
        Swal.fire({
          icon: 'success',
          title: 'Department Updated Successfully!',
          text: 'Department has been updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        });
        
        // Update current department color if it was changed or removed
        setCurrentDepartmentColor(formData.color || "");
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: result.message || "Failed to update department",
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error("Update Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text: 'An error occurred while updating the department.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
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
          <p className="mt-6 text-slate-600 font-medium">Loading department...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while we fetch the department data</p>
        </div>
      </div>
    );
  }

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
              Edit Department
            </h2>
            <p className="text-blue-100 mt-2">Update the details for department ID: <span className="font-semibold">{id}</span></p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Department Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.name 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all`}
                  placeholder="Enter department name"
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
                  <span className={formData.name.length > 50 ? "text-red-500" : "text-slate-500"}>
                    {formData.name.length}/50 characters
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Description
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 resize-none ${
                    errors.description 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all`}
                  placeholder="Enter department description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description}
                  </p>
                )}
                <div className="flex items-center justify-end text-xs">
                  <span className={formData.description.length > 500 ? "text-red-500" : "text-slate-500"}>
                    {formData.description.length}/500 characters
                  </span>
                </div>
              </div>

              {/* Color Picker Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Department Color
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Color Preview and Picker */}
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      {formData.color ? (
                        <div 
                          className={`w-12 h-12 rounded-xl border-2 ${!isCurrentColorAvailable(formData.color) ? 'border-red-300' : 'border-slate-200'} shadow-sm cursor-pointer transition-transform hover:scale-105`}
                          style={{ backgroundColor: formData.color }}
                          onClick={() => setShowColorPicker(!showColorPicker)}
                        >
                          <div className="w-full h-full rounded-lg flex items-center justify-center">
                            {!isCurrentColorAvailable(formData.color) && formData.color !== currentDepartmentColor && (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                            {formData.color === currentDepartmentColor && (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 shadow-sm cursor-pointer transition-transform hover:scale-105 flex items-center justify-center"
                          onClick={() => setShowColorPicker(!showColorPicker)}
                        >
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="relative flex items-center gap-2">
                        <input
                          type="text"
                          name="color"
                          value={formData.color}
                          onChange={handleColorInputChange}
                          className={`w-32 px-3 py-2 rounded-lg border ${!isCurrentColorAvailable(formData.color) ? 'border-red-300' : 'border-slate-300'} text-sm font-mono focus:outline-none focus:ring-2 ${!isCurrentColorAvailable(formData.color) ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                          placeholder="#3B82F6 or empty"
                          maxLength="7"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </span>
                        
                        {formData.color && (
                          <button
                            type="button"
                            onClick={handleRemoveColor}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            title="Remove color"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        {showColorPicker ? "Hide Colors" : "Choose Color"}
                      </button>
                    </div>

                    {/* Color Picker Dropdown */}
                    {showColorPicker && (
                      <div className="absolute z-10 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 w-80">
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-slate-700">Suggested Colors</h4>
                            <span className="text-xs text-slate-500">
                              {usedColors.length} colors in use
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            <button
                              type="button"
                              className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 hover:scale-110 cursor-pointer transition-transform flex items-center justify-center"
                              onClick={() => handleColorChange("")}
                              title="No color"
                            >
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-lg border ${isColorUsedByOthers(color) ? 'border-red-300' : 'border-slate-200'} ${getColorOpacityClass(color)} transition-transform relative`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange(color)}
                                title={`${color} - ${getColorStatus(color)}`}
                                disabled={isColorUsedByOthers(color)}
                              >
                                {isColorUsedByOthers(color) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/80 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                {formData.color === color && !isColorUsedByOthers(color) && (
                                  <div className="w-full h-full rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                {color === currentDepartmentColor && formData.color !== color && (
                                  <div className="w-full h-full rounded-lg flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Color</h4>
                          <div className="flex items-center gap-3">
                            {formData.color ? (
                              <>
                                <div 
                                  className={`w-10 h-10 rounded-lg border ${!isCurrentColorAvailable(formData.color) ? 'border-red-300' : formData.color === currentDepartmentColor ? 'border-green-500' : 'border-slate-300'}`}
                                  style={{ backgroundColor: formData.color }}
                                />
                                <div>
                                  <span className="text-sm font-mono text-slate-600 block">{formData.color}</span>
                                  <span className={`text-xs ${!isCurrentColorAvailable(formData.color) ? 'text-red-600' : formData.color === currentDepartmentColor ? 'text-green-600' : 'text-blue-600'}`}>
                                    {getColorStatus(formData.color)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-sm font-mono text-slate-600 block">No color selected</span>
                                  <span className="text-xs text-slate-500">
                                    {getColorStatus("")}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Current Department</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Used by Others</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {errors.color && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.color}
                  </p>
                )}
                
                <p className="text-slate-500 text-xs mt-2">
                  This color will be used to identify the department in charts, labels, and UI elements. 
                  Colors already used by other departments cannot be selected, but you can keep your current color.
                  <span className="block mt-1 text-blue-600">This field is optional - you can leave it empty or remove the color.</span>
                </p>
              </div>

              {/* Status */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-600 bg-gradient-to-r from-blue-300 to-indigo-300 transition-all ring-2 ring-offset-1 ring-blue-300 peer-checked:ring-blue-600"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-md"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                    Active Status
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    {formData.status ? "Department is active" : "Department is inactive"}
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                onClick={() => navigate("/dashboard/department/manage-department")}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Department
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