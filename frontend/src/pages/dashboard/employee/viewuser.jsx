import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ViewEmployeesStyled() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const storedEmployees = JSON.parse(localStorage.getItem("employees")) || [
      { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Admin" },
      { id: 2, name: "Sarah Johnson", email: "sarah.j@example.com", role: "Staff" },
      { id: 3, name: "Michael Lee", email: "mike.lee@example.com", role: "Staff" },
      { id: 4, name: "Priya Sharma", email: "priya.s@example.com", role: "Staff" },
      { id: 5, name: "Robert Chen", email: "robert.c@example.com", role: "Manager" },
    ];
    setEmployees(storedEmployees);
  }, []);

  // Search functionality
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
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

  // Handle edit - navigate to edit user page
const handleEdit = (id) => {
  navigate(`/dashboard/employee/edit-user`);
};

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
              placeholder="Search employees..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
              <p className="text-gray-500 text-lg">No employees found</p>
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
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          <SortArrow columnKey="email" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 font-medium text-gray-700 w-[12%] cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          <SortArrow columnKey="role" />
                        </div>
                      </th>
                      <th className="py-4 px-4 font-medium text-gray-700 w-[8%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.map((emp) => (
                      <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">{emp.name.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-gray-800">{emp.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          <a 
                            href={`mailto:${emp.email}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {emp.email}
                          </a>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize">
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleEdit(emp.id)} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
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
                {currentEmployees.map((emp) => (
                  <div key={emp.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">{emp.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{emp.name}</h3>
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize">
                          {emp.role}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span>{" "}
                        <a 
                          href={`mailto:${emp.email}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {emp.email}
                        </a>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleEdit} 
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
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
        {filteredEmployees.length > 0 && (
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