import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Briefcase, Building2, UserCircle2, Save, Edit, Copy } from 'lucide-react';
import { getCurrentUser } from "../../utils/api";
import axios from 'axios';

const ProfilePage = () => {
  const [employee, setEmployee] = useState({
    id: '',
    name: '',
    email: '',
    gender: '',
    phone: '',
    dept_name: '',
    designation: '',
    dob: '',
    joining_date: '',
    password: ''
  });

  const user = getCurrentUser();
  const id = user.id;
  const userRole = user.role || '' // Assuming role is stored in user object

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Track if DOB and joining date were originally empty
  const [originalData, setOriginalData] = useState({
    dob: '',
    joining_date: ''
  });

  // Check if current user is staff
  const isStaff = userRole === 'staff';

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 0) return '?';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Get first and last name initials
    const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
    const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    return `${firstNameInitial}${lastNameInitial}`;
  };

  // Function to get background color based on initials
  const getAvatarColor = (initials) => {
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-red-600',
      'bg-yellow-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-teal-600',
      'bg-orange-600',
      'bg-cyan-600'
    ];
    
    if (!initials) return colors[0];
    
    // Generate a consistent color based on the initials
    const charCodeSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorIndex = charCodeSum % colors.length;
    return colors[colorIndex];
  };

  useEffect(() => {
    if (!id) return;

    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/users.php`,
          {
            params: { 
              empId: id,
              profile: 'true'
            }
          }
        );

        const result = response.data.data[0];
        console.log("API result:", result);
        
        // Format dates for input fields (YYYY-MM-DD format)
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        const dob = formatDateForInput(result.dob) || "";
        const joiningDate = formatDateForInput(result.joining_date) || "";
        
        setEmployee({
          id: result.id || "",
          name: result.name || "",
          email: result.email || "",
          gender: result.gender || "",
          phone: result.phone || "",
          password: "",
          dept_name: result.dept_name || "",
          designation: result.designation || "",
          dob: dob,
          joining_date: joiningDate
        });
        
        // Store original data to check if fields were empty
        setOriginalData({
          dob: dob,
          joining_date: joiningDate
        });
          
      } catch (error) {
        console.error("Fetch error:", error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id]);

  // Function to check if a field is editable based on user role
  const isFieldEditable = (fieldName) => {
    if (!isEditing) return false;
    
    // Staff can only edit specific fields
    if (isStaff) {
      const staffEditableFields = ['name', 'phone', 'designation', 'gender'];
      
      // For DOB and joining_date, check if they were originally empty
      if (fieldName === 'dob') {
        // Allow editing only if DOB was originally empty
        return !originalData.dob;
      }
      
      if (fieldName === 'joining_date') {
        // Allow editing only if joining date was originally empty
        return !originalData.joining_date;
      }
      
      return staffEditableFields.includes(fieldName);
    }
    
    // Admin or other roles can edit all fields
    return true;
  };

  const handleEdit = () => {
    if (isEditing) {
      handleSubmit();
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For staff users, check if field is editable
    if (isStaff) {
      if (name === 'dob' && originalData.dob) {
        // Prevent editing if DOB already exists
        setMessage({ 
          type: 'error', 
          text: 'Date of birth cannot be edited once set' 
        });
        return;
      }
      
      if (name === 'joining_date' && originalData.joining_date) {
        // Prevent editing if joining date already exists
        setMessage({ 
          type: 'error', 
          text: 'Joining date cannot be edited once set' 
        });
        return;
      }
      
      // Staff can only edit specific fields
      const allowedFields = ['name', 'phone', 'designation', 'gender'];
      
      // If DOB or joining_date are empty, allow editing them
      if (name === 'dob' && !originalData.dob) {
        allowedFields.push('dob');
      }
      
      if (name === 'joining_date' && !originalData.joining_date) {
        allowedFields.push('joining_date');
      }
      
      if (!allowedFields.includes(name)) {
        setMessage({ 
          type: 'error', 
          text: `You cannot edit ${name}` 
        });
        return;
      }
    }
    
    setEmployee(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generatePassword = () => {
    // Only allow password generation for non-staff users or if staff can edit password
    if (isStaff) {
      // If staff shouldn't edit password, you can either:
      // 1. Disable this feature completely for staff
      // 2. Or show a message
      setMessage({ type: 'error', text: 'Staff cannot change passwords' });
      return;
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const passwordLength = 12;
    
    for (let i = 0; i < passwordLength; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setEmployee(prev => ({ ...prev, password }));
  };

  const copyPassword = () => {
    if (employee.password) {
      navigator.clipboard.writeText(employee.password);
      setMessage({ type: 'success', text: 'Password copied to clipboard!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Staff validation rules
    if (isStaff) {
      // Staff can only edit specific fields, so only validate those
      if (!employee.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      // Optional: add phone validation for staff
      if (employee.phone && !/^\d{10}$/.test(employee.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
      
      // Validate DOB if it's being set for the first time
      if (!originalData.dob && employee.dob) {
        const dobDate = new Date(employee.dob);
        if (isNaN(dobDate.getTime())) {
          newErrors.dob = 'Invalid date of birth';
        } else if (dobDate > new Date()) {
          newErrors.dob = 'Date of birth cannot be in the future';
        }
      }
      
      // Validate joining date if it's being set for the first time
      if (!originalData.joining_date && employee.joining_date) {
        const joinDate = new Date(employee.joining_date);
        if (isNaN(joinDate.getTime())) {
          newErrors.joining_date = 'Invalid joining date';
        } else if (joinDate > new Date()) {
          newErrors.joining_date = 'Joining date cannot be in the future';
        }
      }
    } else {
      // Full validation for non-staff users
      if (isEditing && employee.password && employee.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (!employee.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!employee.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      // Validate date formats
      if (employee.dob) {
        const dobDate = new Date(employee.dob);
        if (isNaN(dobDate.getTime())) {
          newErrors.dob = 'Invalid date of birth';
        } else if (dobDate > new Date()) {
          newErrors.dob = 'Date of birth cannot be in the future';
        }
      }
      
      if (employee.joining_date) {
        const joinDate = new Date(employee.joining_date);
        if (isNaN(joinDate.getTime())) {
          newErrors.joining_date = 'Invalid joining date';
        } else if (joinDate > new Date()) {
          newErrors.joining_date = 'Joining date cannot be in the future';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors before saving' });
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare data based on user role
      let submitData;
      
      // if (isStaff) {
      //   // Staff can only submit specific fields
      //   submitData = {
      //     id: id,
      //     name: employee.name,
      //     gender: employee.gender,
      //     phone: employee.phone || '',
      //     designation: employee.designation || '',
      //     // Include DOB and joining_date only if they were originally empty and are now being set
      //     ...(!originalData.dob && employee.dob && { dob: employee.dob }),
      //     ...(!originalData.joining_date && employee.joining_date && { joining_date: employee.joining_date }),
      //     _method: 'PUT'
      //   };
      // } else {
      //   // Non-staff users can submit all fields
      //   submitData = {
      //     id: id,
      //     name: employee.name,
      //     email: employee.email,
      //     gender: employee.gender,
      //     phone: employee.phone || '',
      //     designation: employee.designation || '',
      //     dob: employee.dob || '',
      //     joining_date: employee.joining_date || '',
      //     password: employee.password || '',
      //     _method: 'PUT'
      //   };
      // }

      submitData = {
          id: id,
          name: employee.name,
          email: employee.email,
          gender: employee.gender,
          phone: employee.phone || '',
          designation: employee.designation || '',
          dob: employee.dob || '',
          joining_date: employee.joining_date || '',
          password: employee.password || '',
          _method: 'PUT'
        };

      console.log("Submitting data:", submitData);

      const formData = new FormData();
      Object.keys(submitData).forEach(key => {
        formData.append(key, submitData[key]);
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/users.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log("Update response:", response.data);

      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: response.data.message || 'Profile updated successfully!' });
        setIsEditing(false);
        
        // Clear password field after successful save
        setEmployee(prev => ({ ...prev, password: '' }));
        
        // Update original data if DOB or joining_date were set
        if (isStaff) {
          if (!originalData.dob && employee.dob) {
            setOriginalData(prev => ({ ...prev, dob: employee.dob }));
          }
          if (!originalData.joining_date && employee.joining_date) {
            setOriginalData(prev => ({ ...prev, joining_date: employee.joining_date }));
          }
        }
        
        // Refresh the page to get updated data
        setTimeout(() => {
          // window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(employee.name);
  const avatarColor = getAvatarColor(initials);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Message Alert */}
      {message.text && (
        <div className={`mx-auto p-6 pb-0`}>
          <div className={`rounded-lg p-4 mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {message.type === 'success' ? 'Success!' : 'Error!'}
                </span>
                <span>{message.text}</span>
              </div>
              <button 
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Indicator */}
      {isStaff && (
        <div className="mx-auto p-6 pb-0">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm font-medium">
              <span className="font-bold">You can only edit Name, Phone, Designation, and Gender fields.</span>
              <br />
           
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${avatarColor} text-white`}>
                    <span className="text-3xl font-bold">{initials}</span>
                  </div>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold mb-1">{employee.name}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-100 flex items-center gap-2">{employee.dept_name}</p>
                    <p className="text-blue-100 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEdit}
                disabled={isSaving}
                className="px-6 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name - Editable for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={employee.name}
                  onChange={handleChange}
                  disabled={!isFieldEditable('name')}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isFieldEditable('name')
                      ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      : 'border-gray-200 bg-gray-50'
                  } ${errors.name ? 'border-red-300' : ''} outline-none transition-all`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Phone Number - Editable for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={employee.phone}
                  onChange={handleChange}
                  disabled={!isFieldEditable('phone')}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isFieldEditable('phone')
                      ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      : 'border-gray-200 bg-gray-50'
                  } ${errors.phone ? 'border-red-300' : ''} outline-none transition-all`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>

              {/* Gender - Editable for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle2 className="w-4 h-4 text-blue-600" />
                  Gender
                </label>
                <select
                  name="gender"
                  value={employee.gender}
                  onChange={handleChange}
                  disabled={!isFieldEditable('gender')}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isFieldEditable('gender')
                      ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      : 'border-gray-200 bg-gray-50'
                  } outline-none transition-all`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Department (Read-only for everyone) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Department
                </label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                  {employee.dept_name || 'Not set'}
                </div>
              </div>

              {/* Designation - Editable for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Designation
                </label>
                {isFieldEditable('designation') ? (
                  <input
                    type="text"
                    name="designation"
                    value={employee.designation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isFieldEditable('designation')
                        ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        : 'border-gray-200 bg-gray-50'
                    } outline-none transition-all`}
                    placeholder="Enter designation"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                    {employee.designation || 'Not set'}
                  </div>
                )}
              </div>

              {/* Email Address - Not editable for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Address
                  {isStaff && <span className="text-xs text-gray-400">(Read-only)</span>}
                </label>
                {isStaff ? (
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                    {employee.email}
                  </div>
                ) : (
                  <input
                    type="email"
                    name="email"
                    value={employee.email}
                    onChange={handleChange}
                    disabled={!isFieldEditable('email')}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isFieldEditable('email')
                        ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        : 'border-gray-200 bg-gray-50'
                    } ${errors.email ? 'border-red-300' : ''} outline-none transition-all`}
                  />
                )}
                {!isStaff && errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Date of Birth - Editable only once for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Date of Birth
                  {isStaff && originalData.dob && (
                    <span className="text-xs text-gray-400">(Set once, cannot be changed)</span>
                  )}
                </label>
                {isStaff ? (
                  isFieldEditable('dob') ? (
                    // Staff can edit DOB only if it was originally empty
                    <>
                      <input
                        type="date"
                        name="dob"
                        value={employee.dob}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isFieldEditable('dob')
                            ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            : 'border-gray-200 bg-gray-50'
                        } ${errors.dob ? 'border-red-300' : ''} outline-none transition-all`}
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                      />
                      <p className="text-xs text-blue-600 italic">
                        You can set your date of birth once. This cannot be changed later.
                      </p>
                      {errors.dob && (
                        <p className="text-red-500 text-sm">{errors.dob}</p>
                      )}
                    </>
                  ) : (
                    // Read-only display for staff if DOB is already set
                    <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                      {formatDisplayDate(employee.dob)}
                    </div>
                  )
                ) : isEditing ? (
                  // Non-staff users in edit mode
                  <>
                    <input
                      type="date"
                      name="dob"
                      value={employee.dob}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isEditing
                          ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                          : 'border-gray-200 bg-gray-50'
                      } ${errors.dob ? 'border-red-300' : ''} outline-none transition-all`}
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-sm">{errors.dob}</p>
                    )}
                  </>
                ) : (
                  // Non-staff users not in edit mode
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                    {formatDisplayDate(employee.dob)}
                  </div>
                )}
              </div>

              {/* Joining Date - Editable only once for staff */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Joining Date
                  {isStaff && originalData.joining_date && (
                    <span className="text-xs text-gray-400">(Set once, cannot be changed)</span>
                  )}
                </label>
                {isStaff ? (
                  isFieldEditable('joining_date') ? (
                    // Staff can edit joining date only if it was originally empty
                    <>
                      <input
                        type="date"
                        name="joining_date"
                        value={employee.joining_date}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isFieldEditable('joining_date')
                            ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            : 'border-gray-200 bg-gray-50'
                        } ${errors.joining_date ? 'border-red-300' : ''} outline-none transition-all`}
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                      />
                      <p className="text-xs text-blue-600 italic">
                        You can set your joining date once. This cannot be changed later.
                      </p>
                      {errors.joining_date && (
                        <p className="text-red-500 text-sm">{errors.joining_date}</p>
                      )}
                    </>
                  ) : (
                    // Read-only display for staff if joining date is already set
                    <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                      {formatDisplayDate(employee.joining_date)}
                    </div>
                  )
                ) : isEditing ? (
                  // Non-staff users in edit mode
                  <>
                    <input
                      type="date"
                      name="joining_date"
                      value={employee.joining_date}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isEditing
                          ? 'border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                          : 'border-gray-200 bg-gray-50'
                      } ${errors.joining_date ? 'border-red-300' : ''} outline-none transition-all`}
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    />
                    {errors.joining_date && (
                      <p className="text-red-500 text-sm">{errors.joining_date}</p>
                    )}
                  </>
                ) : (
                  // Non-staff users not in edit mode
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                    {formatDisplayDate(employee.joining_date)}
                  </div>
                )}
              </div>
            </div>

            {/* Password Section - Only show in edit mode for non-staff users */}
            {isEditing && !isStaff && (
              <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Update</h3>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    New Password
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="password"
                      value={employee.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-32 rounded-lg border-2 ${
                        errors.password 
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                          : "border-blue-200 focus:border-blue-500 focus:ring-blue-100"
                      } focus:ring-2 outline-none transition-all bg-white`}
                      placeholder="Leave blank to keep current password"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      {employee.password && (
                        <button
                          type="button"
                          onClick={copyPassword}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                          title="Copy password"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      {errors.password}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {employee.password.length} characters (optional)
                    </span>
                    {employee.password && (
                      <span className={`font-medium ${
                        employee.password.length >= 8 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {employee.password.length >= 8 ? 'Strong' : 'Weak'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Password must be at least 8 characters long. Leave this field empty if you don't want to change the password.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-semibold text-gray-900">{employee.designation || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-900">{employee.dept_name || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-semibold text-gray-900">{formatDisplayDate(employee.joining_date)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;