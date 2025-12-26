import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManageDepartment = () => {
  const departmentsData = [
    { id: 1, name: "Engineering", description: "Product development team", status: "active" },
    { id: 2, name: "Human Resources", description: "Employee management", status: "active" },
    { id: 3, name: "Marketing", description: "Brand promotion", status: "inactive" },
    { id: 4, name: "Sales", description: "Client acquisition", status: "active" },
    { id: 5, name: "Finance", description: "Budget management", status: "active" },
  ];

  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState(departmentsData);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/department.php`);

        const result = await response.json();
        console.log("Departments API:", result);

        if (result.status === "success") {
          // FIXED: Use result.departments instead of result.data
          if (result.departments && Array.isArray(result.departments)) {
            setDepartments(result.departments);
          } else if (result.data && Array.isArray(result.data)) {
            // Fallback to data if departments doesn't exist
            setDepartments(result.data);
          } else {
            console.warn("Unexpected API response structure:", result);
            // Keep the default data if API structure is unexpected
            setDepartments(departmentsData);
          }
        } else {
          console.warn("API returned error:", result.message);
          // Keep the default data if API fails
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        // Keep the default data on error
        setDepartments(departmentsData);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort arrow component
  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className={`w-4 h-4 ml-1 ${sortConfig.direction === "asc" ? "text-blue-500" : "text-blue-500 rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // Filter departments
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sorting to filtered results
  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
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
  console.log("Current routes available?");
  navigate(`/dashboard/department/edit-dept/${id}`);
};
  
  const goToPage = (page) => setCurrentPage(page);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-100 mt-10 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-800">Loading departments...</h3>
            <p className="text-gray-600 mt-2">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 mt-10">
      <div className="mx-auto bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Manage Departments</h2>
            <p clfssName="text-sm text-gray-600">View and manage all departments</p>
          </div>
          <div className="mt-3 sm:mt-0 w-full sm:w-1/3 relative">
            <input
              type="text"
              placeholder="Search departments..."
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
          {currentDepartments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No departments found</p>
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
                        className="py-4 px-4 font-medium text-gray-700 w-[35%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Department Name
                          <SortArrow columnKey="name" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[45%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center">
                          Description
                          <SortArrow columnKey="description" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[12%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortArrow columnKey="status" />
                        </div>
                      </th>
                      <th className="py-4 px-4 font-medium text-gray-700 w-[8%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDepartments.map((dept) => (
                      <tr key={dept.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">{dept.name ? dept.name.charAt(0) : "?"}</span>
                            </div>
                            <span className="font-medium text-gray-800">{dept.name || "Unnamed"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{dept.description || "No description"}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${(dept.status === "active" || dept.status === 1) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {(dept.status === "active" || dept.status === 1) ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleEdit(dept.id)} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
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
                {currentDepartments.map((dept) => (
                  <div key={dept.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">{dept.name ? dept.name.charAt(0) : "?"}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{dept.name || "Unnamed"}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${(dept.status === "active" || dept.status === 1) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {(dept.status === "active" || dept.status === 1) ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{dept.description || "No description"}</p>
                    <button 
                      onClick={() => handleEdit(dept.id)} 
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {filteredDepartments.length > 0 && (
          <div className="px-5 py-4 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedDepartments.length)} of {sortedDepartments.length} departments
              </p>
              <div className="flex items-center gap-2">
                <button onClick={goToPrevious} disabled={currentPage === 1} className={`px-3 py-2 rounded-lg ${currentPage === 1 ? "bg-gray-200 text-gray-400" : "bg-white border text-gray-700"}`}>
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button key={index + 1} onClick={() => goToPage(index + 1)} className={`px-3 py-2 rounded-lg ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-white border text-gray-700"}`}>
                    {index + 1}
                  </button>
                ))}
                <button onClick={goToNext} disabled={currentPage === totalPages} className={`px-3 py-2 rounded-lg ${currentPage === totalPages ? "bg-gray-200 text-gray-400" : "bg-white border text-gray-700"}`}>
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

export default ManageDepartment;