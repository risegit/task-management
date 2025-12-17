import React, { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";

export default function ViewEmployeesStyled() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedEmployees = JSON.parse(localStorage.getItem("employees")) || [
      { id: 1, name: "John Doe", email: "john.doe@example.com", role: "assignee" },
      { id: 2, name: "Sarah Johnson", email: "sarah.j@example.com", role: "assigner" },
      { id: 3, name: "Michael Lee", email: "mike.lee@example.com", role: "assignee" },
      { id: 4, name: "Priya Sharma", email: "priya.s@example.com", role: "assigner" },
      { id: 5, name: "1233 Sharma", email: "priya.s@example.com", role: "assigner" }
    ];
    setEmployees(storedEmployees);
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
            {filtered.length} Employees
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center p-5 text-gray-500">
                    No matching employees
                  </td>
                </tr>
              ) : (
                filtered.map((emp, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="py-4 px-6 font-medium text-gray-800">{emp.name}</td>
                    <td className="py-4 px-6 text-gray-600">{emp.email}</td>
                    <td className="py-4 px-6 capitalize text-gray-700">{emp.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">Total: {employees.length}</p>
        </div>
      </div>
    </div>
  );
}
