import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";

const ProjectsTable = () => {
  const navigate = useNavigate();
  
  // State management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { id } = useParams();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const user = getCurrentUser();

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

  // Function to parse other_employees string to extract names and colors
  // Function to parse other_employees string to extract names and colors
const parseOtherEmployees = (otherEmployeesString) => {
  if (!otherEmployeesString) return [];
  
  // Split by comma to get individual employee entries
  const employees = otherEmployeesString.split(', ');
  
  return employees.map(employee => {
    // Split each entry by "||" to separate name from color
    const parts = employee.split('||#');
    
    if (parts.length >= 2) {
      const fullName = parts[0].trim();
      const formattedName = formatUserName(fullName);
      
      return {
        name: fullName, // Keep full name for searching/sorting
        displayName: formattedName, // Add formatted name for display
        color: `#${parts[1]}`
      };
    } else {
      // If no color code found, just return the name
      const fullName = employee.trim();
      const formattedName = formatUserName(fullName);
      
      return {
        name: fullName,
        displayName: formattedName,
        color: '#6366F1' // Default color
      };
    }
  });
};

// Function to format user name: FirstName LastInitial.
const formatUserName = (fullName) => {
  if (!fullName) return '';
  
  const names = fullName.trim().split(' ');
  
  if (names.length === 1) {
    // If only one name, return as is
    return names[0];
  } else {
    // Return first name + first letter of last name
    const firstName = names[0];
    const lastNameInitial = names[names.length - 1].charAt(0);
    return `${firstName} ${lastNameInitial}.`;
  }
};

// Also update parsePOCEmployees function similarly if needed
const parsePOCEmployees = (pocString) => {
  if (!pocString) return [];
  
  // Split by comma to get individual POC entries
  const pocs = pocString.split(', ');
  
  return pocs.map(poc => {
    // Split each entry by "||" to separate name from color
    const parts = poc.split('||#');
    
    if (parts.length >= 2) {
      const fullName = parts[0].trim();
      const formattedName = formatUserName(fullName);
      
      return {
        name: fullName,
        displayName: formattedName,
        color: `#${parts[1]}`
      };
    } else {
      // If no color code found, just return the name
      const fullName = poc.trim();
      const formattedName = formatUserName(fullName);
      
      return {
        name: fullName,
        displayName: formattedName,
        color: '#10B981' // Default color for POC
      };
    }
  });
};

  // Function to parse POC string
  // const parsePOCEmployees = (pocString) => {
  //   if (!pocString) return [];
    
  //   // Split by comma to get individual POC entries
  //   const pocs = pocString.split(', ');
    
  //   return pocs.map(poc => {
  //     // Split each entry by "||" to separate name from color
  //     const parts = poc.split('||#');
      
  //     if (parts.length >= 2) {
  //       return {
  //         name: parts[0].trim(),
  //         color: `#${parts[1]}`
  //       };
  //     } else {
  //       // If no color code found, just return the name
  //       return {
  //         name: poc.trim(),
  //         color: '#10B981' // Default color for POC
  //       };
  //     }
  //   });
  // };

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
            // Parse POC employees
            let pocArray = [];
            if (item.poc_employees) {
              pocArray = parsePOCEmployees(item.poc_employees);
            }
            
            // Parse other employees
            let otherEmployeesArray = [];
            if (item.other_employees) {
              otherEmployeesArray = parseOtherEmployees(item.other_employees);
            }
            
            // Create string versions for searching
            const pocNames = pocArray.map(poc => poc.name).join(', ');
            const otherEmployeeNames = otherEmployeesArray.map(emp => emp.name).join(', ');
            
            return {
              id: item.client_id,
              projectIndex: String(index + 1),
              projectName: item.client_name || '',
              description: item.description || '',
              startDate: item.start_date || '',
              status: item.status === "active" ? "Active" : "Inactive",
              poc: pocArray, // Array of objects with name and color
              pocString: pocNames, // String version for searching
              other_employees: otherEmployeesArray, // Array of objects with name and color
              otherEmployeesString: otherEmployeeNames, // String version for searching
              client_name: item.client_name || '',
              description: item.description || ''
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

    if (user && user.id && user.user_code) {
      fetchProjects();
    }
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
    if (!dateString) return "N/A";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
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

  // Enhanced search function - searches all columns
  const searchInAllColumns = (project, query) => {
    const searchTerms = query.toLowerCase().trim();
    
    if (!searchTerms) return true;
    
    // Search in project name
    if (project.projectName && project.projectName.toLowerCase().includes(searchTerms)) {
      return true;
    }
    
    // Search in description
    if (project.description && project.description.toLowerCase().includes(searchTerms)) {
      return true;
    }
    
    // Search in status
    if (project.status && project.status.toLowerCase().includes(searchTerms)) {
      return true;
    }
    
    // Search in POC (check each POC in the array)
    if (project.poc && Array.isArray(project.poc)) {
      for (const pocItem of project.poc) {
        if (pocItem.name && pocItem.name.toLowerCase().includes(searchTerms)) {
          return true;
        }
      }
    }
    
    // Search in POC string
    if (project.pocString && project.pocString.toLowerCase().includes(searchTerms)) {
      return true;
    }
    
    // Search in other employees (check each employee in the array)
    if (project.other_employees && Array.isArray(project.other_employees)) {
      for (const employee of project.other_employees) {
        if (employee.name && employee.name.toLowerCase().includes(searchTerms)) {
          return true;
        }
      }
    }
    
    // Search in other employees string
    if (project.otherEmployeesString && project.otherEmployeesString.toLowerCase().includes(searchTerms)) {
      return true;
    }
    
    // Search in start date (formatted)
    if (project.startDate) {
      const formattedDate = formatDate(project.startDate).toLowerCase();
      if (formattedDate.includes(searchTerms)) {
        return true;
      }
    }
    
    // Search in raw start date
    if (project.startDate && project.startDate.toLowerCase().includes(searchTerms)) {
      return true;
    }
    
    return false;
  };

  // Filter projects using enhanced search
  const filteredProjects = projects.filter(project => 
    searchInAllColumns(project, searchQuery)
  );

  // Apply sorting to filtered results
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.key === 'startDate') {
      const dateA = new Date(aValue || 0);
      const dateB = new Date(bValue || 0);
      if (dateA < dateB) return sortConfig.direction === "ascending" ? -1 : 1;
      if (dateA > dateB) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    } else if (sortConfig.key === 'poc') {
      // Sort by first POC name
      const pocA = (a.poc && a.poc[0]?.name) || '';
      const pocB = (b.poc && b.poc[0]?.name) || '';
      if (pocA.toLowerCase() < pocB.toLowerCase()) return sortConfig.direction === "ascending" ? -1 : 1;
      if (pocA.toLowerCase() > pocB.toLowerCase()) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    } else if (sortConfig.key === 'other_employees') {
      // Sort by first other employee name
      const empA = (a.other_employees && a.other_employees[0]?.name) || '';
      const empB = (b.other_employees && b.other_employees[0]?.name) || '';
      if (empA.toLowerCase() < empB.toLowerCase()) return sortConfig.direction === "ascending" ? -1 : 1;
      if (empA.toLowerCase() > empB.toLowerCase()) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    } else {
      const valA = (aValue || '').toString().toLowerCase();
      const valB = (bValue || '').toString().toLowerCase();
      if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5">
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
                {searchQuery && (
                  <p className="text-blue-100 text-sm mt-1">
                    Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} matching "{searchQuery}"
                  </p>
                )}
              </div>
              
              {/* Search Box */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by project name, POC, employees, status, date..."
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
                <p className="text-slate-600 text-lg font-semibold mb-2">
                  {searchQuery ? `No projects found for "${searchQuery}"` : "No projects found"}
                </p>
                <p className="text-slate-500 text-sm">
                  {searchQuery ? "Try different search terms" : "No projects available in the system"}
                </p>
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 mx-auto"
                  >
                    Clear Search
                  </button>
                )}
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
                          onClick={() => handleSort("other_employees")}
                        >
                          <div className="flex items-center gap-2">
                            Other Employees
                            <SortArrow columnKey="other_employees" />
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
                        {user.role !== "staff" && (
                          <th className="py-4 px-4 text-right font-semibold text-slate-700 rounded-tr-xl">
                            Actions
                          </th>
                        )}
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
                                {project.description && (
                                  <span className="text-slate-600 text-sm block mt-1 line-clamp-1">
                                    {project.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {project.poc && project.poc.length > 0 ? (
                                project.poc.map((pocItem, index) => (
                                  <span 
                                    key={index}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                                    style={{
                                      backgroundColor: `${pocItem.color}`,
                                      borderColor: `${pocItem.color}30`,
                                      color: '#fff'
                                    }}
                                  >
                                    {pocItem.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-sm">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {project.other_employees && project.other_employees.length > 0 ? (
                                project.other_employees.map((employee, index) => (
                                  <span 
                                    key={index}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                                    style={{
                                      backgroundColor: `${employee.color}`,
                                      borderColor: `${employee.color}30`,
                                      color: '#fff'
                                    }}
                                  >
                                    {employee.displayName || employee.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-sm">N/A</span>
                              )}
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
                          {user.role !== "staff" && (
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
                          )}
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
                        {project.description && (
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Description:</span>
                              <span className="text-slate-700 text-sm ml-2 block mt-1">
                                {project.description}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Point of Contact:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.poc && project.poc.length > 0 ? (
                                project.poc.map((pocItem, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 rounded-lg text-xs font-medium border"
                                    style={{
                                      backgroundColor: `${pocItem.color}15`,
                                      borderColor: `${pocItem.color}30`,
                                      color: pocItem.color
                                    }}
                                  >
                                    {pocItem.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-sm">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Other Employees:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.other_employees && project.other_employees.length > 0 ? (
                                project.other_employees.map((employee, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 rounded-lg text-xs font-medium border"
                                    style={{
                                      backgroundColor: `${employee.color}`,
                                      borderColor: `${employee.color}30`,
                                      color: '#fff'
                                    }}
                                  >
                                    {employee.displayName || employee.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-sm">N/A</span>
                              )}
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
                      
                      {user.role !== "staff" && (
                        <button 
                          onClick={() => handleEdit(project.id)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Project
                        </button>
                      )}
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
                  {searchQuery && (
                    <span className="text-blue-600 ml-2">
                      (Filtered from {projects.length} total)
                    </span>
                  )}
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