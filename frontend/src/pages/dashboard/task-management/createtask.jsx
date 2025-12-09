import React, { useState } from "react";
import { Calendar } from "lucide-react";
import Select from "react-select";

export default function CreateTask() {
  const [taskData, setTaskData] = useState({
    name: "",
    assignedBy: null,
    assignedTo: [],
    deadline: "",
    status: "pending",
    remarks: "",
  });

  // Sample options for dropdowns
  const assignedByOptions = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "teamlead", label: "Team Lead" },
  ];

  const assignedToOptions = [
    { value: "user1", label: "User 1" },
    { value: "user2", label: "User 2" },
    { value: "user3", label: "User 3" },
    { value: "user4", label: "User 4" },
  ];

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Task Created:", taskData);
    alert("Task Created!");
  };

  return (
    <div className="w-full min-h-screen flex justify-center py-10 bg-gray-50">
      <div className="w-full bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6">Create Task</h2>

        {/* Task Name */}
        <label className="block text-sm font-medium mb-1">Task Name</label>
        <input
          type="text"
          name="name"
          value={taskData.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />

        {/* Assigned By / Assigned To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Assigned By <span className="text-red-500">*</span>
            </label>
            <Select
              options={assignedByOptions}
              value={taskData.assignedBy}
              onChange={(selected) =>
                setTaskData({ ...taskData, assignedBy: selected })
              }
              classNamePrefix="react-select"
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                control: (provided) => ({
                  ...provided,
                  borderColor: "#d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.125rem",
                }),
              }}
              placeholder="Select..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Assigned To <span className="text-red-500">*</span>
            </label>
            <Select
              isMulti
              options={assignedToOptions}
              value={taskData.assignedTo}
              onChange={(selected) =>
                setTaskData({ ...taskData, assignedTo: selected })
              }
              classNamePrefix="react-select"
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                control: (provided) => ({
                  ...provided,
                  borderColor: "#d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.125rem",
                }),
              }}
              placeholder="Select multiple..."
            />
          </div>
        </div>

        {/* Deadline, Status in one row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Deadline</label>
            <div className="relative">
              <input
                type="date"
                name="deadline"
                value={taskData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Disable past dates
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-400"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-blue-500"
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
            <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
            <div className="flex items-center gap-4 text-sm h-10 bg-gray-50 rounded-lg px-4 border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={taskData.status === "pending"}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-yellow-500 peer-checked:border-yellow-500 peer-checked:bg-yellow-500 transition-all duration-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <span className="text-gray-700 group-hover:text-yellow-600 peer-checked:text-yellow-600 transition-colors">Pending</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="status"
                    value="completed"
                    checked={taskData.status === "completed"}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-green-500 peer-checked:border-green-500 peer-checked:bg-green-500 transition-all duration-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <span className="text-gray-700 group-hover:text-green-600 peer-checked:text-green-600 transition-colors">Completed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"  
                    name="status"
                    value="overdue"
                    checked={taskData.status === "overdue"}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-red-500 peer-checked:border-red-500 peer-checked:bg-red-500 transition-all duration-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <span className="text-gray-700 group-hover:text-red-600 peer-checked:text-red-600 transition-colors">Overdue</span>
              </label>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <label className="block text-sm font-medium mb-1">Remarks</label>
        <textarea
          name="remarks"
          rows="3"
          value={taskData.remarks}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        ></textarea>

        {/* Button - Small, Right Bottom Corner */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}