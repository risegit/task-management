import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Main ManageDepartment Component
const Tasksheet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [tasks, setTasks] = useState([]);
  const [filteredApiTasks, setFilteredApiTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [selectedDeadlineFilter, setSelectedDeadlineFilter] = useState(null);
  
  // State for date range filter
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  
  const user = getCurrentUser();
  const userRole = user?.role || 'staff';
  
  const userId = user?.id;
  const userCode = user?.user_code;
  const userName = user?.name;
  
  const hasFetched = useRef(false);
  
  const paginationSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 250, label: "250 per page" },
  ];
  
  const statusOptions = [
    { value: "all", label: "All Status", color: "#6b7280" },
    { value: "not-acknowledge", label: "Not-Acknowledge", color: "#ef4444" },
    { value: "acknowledge", label: "Acknowledge", color: "#3b82f6" },
    { value: "in-progress", label: "In-progress", color: "#f59e0b" },
    { value: "completed", label: "Completed", color: "#10b981" },
    { value: "overdue", label: "Overdue", color: "#dc2626" },
  ];
  
  const deadlineOptions = [
    { value: "all", label: "All Deadlines", color: "#6b7280" },
    { value: "currentAndFuture", label: "Current & Future", color: "#10b981" },
    { value: "overdueOnly", label: "Overdue Only", color: "#dc2626" },
  ];

  // Parse filter parameters from location state
  useEffect(() => {
    if (location.state) {
      const filterBy = location.state.filterBy || null;
      const employeeName = location.state.employeeName || null;
      const statusFilter = location.state.statusFilter || null;
      const deadlineFilter = location.state.deadlineFilter || null;
      const fromDateParam = location.state.fromDate || null;
      const toDateParam = location.state.toDate || null;
      
      // Clear the location state
      window.history.replaceState({}, document.title);
      
      if (filterBy === "employee" && employeeName) {
        setSearchQuery(employeeName);
      }
      
      if (statusFilter) {
        const statusOption = statusOptions.find(opt => 
          opt.value.toLowerCase() === statusFilter.toLowerCase() ||
          opt.label.toLowerCase() === statusFilter.toLowerCase()
        );
        if (statusOption) {
          setSelectedStatusFilter(statusOption);
        }
      }
      
      if (deadlineFilter) {
        const deadlineOption = deadlineOptions.find(opt => 
          opt.value.toLowerCase() === deadlineFilter.toLowerCase()
        );
        if (deadlineOption) {
          setSelectedDeadlineFilter(deadlineOption);
        }
      }

      // Set date range filters if provided
      if (fromDateParam) {
        setFromDate(fromDateParam);
        setTempFromDate(fromDateParam);
      }
      if (toDateParam) {
        setToDate(toDateParam);
        setTempToDate(toDateParam);
      }
    }
  }, []);

  // Helper functions
  const formatEmployeeName = (fullName) => {
    if (!fullName) return '';
    
    const parts = fullName.trim().split(' ');
    
    if (parts.length === 1) {
      return parts[0];
    } else if (parts.length === 2) {
      return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
    } else if (parts.length > 2) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
    }
    
    return fullName;
  };

  const parseEmployeeName = (employeeString) => {
    if (!employeeString) return { name: '', formattedName: '', color: '#6366F1' };
    
    if (employeeString.includes('||#')) {
      const parts = employeeString.split('||#');
      if (parts.length >= 2) {
        const originalName = parts[0].trim();
        const formattedName = formatEmployeeName(originalName);
        return {
          name: originalName,
          formattedName: formattedName,
          color: `#${parts[1]}`
        };
      }
    }
    
    const formattedName = formatEmployeeName(employeeString);
    return {
      name: employeeString,
      formattedName: formattedName,
      color: '#6366F1'
    };
  };

  const parseMultipleEmployees = (employeesString) => {
    if (!employeesString) return [];
    
    const employeeEntries = employeesString.split(', ');
    
    return employeeEntries.map(entry => {
      return parseEmployeeName(entry.trim());
    });
  };

  const getColorStyles = (color) => {
    const colorMap = {
      '#6366F1': {
        bg: 'rgba(99, 102, 241, 0.1)',
        border: 'rgba(99, 102, 241, 0.2)',
        text: '#4F46E5',
        hover: 'rgba(99, 102, 241, 0.15)'
      },
      '#EC4899': {
        bg: 'rgba(236, 72, 153, 0.1)',
        border: 'rgba(236, 72, 153, 0.2)',
        text: '#DB2777',
        hover: 'rgba(236, 72, 153, 0.15)'
      },
      '#10B981': {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)',
        text: '#059669',
        hover: 'rgba(16, 185, 129, 0.15)'
      },
      '#F59E0B': {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.2)',
        text: '#D97706',
        hover: 'rgba(245, 158, 11, 0.15)'
      },
      '#8B5CF6': {
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.2)',
        text: '#7C3AED',
        hover: 'rgba(139, 92, 246, 0.15)'
      },
      '#EF4444': {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.2)',
        text: '#DC2626',
        hover: 'rgba(239, 68, 68, 0.15)'
      },
      '#06B6D4': {
        bg: 'rgba(6, 182, 212, 0.1)',
        border: 'rgba(6, 182, 212, 0.2)',
        text: '#0891B2',
        hover: 'rgba(6, 182, 212, 0.15)'
      },
      '#84CC16': {
        bg: 'rgba(132, 204, 22, 0.1)',
        border: 'rgba(132, 204, 22, 0.2)',
        text: '#65A30D',
        hover: 'rgba(132, 204, 22, 0.15)'
      }
    };

    if (colorMap[color]) {
      return colorMap[color];
    }

    return {
      bg: `${color}15`,
      border: `${color}30`,
      text: color,
      hover: `${color}20`
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatDateForExport = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch (error) {
      return "";
    }
  };

  const formatTimeTo12Hour = (time24) => {
    if (!time24 || !time24.includes(':')) return time24;
    
    try {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      if (isNaN(hour) || isNaN(minute)) return time24;
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const formattedMinutes = minute.toString().padStart(2, '0');
      
      return `${hour12}:${formattedMinutes} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time24;
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "text-slate-500";
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 font-semibold";
    if (diffDays <= 7) return "text-black-600 font-semibold";
    return "text-green-600 font-medium";
  };

  const isTaskOverdue = (deadline) => {
    if (!deadline) return false;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    
    return deadlineStart < todayStart;
  };

  const checkDeadlineFilter = (taskDeadline, filterType) => {
    if (!taskDeadline || !filterType) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(taskDeadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    switch(filterType) {
      case "currentAndFuture":
        return deadlineDate >= today;
      case "overdueOnly":
        return deadlineDate < today;
      default:
        return true;
    }
  };

  const getTaskStatusBadge = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch(normalizedStatus) {
      case "not-acknowledge":
        return "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200";
      case "acknowledge":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200";
      case "in-progress":
        return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200";
      case "completed":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200";
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200";
    }
  };

  const formatTaskStatus = (status) => {
    if (!status) return "Not-Acknowledge";
    
    const normalizedStatus = status.toLowerCase();
    
    switch(normalizedStatus) {
      case "not-acknowledge":
        return "Not-Acknowledge";
      case "acknowledge":
        return "Acknowledge";
      case "in-progress":
        return "In-progress";
      case "completed":
        return "Completed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Filter functions
  const isUserAssignedToTask = (task) => {
    if (!task || !userId || !userName) return false;
    
    if (Array.isArray(task.assignedTo)) {
      return task.assignedTo.some(assignedUser => {
        return assignedUser.includes(userName) || 
              (task.assignedToIds && task.assignedToIds.includes(userId));
      });
    }
    
    if (typeof task.assignedTo === 'string') {
      return task.assignedTo.includes(userName);
    }
    
    return false;
  };

  // Export to Excel function - exports tasks from API filtered results
  const exportToExcel = () => {
    try {
      const tasksToExport = filteredApiTasks.length > 0 ? filteredApiTasks : tasks;
      
      if (tasksToExport.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Data',
          text: 'No tasks found to export',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }

      const cleanAssignedTo = (assignedToOriginal) => {
        if (!assignedToOriginal) return 'No assignments';
        
        // Remove color codes in format "Name||#COLOR"
        let cleaned = assignedToOriginal.replace(/\|\|#[0-9A-Fa-f]{6}/g, '');
        
        // Also handle any remaining color codes in different formats
        cleaned = cleaned.replace(/#[0-9A-Fa-f]{6}/g, '');
        
        // Clean up any double commas or extra spaces
        cleaned = cleaned.replace(/\s*,\s*/g, ', ').trim();
        
        return cleaned || 'No assignments';
      };

      // Prepare data for export
      const exportData = tasksToExport.map(task => ({
        'Task Name': task.name || 'Unnamed Task',
        'Client': task.clientName || 'N/A',
        'Assigned By': task.assignedByOriginal || 'Unknown',
        'Assigned To': cleanAssignedTo(task.assignedToOriginal || 'No assignments'),
        'Deadline': formatDateForExport(task.deadline),
        'Deadline Time': task.time ? formatTimeTo12Hour(task.time) : '',
        'Task Status': formatTaskStatus(task.taskStatus),
        'Created Date': formatDateForExport(task.created_date),
        'Created Time': task.created_time ? formatTimeTo12Hour(task.created_time) : '',
        'Remarks': task.remark || 'No remarks'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      
      // Download file
      const dateRangeStr = fromDate && toDate 
        ? `${formatDateForExport(fromDate)}_to_${formatDateForExport(toDate)}`
        : fromDate 
          ? `from_${formatDateForExport(fromDate)}`
          : toDate
            ? `until_${formatDateForExport(toDate)}`
            : 'all_tasks';
      
      const employeeStr = selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" 
        ? `_${selectedEmployeeFilter.label.replace(/\s+/g, '_')}` 
        : '';
      
      const fileName = `tasks_export${employeeStr}_${dateRangeStr}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);
      
      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
        text: `${exportData.length} tasks exported successfully`,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'Failed to export tasks to Excel',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Submit date range filter to API
  // Submit date range filter to API
const handleDateRangeSubmit = async () => {
  if (!tempFromDate && !tempToDate) {
    Swal.fire({
      icon: 'warning',
      title: 'Select Date Range',
      text: 'Please select at least one date to filter',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  setFilterLoading(true);

  try {
    console.log("Submitting date range filter:", {
      from_date: tempFromDate ? formatDateForAPI(tempFromDate) : '',
      to_date: tempToDate ? formatDateForAPI(tempToDate) : '',
      employee_id: selectedEmployeeFilter?.value,
      employee_name: selectedEmployeeFilter?.label
    });

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}api/reports.php`,
      {
        params: {
          'view_task_sheet': true,
          user_id: userId,
          user_code: userCode,
          from_date: tempFromDate ? formatDateForAPI(tempFromDate) : '',
          to_date: tempToDate ? formatDateForAPI(tempToDate) : '',
          employee_id: selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" ? selectedEmployeeFilter.value : '',
        }
      }
    );

    const result = response.data;
    console.log("API Response:", result);

    if (result.status === "success") {
      // Process the API response - based on your response, it's returning tasks
      let apiData = [];
      
      if (result.data && Array.isArray(result.data)) {
        apiData = result.data;
      }

      if (apiData.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Data Found',
          text: 'No tasks found for the selected date range',
          timer: 2000,
          showConfirmButton: false
        });
        setFilteredApiTasks([]);
        setDateFilterApplied(true);
        setFromDate(tempFromDate);
        setToDate(tempToDate);
        setCurrentPage(1);
        setFilterLoading(false);
        return;
      }

      // Transform the task data to match your task format
      const transformedTasks = apiData.map((task) => {
        // Parse assigned by
        const assignedByParsed = parseEmployeeName(task.assigned_by_name || "Unknown");
        
        // Parse assigned to
        let assignedToArray = [];
        let assignedToColors = [];
        let assignedToOriginal = '';
        
        if (task.assigned_to_names) {
          assignedToOriginal = task.assigned_to_names;
          if (task.assigned_to_names.includes(',')) {
            const parsedEmployees = parseMultipleEmployees(task.assigned_to_names);
            assignedToArray = parsedEmployees.map(emp => emp.formattedName || emp.name);
            assignedToColors = parsedEmployees.map(emp => emp.color);
          } else {
            const parsedEmployee = parseEmployeeName(task.assigned_to_names);
            assignedToArray = [parsedEmployee.formattedName || parsedEmployee.name];
            assignedToColors = [parsedEmployee.color];
          }
        }
        
        // Parse assigned to IDs
        let assignedToIds = [];
        if (task.assigned_to_ids) {
          assignedToIds = String(task.assigned_to_ids).split(',').map(id => id.trim());
        }
        
        return {
          id: task.id,
          clientName: task.client_name || "Unknown Client",
          clientId: task.client_id,
          name: task.task_name || "Unnamed Task",
          description: task.remarks || "No description",
          assignedBy: assignedByParsed.formattedName || assignedByParsed.name || "Unknown",
          assignedByOriginal: task.assigned_by_name || "Unknown",
          assignedByColor: assignedByParsed.color,
          assignedTo: assignedToArray,
          assignedToOriginal: assignedToOriginal,
          assignedToColors: assignedToColors,
          assignedToString: assignedToOriginal,
          assignedToIds: assignedToIds,
          deadline: task.deadline,
          time: task.time || "",
          created_date: task.created_date,
          created_time: task.created_time,
          remark: task.remarks || "",
          taskStatus: task.task_status || "not-acknowledge",
          createdBy: task.created_by,
          rawAssignedTo: task.assigned_to || "",
          rawAssignedToNames: task.assigned_to_names || ""
        };
      });
      
      console.log("Transformed tasks:", transformedTasks);
      setFilteredApiTasks(transformedTasks);
      setFromDate(tempFromDate);
      setToDate(tempToDate);
      setDateFilterApplied(true);
      setCurrentPage(1);
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Date Range Applied!', 
        text: `Found ${transformedTasks.length} tasks in the selected date range${selectedEmployeeFilter ? ` for ${selectedEmployeeFilter.label}` : ''}.`,
        timer: 2000, 
        showConfirmButton: false,
        timerProgressBar: true
      });
      
    } else {
      Swal.fire({ 
        icon: 'error', 
        title: 'Filter Failed', 
        text: result.message || result.error || "Failed to fetch tasks for selected date range." 
      });
      setFilteredApiTasks([]);
    }
  } catch (error) {
    console.error("Date Range Filter Error:", error);
    
    let errorMessage = 'An error occurred while applying date filter.';
    let errorTitle = 'Error';
    
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      
      errorMessage = error.response.data?.message || 
                    error.response.data?.error || 
                    `Server error: ${error.response.status}`;
      errorTitle = 'Server Error';
    } else if (error.request) {
      console.error("Error request:", error.request);
      errorMessage = 'No response from server. Please check your connection.';
      errorTitle = 'Connection Error';
    } else {
      console.error("Error message:", error.message);
      errorMessage = `Error: ${error.message}`;
    }
    
    Swal.fire({ 
      icon: 'error', 
      title: errorTitle, 
      text: errorMessage,
      confirmButtonColor: '#d33',
    });
  } finally {
    setFilterLoading(false);
  }
};

  // Clear date range filter
  const clearDateRangeFilter = () => {
    setTempFromDate('');
    setTempToDate('');
    setFromDate('');
    setToDate('');
    setFilteredApiTasks([]);
    setDateFilterApplied(false);
    setCurrentPage(1);
    
    Swal.fire({
      icon: 'info',
      title: 'Date Filter Cleared',
      text: 'Showing all tasks',
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true
    });
  };

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !userCode || hasFetched.current) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        hasFetched.current = true;
        
        console.log("Fetching all data...");
        
        // Prepare API parameters
        const params = { 
          id: userId,
          user_code: userCode,
          view_task: true
        };
        
        // Add other filters if needed
        if (selectedClient && selectedClient.value !== "all") {
          params.client_id = selectedClient.value;
        }
        
        if (selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" && !dateFilterApplied) {
          params.employee_name = selectedEmployeeFilter.label;
        }
        
        if (selectedStatusFilter && selectedStatusFilter.value !== "all") {
          params.status = selectedStatusFilter.value;
        }
        
        // Fetch tasks with all parameters
        const tasksResponse = await axios.get(`${import.meta.env.VITE_API_URL}api/task-management.php`, {
          params: params
        });
        
        const clientsResponse = await axios.get(`${import.meta.env.VITE_API_URL}api/project.php`, {
          params: { 
            user_id: userId,
            user_code: userCode,
            view_active_clients: "'active'"
          }
        });
        
        // Process tasks response
        const tasksResult = tasksResponse.data;
        if (tasksResult.status === "success") {
          let tasksData = [];
          
          if (tasksResult.data && Array.isArray(tasksResult.data)) {
            tasksData = tasksResult.data;
          } else if (tasksResult.data123 && Array.isArray(tasksResult.data123)) {
            tasksData = tasksResult.data123;
          }
          
          const transformedTasks = tasksData.map(task => {
            const assignedByParsed = parseEmployeeName(task.assigned_by_name || "Unknown");
            
            let assignedToArray = [];
            let assignedToColors = [];
            
            if (task.assigned_to_names) {
              if (task.assigned_to_names.includes(',')) {
                const parsedEmployees = parseMultipleEmployees(task.assigned_to_names);
                assignedToArray = parsedEmployees.map(emp => emp.formattedName || emp.name);
                assignedToColors = parsedEmployees.map(emp => emp.color);
              } else {
                const parsedEmployee = parseEmployeeName(task.assigned_to_names);
                assignedToArray = [parsedEmployee.formattedName || parsedEmployee.name];
                assignedToColors = [parsedEmployee.color];
              }
            }
            
            const assignedToString = Array.isArray(task.assigned_to_names) ? 
              task.assigned_to_names.join(', ') : 
              (task.assigned_to_names || "");
            
            return {
              id: task.id,
              clientName: task.client_name || "Unknown Client",
              clientId: task.client_id,
              name: task.task_name || "Unnamed Task",
              description: task.remarks || "No description",
              assignedBy: assignedByParsed.formattedName || assignedByParsed.name || "Unknown",
              assignedByOriginal: task.assigned_by_name || "Unknown",
              assignedByColor: assignedByParsed.color,
              assignedTo: assignedToArray,
              assignedToOriginal: task.assigned_to_names || "",
              assignedToColors: assignedToColors,
              assignedToString: assignedToString,
              assignedToIds: task.assigned_to_ids ? 
                (Array.isArray(task.assigned_to_ids) ? task.assigned_to_ids : task.assigned_to_ids.split(',')) : 
                [],
              deadline: task.deadline,
              time: task.time,
              created_date: task.created_date,
              created_time: task.created_time,
              remark: task.remarks,
              taskStatus: task.task_status || "not-acknowledge",
              createdBy: task.created_by,
              rawAssignedTo: task.assigned_to || "",
              rawAssignedToNames: task.assigned_to_names || ""
            };
          });
          
          setTasks(transformedTasks);
        } else {
          console.warn("Tasks API returned error:", tasksResult.message);
          setTasks([]);
        }
        
        // Process clients response
        const clientsResult = clientsResponse.data;
        if (clientsResult.status === "success" && clientsResult.project && Array.isArray(clientsResult.project)) {
          const clientOptions = clientsResult.project.map(client => ({
            value: client.client_id,
            label: client.client_name,
            clientCode: client.client_code,
            description: client.description,
            startDate: client.start_date
          }));
          
          const allClientsOption = {
            value: "all",
            label: "All Clients",
            color: "#3b82f6"
          };
          
          setClients([allClientsOption, ...clientOptions]);
        } else {
          setClients([{
            value: "all",
            label: "All Clients",
            color: "#3b82f6"
          }]);
        }
        
        // Process employees from tasks data
        const employeeMap = new Map();
        const currentTasks = tasksResult.status === "success" ? 
          (tasksResult.data && Array.isArray(tasksResult.data) ? tasksResult.data : 
           tasksResult.data123 && Array.isArray(tasksResult.data123) ? tasksResult.data123 : []) : [];
        
        currentTasks.forEach(user => {
          if (user.assigned_to_names) {
            const parsedEmployee = parseEmployeeName(user.assigned_to_names);
            const employeeName = parsedEmployee.name;
            
            if (!employeeMap.has(employeeName)) {
              employeeMap.set(employeeName, {
                value: user.id || employeeName,
                label: employeeName,
                formattedName: parsedEmployee.formattedName,
                color: parsedEmployee.color
              });
            }
          }
        });
        
        const employeeOptions = Array.from(employeeMap.values());
        const allEmployeesOption = {
          value: "all",
          label: "All Employees",
          color: "#3b82f6"
        };
        
        setEmployees([allEmployeesOption, ...employeeOptions]);
        
      } catch (error) {
        console.error("Fetch Error:", error);
        setTasks([]);
        setClients([{
          value: "all",
          label: "All Clients",
          color: "#3b82f6"
        }]);
        setEmployees([{
          value: "all",
          label: "All Employees",
          color: "#3b82f6"
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup function
    return () => {
      hasFetched.current = false;
    };
  }, [userId, userCode, selectedClient, selectedEmployeeFilter, selectedStatusFilter]);

  // Get active tasks (either from API filter or main tasks)
  const activeTasks = useMemo(() => {
    return dateFilterApplied && filteredApiTasks.length > 0 ? filteredApiTasks : tasks;
  }, [dateFilterApplied, filteredApiTasks, tasks]);

  // Apply client-side filters (search, status, deadline) to active tasks
  const filteredTasks = useMemo(() => {
    if (!activeTasks.length) return [];
    
    return activeTasks.filter(task => {
      // Apply search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableFields = [
          task.name,
          task.clientName,
          task.assignedBy,
          task.assignedToString,
          task.description,
          task.remark,
          task.taskStatus,
          formatDate(task.deadline),
          formatTimeTo12Hour(task.time),
          formatDate(task.created_date)
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(query)) {
          return false;
        }
      }
      
      // Apply status filter
      if (selectedStatusFilter && selectedStatusFilter.value !== "all") {
        if (task.taskStatus?.toLowerCase() !== selectedStatusFilter.value.toLowerCase()) {
          return false;
        }
      }
      
      // Apply deadline filter
      if (selectedDeadlineFilter && selectedDeadlineFilter.value !== "all") {
        if (!checkDeadlineFilter(task.deadline, selectedDeadlineFilter.value)) {
          return false;
        }
      }
      
      return true;
    });
  }, [activeTasks, searchQuery, selectedStatusFilter, selectedDeadlineFilter]);

  // Apply sorting to filtered results
  const sortedTasks = useMemo(() => {
    if (!sortConfig.key) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTasks, sortConfig]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);

  // Handlers
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedClient(null);
    setSelectedEmployeeFilter(null);
    setSelectedStatusFilter(null);
    setSelectedDeadlineFilter(null);
    setTempFromDate('');
    setTempToDate('');
    setFromDate('');
    setToDate('');
    setFilteredApiTasks([]);
    setDateFilterApplied(false);
    setCurrentPage(1);
  };
  
  const clearClientFilter = () => {
    setSelectedClient(null);
    setCurrentPage(1);
  };

  const clearEmployeeFilter = () => {
    setSelectedEmployeeFilter(null);
    setCurrentPage(1);
  };

  const clearStatusFilter = () => {
    setSelectedStatusFilter(null);
    setCurrentPage(1);
  };

  const clearDeadlineFilter = () => {
    setSelectedDeadlineFilter(null);
    setCurrentPage(1);
  };

  const handleEmployeeFilterChange = (selected) => {
    setSelectedEmployeeFilter(selected);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (selected) => {
    setSelectedStatusFilter(selected);
    setCurrentPage(1);
  };

  const handleDeadlineFilterChange = (selected) => {
    setSelectedDeadlineFilter(selected);
    setCurrentPage(1);
  };

  const handlePaginationSizeChange = (selected) => {
    setItemsPerPage(selected.value);
    setCurrentPage(1);
  };

  const handleClientFilterChange = (selected) => {
    setSelectedClient(selected);
    setCurrentPage(1);
  };

  const handleTempFromDateChange = (e) => {
    setTempFromDate(e.target.value);
  };

  const handleTempToDateChange = (e) => {
    setTempToDate(e.target.value);
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

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

  const getPaginationRange = () => {
    const maxPagesToShow = 3;
    const pages = [];
    
    pages.push(1);
    
    let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));
    
    if (currentPage <= Math.floor(maxPagesToShow / 2) + 1) {
      endPage = Math.min(totalPages - 1, maxPagesToShow);
    }
    
    if (currentPage >= totalPages - Math.floor(maxPagesToShow / 2)) {
      startPage = Math.max(2, totalPages - maxPagesToShow + 1);
    }
    
    if (startPage > 2) {
      pages.push('...');
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };
  
  const handleEdit = (id) => {
    navigate(`/dashboard/task-management/edit-task/${id}`);
  };
  
  const handleView = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedTask(null);
  };

  const toggleStatusDropdown = (id) => {
    setStatusDropdownOpen(statusDropdownOpen === id ? null : id);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const form = new FormData();
      form.append("taskId", taskId);
      form.append("userName", user?.name);
      form.append("status", newStatus);
      form.append("update_status", "true");
      form.append("userId", userId);
      form.append("_method", "PUT");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/task-management.php`,
        form,
        {
          params: {
            id: userId
          }
        }
      );

      const result = response.data;
      if (result.status === "success") {
        // Update tasks in both states
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, taskStatus: newStatus }
              : task
          )
        );
        
        setFilteredApiTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, taskStatus: newStatus }
              : task
          )
        );

        setStatusDropdownOpen(null);

        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Task status updated to ${newStatus}`,
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });
      } else {
        throw new Error(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error(
        "Error updating task status:",
        error.response?.data || error.message
      );

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to update task status",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    }
  };
  
  const goToPage = (page) => setCurrentPage(page);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const hasActiveFilters = (selectedEmployeeFilter && selectedEmployeeFilter.value !== "all") || 
                          (selectedStatusFilter && selectedStatusFilter.value !== "all") || 
                          (selectedDeadlineFilter && selectedDeadlineFilter.value !== "all") || 
                          (selectedClient && selectedClient.value !== "all") || 
                          dateFilterApplied ||
                          searchQuery;

  const totalTasksCount = tasks.length;
  const activeTasksCount = activeTasks.length;
  const filteredTasksCount = filteredTasks.length;

  const currentPaginationSize = paginationSizeOptions.find(opt => opt.value === itemsPerPage) || paginationSizeOptions[0];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Styles for dropdowns
  const filterDropdownStyles = {
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
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color || '#1e293b',
      fontWeight: '500',
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : state.data.color || '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      fontSize: '14px',
      borderLeft: state.isSelected ? '4px solid #3b82f6' : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '14px',
    }),
  };

  const clientFilterStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      padding: '8px 4px',
      backgroundColor: 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
      "&:hover": {
        borderColor: '#94a3b8',
      },
      width: '100%',
      maxWidth: '250px',
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '600',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      borderLeft: state.isSelected ? '4px solid #3b82f6' : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    }),
  };

  const paginationSizeStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      padding: '4px 8px',
      backgroundColor: 'white',
      minHeight: '40px',
      minWidth: '140px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      "&:hover": {
        borderColor: '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#e0f2fe' : 'white',
      color: state.isSelected ? '#0369a1' : '#334155',
      fontWeight: state.isSelected ? '600' : '500',
      fontSize: '14px',
      borderLeft: state.isSelected ? '4px solid #3b82f6' : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-5">
      {/* Main Card */}
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-visible">
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
                  View All Tasks
                </h2>
                <p className="text-blue-100 mt-2">View and manage all tasks with task assignments</p>
                <p className="text-blue-100 text-sm mt-1">
                  Found {filteredTasksCount} task{filteredTasksCount !== 1 ? 's' : ''} of {activeTasksCount} total
                  {dateFilterApplied && ` (filtered by date range)`}
                </p>
              </div>
              
              {/* Search Box and Client Filter */}
              <div className="w-full lg:w-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Client Filter Dropdown - Available for all users */}
                  <div className="w-full md:w-64">
                    <div className="relative">
                      <Select
                        options={clients}
                        value={selectedClient}
                        onChange={handleClientFilterChange}
                        classNamePrefix="react-select"
                        styles={clientFilterStyles}
                        placeholder="Filter by client..."
                        isClearable={true}
                        isSearchable={true}
                        formatOptionLabel={(option) => (
                          <div className="flex items-center gap-2">
                            {option.value === "all" && (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            )}
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Search Box */}
                  <div className="w-full md:w-96">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by task name, client, assigned by, or status..."
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
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {/* Active Filters Box */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-blue-200">
                {/* Left Column - Active Filters */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-blue-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Active Filters:
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
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Employee Filter - Only for Admins and Managers */}
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <div className="w-full sm:w-48 mb-2">
                        <Select
                          options={employees}
                          value={selectedEmployeeFilter}
                          onChange={handleEmployeeFilterChange}
                          classNamePrefix="react-select"
                          styles={filterDropdownStyles}
                          placeholder="Select Employee"
                          isClearable={true}
                          isSearchable={true}
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
                    
                    {/* Status Filter - Available for all users */}
                    <div className="w-full sm:w-48 mb-2">
                      <Select
                        options={statusOptions}
                        value={selectedStatusFilter}
                        onChange={handleStatusFilterChange}
                        classNamePrefix="react-select"
                        styles={filterDropdownStyles}
                        placeholder="Select Status"
                        isClearable={true}
                        isSearchable={true}
                        formatOptionLabel={(option) => (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
                    </div>
                    
                    {/* Pagination Size - Available for all users */}
                    <div className="w-full sm:w-48 mb-2">
                      <Select
                        options={paginationSizeOptions}
                        value={currentPaginationSize}
                        onChange={handlePaginationSizeChange}
                        classNamePrefix="react-select"
                        styles={filterDropdownStyles}
                        placeholder="Items per page"
                        isSearchable={false}
                      />
                    </div>
                  </div>

                  {/* Active Filter Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {selectedEmployeeFilter && selectedEmployeeFilter.value !== "all" && (
                      <div className="flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full shadow-sm text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Employee: {selectedEmployeeFilter.label}</span>
                        <button onClick={clearEmployeeFilter} className="ml-1 hover:text-blue-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {selectedStatusFilter && selectedStatusFilter.value !== "all" && (
                      <div className="flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full shadow-sm text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedStatusFilter.color }} />
                        <span>Status: {selectedStatusFilter.label}</span>
                        <button onClick={clearStatusFilter} className="ml-1 hover:text-blue-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {selectedClient && selectedClient.value !== "all" && (
                      <div className="flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full shadow-sm text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Client: {selectedClient.label}</span>
                        <button onClick={clearClientFilter} className="ml-1 hover:text-blue-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {searchQuery && (
                      <div className="flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full shadow-sm text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search: "{searchQuery}"</span>
                        <button onClick={clearSearch} className="ml-1 hover:text-blue-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {dateFilterApplied && (
                      <div className="flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full shadow-sm text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          Date Range: {fromDate ? formatDate(fromDate) : 'Any'} - {toDate ? formatDate(toDate) : 'Any'}
                        </span>
                        <button onClick={clearDateRangeFilter} className="ml-1 hover:text-blue-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Date Filters and Export Button */}
                <div className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-medium text-blue-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date Range Filter:
                      </h2>
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

                    {/* Employee Filter in Date Range Section - Only for Admins and Managers */}
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <div className="w-full mb-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Employee (Optional)</label>
                        <Select
                          options={employees}
                          value={selectedEmployeeFilter}
                          onChange={handleEmployeeFilterChange}
                          classNamePrefix="react-select"
                          styles={filterDropdownStyles}
                          placeholder="Select Employee (Optional)"
                          isClearable={true}
                          isSearchable={true}
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
                          onClick={exportToExcel}
                          className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:shadow-green-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export to Excel ({activeTasksCount} tasks)
                        </button>
                        <p className="text-xs text-green-600 mt-1 text-center">
                          Exporting tasks from selected date range
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-2 bg-blue-100/50 border-t border-blue-200">
                <p className="text-sm text-blue-600">
                  Showing {filteredTasksCount} of {activeTasksCount} active tasks
                  {dateFilterApplied ? ' (filtered by date range)' : ''}
                </p>
              </div>
            </div>

            {currentTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg font-semibold mb-2">
                  {hasActiveFilters ? 
                    `No tasks found matching your filters` 
                    : "No tasks found"}
                </p>
                <p className="text-slate-500 text-sm">
                  {hasActiveFilters ? "Try adjusting your filters" : "No tasks available in the system"}
                </p>
                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 mx-auto"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group rounded-tl-xl"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Task Name
                            <SortArrow columnKey="name" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("assignedBy")}
                        >
                          <div className="flex items-center gap-2">
                            Assigned By
                            <SortArrow columnKey="assignedBy" />
                          </div>
                        </th>
                        <th className="py-4 px-4 text-left font-semibold text-slate-700">
                          Assigned To
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("deadline")}
                        >
                          <div className="flex items-center gap-2">
                            Deadline
                            <SortArrow columnKey="deadline" />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => handleSort("taskStatus")}
                        >
                          <div className="flex items-center gap-2">
                            Task Status
                            <SortArrow columnKey="taskStatus" />
                          </div>
                        </th>
                        <th className="py-4 px-4 text-left font-semibold text-slate-700">
                          Created Date
                        </th>
                        <th className="py-4 px-4 text-left font-semibold text-slate-700">
                          Remark
                        </th>
                        <th className="py-4 px-4 text-right font-semibold text-slate-700 rounded-tr-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTasks.map((task) => {
                        const isAssigned = isUserAssignedToTask(task);
                        const isOverdue = isTaskOverdue(task.deadline) && task.taskStatus !== "completed";
                        return (
                          <tr 
                            key={task.id} 
                            className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 group"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="font-semibold text-slate-900 block">
                                    {task.name || "Unnamed Task"}
                                  </span>
                                  <span className="text-slate-600 text-sm block mt-1 line-clamp-1">
                                    ({task.clientName || "N/A"})
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor: getColorStyles(task.assignedByColor).bg,
                                    border: `1px solid ${getColorStyles(task.assignedByColor).border}`
                                  }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span 
                                  className="font-medium"
                                  style={{ color: getColorStyles(task.assignedByColor).text }}
                                  title={task.assignedByOriginal}
                                >
                                  {task.assignedBy}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {formatDate(task.created_date)} at {formatTimeTo12Hour(task.created_time)}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                  task.assignedTo.map((person, index) => {
                                    const color = task.assignedToColors[index] || '#6366F1';
                                    const colorStyles = getColorStyles(color);
                                    return (
                                      <span 
                                        key={index}
                                        className="px-2 py-1 rounded-lg text-xs font-medium"
                                        style={{
                                          backgroundColor: colorStyles.text,
                                          color: "#fff"
                                        }}
                                        title={task.assignedToOriginal}
                                      >
                                        {person}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-slate-500 text-sm">No assignments</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <svg className={`w-4 h-4 ${getDeadlineStatus(task.deadline)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className={`${getDeadlineStatus(task.deadline)}`}>
                                  {formatDate(task.deadline)}
                                  {task.time && (
                                    <div className="text-sm mt-1">
                                      {formatTimeTo12Hour(task.time)}
                                    </div>
                                  )}
                                </span>
                                {isOverdue && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 relative">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${getTaskStatusBadge(task.taskStatus)}`}>
                                  {formatTaskStatus(task.taskStatus)}
                                </span>
                                {isAssigned && (
                                  <button 
                                    onClick={() => toggleStatusDropdown(task.id)}
                                    className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                                    title="Change Status"
                                  >
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              
                              {/* Status Dropdown - Only show if user is assigned */}
                              {isAssigned && statusDropdownOpen === task.id && (
                                <div className="absolute z-10 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200">
                                  <div className="py-1">
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "not-acknowledge")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      Not-Acknowledge
                                    </button>
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "acknowledge")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      Acknowledge
                                    </button>
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "in-progress")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                      In-progress
                                    </button>
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, "completed")}
                                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Completed
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-slate-700">
                                {formatDate(task.created_date)}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="max-w-xs">
                                <span className="text-sm text-slate-700 line-clamp-2">
                                  {task.remark || "No remarks"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleView(task)} 
                                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2"
                                  title="View Details"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleEdit(task.id)} 
                                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2"
                                  title="Edit Task"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-4">
                  {currentTasks.slice(0, 10).map((task) => {
                    const isAssigned = isUserAssignedToTask(task);
                    const isOverdue = isTaskOverdue(task.deadline) && task.taskStatus !== "completed";
                    return (
                      <div key={task.id} className="border-2 border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                            <span className="text-white font-bold text-lg">
                              {task.name ? task.name.charAt(0).toUpperCase() : "T"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-lg mb-1">
                              {task.name || "Unnamed Task"}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${getTaskStatusBadge(task.taskStatus)}`}>
                                {formatTaskStatus(task.taskStatus)}
                              </span>
                              {isOverdue && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                {task.clientName || "No Client"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Assigned By:</span>
                              <span 
                                className="font-medium ml-2"
                                style={{ color: getColorStyles(task.assignedByColor).text }}
                              >
                                {task.assignedBy}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-700">Assigned To:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                  task.assignedTo.slice(0, 3).map((person, index) => {
                                    const color = task.assignedToColors[index] || '#6366F1';
                                    const colorStyles = getColorStyles(color);
                                    return (
                                      <span 
                                        key={index}
                                        className="px-2 py-1 rounded-lg text-xs font-medium"
                                        style={{
                                          backgroundColor: colorStyles.text,
                                          color: "#fff"
                                        }}
                                      >
                                        {person}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-slate-500 text-sm">No assignments</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Deadline:</span>
                              <span className={`ml-2 ${getDeadlineStatus(task.deadline)}`}>
                                {formatDate(task.deadline)} {task.time && `at ${formatTimeTo12Hour(task.time)}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-slate-700">Created:</span>
                              <span className="ml-2 text-slate-600">
                                {formatDate(task.created_date)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                          <button 
                            onClick={() => handleView(task)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button 
                            onClick={() => handleEdit(task.id)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {sortedTasks.length > 0 && (
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-slate-600 font-medium">
                    Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, sortedTasks.length)}</span> of <span className="font-bold text-slate-900">{sortedTasks.length}</span> tasks
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={goToPrevious} 
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
                  
                  <div className="flex items-center gap-1">
                    {getPaginationRange().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button 
                          key={page} 
                          onClick={() => goToPage(page)} 
                          className={`min-w-8 h-8 px-2 rounded-lg font-medium transition-all ${
                            currentPage === page 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm" 
                              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  
                  <button 
                    onClick={goToNext} 
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

      {/* View Details Modal */}
      {showViewModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Task Details
                </h2>
                <button 
                  onClick={closeViewModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {selectedTask.name ? selectedTask.name.charAt(0).toUpperCase() : "T"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedTask.name}</h3>
                    <p className="text-slate-600 mt-1">{selectedTask.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Client</h4>
                      <p className="text-slate-800 font-medium">
                        {selectedTask.clientName || "No Client"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Assigned By</h4>
                      <p className="text-slate-800 font-medium flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: getColorStyles(selectedTask.assignedByColor).bg,
                            border: `1px solid ${getColorStyles(selectedTask.assignedByColor).border}`
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span style={{ color: getColorStyles(selectedTask.assignedByColor).text }}>
                          {selectedTask.assignedBy}
                        </span>
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Status</h4>
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-block ${getTaskStatusBadge(selectedTask.taskStatus)}`}>
                        {formatTaskStatus(selectedTask.taskStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Deadline</h4>
                      <p className={`flex items-center gap-2 ${getDeadlineStatus(selectedTask.deadline)}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span>{formatDate(selectedTask.deadline)}</span>
                          {selectedTask.time && (
                            <div className="text-sm mt-1">
                              {formatTimeTo12Hour(selectedTask.time)}
                            </div>
                          )}
                        </div>
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Created Date</h4>
                      <p className="text-slate-800 font-medium">
                        {formatDate(selectedTask.created_date)} at {formatTimeTo12Hour(selectedTask.created_time)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">Assigned To</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
                          selectedTask.assignedTo.map((person, index) => {
                            const color = selectedTask.assignedToColors[index] || '#6366F1';
                            const colorStyles = getColorStyles(color);
                            return (
                              <span 
                                key={index}
                                className="px-3 py-1 rounded-lg text-sm font-medium"
                                style={{
                                  backgroundColor: colorStyles.text,
                                  color: "#fff"
                                }}
                              >
                                {person}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-slate-500 text-sm">No assignments</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Remarks</h4>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-700">{selectedTask.remark || "No remarks"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasksheet;