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
  const [sortConfig, setSortConfig] = useState({ key: "total_tasks", direction: "descending" });
  
  // Temporary filter states
  const [tempPeriodFilter, setTempPeriodFilter] = useState(null);
  const [tempTaskFilter, setTempTaskFilter] = useState(null);
  const [tempDeptFilter, setTempDeptFilter] = useState(null);
  const [tempEmployeeFilter, setTempEmployeeFilter] = useState(null);
  
  // Date Range Filter States
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [employeesRangeFilter, setEmployeesRangeFilter] = useState([]);
  const [selectedEmployeeDateFilter, setSelectedEmployeeDateFilter] = useState(null);
  
  // Applied filter states
  const [appliedPeriodFilter, setAppliedPeriodFilter] = useState(null);
  const [appliedTaskFilter, setAppliedTaskFilter] = useState(null);
  const [appliedDeptFilter, setAppliedDeptFilter] = useState(null);
  const [appliedEmployeeFilter, setAppliedEmployeeFilter] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [showExport, setShowExport] = useState(false);

  const user = getCurrentUser();
  const userId = user?.id;
  const userCode = user?.user_code;
  const userRole = user?.role;

  // Filter options
  const taskFilterOptions = [
    { value: "today", label: "Today's Tasks", color: "#3b82f6" },
    { value: "week", label: "This Week", color: "#8b5cf6" },
    { value: "month", label: "This Month", color: "#ec4899" },
    { value: "all", label: "All Tasks", color: "#6b7280" },
  ];

  const workloadFilterOptions = [
    { value: "all", label: "All Workloads", color: "#6b7280" },
    { value: "overloaded", label: "Overloaded (>7 tasks)", color: "#ef4444" },
    { value: "high", label: "High (6-7 tasks)", color: "#f59e0b" },
    { value: "medium", label: "Medium (5-6 tasks)", color: "#3b82f6" },
    { value: "low", label: "Low (3-4 tasks)", color: "#10b981" },
    { value: "idle", label: "Idle (≤2 tasks)", color: "#6b7280" },
  ];

  // Helper function to get workload category
  const getWorkloadCategory = (totalTasks) => {
    const tasks = parseInt(totalTasks) || 0;
    if (tasks <= 2) return { label: "Idle", color: "#6b7280", bg: "bg-gray-100" };
    if (tasks <= 4) return { label: "Low", color: "#10b981", bg: "bg-green-100" };
    if (tasks <= 6) return { label: "Medium", color: "#3b82f6", bg: "bg-blue-100" };
    if (tasks <= 7) return { label: "High", color: "#f59e0b", bg: "bg-amber-100" };
    return { label: "Overloaded", color: "#ef4444", bg: "bg-red-100" };
  };

  // Helper function to get workload percentage
  const getWorkloadPercentage = (totalTasks) => {
    const maxTasks = 30;
    const percentage = Math.min((parseInt(totalTasks) / maxTasks) * 100, 100);
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

  // Handle Date Range Submit
  const handleDateRangeSubmit = async () => {
    if (tempFromDate && tempToDate) {
      setAppliedFromDate(tempFromDate);
      setAppliedToDate(tempToDate);
      setDateFilterApplied(true);
      setAppliedPeriodFilter(null);
      setTempPeriodFilter(null);
      setCurrentPage(1);
      await fetchEmployeeTaskDataWithDateRange(tempFromDate, tempToDate, selectedEmployeeDateFilter);
    }
  };

  // Handle Date Employee Filter Change
  const handleDateEmployeeFilterChange = (selected) => {
    setSelectedEmployeeDateFilter(selected);
    if (tempFromDate && tempToDate) {
      fetchEmployeeTaskDataWithDateRange(tempFromDate, tempToDate, selected);
    }
  };

  // Handle Temp From Date Change
  const handleTempFromDateChange = (e) => {
    setTempFromDate(e.target.value);
    if (tempToDate && e.target.value > tempToDate) {
      setTempToDate('');
    }
  };

  // Handle Temp To Date Change
  const handleTempToDateChange = (e) => {
    setTempToDate(e.target.value);
  };

  // Handle Workload Category Change (Auto-filter)
  const handleWorkloadFilterChange = (selected) => {
    setTempTaskFilter(selected);
    setAppliedTaskFilter(selected);
    setCurrentPage(1);
  };

  // Handle Department Change (Auto-filter)
  const handleDeptFilterChange = (selected) => {
    setTempDeptFilter(selected);
    setAppliedDeptFilter(selected);
    setCurrentPage(1);
  };

  // Handle Employee Change (Auto-filter)
  const handleEmployeeFilterChange = (selected) => {
    setTempEmployeeFilter(selected);
    setAppliedEmployeeFilter(selected);
    setCurrentPage(1);
  };

  // Function to fetch data with date range
  const fetchEmployeeTaskDataWithDateRange = async (fromDate, toDate, employeeFilter) => {
    if (!userId || !userCode) return;
    
    try {
      setFilterLoading(true);
      
      const params = {
        id: userId,
        user_code: userCode,
        work_load_data: true,
        from_date: fromDate,
        to_date: toDate,
        // employee_id: employeeFilter?.value || ''
      };

      console.log("Sending date range params to API:", params);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/reports.php`,
        { params }
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status === "success" && result.data && result.data.length > 0) {
        setShowExport(true);
      } else {
        setShowExport(false);
      }
      
      if (result.status === "success" && result.data) {
        const transformedData = result.data.map(item => ({
          id: item.user_id,
          empName: item.employee_name || 'Unknown',
          deptName: item.department_name || 'No Department',
          deptId: item.department_id,
          notAcknowledge: parseInt(item.not_ack_count) || 0,
          acknowledge: parseInt(item.ack_count) || 0,
          inprogress: parseInt(item.in_progress_count) || 0,
          totalWork: parseInt(item.total_tasks) || 0,
          completionRate: item.total_tasks > 0 
            ? Math.round(((parseInt(item.ack_count) + parseInt(item.in_progress_count)) / parseInt(item.total_tasks)) * 100) 
            : 0,
          pendingTasks: parseInt(item.not_ack_count) || 0,
          workloadCategory: getWorkloadCategory(parseInt(item.total_tasks) || 0),
          workloadPercentage: getWorkloadPercentage(parseInt(item.total_tasks) || 0)
        }));
        
        setEmployeeData(transformedData);
        
        const deptOptions = extractDepartments(result.data);
        setDepartments(deptOptions);
        
        const empOptions = extractEmployees(result.data);
        setEmployees(empOptions);
        
        const empRangeOptions = extractEmployeesForRange(result.data);
        setEmployeesRangeFilter(empRangeOptions);
      } else {
        setEmployeeData([]);
        setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
        setEmployees([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
        setEmployeesRangeFilter([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
      }
    } catch (error) {
      console.error("Error fetching employee task data with date range:", error);
      setEmployeeData([]);
      setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
      setEmployees([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
      setEmployeesRangeFilter([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  // Handle submit button click for quick period filters
  const handleSubmitFilters = async () => {
    // Clear date range filter when applying regular filters
    setDateFilterApplied(false);
    setAppliedFromDate('');
    setAppliedToDate('');
    setTempFromDate('');
    setTempToDate('');
    setSelectedEmployeeDateFilter(null);
    
    const periodValue = tempPeriodFilter;
    const taskValue = tempTaskFilter;
    const deptValue = tempDeptFilter;
    const employeeValue = tempEmployeeFilter;
    
    setAppliedPeriodFilter(periodValue);
    setAppliedTaskFilter(taskValue);
    setAppliedDeptFilter(deptValue);
    setAppliedEmployeeFilter(employeeValue);
    setCurrentPage(1);
    
    await fetchEmployeeTaskDataWithFilters(periodValue, taskValue, deptValue, employeeValue);
  };

  // Function to extract unique departments from API response
  const extractDepartments = (data) => {
    const uniqueDepartments = new Map();
    const deptOptions = [{ value: "all", label: "All Departments", color: "#3b82f6" }];
    
    data.forEach(item => {
      if (item.department_name && !uniqueDepartments.has(item.department_name)) {
        uniqueDepartments.set(item.department_name, {
          value: item.department_id || item.department_name,
          label: item.department_name,
          color: "#6b7280"
        });
      }
    });
    
    uniqueDepartments.forEach(dept => {
      deptOptions.push(dept);
    });
    
    return deptOptions;
  };

  // Function to extract unique employees from API response
  const extractEmployees = (data) => {
    const uniqueEmployees = new Map();
    const empOptions = [{ value: "all", label: "All Employees", color: "#3b82f6" }];
    
    data.forEach(item => {
      if (item.employee_name && !uniqueEmployees.has(item.user_id)) {
        uniqueEmployees.set(item.user_id, {
          value: item.user_id,
          label: item.employee_name,
          color: "#10b981"
        });
      }
    });
    
    uniqueEmployees.forEach(emp => {
      empOptions.push(emp);
    });
    
    return empOptions;
  };

  // Function to extract unique employees for date range filter
  const extractEmployeesForRange = (data) => {
    const uniqueEmployees = new Map();
    const empOptions = [{ value: "all", label: "All Employees", color: "#3b82f6" }];
    
    data.forEach(item => {
      if (item.employee_name && !uniqueEmployees.has(item.user_id)) {
        uniqueEmployees.set(item.user_id, {
          value: item.user_id,
          label: item.employee_name,
          color: "#10b981"
        });
      }
    });
    
    uniqueEmployees.forEach(emp => {
      empOptions.push(emp);
    });
    
    return empOptions;
  };

  // Function to fetch data with specific filters
  const fetchEmployeeTaskDataWithFilters = async (periodFilter, taskFilter, deptFilter, employeeFilter) => {
    if (!userId || !userCode) return;
    
    try {
      setFilterLoading(true);
      
      const params = {
        id: userId,
        user_code: userCode,
        work_load_data: true,
        task_filter: periodFilter?.value || 'today',
        dept_id: deptFilter?.value || '',
      };

      if (taskFilter?.value && taskFilter.value !== 'all') {
        params.workload_filter = taskFilter.value;
      }

      console.log("Sending params to API:", params);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/reports.php`,
        { params }
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status === "success" && result.data && result.data.length > 0) {
        setShowExport(true);
      } else {
        setShowExport(false);
      }
      
      if (result.status === "success" && result.data) {
        const transformedData = result.data.map(item => ({
          id: item.user_id,
          empName: item.employee_name || 'Unknown',
          deptName: item.department_name || 'No Department',
          deptId: item.department_id,
          notAcknowledge: parseInt(item.not_ack_count) || 0,
          acknowledge: parseInt(item.ack_count) || 0,
          inprogress: parseInt(item.in_progress_count) || 0,
          totalWork: parseInt(item.total_tasks) || 0,
          completionRate: item.total_tasks > 0 
            ? Math.round(((parseInt(item.ack_count) + parseInt(item.in_progress_count)) / parseInt(item.total_tasks)) * 100) 
            : 0,
          pendingTasks: parseInt(item.not_ack_count) || 0,
          workloadCategory: getWorkloadCategory(parseInt(item.total_tasks) || 0),
          workloadPercentage: getWorkloadPercentage(parseInt(item.total_tasks) || 0)
        }));
        
        setEmployeeData(transformedData);
        
        const deptOptions = extractDepartments(result.data);
        setDepartments(deptOptions);
        
        const empOptions = extractEmployees(result.data);
        setEmployees(empOptions);
      } else {
        setEmployeeData([]);
        setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
        setEmployees([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
      }
    } catch (error) {
      console.error("Error fetching employee task data:", error);
      setEmployeeData([]);
      setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
      setEmployees([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  // Original fetch function for initial load
  const fetchEmployeeTaskData = async () => {
    if (!userId || !userCode) return;
    
    try {
      setFilterLoading(true);
      const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Kolkata',
});
      const params = {
        id: userId,
        user_code: userCode,
        work_load_data: true,
        from_date: today,
        to_date: today,
      };

      if (appliedTaskFilter?.value && appliedTaskFilter.value !== 'all') {
        params.workload_filter = appliedTaskFilter.value;
      }

      console.log("Sending params to API:", params);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/reports.php`,
        { params }
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status === "success" && result.data && result.data.length > 0) {
        setShowExport(true);
      } else {
        setShowExport(false);
      }
      
      if (result.status === "success" && result.data) {
        const transformedData = result.data.map(item => ({
          id: item.user_id,
          empName: item.employee_name || 'Unknown',
          deptName: item.department_name || 'No Department',
          deptId: item.department_id,
          notAcknowledge: parseInt(item.not_ack_count) || 0,
          acknowledge: parseInt(item.ack_count) || 0,
          inprogress: parseInt(item.in_progress_count) || 0,
          totalWork: parseInt(item.total_tasks) || 0,
          completionRate: item.total_tasks > 0 
            ? Math.round(((parseInt(item.ack_count) + parseInt(item.in_progress_count)) / parseInt(item.total_tasks)) * 100) 
            : 0,
          pendingTasks: parseInt(item.not_ack_count) || 0,
          workloadCategory: getWorkloadCategory(parseInt(item.total_tasks) || 0),
          workloadPercentage: getWorkloadPercentage(parseInt(item.total_tasks) || 0)
        }));
        
        setEmployeeData(transformedData);
        
        const deptOptions = extractDepartments(result.data);
        setDepartments(deptOptions);
        
        const empOptions = extractEmployees(result.data);
        setEmployees(empOptions);
        
        const empRangeOptions = extractEmployeesForRange(result.data);
        setEmployeesRangeFilter(empRangeOptions);
      } else {
        setEmployeeData([]);
        setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
        setEmployees([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
        setEmployeesRangeFilter([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
      }
    } catch (error) {
      console.error("Error fetching employee task data:", error);
      setEmployeeData([]);
      setDepartments([{ value: "all", label: "All Departments", color: "#3b82f6" }]);
      setEmployees([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
      setEmployeesRangeFilter([{ value: "all", label: "All Employees", color: "#3b82f6" }]);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
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

  // Initial data fetch
  useEffect(() => {
    if (userId && userCode) {
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
    if (appliedTaskFilter && appliedTaskFilter.value !== "all") {
      switch(appliedTaskFilter.value) {
        case "overloaded":
          data = data.filter(item => item.totalWork > 7);
          break;
        case "high":
          data = data.filter(item => item.totalWork > 5 && item.totalWork < 8);
          break;
        case "medium":
          data = data.filter(item => item.totalWork > 4 && item.totalWork < 7);
          break;
        case "low":
          data = data.filter(item => item.totalWork > 2 && item.totalWork < 5);
          break;
        case "idle":
          data = data.filter(item => item.totalWork <= 2);
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
  }, [employeeData, appliedDeptFilter, appliedEmployeeFilter, appliedTaskFilter, searchQuery, sortConfig]);

  // Calculate workload statistics
  const workloadStats = useMemo(() => {
    const total = employeeData.length;
    const overloaded = employeeData.filter(e => e.totalWork > 7).length;
    const high = employeeData.filter(e => e.totalWork > 6 && e.totalWork <= 7).length;
    const medium = employeeData.filter(e => e.totalWork > 4 && e.totalWork <= 6).length;
    const low = employeeData.filter(e => e.totalWork > 2 && e.totalWork <= 4).length;
    const idle = employeeData.filter(e => e.totalWork <= 2).length;
    
    return { total, overloaded, high, medium, low, idle };
  }, [employeeData]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  // Clear all filters
  const clearAllFilters = async () => {
    setTempPeriodFilter(null);
    setTempTaskFilter(null);
    setTempDeptFilter(null);
    setTempEmployeeFilter(null);
    setTempFromDate('');
    setTempToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setDateFilterApplied(false);
    setSelectedEmployeeDateFilter(null);
    
    setAppliedPeriodFilter(null);
    setAppliedTaskFilter(null);
    setAppliedDeptFilter(null);
    setAppliedEmployeeFilter(null);
    setSearchQuery("");
    setCurrentPage(1);
    setShowExport(false);
    
    await fetchEmployeeTaskDataWithFilters(null, null, null, null);
  };

  // Clear left column filters (Date Range)
  const clearLeftColumnFilters = async () => {
    setTempFromDate('');
    setTempToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setDateFilterApplied(false);
    setSelectedEmployeeDateFilter(null);
    setCurrentPage(1);
    
    // await fetchEmployeeTaskDataWithFilters(appliedPeriodFilter, appliedTaskFilter, appliedDeptFilter, appliedEmployeeFilter);
    await fetchEmployeeTaskData();
  };

  // Clear right column filters (Workload, Department, Employee)
  const clearRightColumnFilters = async () => {
    setTempTaskFilter(null);
    setTempDeptFilter(null);
    setTempEmployeeFilter(null);
    setAppliedTaskFilter(null);
    setAppliedDeptFilter(null);
    setAppliedEmployeeFilter(null);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const headers = [
      "Employee",
      "Department",
      "Not Acknowledge",
      "Acknowledge",
      "In Progress",
      "Total Tasks"
    ];

    const rows = filteredAndSortedData.map(item => [
      item.empName,
      item.deptName,
      item.notAcknowledge,
      item.acknowledge,
      item.inprogress,
      item.totalWork
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_workload_" + new Date().toISOString().slice(0, 10) + ".csv");
    document.body.appendChild(link);
    link.click();
  };

  // Check if any filter is applied
  const hasActiveFilters = appliedPeriodFilter || appliedTaskFilter || appliedDeptFilter || appliedEmployeeFilter || searchQuery || dateFilterApplied;

  // Check if left column has active filters
  const hasLeftColumnFilters = dateFilterApplied;

  // Check if right column has active filters
  const hasRightColumnFilters = appliedTaskFilter || appliedDeptFilter || appliedEmployeeFilter;

  // Calculate active tasks count for export
  const activeTasksCount = filteredAndSortedData.reduce((total, item) => total + item.totalWork, 0);

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

  const filterDropdownStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      padding: '2px 4px',
      backgroundColor: 'white',
      minHeight: '38px',
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters:
                </h2>
                {(hasLeftColumnFilters || hasRightColumnFilters || searchQuery) && (
                  <button 
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-white rounded-full shadow-sm"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
              
              {/* Updated Grid Layout - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Date Range Filter */}
                <div className="border-r-2 border-blue-200 pr-0 lg:pr-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-blue-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date Range Filter:
                    </h2>
                    {hasLeftColumnFilters && (
                      <button 
                        onClick={clearLeftColumnFilters}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-white rounded-full shadow-sm"
                      >
                        Clear Date Filter
                      </button>
                    )}
                  </div>

                  {/* Date Range Filter Section - From and To Date side by side */}
                  <div className="flex flex-row gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                      <input
                        type="date"
                        value={tempFromDate}
                        onChange={handleTempFromDateChange}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                      <input
                        type="date"
                        value={tempToDate}
                        onChange={handleTempToDateChange}
                        min={tempFromDate}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* Employee Filter in Date Range Section */}
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <div className="w-full mb-3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Employee (Date Range)</label>
                      <Select
                        options={employeesRangeFilter}
                        value={selectedEmployeeDateFilter}
                        onChange={handleDateEmployeeFilterChange}
                        classNamePrefix="react-select"
                        styles={filterDropdownStyles}
                        placeholder="Select Employee (Optional)"
                        isClearable={true}
                        isSearchable={true}
                        isMulti={false}
                        formatOptionLabel={(option) => (
                          <div className="flex items-center gap-2">
                            {option.value === "all" && (
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            )}
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {/* Submit Button for Date Range */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleDateRangeSubmit}
                      disabled={filterLoading || (!tempFromDate && !tempToDate)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        filterLoading || (!tempFromDate && !tempToDate)
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-200'
                      }`}
                    >
                      {filterLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Applying...</span>
                        </>
                      ) : (
                        'Apply Date Range'
                      )}
                    </button>
                    {(tempFromDate || tempToDate) && (
                      <button
                        onClick={() => {
                          setTempFromDate('');
                          setTempToDate('');
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-all"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Export Button - Visible when date range is applied */}
                  {dateFilterApplied && (
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:shadow-green-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export to Excel ({filteredAndSortedData.length})
                      </button>
                      <p className="text-xs text-green-600 mt-1 text-center">
                        Exporting tasks from selected date range
                      </p>
                    </div>
                  )}

                  {/* Regular Export Button (when no date range applied) */}
                  {showExport && !dateFilterApplied && filteredAndSortedData.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-green-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 8l-4-4m4 4l4-4M4 20h16" />
                        </svg>
                        Export to Excel ({filteredAndSortedData.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column - Workload Category, Department, and Employee (Auto-filter) */}
                <div className="pl-0 lg:pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-blue-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter Options:
                    </h2>
                    {hasRightColumnFilters && (
                      <button 
                        onClick={clearRightColumnFilters}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-white rounded-full shadow-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Workload Category Dropdown - Auto-filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Workload Category</label>
                      <Select
                        options={workloadFilterOptions}
                        value={tempTaskFilter}
                        onChange={handleWorkloadFilterChange}
                        styles={dropdownStyles}
                        placeholder="Filter by Load"
                        isClearable={true}
                      />
                    </div>

                    {/* Department Dropdown - Auto-filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                      <Select
                        options={departments}
                        value={tempDeptFilter}
                        onChange={handleDeptFilterChange}
                        styles={dropdownStyles}
                        placeholder="Select Department"
                        isClearable={true}
                        isLoading={departments.length === 0}
                      />
                    </div>

                    {/* Employee Dropdown - Auto-filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Employee</label>
                      <Select
                        options={employees}
                        value={tempEmployeeFilter}
                        onChange={handleEmployeeFilterChange}
                        styles={dropdownStyles}
                        placeholder="Select Employee"
                        isClearable={true}
                        isSearchable={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-600">
                  Showing {filteredAndSortedData.length} of {employeeData.length} employees
                  {searchQuery && ` matching "${searchQuery}"`}
                  {dateFilterApplied && ` (Date Range: ${appliedFromDate} to ${appliedToDate})`}
                  {appliedTaskFilter && appliedTaskFilter.value !== 'all' && ` | Workload: ${appliedTaskFilter.label}`}
                  {appliedDeptFilter && appliedDeptFilter.value !== 'all' && ` | Dept: ${appliedDeptFilter.label}`}
                  {appliedEmployeeFilter && appliedEmployeeFilter.value !== 'all' && ` | Employee: ${appliedEmployeeFilter.label}`}
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

                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 border border-red-200 shadow-sm">
                                <span className="text-red-600 font-bold text-sm">
                                  {item.notAcknowledge}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
                                <span className="text-blue-600 font-bold text-sm">
                                  {item.acknowledge}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                                <span className="text-amber-600 font-bold text-sm">
                                  {item.inprogress}
                                </span>
                              </div>
                            </div>
                          </td>

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
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>entries per page</span>
                </div>

                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {filteredAndSortedData.length === 0 ? 0 : indexOfFirstItem + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(indexOfLastItem, filteredAndSortedData.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredAndSortedData.length}
                  </span>{" "}
                  entries
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    &lt; Prev
                  </button>

                  {(() => {
                    const pages = [];
                    const total = totalPages;

                    if (total <= 5) {
                      for (let i = 1; i <= total; i++) {
                        pages.push(i);
                      }
                    } else {
                      if (currentPage <= 3) {
                        pages.push(1, 2, 3, "...", total);
                      } else if (currentPage >= total - 2) {
                        pages.push(1, "...", total - 2, total - 1, total);
                      } else {
                        pages.push(1, "...", currentPage, "...", total);
                      }
                    }

                    return pages.map((page, index) =>
                      page === "..." ? (
                        <span key={index} className="px-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-md border text-sm ${
                            currentPage === page
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    );
                  })()}

                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Next &gt;
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