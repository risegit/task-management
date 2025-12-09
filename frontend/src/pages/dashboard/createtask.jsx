import React, { useState } from "react";
import { FiUser, FiCalendar } from "react-icons/fi";

export default function CreateTask() {
  const [taskData, setTaskData] = useState({
    name: "",
    assignedBy: "",
    assignedTo: "",
    deadline: "",
    status: "pending",
    remarks: "",
  });

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Task Created:", taskData);
    alert("Task Created!");
  };

  return (
    <div className="w-full min-h-screen flex justify-center py-10 bg-gray-50">
      <div className="w-full  bg-white rounded-2xl shadow-md p-6 md:p-8">

        {/* Header */}
    

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assigned By</label>
            <select
              name="assignedBy"
              value={taskData.assignedBy}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Team Lead">Team Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
            <select
              name="assignedTo"
              value={taskData.assignedTo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="User 1">User 1</option>
              <option value="User 2">User 2</option>
              <option value="User 3">User 3</option>
            </select>
          </div>
        </div>

        {/* Deadline */}
        <label className="block text-sm font-medium mt-4 mb-1">Deadline</label>
        <div className="relative">
          <input
            type="date"
            name="deadline"
            value={taskData.deadline}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <FiCalendar className="absolute right-3 top-3 text-gray-500" size={20} />
        </div>

        {/* Status */}
        <label className="block text-sm font-medium mt-4 mb-2">Status</label>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="status"
              value="pending"
              checked={taskData.status === "pending"}
              onChange={handleChange}
            />
            Pending
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="status"
              value="completed"
              checked={taskData.status === "completed"}
              onChange={handleChange}
            />
            Completed
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="status"
              value="overdue"
              checked={taskData.status === "overdue"}
              onChange={handleChange}
            />
            Overdue
          </label>
        </div>

        {/* Remarks */}
        <label className="block text-sm font-medium mt-4 mb-1">Remarks</label>
        <textarea
          name="remarks"
          rows="3"
          value={taskData.remarks}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        ></textarea>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 text-lg font-semibold hover:bg-blue-700 transition"
        >
          Create Task
        </button>
      </div>
    </div>
  );
}
