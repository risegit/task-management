import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    role: "assignee",
    department: null,
    name: "",
    email: "",
    phone: "",
    password: "",
    active: true, // Added status field
  });

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  // Fetch employee data on component mount
  useEffect(() => {
  if (!id) return;

  const fetchEmployeeAndDepartments = async () => {
    try {
      setIsLoading(true);
      setIsLoadingDepartments(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/emp.php?id=${id}`
      );

      const result = await response.json();
      console.log("API result:", result);

      if (result.status === "success") {
        const employee = result.data?.[0];
        const deptList = result.departments || [];

        // ✅ SET DEPARTMENTS FIRST
        setDepartments(deptList);

        if (employee) {
          // ✅ MATCH dept_name → dept.id
          const matchedDept = deptList.find(
            (dept) => dept.name === employee.dept_name
          );

          setFormData({
            role: employee.role || "assignee",
            department: matchedDept ? matchedDept.id : "",
            name: employee.name || "",
            email: employee.email || "",
            phone: employee.phone || "",
            password: "",
            active:
              employee.status === "active" ||
              employee.active === true ||
              employee.status === "1",
          });
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingDepartments(false);
    }
  };

  fetchEmployeeAndDepartments();
}, [id]);


  // Fetch departments from API
  // useEffect(() => {
  //   const fetchDepartments = async () => {
  //     try {
  //       setIsLoadingDepartments(true);
  //       const response = await fetch(`${import.meta.env.VITE_API_URL}api/department.php`);
        
  //       const result = await response.json();
  //       console.log("Fetched departments:", result);
        
  //       if (result.status === "success") {
  //         if (result.departments && Array.isArray(result.departments)) {
  //           setDepartments(result.departments);
  //         } else if (result.data && Array.isArray(result.data)) {
  //           setDepartments(result.data);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error fetching departments:", error);
  //       // Fallback static departments if API fails
  //       setDepartments([
  //         { id: 1, name: "Engineering" },
  //         { id: 2, name: "Development" },
  //         { id: 3, name: "Sales" },
  //         { id: 4, name: "Marketing" },
  //         { id: 5, name: "Human Resources" },
  //         { id: 6, name: "Finance" }
  //       ]);
  //     } finally {
  //       setIsLoadingDepartments(false);
  //     }
  //   };

  //   fetchDepartments();
  // }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    alert("Password copied to clipboard!");
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.role) newErrors.role = "Role is required";

    if ((formData.role === "manager" || formData.role === "staff") && !formData.department) {
      newErrors.department = "Department is required";
    }

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFormData({ ...formData, active: checked });
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      console.log("Updating employee ID:", id);
      console.log("Update Payload:", formData);
      
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
          if (value !== null) form.append(key, value);
      });

      form.append('id', id);
      form.append('_method', 'PUT');
      
      // Send PUT request to update employee
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/emp.php`, {
        method: 'POST',
        body: form,
      });

      const result = await response.json();
      
      if (result.status === "success") {
        alert("Employee Updated Successfully!");
      } else {
        alert(result.message || "Failed to update employee");
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDepartment = formData.role === "manager" || formData.role === "staff" || formData.role === "admin";

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-10 bg-gray-100">
        <div className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Employee</h2>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-10 bg-gray-100">
      <div className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Employee</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full border ${
                  errors.role ? "border-red-500 bg-red-50" : "border-gray-300"
                } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
              >
                <option value="assignee" disabled>Select Role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.role}
                </p>
              )}
            </div>

            {showDepartment ? (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.department ? "border-red-500 bg-red-50" : "border-gray-300"
                    } rounded-lg px-4 py-3`}
                  >
                    <option value="">Select Department</option>

                    {isLoadingDepartments ? (
                      <option disabled>Loading departments...</option>
                    ) : (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))
                    )}
                  </select>

                {errors.department && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.department}
                  </p>
                )}
              </div>
            ) : (
              <div></div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border ${
                  errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
                placeholder="Enter employee name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border ${
                  errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
                } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
                placeholder="Enter employee email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full border ${
                  errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
                } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
                placeholder="Enter 10-digit phone number"
                maxLength="10"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.password ? "border-red-500 bg-red-50" : "border-gray-300"
                  } rounded-lg px-4 py-3 pr-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
                  placeholder="Enter or generate password"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {formData.password && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                      title="Copy password"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
         
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <div>{formData.password.length}/6 characters</div>
                <div className={!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(formData.password) ? "text-red-500" : "text-green-500"}>
                  {formData.password ? "Must contain letters & numbers" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Status Checkbox - Added below the phone number field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Status
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleCheckboxChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Active</span>
                     
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div></div> {/* Empty div to maintain grid layout */}
          </div>
        </div>

        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Employee'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}