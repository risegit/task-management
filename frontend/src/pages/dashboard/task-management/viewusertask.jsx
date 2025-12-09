import { FiEye, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function TasksPage() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-management.php?view-task=viewTask`, {
          method: "GET",
        });
        const data = await response.json();
        console.log("user data=", data);
        setAllUsers(data.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      {/* MAIN CONTENT */}
      <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
            {filteredTasks.length} Active Tasks
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <select 
            value={selectedAssignedBy}
            onChange={(e) => setSelectedAssignedBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full sm:w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
          >
            <option value="all">All Assigners</option>
            {uniqueAssignedBy.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full sm:w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned By
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="py-4 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-6 text-center text-gray-500">
                    No tasks found matching your filters
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${task.assignedBy.color} flex items-center justify-center text-white font-semibold text-sm`}>
                          {task.assignedBy.initials}
                        </div>
                        <span className="font-medium text-gray-800">{task.assignedBy.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${task.assignedTo.color} flex items-center justify-center text-white font-semibold text-sm`}>
                          {task.assignedTo.initials}
                        </div>
                        <span className="font-medium text-gray-800">{task.assignedTo.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">{task.deadline}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(task.status)}`}>
                        ● {task.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{task.remarks}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleEdit(task)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                        >
                          <FiEdit className="text-gray-600 group-hover:text-green-600 transition-colors" size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        >
                          <FiTrash2 className="text-gray-600 group-hover:text-red-600 transition-colors" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">Showing {filteredTasks.length} of {allTasks.length} results</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              Prev
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm">
              1
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              2
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              3
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-800">Edit Task</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Task Name */}
              <label className="block text-sm font-medium mb-1">Task Name</label>
              <input
                type="text"
                value={editingTask.name}
                onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
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
                    value={editingTask.assignedBySelect}
                    onChange={(selected) =>
                      setEditingTask({ ...editingTask, assignedBySelect: selected })
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
                    value={editingTask.assignedToSelect}
                    onChange={(selected) =>
                      setEditingTask({ ...editingTask, assignedToSelect: selected })
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
                      value={editingTask.deadline}
                      onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
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
                        value="Pending"
                        checked={editingTask.status === "Pending"}
                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                        className="cursor-pointer"
                      />
                      Pending
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="Completed"
                        checked={editingTask.status === "Completed"}
                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                        className="cursor-pointer"
                      />
                      Completed
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="Overdue"
                        checked={editingTask.status === "Overdue"}
                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
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
                rows="3"
                value={editingTask.remarks}
                onChange={(e) => setEditingTask({ ...editingTask, remarks: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              ></textarea>

              {/* Modal Footer - Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}