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
            3 Active Tasks
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <select className="px-4 py-2.5 border border-gray-200 rounded-xl w-full sm:w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
            <option>Assigned By</option>
            <option>John</option>
            <option>Alice</option>
          </select>

          <input
            type="date"
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
              {/* ROW 1 */}
              <tr className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      JS
                    </div>
                    <span className="font-medium text-gray-800">John Smith</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                      AJ
                    </div>
                    <span className="font-medium text-gray-800">Alice John</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-600">2025-01-12</span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    ● Pending
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">...</td>
                <td className="py-4 px-6">
                  <div className="flex gap-2 justify-center">
                    <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors group">
                      <FiEye className="text-gray-600 group-hover:text-blue-600 transition-colors" size={18} />
                    </button>
                    <button className="p-2 hover:bg-green-100 rounded-lg transition-colors group">
                      <FiEdit className="text-gray-600 group-hover:text-green-600 transition-colors" size={18} />
                    </button>
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors group">
                      <FiTrash2 className="text-gray-600 group-hover:text-red-600 transition-colors" size={18} />
                    </button>
                  </div>
                </td>
              </tr>

              {/* ROW 2 */}
              <tr className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      BW
                    </div>
                    <span className="font-medium text-gray-800">Bob Will</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      JS
                    </div>
                    <span className="font-medium text-gray-800">John Smith</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-600">2025-01-15</span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    ● Overdue
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">...</td>
                <td className="py-4 px-6">
                  <div className="flex gap-2 justify-center">
                    <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors group">
                      <FiEye className="text-gray-600 group-hover:text-blue-600 transition-colors" size={18} />
                    </button>
                    <button className="p-2 hover:bg-green-100 rounded-lg transition-colors group">
                      <FiEdit className="text-gray-600 group-hover:text-green-600 transition-colors" size={18} />
                    </button>
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors group">
                      <FiTrash2 className="text-gray-600 group-hover:text-red-600 transition-colors" size={18} />
                    </button>
                  </div>
                </td>
              </tr>

              {/* ROW 3 */}
              <tr className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                      AJ
                    </div>
                    <span className="font-medium text-gray-800">Alice John</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                      SR
                    </div>
                    <span className="font-medium text-gray-800">Steve Roy</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-600">2025-01-10</span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    ● Completed
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">...</td>
                <td className="py-4 px-6">
                  <div className="flex gap-2 justify-center">
                    <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors group">
                      <FiEye className="text-gray-600 group-hover:text-blue-600 transition-colors" size={18} />
                    </button>
                    <button className="p-2 hover:bg-green-100 rounded-lg transition-colors group">
                      <FiEdit className="text-gray-600 group-hover:text-green-600 transition-colors" size={18} />
                    </button>
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors group">
                      <FiTrash2 className="text-gray-600 group-hover:text-red-600 transition-colors" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">Showing 1 to 3 of 3 results</p>
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
    </div>
  );
}