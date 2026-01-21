import React, { useState, useEffect } from "react";
import { getCurrentUser } from "../../../utils/api";
import Swal from "sweetalert2";
import axios from "axios";

export default function AddItemTable() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    color: "#3B82F6", // Default blue color
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [usedColors, setUsedColors] = useState([]); // Store used colors from API
  
  const user = getCurrentUser();

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
    const fetchDepartment = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/department.php`,
          {
            params: { 
              'check_color': 'true'
            }, 
          }
        );
        
        const result = response.data;
        console.log('result=', result);
        
        if (result.status === 'success' && result.data && Array.isArray(result.data)) {
          // Extract color codes from the response
          const colorsInUse = result.data
            .map(item => item.color_code)
            .filter(color => color); // Filter out any null/undefined values
          
          setUsedColors(colorsInUse);
          console.log('Used colors:', colorsInUse);
          
          // If current selected color is already used, change it to first available color
          if (colorsInUse.includes(formData.color)) {
            const availableColor = colorOptions.find(color => !colorsInUse.includes(color));
            if (availableColor) {
              setFormData(prev => ({ ...prev, color: availableColor }));
            }
          }
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
      }
    };
    
    fetchDepartment();
  }, []);

  // Check if a color is already used
  const isColorUsed = (color) => usedColors.includes(color);

  // Get available colors
  const getAvailableColors = () => colorOptions.filter(color => !isColorUsed(color));

  // Function to get color status text
  const getColorStatus = (color) => {
    if (isColorUsed(color)) {
      return "Already used by another department";
    }
    return "Available";
  };

  // Function to get color opacity class
  const getColorOpacityClass = (color) => {
    if (isColorUsed(color)) {
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
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    // Validate color format
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!formData.color || !colorRegex.test(formData.color)) {
      newErrors.color = "Please select a valid color";
    } else if (isColorUsed(formData.color)) {
      newErrors.color = "This color is already used by another department";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFormData({ ...formData, active: checked });
  };

  const handleColorChange = (color) => {
    // Don't allow selection of used colors
    if (isColorUsed(color)) {
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
    // Only update if it's a valid hex color
    if (value.match(/^#[0-9A-F]{6}$/i) || value === "") {
      // Check if the manually entered color is already used
      if (isColorUsed(value) && value !== "") {
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
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Double-check if color is already used (in case of manual entry)
    if (isColorUsed(formData.color)) {
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
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("color", formData.color); // Add color to form data
      form.append("status", formData.active ? "active" : "inactive");

      console.log("Submitting form data:");
      for (let pair of form.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/department.php?id=${user?.id}`,
        {
          method: "POST",
          body: form,
        }
      );

      const result = await response.json();
      console.log("API Response:", result);

      if (result.status === "success") {
        Swal.fire({
          icon: 'success',
          title: 'Department added successfully!',
          text: result.message || 'Department added successfully!',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        // Add the new color to used colors list
        setUsedColors(prev => [...prev, formData.color]);
        
        // Reset form and select next available color
        const availableColors = getAvailableColors();
        const nextColor = availableColors.length > 0 ? availableColors[0] : "#3B82F6";
        
        setFormData({
          name: "",
          description: "",
          active: true,
          color: nextColor,
        });
        setErrors({});
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to add department",
          text: result.message || "Failed to add department",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33 !important"
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text: 'An error occurred while creating the project.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5">
      {/* Main Form Card */}
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              Add Department
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details to add a new department to the system</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Name Field */}
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
                  maxLength="50"
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
                  <span className="text-slate-500">{formData.name.length}/50 characters</span>
                  {formData.name.length >= 2 && (
                    <span className="text-green-600 font-medium">✓ Valid length</span>
                  )}
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Description
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.description 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all resize-none`}
                  placeholder="Enter department description"
                  maxLength="500"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{formData.description.length}/500 characters</span>
                  {formData.description.length >= 10 && (
                    <span className="text-green-600 font-medium">✓ Valid length</span>
                  )}
                </div>
              </div>

              {/* Color Picker Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Department Color
                  <span className="text-red-500">*</span>
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Color Preview and Picker */}
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-12 h-12 rounded-xl border-2 ${isColorUsed(formData.color) ? 'border-red-300' : 'border-slate-200'} shadow-sm cursor-pointer transition-transform hover:scale-105`}
                        style={{ backgroundColor: formData.color }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      >
                        <div className="w-full h-full rounded-lg flex items-center justify-center">
                          {isColorUsed(formData.color) && (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          name="color"
                          value={formData.color}
                          onChange={handleColorInputChange}
                          className={`w-32 px-3 py-2 rounded-lg border ${isColorUsed(formData.color) ? 'border-red-300' : 'border-slate-300'} text-sm font-mono focus:outline-none focus:ring-2 ${isColorUsed(formData.color) ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                          placeholder="#3B82F6"
                          maxLength="7"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </span>
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
                              {getAvailableColors().length} of {colorOptions.length} available
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-lg border ${isColorUsed(color) ? 'border-red-300' : 'border-slate-200'} ${getColorOpacityClass(color)} transition-transform relative`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange(color)}
                                title={`${color} - ${getColorStatus(color)}`}
                                disabled={isColorUsed(color)}
                              >
                                {isColorUsed(color) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/80 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                {formData.color === color && !isColorUsed(color) && (
                                  <div className="w-full h-full rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
                            <div 
                              className={`w-10 h-10 rounded-lg border ${isColorUsed(formData.color) ? 'border-red-300' : 'border-slate-300'}`}
                              style={{ backgroundColor: formData.color }}
                            />
                            <div>
                              <span className="text-sm font-mono text-slate-600 block">{formData.color}</span>
                              <span className={`text-xs ${isColorUsed(formData.color) ? 'text-red-600' : 'text-green-600'}`}>
                                {getColorStatus(formData.color)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Already Used</span>
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
                  Colors already used by other departments cannot be selected.
                </p>
              </div>

              {/* Active Status */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                 <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-600 bg-gradient-to-r from-blue-300 to-indigo-300 transition-all ring-2 ring-offset-1 ring-blue-300 peer-checked:ring-blue-600"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-md"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                    Active Status
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
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
                    Adding Department...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Department
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