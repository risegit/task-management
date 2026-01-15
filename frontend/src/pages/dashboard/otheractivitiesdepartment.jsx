import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import { getCurrentUser } from "@/utils/api";

export default function OthersActivitiesDepartment() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: true,
  });

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Keep projects state for compatibility
  const [allProjects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "ascending",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const user = getCurrentUser();

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!user?.id || !user?.user_code) return;

      setLoadingDepartments(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/department.php`,
          {
            params: {
              user_id: user.id,
              user_code: user.user_code
            }
          }
        );

        const result = response.data;
        console.log("Departments API Response:", result);

        if (result.status === "success") {
          // Adjust based on your actual API response structure
          const departmentsData = result.departments || result.data || [];

          const normalizedDepartments = departmentsData.map((dept) => ({
            id: dept.department_id || dept.id || dept.client_id,
            department_name: dept.department_name || dept.name || dept.client_name || "Unnamed Department",
            description: dept.description || "",
            status: dept.status || "active"
          }));

          setDepartments(normalizedDepartments);
        } else {
          console.warn("No departments found in response:", result);
          setDepartments([]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load departments",
          text: "Please try refreshing the page",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33 !important"
        });
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [user?.id, user?.user_code]);

  // Fetch projects if needed (keeping for compatibility)
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id || !user?.user_code) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/project.php`,
          {
            params: {
              user_id: user.id,
              user_code: user.user_code
            }
          }
        );

        const result = response.data;
        console.log("Projects API Response:", result);
        setLoadingProjects(true);
        if (result.status === "success") {
          const projects = result.project
            .map(user => ({
              value: user.client_id || user.id,
              label: user.client_name
            }));

          setProjects(projects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Axios Error:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user?.id, user?.user_code]);

  const validate = () => {
    let newErrors = {};

    if (!selectedDepartment) {
      newErrors.department = "Please select a department";
    }

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
    const { checked } = e.target;
    setFormData({ ...formData, status: checked });
  };

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setSelectedDepartment(value);

    // Clear department error on selection
    if (errors.department) {
      setErrors({ ...errors, department: "" });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("department_id", selectedDepartment);
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("status", formData.status ? "active" : "inactive");

      // Add user info
      if (user?.id) {
        form.append("created_by", user.id);
        form.append("created_by_code", user.user_code);
      }

      // Debug: log form data before sending
      console.log("Submitting form data:");
      for (let pair of form.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/announcement.php?id=${user?.id}`,
        form
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Announcement added successfully!",
          text: result.message || "Announcement added successfully!",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        // Reset form
        setFormData({
          name: "",
          description: "",
          status: true,
        });
        setSelectedDepartment("");
        setErrors({});
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to add announcement!",
          text: result.message || "Failed to add announcement!",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33 !important"
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire({
        icon: "error",
        title: "Something went wrong while submitting",
        text: error.message || "Something went wrong while submitting",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33 !important"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter departments based on search (if you want search functionality)
  // const filteredProjects = projects.filter(project =>
  //   project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   project.poc.some(poc => poc.toLowerCase().includes(searchQuery.toLowerCase())) ||
  //   project.status.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              Create Department Announcement
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details to create a new announcement for a department</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Department Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Select Project
                  <span className="text-red-500">*</span>
                </label>

                <Select
                  options={allProjects}
                  onChange={setSelectedProject}
                  value={selectedProject}
                  classNamePrefix="react-select"
                  placeholder="Select Project..."
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
                  isLoading={loadingProjects}
                  isDisabled={loadingProjects}
                />

                {errors.department && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.department}
                  </p>
                )}

                {loadingProjects && (
                  <p className="text-blue-600 text-sm flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading departments...
                  </p>
                )}

                {!loadingProjects && departments.length === 0 && (
                  <p className="text-yellow-600 text-sm">
                    No departments found. Please contact administrator.
                  </p>
                )}

                {/* {selectedDepartment && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Selected:</span> {
                        departments.find(d => d.id.toString() === selectedDepartment.toString())?.department_name ||
                        "Unknown Department"
                      }
                    </p>
                  </div>
                )} */}

                {/* {selectedDepartment && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Selected:</span> {
                        departments.find(d => d.id.toString() === selectedDepartment.toString())?.department_name ||
                        "Unknown Department"
                      }
                    </p>
                  </div>
                )} */}

              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Announcement Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${errors.name
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    } focus:ring-4 outline-none transition-all`}
                  placeholder="Enter announcement name"
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
                  className={`w-full px-4 py-3 rounded-xl border-2 ${errors.description
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    } focus:ring-4 outline-none transition-all resize-none`}
                  placeholder="Enter announcement description"
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

              {/* Active Status */}
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
                </label>
                <p className="text-slate-500 text-sm mt-2 ml-14">
                  {formData.status
                    ? "Announcement will be active and visible to all users"
                    : "Announcement will be inactive and hidden from users"
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || loadingDepartments}
                className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center gap-2 ${isSubmitting || loadingDepartments
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
                    Creating Announcement...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Announce Now!
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