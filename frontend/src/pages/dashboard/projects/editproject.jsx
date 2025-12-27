import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from "axios";
import Swal from "sweetalert2";

const ProjectForm = () => {
  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    poc: null,
    otherEmployees: [],
    startDate: '',
    status: 'Active'
  });

  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Errors state
  const [errors, setErrors] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchEMP = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/emp.php`
        );

        console.log("EMP API:", response.data);

        if (response.data?.data) {
           const formattedEmployees = response.data.data.map(emp => ({
            value: emp.id,
            label: `${emp.name} (${emp.role})`
          }));
          setEmployees(formattedEmployees);
          setFilteredEmployees(formattedEmployees);
        } else {
          alert("No employees found");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        alert("Something went wrong while fetching employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEMP();
  }, []);

  // Update filtered employees when POC selection changes
  useEffect(() => {
    if (formData.poc && formData.poc.value) {
      const pocValue = formData.poc.value;

      // Remove POC from Other Employees options
      const availableEmployees = employees.filter(
        emp => emp.value !== pocValue
      );
      setFilteredEmployees(availableEmployees);

      // Remove POC from already selected Other Employees
      const cleanedOtherEmployees = formData.otherEmployees.filter(
        emp => emp.value !== pocValue
      );

      if (cleanedOtherEmployees.length !== formData.otherEmployees.length) {
        setFormData(prev => ({
          ...prev,
          otherEmployees: cleanedOtherEmployees
        }));
      }
    } else {
      // No POC selected → show all employees
      setFilteredEmployees(employees);
    }
  }, [formData.poc, employees]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle Select changes
  const handleSelectChange = (selectedOptions, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: selectedOptions
    }));
    
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Validation function
  const validate = () => {
    let newErrors = {};
    
    // Project Name validation
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project Name is required';
    } else if (formData.projectName.trim().length < 3) {
      newErrors.projectName = 'Project Name must be at least 3 characters';
    } else if (formData.projectName.trim().length > 100) {
      newErrors.projectName = 'Project Name cannot exceed 100 characters';
    }

    // Project Description validation
    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Project Description is required';
    } else if (formData.projectDescription.trim().length < 10) {
      newErrors.projectDescription = 'Project Description must be at least 10 characters';
    } else if (formData.projectDescription.trim().length > 500) {
      newErrors.projectDescription = 'Project Description cannot exceed 500 characters';
    }
    
    // POC validation
    if (!formData.poc || !formData.poc.value) {
      newErrors.poc = 'Please select a Point of Contact';
    }
    
    // Start Date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start Date is required';
    } else {
      const selectedDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.startDate = 'Start Date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
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
      // Prepare payload
      const payload = {
        ...formData,
        poc: formData.poc?.value || null,
        otherEmployees: formData.otherEmployees.map(e => e.value)
      };

      console.log("Submitting Project Data:", payload);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/project.php`,
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          },
          params: { 
            id: user.id,
            user_code: user.user_code 
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data?.status === "success") {
        Swal.fire({
          icon: 'success',
          title: 'Project Created Successfully!',
          text: response.data.message || 'Project has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        // Reset form
        setFormData({
          projectName: '',
          projectDescription: '',
          poc: null,
          otherEmployees: [],
          startDate: '',
          status: 'Active'
        });
        setErrors({});
        setFilteredEmployees(employees);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Create Project',
          text: response.data?.message || "Failed to create project",
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error("API Error:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
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
              Edit Project
            </h2>
            <p className="text-blue-100 mt-2">Fill in the details to edit a project</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Project Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.projectName 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all`}
                  placeholder="Enter project name"
                />
                {errors.projectName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.projectName}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Required field</span>
                  <span className="text-slate-500">{formData.projectName.length}/100 characters</span>
                </div>
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Project Description
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="projectDescription"
                  rows="3"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.projectDescription 
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  } focus:ring-4 outline-none transition-all resize-none`}
                  placeholder="Enter project description"
                />
                {errors.projectDescription && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.projectDescription}
                  </p>
                )}
                <div className="flex items-center justify-end text-xs">
                  <span className={formData.projectDescription.length > 500 ? "text-red-500" : "text-slate-500"}>
                    {formData.projectDescription.length}/500 characters
                  </span>
                </div>
              </div>

              {/* Second Row: POC and Other Employees */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* POC Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Point of Contact (POC)
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={employees}
                    value={formData.poc}
                    onChange={(selected) => handleSelectChange(selected, 'poc')}
                    classNamePrefix="react-select"
                    className={`react-select-container ${
                      errors.poc ? 'error' : ''
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
                    placeholder="Select Point of Contact..."
                    isDisabled={loading}
                  />
                  {errors.poc && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.poc}
                    </p>
                  )}
                </div>

                {/* Other Employees Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Other Employees
                  </label>
                  <Select
                    isMulti
                    options={filteredEmployees}
                    value={formData.otherEmployees}
                    onChange={(selected) => handleSelectChange(selected, 'otherEmployees')}
                    classNamePrefix="react-select"
                    className={`react-select-container ${
                      errors.otherEmployees ? 'error' : ''
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
                        border: `2px solid ${errors.otherEmployees ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '0.75rem',
                        padding: '8px 4px',
                        backgroundColor: errors.otherEmployees ? '#fef2f2' : 'white',
                        minHeight: '52px',
                        boxShadow: state.isFocused ? (errors.otherEmployees ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                        "&:hover": {
                          borderColor: errors.otherEmployees ? '#f87171' : '#94a3b8',
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
                    placeholder="Select other employees..."
                    isDisabled={loading}
                  />
                  {errors.otherEmployees && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.otherEmployees}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {formData.otherEmployees.length} employee(s) selected
                  </div>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Start Date
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 ${
                      errors.startDate 
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    } focus:ring-4 outline-none transition-all`}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className={`w-5 h-5 ${errors.startDate ? 'text-red-500' : 'text-blue-500'}`}
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
                {errors.startDate ? (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.startDate}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Cannot select past dates</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                onClick={() => {
                  setFormData({
                    projectName: '',
                    projectDescription: '',
                    poc: null,
                    otherEmployees: [],
                    startDate: '',
                    status: 'Active'
                  });
                  setErrors({});
                  setFilteredEmployees(employees);
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
                    Creating Project...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Edit Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;