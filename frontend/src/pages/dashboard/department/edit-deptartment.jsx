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
    status: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (result.status === "success" && result.data?.length > 0) {
          const departmentData = result.data[0];

          setFormData({
            name: departmentData.name || "",
            description: departmentData.description || "",
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
      // Prepare data for API submission
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) form.append(key, value);
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
        
        // Navigate back after success
        // setTimeout(() => {
        //   navigate("/dashboard/department/manage");
        // }, 2000);
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
      {/* Header */}

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
                onClick={() => navigate("/dashboard/department/managedept")}
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