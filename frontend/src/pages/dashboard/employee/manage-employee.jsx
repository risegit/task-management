import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";

export default function ViewEmployeesStyled() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Search functionality - now includes dept_name

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // 🔹 Call API using axios (GET request)
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/emp.php`,
          {
            params: { 
              'all_emp': 'true',
            }
          }
        );

        // 🔹 Axios automatically converts response to JSON
        const result = response.data;
        console.log("API Response:", result);

        // 🔹 Check API status
        if (result.status === "success") {

          // 🔹 API sometimes returns data in "departments"
          if (Array.isArray(result.departments)) {
            setEmployees(result.departments);

          // 🔹 Or sometimes in "data"
          } else if (Array.isArray(result.data)) {
            setEmployees(result.data);

          // 🔹 If structure is not what we expect
          } else {
            console.warn("Unexpected API response structure:", result);
            setEmployees([]);
          }

        } else {
          // 🔹 API responded but status is not success
          console.warn("API returned error:", result.message);
          setEmployees([]);
        }
      } catch (error) {
        // 🔹 Axios throws error automatically for 4xx / 5xx
        console.error("Axios Error:", error);
        setEmployees([]);
      } finally {
        // 🔹 Stop loader no matter what happens
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Filter employees based on search query - includes dept_name
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
      (emp.dept_name && emp.dept_name.toLowerCase().includes(searchLower)) ||
      (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
      (emp.role && emp.role.toLowerCase().includes(searchLower)) ||
      (emp.department && emp.department.toLowerCase().includes(searchLower))
    );
  });

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Updated Sort arrow component
  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className={`w-4 h-4 text-blue-600 ${sortConfig.direction === "descending" ? "rotate-180" : ""} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // Sort the filtered employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.key) return 0;

    // Handle dept_name for sorting
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // For department sorting, use dept_name if available
    if (sortConfig.key === 'department') {
      aValue = a.dept_name || a.department || '';
      bValue = b.dept_name || b.department || '';
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = sortedEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Handle edit
  const handleEdit = (id) => {
    navigate(`/dashboard/employee/edit-employee/${id}`);
  };

  // Handle view details
  const handleView = (id) => {
    console.log('View employee:', id);
    // You can implement view functionality here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading employees...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Main Card */}
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>  
                  Employee Directory
                </h2>
                <p className="text-blue-100 mt-2">View and manage all employees in your organization</p>
              </div>
              
              {/* Search Box */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, department, email or role..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-blue-100 focus:border-white focus:bg-white/20 focus:ring-4 focus:ring-white/30 outline-none transition-all"
                  />
                  <svg className="w-5 h-5 text-blue-100 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button 
                      onClick={clearSearch} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-100 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {currentEmployees.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">No employees found</p>
                <p className="text-slate-500 text-sm">
                  {searchQuery ? "Try adjusting your search terms" : "No employees available in the system"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="overflow-x-auto hidden lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group rounded-tl-xl"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Name
                            <SortArrow columnKey="name" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            <SortArrow columnKey="email" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center gap-2">
                            Role
                            <SortArrow columnKey="role" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort('department')}
                        >
                          <div className="flex items-center gap-2">
                            Department
                            <SortArrow columnKey="department" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            <SortArrow columnKey="status" />
                          </div>
                        </th>
                        {user?.role == "admin" && (
                        <th className="py-4 px-4 text-right font-semibold text-slate-700 rounded-tr-xl">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentEmployees.map((emp) => (
                        <tr 
                          key={emp.id || emp.emp_id} 
                          className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all">
                                <span className="text-white font-bold text-sm">
                                  {emp.name ? emp.name.charAt(0).toUpperCase() : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {emp.name || 'No Name'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {emp.email ? (
                              <a 
                                href={`mailto:${emp.email}`} 
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                title={emp.email}
                              >
                                {emp.email}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">No email</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                              {(emp.role || emp.position || 'Employee').charAt(0).toUpperCase() + (emp.role || emp.position || 'Employee').slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-block bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border border-purple-200">
                              {emp.dept_name || emp.department || 'No Department'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${
                              (emp.status === "active" || emp.status === 1) 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" 
                                : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                            }`}>
                              {(emp.status === "active" || emp.status === 1) ? "Active" : "Inactive"}
                            </span>
                          </td>
                          {user?.role == "admin" && (
                            <td className="py-4 px-4 text-right">
                              <button 
                                onClick={() => handleEdit(emp.id || emp.emp_id)} 
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2 ml-auto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-4">
                  {currentEmployees.map((emp) => (
                    <div key={emp.id || emp.emp_id} className="border-2 border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 hover:border-blue-300 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                          <span className="text-white font-bold text-lg">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg mb-1">
                            {emp.name || 'No Name'}
                          </h3>
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                            {emp.role || emp.position || 'Employee'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {emp.email ? (
                            <a 
                              href={`mailto:${emp.email}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-sm"
                            >
                              {emp.email}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-sm">No email</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold inline-block bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border border-purple-200">
                            {emp.dept_name || emp.department || 'No Department'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleEdit(emp.id || emp.emp_id)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Employee
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {sortedEmployees.length > 0 && (
            <div className="px-6 py-5 border-t-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-slate-900">{indexOfFirstEmployee + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastEmployee, sortedEmployees.length)}</span> of <span className="font-bold text-slate-900">{sortedEmployees.length}</span> employees
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goToPrevious} 
                    disabled={currentPage === 1} 
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      currentPage === 1 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm border-2 border-slate-200"
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button 
                      key={index + 1} 
                      onClick={() => goToPage(index + 1)} 
                      className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                        currentPage === index + 1 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200" 
                          : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm border-2 border-slate-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button 
                    onClick={goToNext} 
                    disabled={currentPage === totalPages} 
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      currentPage === totalPages 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm border-2 border-slate-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}