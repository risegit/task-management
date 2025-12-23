import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const Edirproject = () => {
  // Sample employee data - replace with your actual data source
  const allEmployees = [
    { value: 'emp1', label: 'John Doe' },
    { value: 'emp2', label: 'Jane Smith' },
    { value: 'emp3', label: 'Robert Johnson' },
    { value: 'emp4', label: 'Emily Williams' },
    { value: 'emp5', label: 'Michael Brown' },
    { value: 'emp6', label: 'Sarah Davis' },
    { value: 'emp7', label: 'David Wilson' },
    { value: 'emp8', label: 'Lisa Miller' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    poc: [],
    otherEmployees: [],
    startDate: '',
    status: 'Active'
  });

  // Filtered employees for "Other Employees" dropdown (excludes selected POCs)
  const [filteredEmployees, setFilteredEmployees] = useState(allEmployees);
  
  // Errors state
  const [errors, setErrors] = useState({
    projectName: '',
    poc: '',
    otherEmployees: '',
    startDate: '',
    status: ''
  });

  // Update filtered employees when POC selection changes
  useEffect(() => {
    if (formData.poc.length > 0) {
      const pocValues = formData.poc.map(p => p.value);
      const availableEmployees = allEmployees.filter(
        emp => !pocValues.includes(emp.value)
      );
      setFilteredEmployees(availableEmployees);
      
      // Also filter out any selected other employees that are now POCs
      const currentOtherEmps = formData.otherEmployees.filter(
        emp => !pocValues.includes(emp.value)
      );
      if (currentOtherEmps.length !== formData.otherEmployees.length) {
        setFormData(prev => ({
          ...prev,
          otherEmployees: currentOtherEmps
        }));
      }
    } else {
      setFilteredEmployees(allEmployees);
    }
  }, [formData.poc]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
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
      [fieldName]: selectedOptions || []
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project Name is required';
    }
    
    if (formData.poc.length === 0) {
      newErrors.poc = 'Please select at least one POC';
    }
    
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        poc: formData.poc.map(p => p.value),
        otherEmployees: formData.otherEmployees.map(e => e.value)
      };
      
      console.log('Form submitted:', submissionData);
      // Add your API call here
      
      // Reset form after submission (optional)
      // setFormData({
      //   projectName: '',
      //   poc: [],
      //   otherEmployees: [],
      //   startDate: '',
      //   status: 'Active'
      // });
      
      alert('Form submitted successfully!');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 mt-10">
      <div className="mx-auto bg-white rounded-2xl shadow-xl p-6">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Project</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6 [&_input]:h-[42px] [&_select]:h-[42px]">
            
            {/* Project Name */}
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 font-medium text-gray-700">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                placeholder="Enter project name"
                className={`px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition 
                  ${errors.projectName ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"}`}
              />
              {errors.projectName && (
                <span className="text-red-500 text-sm mt-1">{errors.projectName}</span>
              )}
            </div>
            
            {/* Select POC - Multiple Select Dropdown */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">
                Select POC <span className="text-red-500">*</span>
              </label>
              <Select
                isMulti
                options={allEmployees}
                value={formData.poc}
                placeholder="Select POC..."
                classNamePrefix="react-select"
                styles={{ 
                  menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  control: (provided) => ({ 
                    ...provided, 
                    minHeight: '42px',
                    borderColor: errors.poc ? '#ef4444' : '#d1d5db',
                    '&:hover': {
                      borderColor: errors.poc ? '#ef4444' : '#d1d5db'
                    }
                  })
                }}
                onChange={(selected) => handleSelectChange(selected, 'poc')}
              />
              {errors.poc && (
                <span className="text-red-500 text-sm mt-1">{errors.poc}</span>
              )}
            </div>
            
            {/* Select Other Employees - Multiple Select Dropdown */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">
                Select Other Employees
              </label>
              <Select
                isMulti
                options={filteredEmployees}
                value={formData.otherEmployees}
                placeholder="Select other employees..."
                classNamePrefix="react-select"
                styles={{ 
                  menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  control: (provided) => ({ 
                    ...provided, 
                    minHeight: '42px',
                    borderColor: errors.otherEmployees ? '#ef4444' : '#d1d5db',
                    '&:hover': {
                      borderColor: errors.otherEmployees ? '#ef4444' : '#d1d5db'
                    }
                  })
                }}
                onChange={(selected) => handleSelectChange(selected, 'otherEmployees')}
              />
              {errors.otherEmployees && (
                <span className="text-red-500 text-sm mt-1">{errors.otherEmployees}</span>
              )}
            </div>
            
            {/* Start Date */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                className={`px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition 
                  ${errors.startDate ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"}`}
              />
              {errors.startDate && (
                <span className="text-red-500 text-sm mt-1">{errors.startDate}</span>
              )}
            </div>
       {/* Status - Checkbox Style */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"                                                                                                                     
                    checked={formData.status === 'Active'}
                    onChange={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Active</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.status === 'Inactive'}
                    onChange={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Inactive</span>
                </label>
              </div>
              {errors.status && (
                <span className="text-red-500 text-sm mt-1">{errors.status}</span>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end px-6 py-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edirproject;