import React, { useEffect, useState } from "react";
import { CheckCircle, Clock, TrendingUp, Lightbulb, Cake, Award, Megaphone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import axios from 'axios';
import { getCurrentUser } from "../../utils/api";
import { jwtDecode } from 'jwt-decode';

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAnnouncements, setCurrentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todoTasks, setTodoTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Pagination states for each task category
  const [todoPage, setTodoPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const user = getCurrentUser();

  // const token = localStorage.getItem("token");
  // let username = "";
  // if (token) {
  //   try {
  //     const decoded = jwtDecode(token);
  //     username = decoded.user?.name || "";
  //   } catch (e) {}
  // }
  
  const itemsPerPage = 3; // Number of tasks to show per page

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // const response = await apiFetch('api/announcement.php');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}api/announcement.php`)

        // if (!response.ok) {
        //   throw new Error("Failed to fetch announcements");
        // }

        const data = response.data;
        console.log("data=", data.data);
        setCurrentAnnouncements(data.data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setError("Unable to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              id: user?.id,
              user_code: user?.user_code,
              dashboard_task: true
            }
          }
        );

        const data = response.data;
        console.log("task data=", data.data);
        
        // Check if data is empty or has null values
        const validTasks = data.data.filter(task => 
          task && ["acknowledge"].includes(task.status) && task.name && task.count_tasks && parseInt(task.count_tasks) > 0
        );

        const validTasks1 = data.data.filter(task => 
          task && ["in-progress"].includes(task.status) && task.name && task.count_tasks && parseInt(task.count_tasks) > 0
        );

        const validTasks2 = data.data.filter(task => 
          task && ["completed"].includes(task.status) && task.name && task.count_tasks && parseInt(task.count_tasks) > 0
        );
        
        setTodoTasks(validTasks);
        setInProgressTasks(validTasks1);
        setCompletedTasks(validTasks2);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Unable to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, []);

  // Mock tasks data - you would fetch this from your API
  // const todoTasks = [
  //   { id: 1, title: "Review project proposal", priority: "high" },
  //   { id: 2, title: "Update team documentation", priority: "medium" },
  //   { id: 3, title: "Schedule client meeting", priority: "low" },
  //   { id: 10, title: "Prepare quarterly report", priority: "high" },
  //   { id: 11, title: "Team meeting agenda", priority: "medium" },
  //   { id: 12, title: "Code review", priority: "low" },
  //   { id: 13, title: "Budget planning", priority: "high" }
  // ];

  // const inProgressTasks = [
  //   { id: 4, title: "Develop new feature module", progress: 65 },
  //   { id: 5, title: "Bug fixes for deployment", progress: 40 },
  //   { id: 6, title: "Database optimization", progress: 80 },
  //   { id: 14, title: "UI/UX redesign", progress: 30 },
  //   { id: 15, title: "API integration", progress: 70 },
  //   { id: 16, title: "Testing phase", progress: 50 }
  // ];

  // const completedTasks = [
  //   { id: 7, title: "Q4 Performance review", date: "Dec 26" },
  //   { id: 8, title: "Security audit completed", date: "Dec 25" },
  //   { id: 9, title: "Team training session", date: "Dec 24" },
  //   { id: 17, title: "Client presentation", date: "Dec 23" },
  //   { id: 18, title: "System update", date: "Dec 22" },
  //   { id: 19, title: "Documentation complete", date: "Dec 21" },
  //   { id: 20, title: "Onboarding new hires", date: "Dec 20" }
  // ];

  // Function to get paginated tasks for each category
  const getPaginatedTasks = (tasks, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tasks.slice(startIndex, endIndex);
  };

  // Function to calculate total pages for each category
  const getTotalPages = (tasks) => {
    return Math.ceil(tasks.length / itemsPerPage);
  };

  // Calculate total task count for To Do section
  const getTotalTodoTaskCount = () => {
    return todoTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 0), 0);
  };

  // Calculate total task count for In Progress section
const getTotalInProgressTaskCount = () => {
  return inProgressTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 0), 0);
};

