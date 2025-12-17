import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManageDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}api/department.php`
        );

        const result = await response.json();
        console.log("Departments API:", result);

        if (result.status === "success") {
          setDepartments(result.data); // 👈 API data
        } else {
          alert(result.message || "Failed to load departments");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        alert("Something went wrong while fetching departments");
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
  const handleEdit = (userId) => {
    navigate(`/dashboard/department/editdept/${userId}`);
  };
  const goToPage = (page) => setCurrentPage(page);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="w-full min-h-screen bg-gray-100 mt-10">
      <div className="mx-auto bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Manage Departments</h2>
            <p className="text-sm text-gray-600">View and manage all departments</p>
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
              <p className="text-gray-500 text-lg">No departments found</p>
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
                          Name
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
                              <span className="text-blue-600 font-bold">{dept.name.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-gray-800">{dept.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{dept.description}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${dept.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {dept.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button onClick={() => handleEdit(dept.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
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
                        <span className="text-blue-600 font-bold text-lg">{dept.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{dept.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${dept.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {dept.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
                    <button onClick={() => handleEdit(dept.id)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
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