import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { getCurrentUser } from "../../../utils/api";
import axios from "axios";

const EmployeeTaskSheet = () => {
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "totalWork", direction: "descending" });
  
  // Temporary filter states
  const [tempTaskFilter, setTempTaskFilter] = useState(null);
  const [tempDeptFilter, setTempDeptFilter] = useState(null);
  const [tempEmployeeFilter, setTempEmployeeFilter] = useState(null);
  
  // Applied filter states
  const [appliedTaskFilter, setAppliedTaskFilter] = useState(null);
  const [appliedDeptFilter, setAppliedDeptFilter] = useState(null);
  const [appliedEmployeeFilter, setAppliedEmployeeFilter] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const user = getCurrentUser();
  const userId = user?.id;
  const userCode = user?.user_code;

  // Filter options
  const taskFilterOptions = [
    { value: "today", label: "Today's Tasks", color: "#3b82f6" },
    { value: "week", label: "This Week", color: "#8b5cf6" },
    { value: "month", label: "This Month", color: "#ec4899" },
    { value: "all", label: "All Tasks", color: "#6b7280" },
  ];

  const workloadFilterOptions = [
    { value: "all", label: "All Workloads", color: "#6b7280" },
    { value: "overloaded", label: "Overloaded (>8 tasks)", color: "#ef4444" },
    { value: "high", label: "High (6-8 tasks)", color: "#f59e0b" },
    { value: "medium", label: "Medium (3-5 tasks)", color: "#3b82f6" },
    { value: "low", label: "Low (1-2 tasks)", color: "#10b981" },
    { value: "idle", label: "Idle (0 tasks)", color: "#6b7280" },
  ];

  const paginationSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  // Helper function to get workload category
  const getWorkloadCategory = (totalTasks) => {
    if (totalTasks === 0) return { label: "Idle", color: "#6b7280", bg: "bg-gray-100" };
    if (totalTasks <= 5) return { label: "Low", color: "#10b981", bg: "bg-green-100" };
    if (totalTasks <= 10) return { label: "Medium", color: "#3b82f6", bg: "bg-blue-100" };
    if (totalTasks <= 20) return { label: "High", color: "#f59e0b", bg: "bg-amber-100" };
    return { label: "Overloaded", color: "#ef4444", bg: "bg-red-100" };
  };

  // Helper function to get workload percentage for progress bar
  const getWorkloadPercentage = (totalTasks) => {
    const maxTasks = 30; // Consider 30 tasks as 100% workload
    const percentage = Math.min((totalTasks / maxTasks) * 100, 100);
    return percentage;
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

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

  // Handle submit button click
  const handleSubmitFilters = () => {
    setAppliedTaskFilter(tempTaskFilter);
    setAppliedDeptFilter(tempDeptFilter);
    setAppliedEmployeeFilter(tempEmployeeFilter);
    setCurrentPage(1);
    fetchEmployeeTaskData();
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Fetch departments from department.php API
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/department.php`,
        {
          params: {
            // id: userId,
            // user_code: userCode
          }
        }
      );

      const result = response.data;
      
      if (result.status === "success" && result.data) {
        const deptOptions = [
          { value: "all", label: "All Departments", color: "#3b82f6" },
          ...result.data.map(dept => ({
            value: dept.id,
            label: dept.name,
            color: "#6b7280"
          }))
        ];
        setDepartments(deptOptions);
      } else {
        // Fallback to empty array with "All Departments"
        setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Fallback to empty array with "All Departments"
      setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
    }
  };

  // Fetch data
  const fetchEmployeeTaskData = async () => {
    if (!userId || !userCode) return;
    
    try {
      setFilterLoading(true); 
      
      const params = {
        id: userId,
        user_code: userCode,
        work_load_data: true,
        task_filter: appliedTaskFilter?.value || 'one_month',
        dept_id: appliedDeptFilter?.value || '',
        employee_id: appliedEmployeeFilter?.value || ''
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/reports.php`,
        { params }
      );

      const result = response.data;
      
      if (result.status === "success") {
        // Transform the data with additional calculated fields
        const transformedData = result.data.map(item => ({
          id: item.employee_id,
          empName: item.employee_name || 'Unknown',
          deptName: item.department_name || 'No Department',
          notAcknowledge: parseInt(item.not_acknowledge_count) || 0,
          acknowledge: parseInt(item.acknowledge_count) || 0,
          inprogress: parseInt(item.in_progress_count) || 0,
          totalWork: parseInt(item.total_tasks) || 0,
          completionRate: item.total_tasks > 0 
            ? Math.round(((parseInt(item.acknowledge_count) + parseInt(item.in_progress_count)) / parseInt(item.total_tasks)) * 100) 
            : 0,
          pendingTasks: parseInt(item.not_acknowledge_count) || 0,
          workloadCategory: getWorkloadCategory(parseInt(item.total_tasks) || 0),
          workloadPercentage: getWorkloadPercentage(parseInt(item.total_tasks) || 0)
        }));
        
        setEmployeeData(transformedData);
        
        // Set employees for dropdown from the response
        if (result.employees) {
          const empOptions = [
            { value: "all", label: "All Employees", color: "#3b82f6" },
            ...result.employees.map(emp => ({
              value: emp.id,
              label: emp.name,
              color: "#10b981"
            }))
          ];
          setEmployees(empOptions);
        }
      } else {
        setEmployeeData([]);
      }
    } catch (error) {
      console.error("Error fetching employee task data:", error);
      setEmployeeData([]);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  // Initial data fetch - fetch departments and employee task data
  useEffect(() => {
    if (userId && userCode) {
      // Fetch departments first
      fetchDepartments();
      // Then fetch employee task data
      fetchEmployeeTaskData();
    }
  }, [userId, userCode]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let data = [...employeeData];
    
    // Apply department filter
    if (appliedDeptFilter && appliedDeptFilter.value !== "all") {
      data = data.filter(item => item.deptName === appliedDeptFilter.label);
    }
    
    // Apply employee filter
    if (appliedEmployeeFilter && appliedEmployeeFilter.value !== "all") {
      data = data.filter(item => item.empName === appliedEmployeeFilter.label);
    }
    
    // Apply workload category filter
    if (tempTaskFilter) {
      switch(tempTaskFilter.value) {
        case "overloaded":
          data = data.filter(item => item.totalWork > 20);
          break;
        case "high":
          data = data.filter(item => item.totalWork > 10 && item.totalWork <= 20);
          break;
        case "medium":
          data = data.filter(item => item.totalWork > 5 && item.totalWork <= 10);
          break;
        case "low":
          data = data.filter(item => item.totalWork > 0 && item.totalWork <= 5);
          break;
        case "idle":
          data = data.filter(item => item.totalWork === 0);
          break;
        default:
          break;
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      data = data.filter(item => {
        return (
          (item.empName && item.empName.toLowerCase().includes(query)) ||
          (item.deptName && item.deptName.toLowerCase().includes(query)) ||
          item.notAcknowledge.toString().includes(query) ||
          item.acknowledge.toString().includes(query) ||
          item.inprogress.toString().includes(query) ||
          item.totalWork.toString().includes(query) ||
          item.workloadCategory.label.toLowerCase().includes(query)
        );
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'empName' || sortConfig.key === 'deptName') {
          aValue = aValue || '';
          bValue = bValue || '';
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    
    return data;
  }, [employeeData, appliedDeptFilter, appliedEmployeeFilter, tempTaskFilter, searchQuery, sortConfig]);

  // Calculate workload statistics
  const workloadStats = useMemo(() => {
    const total = employeeData.length;
    const overloaded = employeeData.filter(e => e.totalWork > 20).length;
    const high = employeeData.filter(e => e.totalWork > 10 && e.totalWork <= 20).length;
    const medium = employeeData.filter(e => e.totalWork > 5 && e.totalWork <= 10).length;
    const low = employeeData.filter(e => e.totalWork > 0 && e.totalWork <= 5).length;
    const idle = employeeData.filter(e => e.totalWork === 0).length;
    
    return { total, overloaded, high, medium, low, idle };
  }, [employeeData]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  // Clear all filters
  const clearAllFilters = () => {
    setTempTaskFilter(null);
    setTempDeptFilter(null);
    setTempEmployeeFilter(null);
    setAppliedTaskFilter(null);
    setAppliedDeptFilter(null);
    setAppliedEmployeeFilter(null);
    setSearchQuery("");
    setCurrentPage(1);
    fetchEmployeeTaskData();
  };

  // Check if any filter is applied
  const hasActiveFilters = appliedTaskFilter || appliedDeptFilter || appliedEmployeeFilter || searchQuery || tempTaskFilter;

  // Styles for dropdowns
  const dropdownStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      padding: '4px 8px',
      backgroundColor: 'white',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      "&:hover": {
        borderColor: '#94a3b8',
      },
      width: '100%',
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : state.data.color || '#334155',
      fontWeight: state.isSelected ? '600' : '500',
    }),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading employee workload data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5">
      {/* Main Card */}
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-visible">
          {/* Card Header with Search */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  Employee Workload Dashboard
                </h2>
                <p className="text-blue-100 mt-2">Track and analyze task distribution across employees</p>
              </div>
              
              {/* Search Input */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, department, or workload..."
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

          {/* Workload Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-slate-50 border-b border-slate-200">
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
              <p className="text-xs text-slate-500 mb-1">Overloaded</p>
              <p className="text-2xl font-bold text-red-600">{workloadStats.overloaded}</p>
              <p className="text-xs text-slate-400">employees</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500">
              <p className="text-xs text-slate-500 mb-1">High Load</p>
              <p className="text-2xl font-bold text-amber-600">{workloadStats.high}</p>
              <p className="text-xs text-slate-400">employees</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-slate-500 mb-1">Medium Load</p>
              <p className="text-2xl font-bold text-blue-600">{workloadStats.medium}</p>
              <p className="text-xs text-slate-400">employees</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
              <p className="text-xs text-slate-500 mb-1">Low Load</p>
              <p className="text-2xl font-bold text-green-600">{workloadStats.low}</p>
              <p className="text-xs text-slate-400">employees</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-500">
              <p className="text-xs text-slate-500 mb-1">Idle</p>
              <p className="text-2xl font-bold text-gray-600">{workloadStats.idle}</p>
              <p className="text-xs text-slate-400">employees</p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-6">
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters:
                </h2>
                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-white rounded-full shadow-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Task Filter Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Time Period</label>
                  <Select
                    options={taskFilterOptions}
                    value={tempTaskFilter}
                    onChange={setTempTaskFilter}
                    styles={dropdownStyles}
                    placeholder="Select Period"
                    isClearable={true}
                  />
                </div>

                {/* Workload Filter Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Workload Category</label>
                  <Select
                    options={workloadFilterOptions}
                    value={tempTaskFilter}
                    onChange={setTempTaskFilter}
                    styles={dropdownStyles}
                    placeholder="Filter by Load"
                    isClearable={true}
                  />
                </div>

                {/* Department Dropdown - Now populated from department.php API */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                  <Select
                    options={departments}
                    value={tempDeptFilter}
                    onChange={setTempDeptFilter}
                    styles={dropdownStyles}
                    placeholder="Select Department"
                    isClearable={true}
                    isLoading={departments.length === 0} // Show loading state if no departments
                  />
                </div>

                {/* Employee Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Employee</label>
                  <Select
                    options={employees}
                    value={tempEmployeeFilter}
                    onChange={setTempEmployeeFilter}
                    styles={dropdownStyles}
                    placeholder="Select Employee"
                    isClearable={true}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleSubmitFilters}
                    disabled={filterLoading}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      filterLoading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-200'
                    }`}
                  >
                    {filterLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Apply Filters
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-600">
                  Showing {filteredAndSortedData.length} of {employeeData.length} employees
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            </div>

            {/* Enhanced Table with Workload Visualization */}
            {currentItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">
                  No employee data found
                </p>
                <p className="text-slate-500 text-sm">
                  {hasActiveFilters 
                    ? "Try adjusting your filters or search query" 
                    : "No data available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th 
                        className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort("empName")}
                      >
                        <div className="flex items-center gap-2">
                          Employee & Department
                          <SortArrow columnKey="empName" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 text-center font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort("notAcknowledge")}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          Not-Ack
                          <SortArrow columnKey="notAcknowledge" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 text-center font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort("acknowledge")}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          Ack
                          <SortArrow columnKey="acknowledge" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 text-center font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort("inprogress")}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          In Progress
                          <SortArrow columnKey="inprogress" />
                        </div>
                      </th>
                      <th 
                        className="py-4 px-4 text-center font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort("totalWork")}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          Total Work
                          <SortArrow columnKey="totalWork" />
                        </div>
                      </th>
                      <th className="py-4 px-4 text-left font-semibold text-slate-700">
                        Workload Status
                      </th>
                      <th className="py-4 px-4 text-left font-semibold text-slate-700">
                        Progress
                      </th>
                    </tr>
                  </thead>
                 <tbody>
                  {currentItems.map((item, index) => {
                    const workloadCategory = getWorkloadCategory(item.totalWork);

                    return (
                      <tr
                        key={item.id || index}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200"
                      >
                        {/* Employee */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                              {item.empName ? item.empName.charAt(0).toUpperCase() : "E"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {item.empName}
                              </span>
                              <span className="text-xs text-slate-500">
                                {item.deptName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Not Ack */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 border border-red-200 shadow-sm">
                              <span className="text-red-600 font-bold text-sm">
                                {item.notAcknowledge}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Ack */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
                              <span className="text-blue-600 font-bold text-sm">
                                {item.acknowledge}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* In Progress */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                              <span className="text-amber-600 font-bold text-sm">
                                {item.inprogress}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Work */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-md ${workloadCategory.bg}`}
                            >
                              <span
                                className="font-bold text-base"
                                style={{ color: workloadCategory.color }}
                              >
                                {item.totalWork}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Workload Status */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-3 py-1.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: workloadCategory.color + "20",
                                color: workloadCategory.color,
                                border: `1px solid ${workloadCategory.color}40`,
                              }}
                            >
                              {workloadCategory.label}
                            </span>
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-4 px-4">
                          <div className="w-36">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">
                                Completion
                              </span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: workloadCategory.color }}
                              >
                                {item.completionRate}%
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.completionRate}%`,
                                  backgroundColor: workloadCategory.color,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredAndSortedData.length > 0 && (
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredAndSortedData.length)}</span>{' '}
                  of <span className="font-bold text-slate-900">{filteredAndSortedData.length}</span> employees
                </p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1} 
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      currentPage === 1 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  
                  <span className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                    disabled={currentPage === totalPages} 
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      currentPage === totalPages 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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

export default EmployeeTaskSheet;