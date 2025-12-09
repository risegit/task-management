import React, { useState } from "react";

export default function AddEmployee() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "assignee",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // valid = true
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Clear error on typing
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    console.log("Employee Added:", formData);
    alert("Employee Added Successfully!");
  };

  return (
    <div className="w-full min-h-screen flex justify-center py-10 bg-gray-100 px-4">
      <div className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add Employee</h2>

        {/* Name */}
        <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full border ${
            errors.name ? "border-red-500" : "border-gray-300"
          } rounded-lg px-3 py-2 mb-1 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
          placeholder="Enter employee name"
        />
        {errors.name && <p className="text-red-500 text-sm mb-3">{errors.name}</p>}

        {/* Email */}
        <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full border ${
            errors.email ? "border-red-500" : "border-gray-300"
          } rounded-lg px-3 py-2 mb-1 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
          placeholder="Enter employee email"
        />
        {errors.email && <p className="text-red-500 text-sm mb-3">{errors.email}</p>}

        {/* Role */}
        <label className="block text-sm font-medium mb-1 text-gray-700">Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={`w-full border ${
            errors.role ? "border-red-500" : "border-gray-300"
          } rounded-lg px-3 py-2 mb-1 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
        >
          <option value="assignee">Assignee</option>
          <option value="assigner">Assigner</option>
        </select>
        {errors.role && <p className="text-red-500 text-sm mb-3">{errors.role}</p>}

        {/* Password */}
        <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full border ${
            errors.password ? "border-red-500" : "border-gray-300"
          } rounded-lg px-3 py-2 mb-1 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
          placeholder="Enter password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mb-3">{errors.password}</p>
        )}

        {/* Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
}
