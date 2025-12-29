import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
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
    status: ''
  });

  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Errors state
  const [errors, setErrors] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/project.php`,
          {
            params: { id }
          }
        );

        console.log("API Response:", response.data);

        // Process employees data for dropdown
        if (response.data?.employee) {
          const formattedEmployees = response.data.employee.map(emp => ({
            value: emp.id,
            label: `${emp.name} (${emp.role})`
          }));
          setEmployees(formattedEmployees);
          setFilteredEmployees(formattedEmployees);
        } else {
          console.warn("No employees found in response");
        }

        // If editing and project data exists, populate the form
        if (id && response.data?.data?.[0]) {
          const project = response.data.data[0];
          console.log("Project data for editing:", project);
          console.log("Assigned employees:", response.data.assigned_emp);
          
          // Initialize variables for POC and other employees
          let pocEmployee = null;
          let otherEmployeesList = [];
          
          // Process assigned_emp array to find POC and other employees
          if (response.data.assigned_emp && response.data.assigned_emp.length > 0) {
            // Find POC (where is_poc = '1')
            const pocData = response.data.assigned_emp.find(emp => emp.is_poc === '1');
            
            if (pocData && response.data.employee) {
              // Find the POC employee in the employee list
              const pocEmployeeData = response.data.employee.find(
                emp => emp.id.toString() === pocData.emp_id.toString()
              );
              
              if (pocEmployeeData) {
                pocEmployee = {
                  value: pocEmployeeData.id,
                  label: `${pocEmployeeData.name} (${pocEmployeeData.role})`
                };
              }
            }
            
            // Find other employees (where is_poc = '0')
            const otherEmployeesData = response.data.assigned_emp.filter(emp => emp.is_poc === '0');
            
            if (otherEmployeesData.length > 0 && response.data.employee) {
              otherEmployeesList = otherEmployeesData
                .map(data => {
                  const empData = response.data.employee.find(
                    emp => emp.id.toString() === data.emp_id.toString()
                  );
                  return empData ? {
                    value: empData.id,
                    label: `${empData.name} (${empData.role})`
                  } : null;
                })
                .filter(emp => emp !== null); // Remove any null entries
            }
          }
          
          console.log("POC employee:", pocEmployee);
          console.log("Other employees:", otherEmployeesList);

          // If no assigned_emp data, fallback to old method using project data
          if (!pocEmployee && project.poc_id) {
            const fallbackPoc = response.data.employee
              ?.map(emp => ({
                value: emp.id,
                label: `${emp.name} (${emp.role})`
              }))
              .find(emp => emp.value.toString() === project.poc_id.toString());
            
            if (fallbackPoc) {
              pocEmployee = fallbackPoc;
            }
          }

          setFormData({
            projectName: project.name || '',
            projectDescription: project.description || '',
            poc: pocEmployee,
            otherEmployees: otherEmployeesList,
            startDate: project.start_date ? project.start_date.split(' ')[0] : '', // Get date part only if contains time
            status: project.status
          });
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load data. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
    } else if (formData.projectName.trim().length > 50) {
      newErrors.projectName = 'Project Name cannot exceed 50 characters';
    }

    // Project Description validation
    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Project Description is required';
    } else if (formData.projectDescription.trim().length < 10) {
      newErrors.projectDescription = 'Project Description must be at least 10 characters';
    } else if (formData.projectDescription.trim().length > 200) {
      newErrors.projectDescription = 'Project Description cannot exceed 200 characters';
    }
    
    // POC validation
    if (!formData.poc || !formData.poc.value) {
      newErrors.poc = 'Please select a Point of Contact';
    }
    
    // Start Date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start Date is required';
    } else if (!id) { // Only check for new projects
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
          confirmButtonColor: '#d33',
        });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();

      form.append("projectName", formData.projectName);
      form.append("projectDescription", formData.projectDescription);
      form.append("startDate", formData.startDate);
      form.append("status", formData.status);

      // ✅ Convert Select values
      form.append("poc", formData.poc?.value || "");
      form.append(
        "otherEmployees",
        JSON.stringify(formData.otherEmployees.map(emp => emp.value))
      );

      // edit / create logic
      if (id) {
        form.append("project_id", id);
        form.append("_method", "PUT");
      }

      // user info
      form.append("id", user.id);
      form.append("user_code", user.user_code);

      console.log("Submitting Project Data:");
      for (let pair of form.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/project.php`,
        form
      );

      console.log("API Response:", response.data);

      if (response.data?.status === "success") {
        Swal.fire({
          icon: "success",
          title: id ? "Project Updated Successfully!" : "Project Created Successfully!",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          if (id) {
            // navigate(-1);
          } else {
            setFormData({
              projectName: "",
              projectDescription: "",
              poc: null,
              otherEmployees: [],
              startDate: "",
              status: "Active"
            });
            setFilteredEmployees(employees);
          }
        });
      } else {
        Swal.fire("Error", response.data?.message || "Failed", "error");
      }

    } catch (error) {
      console.error("API Error:", error);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFormData({ 
      ...formData, 
      status: checked ? 'active' : 'inactive' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading {id ? 'project data' : 'form'}...</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {id ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-blue-100 mt-2">
              {id ? 'Update the project details below' : 'Fill in the details to create a new project'}
            </p>
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
                  <span className="text-slate-500">{formData.projectName.length}/50 characters</span>
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
                  <span className={formData.projectDescription.length > 200 ? "text-red-500" : "text-slate-500"}>
                    {formData.projectDescription.length}/200 characters
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
                  {loading && !employees.length && (
                    <p className="text-xs text-slate-500">Loading employees...</p>
                  )}
                  {/* {id && formData.poc && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      POC loaded from project data
                    </p>
                  )} */}
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
                    placeholder={loading ? "Loading employees..." : "Select other employees..."}
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
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>{formData.otherEmployees.length} employee(s) selected</span>
                    {/* {id && formData.otherEmployees.length > 0 && (
                      <span className="text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Loaded from project data
                      </span>
                    )} */}
                  </div>
                </div>
              </div>

              {/* Third Row: Start Date and Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      min={id ? undefined : new Date().toISOString().split('T')[0]}
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
                    <p className="text-xs text-slate-500">
                      {id ? 'Project start date' : 'Cannot select past dates for new projects'}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="status"
                        checked={formData.status === 'active'} // Compare with 'Active' string
                        onChange={handleCheckboxChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-600 transition-all"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-md"></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 block">
                        Active Status
                      </span>
                      <span className="text-xs text-slate-500">
                        {formData.status === 'Active' ? 'Project is currently active' : 'Project is currently inactive'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                onClick={() => {
                  if (id) {
                    navigate(-1);
                  } else {
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
                  }
                }}
              >
                {id ? 'Back' : 'Cancel'}
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
                    {id ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {id ? 'Update Project' : 'Create Project'}
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