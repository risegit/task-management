import React, { useState } from "react";

export default function AddItemTable() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true, // Default to active (checked)
  });

  const [errors, setErrors] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));

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
    setFormData({ ...formData, active: checked });
  };

  const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const form = new FormData();

    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("status", formData.active ? "active" : "inactive");

    // 🔍 Debug: log form data before sending
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
      alert(result.message || "Item added successfully!");

      // 🔄 Reset form
      setFormData({
        name: "",
        description: "",
        active: true,
      });

      setErrors({});
    } else {
      alert(result.message || "Failed to add item");
    }
  } catch (error) {
    console.error("Submit Error:", error);
    alert("Something went wrong while submitting!");
  }
};


  return (
    <div className="w-full flex justify-center py-10 bg-gray-100">
      <div className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add New Item</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border ${
                  errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
                placeholder="Enter item name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {formData.name.length}/50 characters
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`w-full border ${
                  errors.description ? "border-red-500 bg-red-50" : "border-gray-300"
                } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors resize-none`}
                placeholder="Enter item description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.description}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Status
              </label>
              
              {/* Single checkbox approach */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  
                  </label>
                </div>
                
          
                {/* Alternative: Toggle switch approach */}
          
              </div>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Add Department
          </button>
        </div>
      </div>
    </div>
  );
}