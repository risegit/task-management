import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManageDepartment = () => {
  // Updated sample data with new columns
  const departmentsData = [
  
    { 
      id: 2, 
      name: "Human Resources", 
      description: "Employee management", 
      assignedBy: "Sarah Chen",
      assignedTo: ["Mike Brown"],
      deadline: "2024-11-15",
      status: "active",
      remark: "Recruitment drive ongoing"
    },
    { 
      id: 3, 
      name: "Marketing", 
      description: "Brand promotion", 
      assignedBy: "David Lee",
      assignedTo: ["Emma Davis", "James Miller", "Lisa Taylor"],
      deadline: "2024-10-30",
      status: "inactive",
      remark: "Campaign on hold"
    },
    { 
      id: 4, 
      name: "Sales", 
      description: "Client acquisition", 
      assignedBy: "Robert King",
      assignedTo: ["Sophia White"],
      deadline: "2024-12-20",
      status: "active",
      remark: "Quarterly targets"
    },
    { 
      id: 5, 
      name: "Finance", 
      description: "Budget management", 
      assignedBy: "Maria Garcia",
      assignedTo: ["Tom Anderson", "Chris Evans"],
      deadline: "2024-11-30",
      status: "active",
      remark: "Annual audit preparation"
    },
  ];

  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState(departmentsData);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/department.php`);
        const result = await response.json();
        console.log("Departments API:", result);

        if (result.status === "success") {
          if (result.departments && Array.isArray(result.departments)) {
            setDepartments(result.departments);
          } else if (result.data && Array.isArray(result.data)) {
            setDepartments(result.data);
          } else {
            console.warn("Unexpected API response structure:", result);
            setDepartments(departmentsData);
          }
        } else {
          console.warn("API returned error:", result.message);
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setDepartments(departmentsData);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Sort arrow component
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

  // Filter departments
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dept.assignedBy && dept.assignedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dept.remark && dept.remark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Apply sorting to filtered results
  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = sortedDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDepartments.length / itemsPerPage);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  const clearSearch = () => setSearchQuery("");
  
  // Navigate to edit department page
  const handleEdit = (id) => {
    console.log("Attempting to navigate to:", `/dashboard/department/edit-dept/${id}`);
    navigate(`/dashboard/department/edit-dept/${id}`);
  };
  
  // Navigate to view department page
  const handleView = (id) => {
    console.log("View department:", id);
    navigate(`/dashboard/department/view-dept/${id}`);
  };
  
  const goToPage = (page) => setCurrentPage(page);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if deadline is upcoming or overdue
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "text-slate-500";
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 font-semibold";
    if (diffDays <= 7) return "text-amber-600 font-semibold";
    return "text-green-600 font-medium";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading departments...</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Department Directory
                </h2>
                <p className="text-blue-100 mt-2">View and manage all departments with task assignments</p>
              </div>
              
              {/* Search Box */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, description, assigned by, or remark..."
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
            {currentDepartments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">No departments found</p>
                <p className="text-slate-500 text-sm">
                  {searchQuery ? "Try adjusting your search terms" : "No departments available in the system"}
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
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Department Name
                            <SortArrow columnKey="name" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("assignedBy")}
                        >
                          <div className="flex items-center gap-2">
                            Assigned By
                            <SortArrow columnKey="assignedBy" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            Assigned To
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("deadline")}
                        >
                          <div className="flex items-center gap-2">
                            Deadline
                            <SortArrow columnKey="deadline" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            <SortArrow columnKey="status" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            Remark
                          </div>
                        </th>
                        <th className="py-4 px-4 text-right font-semibold text-slate-700 rounded-tr-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDepartments.map((dept) => (
                        <tr 
                          key={dept.id} 
                          className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all">
                                <span className="text-white font-bold text-sm">
                                  {dept.name ? dept.name.charAt(0).toUpperCase() : "D"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {dept.name || "Unnamed Department"}
                                </span>
                                <span className="text-xs text-slate-500 mt-1 block">
                                  {dept.description || "No description"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span className="font-medium text-slate-800">
                                {dept.assignedBy || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {Array.isArray(dept.assignedTo) && dept.assignedTo.length > 0 ? (
                                dept.assignedTo.slice(0, 2).map((person, index) => (
                                  <span 
                                    key={index}
                                    className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                                  >
                                    {person}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-sm">No assignments</span>
                              )}
                              {Array.isArray(dept.assignedTo) && dept.assignedTo.length > 2 && (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                  +{dept.assignedTo.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <svg className={`w-4 h-4 ${getDeadlineStatus(dept.deadline)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className={`${getDeadlineStatus(dept.deadline)}`}>
                                {formatDate(dept.deadline)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${
                              (dept.status === "active" || dept.status === 1) 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" 
                                : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                            }`}>
                              {(dept.status === "active" || dept.status === 1) ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="max-w-xs">
                              <span className="text-sm text-slate-700 line-clamp-2">
                                {dept.remark || "No remarks"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleView(dept.id)} 
                                className="px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-slate-200 hover:scale-105 transition-all flex items-center gap-2"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleEdit(dept.id)} 
                                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2"
                                title="Edit Department"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-4">
                  {currentDepartments.map((dept) => (
                    <div key={dept.id} className="border-2 border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 hover:border-blue-300 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                          <span className="text-white font-bold text-lg">
                            {dept.name ? dept.name.charAt(0).toUpperCase() : "D"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg mb-1">
                            {dept.name || "Unnamed Department"}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${
                              (dept.status === "active" || dept.status === 1) 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" 
                                : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                            }`}>
                              {(dept.status === "active" || dept.status === 1) ? "Active" : "Inactive"}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className={`${getDeadlineStatus(dept.deadline)}`}>
                                {formatDate(dept.deadline)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Assigned By:</span>
                            <span className="text-slate-800 font-medium ml-2">{dept.assignedBy || "N/A"}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-700">Assigned To:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(dept.assignedTo) && dept.assignedTo.length > 0 ? (
                                dept.assignedTo.slice(0, 3).map((person, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                                  >
                                    {person}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-sm">No assignments</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Description:</span>
                            <span className="text-slate-700 text-sm ml-2 block mt-1">
                              {dept.description || "No description available"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Remark:</span>
                            <span className="text-slate-700 text-sm ml-2 block mt-1">
                              {dept.remark || "No remarks"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                        <button 
                          onClick={() => handleView(dept.id)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button 
                          onClick={() => handleEdit(dept.id)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {sortedDepartments.length > 0 && (
            <div className="px-6 py-5 border-t-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, sortedDepartments.length)}</span> of <span className="font-bold text-slate-900">{sortedDepartments.length}</span> departments
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
};

export default ManageDepartment;