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
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <div className="relative">
              <input
                type="date"
                name="deadline"
                value={taskData.deadline}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
              />
              <Calendar
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex items-center gap-3 text-sm h-10">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={taskData.status === "pending"}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
                Pending
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={taskData.status === "completed"}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
                Completed
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="overdue"
                  checked={taskData.status === "overdue"}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
                Overdue
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