// Calculate total task count for Completed section
const getTotalCompletedTaskCount = () => {
  return completedTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 0), 0);
};

  // Format time and date functions
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, category }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center text-sm ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>
        
        <div className="flex items-center space-x-1">
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            // Show limited page numbers for better UI
            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`w-8 h-8 rounded-full text-sm font-medium ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {pageNumber}
                </button>
              );
            } else if (
              (pageNumber === currentPage - 2 && currentPage > 3) ||
              (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
            ) {
              return <span key={pageNumber} className="text-gray-400">...</span>;
            }
            return null;
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center text-sm ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    );
  };

  // Analog Clock Component
  const AnalogClock = ({ time }) => {
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    const secondAngle = (seconds * 6) - 90;
    const minuteAngle = (minutes * 6 + seconds * 0.1) - 90;
    const hourAngle = (hours * 30 + minutes * 0.5) - 90;

    return (
      <div className="relative w-40 h-40">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Clock face */}
          <circle cx="100" cy="100" r="95" fill="white" stroke="#2563eb" strokeWidth="4" />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 100 + 85 * Math.cos(angle);
            const y1 = 100 + 85 * Math.sin(angle);
            const x2 = 100 + 75 * Math.cos(angle);
            const y2 = 100 + 75 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#2563eb"
                strokeWidth="3"
              />
            );
          })}

          {/* Hour hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 50 * Math.cos(hourAngle * Math.PI / 180)}
            y2={100 + 50 * Math.sin(hourAngle * Math.PI / 180)}
            stroke="#1e40af"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 65 * Math.cos(minuteAngle * Math.PI / 180)}
            y2={100 + 65 * Math.sin(minuteAngle * Math.PI / 180)}
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Second hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 70 * Math.cos(secondAngle * Math.PI / 180)}
            y2={100 + 70 * Math.sin(secondAngle * Math.PI / 180)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="100" cy="100" r="8" fill="#1e40af" />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back   {user.name ? user.name: " "}!</h1>
        </div>

        {/* First Row - Task Management */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* To Do Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-black-800 ml-3">To Do</h2>
              <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {getTotalTodoTaskCount()}
              </span>
            </div>
            <div className="space-y-3 flex-grow">
              {todoTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No tasks pending</p>
                </div>
              ) : (
                getPaginatedTasks(todoTasks, todoPage).map((task, index) => (
                  <Link to="/dashboard/task-management/view-task" key={task.id || index}>
                    <div
                      className="p-4 bg-gradient-to-r mb-2 from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-black-800 text-sm mb-1">
                            {task.name || "Unknown User"} has <span className="text-red-900">{task.count_tasks}</span> Pending Task{parseInt(task.count_tasks) !== 1 ? 's' : ''}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <PaginationControls
              currentPage={todoPage}
              totalPages={getTotalPages(todoTasks)}
              onPageChange={setTodoPage}
              category="todo"
            />
          </div>

          {/* In Progress Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-black-800 ml-3">In Progress</h2>
              <span className="ml-auto bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                {getTotalInProgressTaskCount()}
              </span>
            </div>
            <div className="space-y-3 flex-grow">
              {getPaginatedTasks(inProgressTasks, inProgressPage).map(task => (
                <Link to="/dashboard/task-management/view-task" key={task.id}>
                    <div
                      className="p-4 bg-gradient-to-r mb-2 from-indigo-50 to-blue-50 rounded-lg border-l-4 border-progress-500 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-progress-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-black-800 text-sm mb-1">
                            {task.name || "Unknown User"} has <span className="text-red-900">{task.count_tasks}</span> Progress Task{parseInt(task.count_tasks) !== 1 ? 's' : ''}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </Link>
              ))}
            </div>
            <PaginationControls
              currentPage={inProgressPage}
              totalPages={getTotalPages(inProgressTasks)}
              onPageChange={setInProgressPage}
              category="inProgress"
            />
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-black-800 ml-3">Completed</h2>
              <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                {getTotalCompletedTaskCount()}
              </span>
            </div>
            <div className="space-y-3 flex-grow">
              {getPaginatedTasks(completedTasks, completedPage).map(task => (
                <div key={task.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-3" />
                  {/* <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium line-through">
                      {task.task_name}
                    </p>
                    <span className="text-xs text-gray-500">{task.date}</span>
                  </div> */}
                  <div>
                    <h4 className="font-semibold text-black-800 text-sm mb-1 line-through">
                      {task.name || "Unknown User"} has <span className="text-red-900">{task.count_tasks}</span> completed Task{parseInt(task.count_tasks) !== 1 ? 's' : ''}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              currentPage={completedPage}
              totalPages={getTotalPages(completedTasks)}
              onPageChange={setCompletedPage}
              category="completed"
            />
          </div>
        </div>

        {/* Second Row - Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Combined Card: Today's Thought, Birthday, Work Anniversary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Today's Thought */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-md font-semibold text-black-800 ml-3">Today's Thought</h3>
              </div>
              <p className="text-sm text-black-600 italic bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
                "If you aspire to the highest place, it is no disgrace to stop at the second or even the third place."
              </p>
            </div>

            {/* Birthday */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Cake className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="text-md font-semibold text-black-800 ml-3">Birthdays</h3>
              </div>
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No One's Birthday Today</p>
              </div>
            </div>

            {/* Work Anniversary */}
            <div>
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-md font-semibold text-black-800 ml-3">Work Anniversary</h3>
              </div>
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No Work Anniversary Today</p>
              </div>
            </div>
          </div>

          {/* Events and Announcements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Megaphone className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-black-800 ml-3">Events & Announcements</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-black-400 text-sm mt-2">Loading...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              ) : currentAnnouncements.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-black-400 text-sm">No announcements found</p>
                </div>
              ) : (
                currentAnnouncements.map((announce) => (
                  <div
                    key={announce.id}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-black-800 text-sm mb-1">
                          {announce.name || "Untitled Announcement"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {announce.description || "No description available"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clock */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-xl hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-4">
                <AnalogClock time={currentTime} />
              </div>
              <div className="text-center mt-4">
                <p className="text-sm opacity-90 mb-2">{formatDate(currentTime)}</p>
                <p className="text-3xl font-bold tracking-wider mb-2">{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;