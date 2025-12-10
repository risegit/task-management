import React, { useEffect, useState } from "react";

export default function ViewEmployeesStyled() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    const storedEmployees = JSON.parse(localStorage.getItem("employees")) || [
      { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Admin" },
      { id: 2, name: "Sarah Johnson", email: "sarah.j@example.com", role: "Staff" },
      { id: 3, name: "Michael Lee", email: "mike.lee@example.com", role: "Staff" },
      { id: 4, name: "Priya Sharma", email: "priya.s@example.com", role: "Staff" },
      { id: 5, name: "1233 Sharma", email: "priya.s@example.com", role: "Manager" },
      
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

  return (
    <div className="w-full min-h-screen bg-gray-100 mt-10">
      <div className="mx-auto bg-white rounded-2xl shadow-xl p-6">
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 sm:px-6 py-5 sm:py-4 border-b">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Employee Management
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage employees
            </p>
          </div>

          <div className="mt-3 sm:mt-0 w-full sm:w-1/3 relative">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            />
         
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* <button 
          onClick={() => console.log("Searching...")}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <FiSearch size={18} />
          <span className="hidden sm:inline">Search</span>
        </button> */}
      </div>
    </div>

        <div className="p-4 sm:p-6">
          {currentEmployees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No employees found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="overflow-x-auto hidden lg:block">
                <table className="w-full table-fixed text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th
                        className="w-[30%] py-4 px-4 font-medium text-gray-700 text-left cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          <SortArrow columnKey="name" />
                        </div>
                      </th>
                      <th
                        className="w-[40%] py-4 px-4 font-medium text-gray-700 text-left cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          <SortArrow columnKey="email" />
                        </div>
                      </th>
                      <th
                        className="w-[30%] py-4 px-4 font-medium text-gray-700 text-left cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          <SortArrow columnKey="role" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        {/* Name */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-800 truncate">
                              {emp.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-gray-700 truncate">
                          <a
                            href={`mailto:${emp.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {emp.email}
                          </a>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4 text-gray-700 truncate">
                          <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                            {emp.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block lg:hidden space-y-5">
                {currentEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition bg-white"
                  >
                    <h3 className="font-semibold text-gray-800 text-lg mb-3">
                      {emp.name}
                    </h3>

                    <div className="space-y-3 mb-5">
                      {/* Email */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Email
                        </span>
                        <a
                          href={`mailto:${emp.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {emp.email}
                        </a>
                      </div>

                      {/* Role */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Role
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold w-fit bg-blue-100 text-blue-800 capitalize"
                        >
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <div className="px-5 sm:px-6 py-4 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstEmployee + 1} to{" "}
                {Math.min(indexOfLastEmployee, filteredEmployees.length)} of{" "}
                {filteredEmployees.length} employees
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg font-medium transition ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => goToPage(index + 1)}
                    className={`px-3 py-2 rounded-lg font-medium transition ${currentPage === index + 1
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg font-medium transition ${currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
</div>
  );
}