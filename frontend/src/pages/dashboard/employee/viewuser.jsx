import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ViewEmployeesStyled() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage] = useState(5);
  
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchEmployees = async () => {
  //     try {
  //       const response = await fetch(
  //         `${import.meta.env.VITE_API_URL}api/emp.php`
  //       );

  //       const result = await response.json();
  //       console.log("API Response:", result);

  //       if (result.status === "success") {
  //         if (result.departments && Array.isArray(result.departments)) {
  //           setEmployees(result.departments);
  //         } else if (result.data && Array.isArray(result.data)) {
  //           setEmployees(result.data);
  //         } else {
  //           console.warn("Unexpected API response structure:", result);
  //           setEmployees([]);
  //         }
  //       } else {
  //         console.warn("API returned error:", result.message);
  //         setEmployees([]);
  //       }
  //     } catch (error) {
  //       console.error("Fetch Error:", error);
  //       setEmployees([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchEmployees();
  // }, []);

  // Search functionality - now includes dept_name

 useEffect(() => {
  const fetchEmployees = async () => {
    try {
      // 🔹 Call API using axios (GET request)
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/emp.php`
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

  // Sort arrow component
  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
      </span>
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
    navigate(`/dashboard/employee/edit-user/${id}`);
  };

  // Handle view details
  const handleView = (id) => {
    console.log('View employee:', id);
    // You can implement view functionality here
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-100 mt-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
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
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Employee Management</h2>
            <p className="text-sm text-gray-600">View and manage all employees</p>
          </div>
          <div className="mt-3 sm:mt-0 w-full sm:w-1/3 relative">
            <input
              type="text"
              placeholder="Search by name, department, email or role..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          {currentEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg mb-2">No employees found</p>
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'Try a different search term' : 'No employees available in the system'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="overflow-x-auto hidden lg:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[20%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          <SortArrow columnKey="name" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[25%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          <SortArrow columnKey="email" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[15%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          <SortArrow columnKey="role" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[20%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center">
                          Department
                          <SortArrow columnKey="department" />
                        </div>
                      </th>
                      <th className="py-4 px-4 font-medium text-gray-700 w-[20%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.map((emp) => (
                      <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">
                                {emp.name ? emp.name.charAt(0).toUpperCase() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 block">
                                {emp.name || 'No Name'}
                              </span>
                      
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {emp.email ? (
                            <a 
                              href={`mailto:${emp.email}`} 
                              className="text-blue-600 hover:underline truncate block"
                              title={emp.email}
                            >
                              {emp.email}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">No email</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize inline-block">
                            {emp.role || emp.position || 'Employee'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 capitalize">
                            {emp.dept_name || emp.department || 'No Department'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(emp.id || emp.emp_id)} 
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block lg:hidden space-y-4">
                {currentEmployees.map((emp) => (
                  <div key={emp.id || emp.emp_id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {emp.name || 'No Name'}
                            </h3>
                        

                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize">
                            {emp.role || emp.position || 'Employee'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1 font-medium">Email:</p>
                        {emp.email ? (
                          <a 
                            href={`mailto:${emp.email}`} 
                            className="text-blue-600 hover:underline text-sm block truncate"
                            title={emp.email}
                          >
                            {emp.email}
                          </a>
                        ) : (
                          <span className="text-gray-400 italic text-sm">No email</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1 font-medium">Department:</p>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {emp.dept_name || emp.department || 'No Department'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                      
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
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
        {sortedEmployees.length > 0 && (
          <div className="px-5 py-4 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstEmployee + 1} to {Math.min(indexOfLastEmployee, sortedEmployees.length)} of {sortedEmployees.length} employees
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={goToPrevious} 
                  disabled={currentPage === 1} 
                  className={`px-3 py-2 rounded-lg transition-colors duration-200 ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button 
                    key={index + 1} 
                    onClick={() => goToPage(index + 1)} 
                    className={`px-3 py-2 rounded-lg transition-colors duration-200 ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button 
                  onClick={goToNext} 
                  disabled={currentPage === totalPages} 
                  className={`px-3 py-2 rounded-lg transition-colors duration-200 ${currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
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
}