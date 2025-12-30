import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ProjectsTable = () => {

  const navigate = useNavigate();

  // State management
  const [projects, setProjects] = useState([]);
  const [project_assign, setProjectAssign] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { id } = useParams();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort Arrow Component
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

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/project.php`,
          {
            params: { 
              user_id: user.id,
              user_code: user.user_code
            }
          }
        );

        const result = response.data;
        console.log("API Response:", result);

        if (result.status === "success") {

          const normalizedProjects = result.project.map((item, index) => {
            
            return {
              id: item.client_id,        // used for routing
              projectIndex: String(index + 1), // used for mapping
              projectName: item.client_name,
              description: item.description,
              startDate: item.start_date,
              status: item.status === "active" ? "Active" : "Inactive",
              poc: item.poc_employee,
              other_employees: item.other_employees
            };
          });

          setProjects(normalizedProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Axios Error:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);




  // Handle sorting
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Search function
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle edit
  const handleEdit = (id) => {
    navigate(`/dashboard/projects/edit-project/${id}`);
  };

  // Filter projects
  const filteredProjects = projects.filter(project =>
    project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.poc.some(poc => poc.toLowerCase().includes(searchQuery.toLowerCase())) ||
    project.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sorting to filtered results
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.key === 'startDate') {
      const dateA = new Date(aValue);
      const dateB = new Date(bValue);
      if (dateA < dateB) return sortConfig.direction === "ascending" ? -1 : 1;
      if (dateA > dateB) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    } else if (sortConfig.key === 'poc') {
      // Sort by first POC name
      const pocA = aValue[0] || '';
      const pocB = bValue[0] || '';
      if (pocA.toLowerCase() < pocB.toLowerCase()) return sortConfig.direction === "ascending" ? -1 : 1;
      if (pocA.toLowerCase() > pocB.toLowerCase()) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    } else {
      if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    }
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  // Pagination handlers
  const goToPage = (page) => setCurrentPage(page);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
          <p className="mt-6 text-slate-600 font-medium">Loading projects...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
     

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
                  Project Directory
                </h2>
                <p className="text-blue-100 mt-2">View and manage all projects in your organization</p>
              </div>
              
              {/* Search Box */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by project name, POC, or status..."
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
            {currentProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">No projects found</p>
                <p className="text-slate-500 text-sm">
                  {searchQuery ? "Try adjusting your search terms" : "No projects available in the system"}
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
                          onClick={() => handleSort("projectName")}
                        >
                          <div className="flex items-center gap-2">
                            Project Name
                            <SortArrow columnKey="projectName" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("poc")}
                        >
                          <div className="flex items-center gap-2">
                            Point of Contact (POC)
                            <SortArrow columnKey="poc" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("poc")}
                        >
                          <div className="flex items-center gap-2">
                            Others
                            <SortArrow columnKey="poc" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("startDate")}
                        >
                          <div className="flex items-center gap-2">
                            Start Date
                            <SortArrow columnKey="startDate" />
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
                        <th className="py-4 px-4 text-right font-semibold text-slate-700 rounded-tr-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProjects.map((project) => (
                        <tr 
                          key={project.id} 
                          className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all">
                                <span className="text-white font-bold text-sm">
                                  {project.projectName ? project.projectName.charAt(0).toUpperCase() : "P"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {project.projectName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                                <span 
                                  className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                                >
                                  {project.poc || "N/A"}
                                </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                                <span 
                                  className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                                >
                                  {project.other_employees || "N/A"}
                                </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-slate-700 font-medium">
                                {formatDate(project.startDate)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${
                              project.status === "Active" 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" 
                                : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => handleEdit(project.id)} 
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2 ml-auto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-4">
                  {currentProjects.map((project) => (
                    <div key={project.id} className="border-2 border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 hover:border-blue-300 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                          <span className="text-white font-bold text-lg">
                            {project.projectName ? project.projectName.charAt(0).toUpperCase() : "P"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg mb-1">
                            {project.projectName || "Unnamed Project"}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${
                            project.status === "Active" 
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" 
                              : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Point of Contact:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                <span 
                                  className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                                >
                                  {project.poc || "N/A"}
                                </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Start Date:</span>
                            <span className="text-slate-800 font-medium ml-2">
                              {formatDate(project.startDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleEdit(project.id)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Project
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {sortedProjects.length > 0 && (
            <div className="px-6 py-5 border-t-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, sortedProjects.length)}</span> of <span className="font-bold text-slate-900">{sortedProjects.length}</span> projects
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

export default ProjectsTable;