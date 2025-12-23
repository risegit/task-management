import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const ProjectsTable = () => {
  // Sample data - replace with your actual data
  const initialProjects = [
    { id: 1, projectName: 'Website Redesign', poc: ['John Doe', 'Jane Smith'], startDate: '2024-01-15', status: 'Active' },
    { id: 2, projectName: 'Mobile App Development', poc: ['Robert Johnson'], startDate: '2024-02-01', status: 'Active' },
    { id: 3, projectName: 'CRM Implementation', poc: ['Emily Williams', 'Michael Brown'], startDate: '2023-12-10', status: 'Inactive' },
    { id: 4, projectName: 'Cloud Migration', poc: ['Sarah Davis'], startDate: '2024-03-05', status: 'Active' },
    { id: 5, projectName: 'Data Analytics Platform', poc: ['David Wilson', 'Lisa Miller'], startDate: '2024-01-30', status: 'Active' },
    { id: 6, projectName: 'E-commerce Integration', poc: ['John Doe'], startDate: '2023-11-20', status: 'Inactive' },
    { id: 7, projectName: 'Security Audit', poc: ['Michael Brown'], startDate: '2024-02-28', status: 'Active' },
    { id: 8, projectName: 'API Gateway Setup', poc: ['Jane Smith', 'Robert Johnson'], startDate: '2024-03-10', status: 'Active' },
  ];

    const navigate = useNavigate();

  // State management
  const [projects, setProjects] = useState(initialProjects);
  const [filteredProjects, setFilteredProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'projectName', direction: 'ascending' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sort Arrow Component
  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'ascending' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
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
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.projectName.toLowerCase().includes(query) ||
        project.poc.some(poc => poc.toLowerCase().includes(query)) ||
        project.status.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    }
    setCurrentPage(1); // Reset to first page on search
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredProjects(projects);
  };

  // Handle edit
//   const handleEdit = (id) => {
//     console.log('Edit project with id:', id);
//     // Add your edit logic here
//     alert(`Edit project with ID: ${id}`);
//   };

  const handleEdit = (id) => {
    navigate(`/dashboard/project/edit-project`);
  };

  // Sort projects
  const sortedProjects = React.useMemo(() => {
    const sortableItems = [...filteredProjects];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Handle different data types
        if (sortConfig.key === 'startDate') {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        } else if (sortConfig.key === 'poc') {
          // Sort by first POC name
          const pocA = a[sortConfig.key][0] || '';
          const pocB = b[sortConfig.key][0] || '';
          if (pocA.toLowerCase() < pocB.toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (pocA.toLowerCase() > pocB.toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        } else {
          // For strings
          const aValue = a[sortConfig.key] || '';
          const bValue = b[sortConfig.key] || '';
          if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  // Pagination handlers
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const goToNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevious = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="w-full min-h-screen bg-gray-100 mt-10">
      <div className="mx-auto bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Manage Projects</h2>
            <p className="text-sm text-gray-600">View and manage all projects</p>
          </div>
          <div className="mt-3 sm:mt-0 w-full sm:w-1/3 relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          {currentProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No projects found</p>
              {searchQuery && (
                <p className="text-gray-400 mt-2">Try adjusting your search query</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="overflow-x-auto hidden lg:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[30%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('projectName')}
                      >
                        <div className="flex items-center">
                          Project Name
                          <SortArrow columnKey="projectName" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[25%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('poc')}
                      >
                        <div className="flex items-center">
                          POC
                          <SortArrow columnKey="poc" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[20%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('startDate')}
                      >
                        <div className="flex items-center">
                          Start Date
                          <SortArrow columnKey="startDate" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[15%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortArrow columnKey="status" />
                        </div>
                      </th>
                      <th className="py-4 px-4 font-medium text-gray-700 w-[10%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProjects.map((project) => (
                      <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">
                                {project.projectName ? project.projectName.charAt(0) : "P"}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800">{project.projectName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          <div className="flex flex-wrap gap-1">
                            {project.poc.map((person, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                              >
                                {person}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {formatDate(project.startDate)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            project.status === "Active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleEdit(project.id)} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 ml-auto"
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

              {/* Mobile View */}
              <div className="block lg:hidden space-y-4">
                {currentProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {project.projectName ? project.projectName.charAt(0) : "P"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{project.projectName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          project.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">POC</p>
                        <div className="flex flex-wrap gap-1">
                          {project.poc.map((person, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Start Date</p>
                        <p className="text-gray-700">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleEdit(project.id)} 
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
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
          <div className="px-5 py-4 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedProjects.length)} of {sortedProjects.length} projects
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={goToPrevious} 
                  disabled={currentPage === 1} 
                  className={`px-3 py-2 rounded-lg ${currentPage === 1 ? "bg-gray-200 text-gray-400" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button 
                    key={index + 1} 
                    onClick={() => goToPage(index + 1)} 
                    className={`px-3 py-2 rounded-lg ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button 
                  onClick={goToNext} 
                  disabled={currentPage === totalPages} 
                  className={`px-3 py-2 rounded-lg ${currentPage === totalPages ? "bg-gray-200 text-gray-400" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsTable;