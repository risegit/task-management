import React, { useEffect, useState } from "react";
import { CheckCircle, Clock, TrendingUp, Lightbulb, Cake, Award, Megaphone, Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import axios from 'axios';
import { getCurrentUser } from "../../utils/api";
import { jwtDecode } from 'jwt-decode';
import CapsuleGridMarquee from './task-management/CapsuleGridPreview';

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAnnouncements, setCurrentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todoTasks, setTodoTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);

  // Pagination states for each task category
  const [todoPage, setTodoPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);
  const user = getCurrentUser();
  
  const itemsPerPage = 3;

  const items = [
    { employeeName: "Rahul Gupta", count_tasks: 31 },
    { employeeName: "Nimish", count_tasks: 1 },
    { employeeName: "Dilip Gupta", count_tasks: 11 }
  ];


  // const items = [
  //   `⚠️ Rahul Gupta has ${getTotalOverdueTaskCount("Rahul Gupta")} Pending Tasks`,
  //   `⚠️ Nimish has ${getTotalOverdueTaskCount("Nimish")} Pending Tasks`,
  //   `⚠️ Dilip Gupta has ${getTotalOverdueTaskCount("Dilip Gupta")} Pending Tasks`,
  //   `⚠️ Aditya has ${getTotalOverdueTaskCount("Aditya")} Pending Tasks`
  // ];


  // Clock update (keeping for time display)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}api/announcement.php`)
        const data = response.data;
        setCurrentAnnouncements(data.data);
      } catch (err) {
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
        
        // Check if user is admin or regular user
        const isAdmin = user?.role !== "staff";
        
        // Process data based on user role
        const processedData = data.data.map(task => {
          if (isAdmin && task.count_tasks) {
            // For admin - use aggregated data with count_tasks
            return {
              ...task,
              count_tasks: parseInt(task.count_tasks) || 1,
              task_name: task.task_name || "Task",
              clients: task.clients || "Client"
            };
          } else {
            // For regular users - create individual task entries
            return {
              ...task,
              count_tasks: 1, // Each item is a single task
              task_name: task.task_name || "Task",
              clients: task.clients || "Client",
              name: task.name || "Unknown"
            };
          }
        });

        // Filter tasks based on status
        const validTasks = processedData.filter(task => 
          task && ["acknowledge"].includes(task.status)
        );

        const validTasks1 = processedData.filter(task => 
          task && ["in-progress"].includes(task.status)
        );

        const validTasks2 = processedData.filter(task => 
          task && ["completed"].includes(task.status)
        );

        const validOverdueTasks = processedData.filter(task => 
          task && ["overdue", "pending"].includes(task.status)
        );

        setTodoTasks(validTasks);
        setInProgressTasks(validTasks1);
        setCompletedTasks(validTasks2);
        setOverdueTasks(validOverdueTasks);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Unable to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, []);

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
    if (user?.role !== "staff") {
      // Admin - sum up count_tasks
      return todoTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 1), 0);
    } else {
      // Regular user - just count number of tasks
      return todoTasks.length;
    }
  };

  // Calculate total task count for In Progress section
  const getTotalInProgressTaskCount = () => {
    if (user?.role !== "staff") {
      return inProgressTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 1), 0);
    } else {
      return inProgressTasks.length;
    }
  };

  // Calculate total task count for Completed section
  const getTotalCompletedTaskCount = () => {
    if (user?.role !== "staff") {
      return completedTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 1), 0);
    } else {
      return completedTasks.length;
    }
  };

  // Calculate total task count for Overdue section
  const getTotalOverdueTaskCount = () => {
    if (user?.role !== "staff") {
      return overdueTasks.reduce((total, task) => total + (parseInt(task.count_tasks) || 1), 0);
    } else {
      return overdueTasks.length;
    }
  };

  // Format time and date functions
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  // Helper function to render task card based on user role
  const renderTaskCard = (task, index, status) => {
    const isAdmin = user?.role !== "staff";
    
    if (isAdmin) {
      // Admin view
      return (
        <div key={task.user_id || index} className="p-4 bg-gradient-to-r mb-2 from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-black-800 text-sm mb-1">
                {task.name || "Unknown User"} has <span className="text-red-900">{task.count_tasks || 1}</span> {status} Task{(task.count_tasks || 1) !== 1 ? 's' : ''}
              </h4>
            </div>
          </div>
        </div>
      );
    } else {
      // Regular user view
      return (
        <div key={task.ta_id || index} className="p-4 bg-gradient-to-r mb-2 from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-black-800 text-sm mb-1">
                {task.task_name || "Task"}
              </h4>
              <p className="text-xs text-gray-600">
                {task.clients} • Priority: {task.priority}
                {task.deadline && <span> • Deadline: {task.deadline}</span>}
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <CapsuleGridMarquee items={items} speed={25} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back {user.name ? user.name : " "}!</h1>
          <p className="text-gray-600 mt-2">{formatDate(currentTime)} • {formatTime(currentTime)}</p>
        </div>

        {/* First Row - 3 Task Boxes (Larger) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <Link to="/dashboard/task-management/view-task" key={task.ta_id || task.user_id || index}>
                    {renderTaskCard(task, index, "To Do")}
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
              {inProgressTasks.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No tasks in progress</p>
                </div>
              ) : (
                getPaginatedTasks(inProgressTasks, inProgressPage).map((task, index) => (
                  <Link to="/dashboard/task-management/view-task" key={task.ta_id || task.user_id || index}>
                    <div className="p-4 bg-gradient-to-r mb-2 from-orange-50 to-yellow-50 rounded-lg border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          {user?.role !== "staff" ? (
                            <h4 className="font-semibold text-black-800 text-sm mb-1">
                              {task.name} has <span className="text-red-900">{task.count_tasks || 1}</span> Task{(task.count_tasks || 1) !== 1 ? 's' : ''} in Progress
                            </h4>
                          ) : (
                            <>
                              <h4 className="font-semibold text-black-800 text-sm mb-1">
                                {task.task_name || "Task"}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {task.clients} • Priority: {task.priority}
                                {task.deadline && <span> • Deadline: {task.deadline}</span>}
                              </p>
                            </>
                          )}
                        </h4>
                        {user.role === "staff" && (
                          <em className="text-xs">{task.clients}</em>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <PaginationControls
              currentPage={inProgressPage}
              totalPages={getTotalPages(inProgressTasks)}
              onPageChange={setInProgressPage}
              category="inProgress"
            />
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-black-800 ml-3">Overdue</h2>
              <span className="ml-auto bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {getTotalOverdueTaskCount()}
              </span>
            </div>
            <div className="space-y-3 flex-grow">
              {overdueTasks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No overdue tasks</p>
                </div>
              ) : (
                getPaginatedTasks(overdueTasks, overduePage).map((task, index) => (
                  <Link to="/dashboard/task-management/view-task" key={task.ta_id || task.user_id || index}>
                    <div className="p-4 bg-gradient-to-r mb-2 from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          {user?.role !== "staff" ? (
                            <h4 className="font-semibold text-black-800 text-sm mb-1">
                              {task.name} has <span className="text-red-900">{task.count_tasks || 1}</span> Overdue Task{(task.count_tasks || 1) !== 1 ? 's' : ''}
                            </h4>
                          ) : (
                            <>
                              <h4 className="font-semibold text-black-800 text-sm mb-1">
                                {task.task_name || "Task"}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {task.clients} • Priority: {task.priority}
                                {task.deadline && <span> • Deadline: {task.deadline}</span>}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <PaginationControls
              currentPage={overduePage}
              totalPages={getTotalPages(overdueTasks)}
              onPageChange={setOverduePage}
              category="overdue"
            />
          </div>
        </div>

        {/* Second Row - 3 Boxes (Completed, Combined Today's Thought & Announcements, Birthday & Anniversary) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Completed Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col">
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
              {completedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No completed tasks</p>
                </div>
              ) : (
                getPaginatedTasks(completedTasks, completedPage).map((task, index) => (
                  <div key={task.ta_id || task.user_id || index} className="p-4 bg-gradient-to-r mb-2 from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        {user?.role !== "staff" ? (
                          <h4 className="font-semibold text-black-800 text-sm mb-1">
                            {task.name} has <span className="text-red-900">{task.count_tasks || 1}</span> Completed Task{(task.count_tasks || 1) !== 1 ? 's' : ''}
                          </h4>
                        ) : (
                          <>
                            <h4 className="font-semibold text-black-800 text-sm mb-1 line-through">
                              {task.task_name || "Task"}
                            </h4>
                            <p className="text-xs text-gray-600 line-through">
                              {task.clients} • Priority: {task.priority}
                              {task.deadline && <span> • Deadline: {task.deadline}</span>}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <PaginationControls
              currentPage={completedPage}
              totalPages={getTotalPages(completedTasks)}
              onPageChange={setCompletedPage}
              category="completed"
            />
          </div>

          {/* Combined Today's Thought & Announcements Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col">
            {/* Today's Thought Section */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-2 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 ml-3">Today's Thought</h2>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">"</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <blockquote className="text-gray-700 italic text-sm leading-relaxed">
                      "If you aspire to the highest place, it is no disgrace to stop at the second or even the third place."
                    </blockquote>
                    <div className="mt-3 pt-2 border-t border-purple-100">
                      <p className="text-xs text-gray-500 font-medium">- Marcus Tullius Cicero</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcements Section */}
            <div className="flex-grow">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 p-2 rounded-lg">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 ml-3">Announcements</h2>
                <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                  {currentAnnouncements.length}
                </span>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {currentAnnouncements.length === 0 ? (
                  <div className="text-center py-4">
                    <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No announcements</p>
                  </div>
                ) : (
                  currentAnnouncements.map((announce, index) => (
                    <div
                      key={announce.id}
                      className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border-l-3 border-indigo-400 hover:shadow-sm transition-shadow duration-200"
                    >
                      <div className="flex items-start">
                        <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2 flex-grow">
                          <h4 className="font-semibold text-gray-800 text-xs mb-1 line-clamp-1">
                            {announce.name}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {announce.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Birthday & Anniversary Box */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Celebrations</h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            {/* Birthday Section */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="bg-gradient-to-r from-pink-100 to-pink-50 p-2 rounded-lg">
                  <Cake className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="font-semibold text-black-700 ml-3">Birthdays Today</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="text-center py-3">
                  <Cake className="w-8 h-8 text-black-300 mx-auto mb-2" />
                  <p className="text-black-500 text-sm">No birthdays today</p>
                  <p className="text-xs text-black-400 mt-1">Wish your colleagues tomorrow!</p>
                </div>
              </div>
            </div>

            {/* Anniversary Section */}
            <div>
              <div className="flex items-center mb-3">
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-2 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-700 ml-3">Work Anniversaries</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="text-center py-3">
                  <Award className="w-8 h-8 text-black-300 mx-auto mb-2" />
                  <p className="text-black-500 text-sm">No anniversaries today</p>
                  <p className="text-xs text-black-400 mt-1">Celebrate milestones tomorrow!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;