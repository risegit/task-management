import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import Swal from "sweetalert2";
import axios from "axios";
import { getCurrentUser } from "../../../utils/api";
import TaskComments from "./TaskComments";

export default function EditTask() {
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [assignedUsersStatus, setAssignedUsersStatus] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  const [loggedInUserStatus, setLoggedInUserStatus] = useState(null);
  const [isTaskCreator, setIsTaskCreator] = useState(false);
  const [isUserAssignedToTask, setIsUserAssignedToTask] = useState(false);
  const [userBelongsToProject, setUserBelongsToProject] = useState([]);
  const [originalGraphicType, setOriginalGraphicType] = useState("");
  const [timeSlotOptions, setTimeSlotOptions] = useState([]);
  const [originalTimeSlots, setOriginalTimeSlots] = useState({});

  const user = getCurrentUser();
  const userId = user?.id;
  const userName = user?.name || "User";
  const { id } = useParams();
  const navigate = useNavigate();

  const priorityOptions = [
    { value: "Low", label: "Low", color: "#10b981" },
    { value: "Medium", label: "Medium", color: "#f59e0b" },
    { value: "High", label: "High", color: "#ef4444" },
  ];

  const statusOptions = [
    { value: "not-acknowledge", label: "Not Acknowledge", color: "#9ca3af", bgColor: "#f3f4f6" },
    { value: "acknowledge", label: "Acknowledge", color: "#3b82f6", bgColor: "#dbeafe" },
    { value: "in-progress", label: "In Progress", color: "#f59e0b", bgColor: "#fef3c7" },
    { value: "completed", label: "Completed", color: "#10b981", bgColor: "#d1fae5" },
  ];

  const graphicOptions = [
    { value: "Logo Design", label: "Logo Design" },
    { value: "ID Card Design",label:"ID Card Design"},
    { value: "Website UI Design", label: "Website UI Design" },
    { value: "Website Banner", label: "Website Banner" },
    { value: "Website Slider", label: "Website Slider" },
    { value: "Landing Page", label: "Landing Page" },
    { value: "Web Icons", label: "Web Icons" },
    { value: "Website Illustrations", label: "Website Illustrations" },
    { value: "Website Infographics", label: "Website Infographics" },
    { value: "Website Graphics", label: "Website Graphics" },
    { value: "Static Post", label: "Static Post" },
    { value: "Banner Print", label: "Banner (Print)" },
    { value: "Banner Digital", label: "Banner (Digital)" },
    { value: "Standee Print", label: "Standee (Print)" },
    { value: "Selfie Booth Print", label: "Selfie Booth (Print)" },
    { value: "Business Card", label: "Business Card" },
    { value: "Letterhead", label: "Letterheads" },
    { value: "Magazine Ads", label: "Magazine Ads" },
    { value: "Flyer One Pager", label: "Flyer (One-Pager)" },
    { value: "Brochure Multi Page", label: "Brochure (Multi Page)" },
    { value: "Booklet", label: "Booklet" },
    { value: "Tri Fold", label: "Tri-Fold (3 Pages)" },
    { value: "Carousel Post", label: "Carousel (Post)" },
    { value: "Reel Post", label: "Reel (Post)" },
    { value: "Animated Reel", label: "Animated Reel (Graphic + Video)" },
    { value: "Icon Design", label: "Icon Design" },
    { value: "Packaging Design", label: "Packaging Design" },
    { value: "Brand Guideline", label: "Brand Guideline" },
    { value: "PPT Design", label: "PPT" },
    { value: "Email Signature", label: "Email Signature" },
    { value: "Emailer Newsletter", label: "Emailer / Newsletter" },
    { value: "Brand Video", label: "Brand Video" },
    { value: "Explainer Video", label: "Explainer Video" },
    { value: "Booth Creatives", label: "Booth Creatives" }
  ];

  const [taskData, setTaskData] = useState({
    name: "",
    projectName: "",
    assignedBy: "",
    assignedTo: [],
    deadline: "",
    remarks: "",
    priority: "",
    status: "",
    taskStatus: "",
    graphicType: "",
    timeSlots: {},
  });

  const getGraphicDesignMembers = () => {
    if (taskData.assignedTo.length === 0) return [];
    
    const selectedUserIds = taskData.assignedTo.map(user => user.value);
    
    return userBelongsToProject.filter(user => 
      selectedUserIds.includes(user.emp_id || user.id) && 
      user.dept_name === "Graphic Design / Video Editor"
    );
  };

  const hasGraphicDesignMember = () => {
    return getGraphicDesignMembers().length > 0;
  };

  const isAnimatedReelSelected = () => {
    return taskData.graphicType?.value === "Animated Reel";
  };

  useEffect(() => {
    const updateTimeSlots = () => {
      // Create half-hour slots from 10:00 AM to 7:00 PM
      const timeSlots = [];
      const startHour = 10; // 10:00 AM
      const endHour = 19; // 7:00 PM (19 in 24-hour format)
      
      for (let hour = startHour; hour <= endHour; hour++) {
        // Convert 24-hour to 12-hour format for display
        const displayHour = hour % 12 || 12;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour < endHour) {
          // :00 slot
          timeSlots.push({
            value: `${hour.toString().padStart(2, '0')}:00`,
            label: `${displayHour}:00 ${period}`,
            hour: hour,
            minute: 0
          });
          
          // :30 slot
          timeSlots.push({
            value: `${hour.toString().padStart(2, '0')}:30`,
            label: `${displayHour}:30 ${period}`,
            hour: hour,
            minute: 30
          });
        } else {
          // For the last hour (7:00 PM), only include :00 slot
          timeSlots.push({
            value: `${hour.toString().padStart(2, '0')}:00`,
            label: `${displayHour}:00 ${period}`,
            hour: hour,
            minute: 0
          });
        }
      }

      if (taskData.deadline) {
        const deadlineDate = new Date(taskData.deadline);
        const today = new Date();
        
        today.setHours(0, 0, 0, 0);
        const deadlineForCompare = new Date(deadlineDate);
        deadlineForCompare.setHours(0, 0, 0, 0);
        
        const isToday = deadlineForCompare.getTime() === today.getTime();
        
        if (isToday) {
          const currentHour = new Date().getHours();
          const currentMinutes = new Date().getMinutes();
          const currentTime = currentHour + (currentMinutes / 60);
          
          const updatedSlots = timeSlots.map(slot => {
            const slotTime = slot.hour + (slot.minute / 60);
            return {
              ...slot,
              isDisabled: slotTime <= currentTime
            };
          });
          
          setTimeSlotOptions(updatedSlots);
          return;
        }
      }
      
      const updatedSlots = timeSlots.map(slot => ({
        ...slot,
        isDisabled: false
      }));
      
      setTimeSlotOptions(updatedSlots);
    };

    updateTimeSlots();
  }, [taskData.deadline]);

  useEffect(() => {
    if (!hasGraphicDesignMember() || !taskData.graphicType) {
      setTaskData(prev => ({ ...prev, timeSlots: {} }));
    } else {
      const graphicMembers = getGraphicDesignMembers();
      const newTimeSlots = { ...taskData.timeSlots };
      
      graphicMembers.forEach(member => {
        const userId = member.emp_id || member.id;
        if (!newTimeSlots[userId]) {
          newTimeSlots[userId] = originalTimeSlots[userId] || "";
        }
      });
      
      Object.keys(newTimeSlots).forEach(userId => {
        if (!graphicMembers.some(member => (member.emp_id || member.id) === userId)) {
          delete newTimeSlots[userId];
        }
      });
      
      setTaskData(prev => ({ ...prev, timeSlots: newTimeSlots }));
    }
  }, [taskData.assignedTo, taskData.graphicType, originalTimeSlots]);

  const getAvatarColor = (id) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500"];
    return colors[parseInt(id) % colors.length];
  };

  const getUserInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserRemovable = (userId) => {
    const status = assignedUsersStatus[userId];
    return !(status === "in-progress" || status === "completed");
  };

  const formatTimeLabel = (timeValue) => {
    if (!timeValue) return "";
    
    try {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      if (minutes === 30) {
        return `${displayHours}:30 ${period}`;
      } else {
        return `${displayHours}:00 ${period}`;
      }
    } catch (error) {
      return timeValue;
    }
  };

  const priorityCustomStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? state.data.color + '20' : 'white',
      color: state.data.color,
      fontWeight: '500',
      borderLeft: state.isSelected ? `4px solid ${state.data.color}` : '4px solid transparent',
      '&:hover': {
        backgroundColor: state.data.color + '10',
      },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color,
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
    }),
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${errors.priority ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: errors.priority ? '#fef2f2' : 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? (errors.priority ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
      "&:hover": {
        borderColor: errors.priority ? '#f87171' : '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
  };

  const statusCustomStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? state.data.bgColor : 'white',
      color: state.data.color,
      fontWeight: '500',
      borderLeft: state.isSelected ? `4px solid ${state.data.color}` : '4px solid transparent',
      '&:hover': {
        backgroundColor: state.data.bgColor,
      },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color,
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${errors.status ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: errors.status ? '#fef2f2' : 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? (errors.status ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
      "&:hover": {
        borderColor: errors.status ? '#f87171' : '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
  };

  const graphicCustomStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? '#f3f4f6' : 'white',
      color: '#7c3aed',
      fontWeight: '500',
      borderLeft: state.isSelected ? `4px solid #8b5cf6` : '4px solid transparent',
      '&:hover': {
        backgroundColor: '#f3f4f6',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#7c3aed',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
    }),
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${errors.graphicType ? '#fca5a5' : state.isFocused ? '#8b5cf6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: errors.graphicType ? '#fef2f2' : 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? (errors.graphicType ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(139, 92, 246, 0.1)') : 'none',
      "&:hover": {
        borderColor: errors.graphicType ? '#f87171' : '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
  };

  const timeSlotCustomStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '12px 16px',
      backgroundColor: state.isSelected ? '#8b5cf6' : state.isDisabled ? '#f1f5f9' : 'white',
      color: state.isDisabled ? '#94a3b8' : state.isSelected ? 'white' : '#7c3aed',
      fontWeight: '500',
      borderLeft: state.isSelected ? `4px solid #8b5cf6` : '4px solid transparent',
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      '&:hover': {
        backgroundColor: state.isDisabled ? '#f1f5f9' : state.isSelected ? '#8b5cf6' : '#f3f4f6',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#7c3aed',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
    }),
    control: (provided, state) => ({
      ...provided,
      border: `2px solid ${errors.time ? '#fca5a5' : state.isFocused ? '#8b5cf6' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      padding: '8px 4px',
      backgroundColor: errors.time ? '#fef2f2' : 'white',
      minHeight: '52px',
      boxShadow: state.isFocused ? (errors.time ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(139, 92, 246, 0.1)') : 'none',
      "&:hover": {
        borderColor: errors.time ? '#f87171' : '#94a3b8',
      },
    }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: '0.75rem',
      marginTop: '4px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }),
  };

  const formatOptionLabel = ({ value, label, color }) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );

  const formatStatusOptionLabel = ({ value, label, color, bgColor }) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );

  const CustomMultiValueRemove = (props) => {
    const { data } = props;
    const isRemovable = isUserRemovable(data.value);
    
    if (!isRemovable) {
      return null;
    }
    
    return <components.MultiValueRemove {...props} />;
  };

  const CustomMultiValue = (props) => {
    const { data } = props;
    const isRemovable = isUserRemovable(data.value);
    
    let displayName = data.originalName || data.label || '';
    
    if (displayName.includes(' (POC)')) {
      displayName = displayName.replace(' (POC)', '');
    }
    
    return (
      <components.MultiValue {...props}>
        <div className="flex items-center gap-1 px-1">
          <span className="font-medium">{displayName}</span>
          {!isRemovable && data.status && (
            <span className="text-xs text-gray-600 italic ml-1">({data.status})</span>
          )}
          {data.isPOC && (
            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-1">POC</span>
          )}
        </div>
      </components.MultiValue>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSelectChange = (field, selected) => {
    if (field === "assignedTo") {
      const nonRemovableUsers = taskData.assignedTo.filter(user => 
        !isUserRemovable(user.value)
      );
      
      const newSelection = [
        ...nonRemovableUsers,
        ...selected.filter(newUser => 
          isUserRemovable(newUser.value) && 
          !nonRemovableUsers.some(nr => nr.value === newUser.value)
        )
      ];
      
      const hasGraphicDesignMemberNow = (() => {
        const selectedUserIds = newSelection.map(user => user.value);
        return userBelongsToProject.some(user => 
          selectedUserIds.includes(user.emp_id || user.id) && 
          user.dept_name === "Graphic Design / Video Editor"
        );
      })();
      
      const hadGraphicDesignMemberBefore = hasGraphicDesignMember();
      
      setTaskData(prev => ({ ...prev, [field]: newSelection }));
      
      if (!hadGraphicDesignMemberBefore && hasGraphicDesignMemberNow) {
        setTimeout(() => {
          if (originalGraphicType) {
            setTaskData(prev => ({ ...prev, graphicType: originalGraphicType }));
          }
          
          if (Object.keys(originalTimeSlots).length > 0) {
            const newTimeSlots = { ...taskData.timeSlots };
            Object.keys(originalTimeSlots).forEach(userId => {
              if (newSelection.some(user => user.value === userId)) {
                newTimeSlots[userId] = originalTimeSlots[userId];
              }
            });
            
            setTaskData(prev => ({ ...prev, timeSlots: newTimeSlots }));
          }
        }, 100);
      }
      
      if (!hasGraphicDesignMemberNow) {
        setTaskData(prev => ({ 
          ...prev, 
          graphicType: "",
          timeSlots: {}
        }));
      }
    } else if (field === "graphicType") {
      setTaskData({ ...taskData, [field]: selected });
      setOriginalGraphicType(selected);
      
      if (selected && hasGraphicDesignMember()) {
        const graphicMembers = getGraphicDesignMembers();
        const newTimeSlots = { ...taskData.timeSlots };
        
        graphicMembers.forEach(member => {
          const userId = member.emp_id || member.id;
          if (!newTimeSlots[userId] && originalTimeSlots[userId]) {
            newTimeSlots[userId] = originalTimeSlots[userId];
          }
        });
        
        if (selected.value !== "Animated Reel" && graphicMembers.length > 0) {
          const firstMemberId = graphicMembers[0].emp_id || graphicMembers[0].id;
          const existingTimeSlot = newTimeSlots[firstMemberId] || originalTimeSlots[firstMemberId];
          
          if (existingTimeSlot) {
            graphicMembers.forEach(member => {
              const userId = member.emp_id || member.id;
              newTimeSlots[userId] = existingTimeSlot;
            });
          }
        }
        
        setTaskData(prev => ({ ...prev, timeSlots: newTimeSlots }));
      }
    } else {
      setTaskData({ ...taskData, [field]: selected });
    }
    
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleTimeSlotChange = (userId, selected) => {
    setTaskData(prev => {
      const newTimeSlots = { ...prev.timeSlots };
      
      if (isAnimatedReelSelected()) {
        newTimeSlots[userId] = selected;
      } else {
        const graphicMembers = getGraphicDesignMembers();
        graphicMembers.forEach(member => {
          const memberId = member.emp_id || member.id;
          newTimeSlots[memberId] = selected;
        });
      }
      
      return {
        ...prev,
        timeSlots: newTimeSlots
      };
    });
    
    if (errors.time) {
      setErrors({ ...errors, time: "" });
    }
  };

  const validate = () => {
    let newErrors = {};

    if (!taskData.name.trim()) newErrors.name = "Task name is required";
    else if (taskData.name.trim().length < 3) newErrors.name = "Task name must be at least 3 characters";
    else if (taskData.name.trim().length > 100) newErrors.name = "Task name cannot exceed 100 characters";

    if (taskData.assignedTo.length === 0) newErrors.assignedTo = "Please select at least one assignee";
    
    if (hasGraphicDesignMember() && !taskData.graphicType) {
      newErrors.graphicType = "Graphic type is required for Graphic Design members";
    }

    if (isAnimatedReelSelected()) {
      const graphicMembers = getGraphicDesignMembers();
      let allTimeSlotsValid = true;
      
      graphicMembers.forEach(member => {
        const userId = member.emp_id || member.id;
        if (!taskData.timeSlots[userId]) {
          allTimeSlotsValid = false;
        }
      });
      
      if (!allTimeSlotsValid) {
        newErrors.time = "Time slot is required for each Graphic Design member for Animated Reel";
      }
    }
    else if (hasGraphicDesignMember() && !isAnimatedReelSelected()) {
      const hasAnyTimeSlot = Object.values(taskData.timeSlots).some(slot => slot !== "");
      if (!hasAnyTimeSlot) {
        newErrors.time = "Time slot is required for Graphic Design members";
      }
    }

    if (!taskData.priority) newErrors.priority = "Priority is required";
    
    if (isUserAssignedToTask && !taskData.status) {
      newErrors.status = "Status is required";
    }

    if (!taskData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(taskData.deadline);
      
      if (taskData.created_date) {
        const createdDate = new Date(taskData.created_date).setHours(0, 0, 0, 0);
        if (deadlineDate <= createdDate) {
          newErrors.deadline = `Deadline cannot be before the task creation date (${taskData.created_date})`;
        }
      }
    }

    if (taskData.remarks && taskData.remarks.length > 500) newErrors.remarks = "Remarks cannot exceed 500 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTaskData = async () => {
      setLoading(true);
      setLoadingAssignedUsers(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/task-management.php`,
          {
            params: { 
              task_id: id,
              user_id: userId,
              user_code: user?.user_code,
              'edit-task': true
            },
          }
        );
        
        const data = response.data;

        console.log("API response:", data);
        
        if (data.status === "success" && data.data && data.data.length > 0) {
          const task = data.data[0];
          
          if (data.userBelongsToProject) {
            setUserBelongsToProject(data.userBelongsToProject);
          }
          
          const isCreator = task.assigned_by === userId;
          setIsTaskCreator(isCreator);
          
          const userStatusMap = {};
          let loggedInUserAssignment = null;
          let isUserInAssignedTo = false;
          const timeSlotsMap = {};
          const originalTimeSlotsMap = {};
          
          if (data.assignedTo) {
            data.assignedTo.forEach(user => {
              userStatusMap[user.user_id] = user.status;
              
              if (user.user_id === userId) {
                loggedInUserAssignment = user;
                isUserInAssignedTo = true;
              }
              
              if (user.time && user.time.trim() !== "") {
                const timeLabel = formatTimeLabel(user.time);
                const timeHour = parseInt(user.time.split(':')[0]);
                const timeMinute = parseInt(user.time.split(':')[1] || 0);
                const timeOption = {
                  value: user.time,
                  label: timeLabel,
                  hour: timeHour,
                  minute: timeMinute
                };
                timeSlotsMap[user.user_id] = timeOption;
                originalTimeSlotsMap[user.user_id] = timeOption;
              }
            });
          }
          
          setAssignedUsersStatus(userStatusMap);
          setIsUserAssignedToTask(isUserInAssignedTo);
          setOriginalTimeSlots(originalTimeSlotsMap);
          
          if (loggedInUserAssignment) {
            setLoggedInUserStatus(loggedInUserAssignment.status);
          } else {
            setLoggedInUserStatus(null);
          }
          
          const assignedUsers = data.assignedTo?.map(user => {
            const userInfo = data.userBelongsToProject?.find(u => u.emp_id === user.user_id);
            const isPOC = userInfo?.is_poc === "1";
            
            return {
              value: user.user_id,
              label: user.name + (isPOC ? " (POC)" : ""),
              originalName: user.name,
              status: user.status,
              isPOC: isPOC,
              isRemovable: !(user.status === "in-progress" || user.status === "completed"),
              department: user.dept_name
            };
          }) || [];

          const allUsers = data.userBelongsToProject || [];
          const formattedUsers = allUsers
            .map(user => ({
              value: user.emp_id,
              label: user.name + (user.is_poc === "1" ? " (POC)" : ""),
              originalName: user.name,
              isPOC: user.is_poc === "1",
              department: user.dept_name
            }));
          
          setAssignedTo(formattedUsers);

          setSelectedProject({
            value: task.client_id,
            label: task.name || "Unknown Project"
          });

          let determinedStatus = "not-acknowledge";
          
          if (isCreator && task.task_status) {
            determinedStatus = task.task_status.toLowerCase().replace(/\s+/g, '-');
          } else if (loggedInUserAssignment && loggedInUserAssignment.status) {
            determinedStatus = loggedInUserAssignment.status.toLowerCase().replace(/\s+/g, '-');
          }

          const statusOption = statusOptions.find(opt => opt.value === determinedStatus) || 
                              statusOptions.find(opt => opt.value === "not-acknowledge");

          let graphicTypeValue = "";
          if (data.assignedTo) {
            const graphicUser = data.assignedTo.find(user => user.graphic_creative_type && user.graphic_creative_type.trim() !== "");
            if (graphicUser && graphicUser.graphic_creative_type) {
              graphicTypeValue = graphicOptions.find(opt => opt.value === graphicUser.graphic_creative_type) || "";
            }
          }

          setOriginalGraphicType(graphicTypeValue);

          setTaskData({
            name: task.task_name || "",
            projectName: task.name || "",
            assignedBy: task.assigned_by || "",
            assignedTo: assignedUsers,
            deadline: task.deadline || "",
            remarks: task.remarks || "",
            priority: priorityOptions.find(p => p.value === task.priority) || "",
            status: statusOption,
            created_date: task.created_date || "",
            taskStatus: task.task_status || "",
            graphicType: graphicTypeValue,
            timeSlots: timeSlotsMap
          });

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Task not found',
            confirmButtonText: 'OK',
            confirmButtonColor: '#d33',
          }).then(() => {
            navigate(-1);
          });
        }
        
      } catch (error) {
        console.error("Axios error:", error);
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Failed to fetch task data.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        }).then(() => {
          navigate(-1);
        });
      } finally {
        setLoading(false);
        setLoadingAssignedUsers(false);
      }
    };
    
    fetchTaskData();
  }, [id]);

  const getSingleTimeSlotValue = () => {
    if (!hasGraphicDesignMember() || !taskData.graphicType) {
      return "";
    }
    
    const graphicMembers = getGraphicDesignMembers();
    if (graphicMembers.length === 0) {
      return "";
    }
    
    const firstMember = graphicMembers[0];
    const userId = firstMember.emp_id || firstMember.id;
    
    return taskData.timeSlots[userId] || "";
  };

  const handleSubmit = async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: firstError });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      formData.append("taskName", taskData.name.trim());
      formData.append("assignedBy", taskData.assignedBy);
      formData.append("userName", user?.name);
      formData.append("priority", taskData.priority.value);
      
      if (isUserAssignedToTask || isTaskCreator) {
        formData.append("status", taskData.status.value);
      }
      
      if (taskData.graphicType) {
        formData.append("graphic_type", taskData.graphicType.value);
      }
      
      formData.append("deadline", taskData.deadline);
      formData.append("remarks", taskData.remarks.trim());
      
      const assignedToPayload = taskData.assignedTo.map(selectedUser => {
        const userDetails = userBelongsToProject.find(
          u => (u.emp_id || u.id) === selectedUser.value
        );

        const userData = {
          user_id: selectedUser.value,
          dept_name: userDetails?.dept_name || ""
        };

        if (userDetails?.dept_name === "Graphic Design / Video Editor" && taskData.timeSlots[selectedUser.value]) {
          userData.time_slot = taskData.timeSlots[selectedUser.value].value;
        }

        return userData;
      });

      formData.append("assignedTo", JSON.stringify(assignedToPayload));
      
      if (selectedProject && selectedProject.value) {
        formData.append("client_id", selectedProject.value);
      }
      
      if (id) {
        formData.append("taskId", id);
        formData.append("_method", "PUT");
      }
      
      formData.append("userId", userId);
      formData.append("userCode", user?.user_code || "");
      
      console.log("Submitting task data:", {
        task_name: taskData.name,
        assigned_by: taskData.assignedBy,
        assigned_to: assignedToPayload,
        priority: taskData.priority?.value,
        status: taskData.status?.value,
        graphic_type: taskData.graphicType?.value,
        time_slots: taskData.timeSlots,
        deadline: taskData.deadline,
        remarks: taskData.remarks,
        task_id: id || "new",
        is_task_creator: isTaskCreator,
        is_user_assigned: isUserAssignedToTask
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/task-management.php`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: {
            id: userId,
            user_code: user?.user_code
          }
        }
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status === "success") {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Task Updated!', 
          text: result.message || 'Task has been updated successfully.',
          timer: 2000, 
          showConfirmButton: false 
        });
        
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Operation Failed', 
          text: result.message || result.error || "Failed to save task. Please try again." 
        });
      }
    } catch (error) {
      console.error("Submit Error Details:", error);
      
      let errorMessage = 'An error occurred while saving the task.';
      let errorTitle = 'Error';
      
      if (error.response) {
        if (error.response.data) {
          errorMessage = error.response.data.message || 
                        error.response.data.error || 
                        `Server error: ${error.response.status} - ${error.response.statusText}`;
        } else {
          errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        }
        
        errorTitle = 'Server Error';
        
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection and try again.';
        errorTitle = 'Connection Error';
        
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: errorTitle, 
        text: errorMessage,
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const customComponents = {
    MultiValue: CustomMultiValue,
    MultiValueRemove: CustomMultiValueRemove
  };

  const canEditStatus = isUserAssignedToTask || isTaskCreator;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Edit Task
            </h2>
            <p className="text-blue-100 mt-2">
              {isTaskCreator ? "You can edit all task details" : 
               isUserAssignedToTask ? "You can update your task status" : 
               "You are not assigned to this task"}
            </p>
            {!isTaskCreator && !isUserAssignedToTask && (
              <div className="mt-2 text-yellow-100 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Only assigned users can update task status
              </div>
            )}
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600">Loading task details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Project
                      <span className="text-red-500">*</span>
                    </label>
                    <div className={`px-4 py-3 rounded-xl border-2 ${isTaskCreator ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <p className={`font-medium ${isTaskCreator ? 'text-slate-800' : 'text-slate-600'}`}>{taskData.projectName}</p>
                    </div>
                    <p className="text-xs text-slate-500">Project is read-only</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Assigned To
                      <span className="text-red-500">*</span>
                      {loadingAssignedUsers && (
                        <span className="text-xs text-blue-500 font-normal animate-pulse">
                          Loading...
                        </span>
                      )}
                      {!isTaskCreator && (
                        <span className="text-xs text-amber-600 font-normal">
                          (Read-only)
                        </span>
                      )}
                    </label>
                    
                    <Select
                      isMulti
                      options={allAssignedTo}
                      value={taskData.assignedTo}
                      onChange={isTaskCreator ? (selected) => handleSelectChange("assignedTo", selected) : undefined}
                      classNamePrefix="react-select"
                      className={`react-select-container ${errors.assignedTo ? 'error' : ''}`}
                      styles={{
                        menu: (provided) => ({ 
                          ...provided, 
                          zIndex: 9999,
                          borderRadius: '0.75rem',
                          marginTop: '4px',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                        }),
                        control: (provided, state) => ({
                          ...provided,
                          border: `2px solid ${errors.assignedTo ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                          borderRadius: '0.75rem',
                          padding: '8px 4px',
                          backgroundColor: errors.assignedTo ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                          minHeight: '52px',
                          boxShadow: state.isFocused && isTaskCreator ? (errors.assignedTo ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                          "&:hover": {
                            borderColor: errors.assignedTo ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                          },
                          opacity: loadingAssignedUsers || !isTaskCreator ? 0.7 : 1,
                          cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                        }),
                        multiValue: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.data.status === 'in-progress' ? '#fef3c7' : 
                                         state.data.status === 'completed' ? '#d1fae5' : 
                                         state.data.status === 'acknowledge' ? '#dbeafe' : 
                                         '#e0f2fe',
                          borderRadius: '0.5rem',
                          border: state.data.status === 'in-progress' ? '1px solid #f59e0b' : 
                                 state.data.status === 'completed' ? '1px solid #10b981' : 
                                 state.data.status === 'acknowledge' ? '1px solid #3b82f6' : 
                                 '1px solid #0369a1',
                          opacity: !isTaskCreator ? 0.8 : 1,
                        }),
                        multiValueLabel: (provided, state) => ({
                          ...provided,
                          color: state.data.status === 'in-progress' ? '#92400e' : 
                                state.data.status === 'completed' ? '#065f46' : 
                                state.data.status === 'acknowledge' ? '#1e40af' : 
                                '#0369a1',
                          fontWeight: '500',
                          paddingRight: '4px',
                        }),
                        multiValueRemove: (provided, state) => {
                          const isRemovable = !(state.data.status === 'in-progress' || 
                                               state.data.status === 'completed');
                          
                          return {
                            ...provided,
                            color: isRemovable && isTaskCreator ? '#0369a1' : '#9ca3af',
                            cursor: isRemovable && isTaskCreator ? 'pointer' : 'not-allowed',
                            '&:hover': {
                              backgroundColor: isRemovable && isTaskCreator ? '#bae6fd' : 'transparent',
                              color: isRemovable && isTaskCreator ? '#0c4a6e' : '#9ca3af',
                            },
                            display: isRemovable && isTaskCreator ? 'flex' : 'none',
                          };
                        },
                        indicatorSeparator: (provided) => ({
                          ...provided,
                          display: isTaskCreator ? 'flex' : 'none',
                        }),
                        dropdownIndicator: (provided) => ({
                          ...provided,
                          display: isTaskCreator ? 'flex' : 'none',
                        }),
                      }}
                      placeholder={
                        loadingAssignedUsers 
                          ? "Loading team members..." 
                          : allAssignedTo.length === 0 
                            ? "No other team members available" 
                            : isTaskCreator 
                              ? "Select multiple team members..."
                              : "Assigned users (read-only)"
                      }
                      isDisabled={loading || loadingAssignedUsers || allAssignedTo.length === 0 || !isTaskCreator}
                      isLoading={loadingAssignedUsers}
                      loadingMessage={() => (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading team members...</span>
                        </div>
                      )}
                      noOptionsMessage={() => 
                        loadingAssignedUsers 
                          ? "Loading team members..." 
                          : "No other team members available"
                      }
                      isClearable={isTaskCreator}
                      components={isTaskCreator ? customComponents : {
                        ...customComponents,
                        DropdownIndicator: () => null,
                        ClearIndicator: () => null,
                      }}
                    />
                    {errors.assignedTo && isTaskCreator && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.assignedTo}
                    </p>
                    )}
                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                      {allAssignedTo.length > 0 && (
                        <span>{allAssignedTo.length} team member(s) available (current user excluded)</span>
                      )}
                      {!isTaskCreator && (
                        <span className="text-amber-600">Field is read-only</span>
                      )}
                    </div>
                    {taskData.assignedTo.some(user => 
                      user.status === 'in-progress' || 
                      user.status === 'completed'
                    ) && isTaskCreator && (
                      <div className="mt-2 text-xs text-amber-600">
                        <span className="font-medium">Note:</span> Users with status "in-progress" or "completed" cannot be removed.
                      </div>
                    )}
                  </div>
                </div>

                {hasGraphicDesignMember() && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Task Name
                          <span className="text-red-500">*</span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={taskData.name}
                          onChange={isTaskCreator ? handleChange : undefined}
                          className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.name 
                              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                              : isTaskCreator 
                                ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                : "border-slate-100 bg-slate-50/50"
                          } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all`}
                          placeholder="Enter task name"
                          readOnly={!isTaskCreator}
                        />
                        {errors.name && isTaskCreator && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.name}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Required field</span>
                          <span className="text-slate-500">{taskData.name.length}/100 characters</span>
                          {!isTaskCreator && (
                            <span className="text-amber-600">Read-only</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          For Graphic (Creative Type)
                          <span className="text-red-500">*</span>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            Graphic Design Only
                          </span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </label>
                        <Select
                          options={graphicOptions}
                          value={taskData.graphicType}
                          onChange={isTaskCreator ? (selected) => handleSelectChange("graphicType", selected) : undefined}
                          classNamePrefix="react-select"
                          styles={{
                            ...graphicCustomStyles,
                            control: (provided, state) => ({
                              ...provided,
                              border: `2px solid ${errors.graphicType ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#8b5cf6' : '#e2e8f0') : '#e2e8f0'}`,
                              borderRadius: '0.75rem',
                              padding: '8px 4px',
                              backgroundColor: errors.graphicType ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                              minHeight: '52px',
                              boxShadow: state.isFocused && isTaskCreator ? (errors.graphicType ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(139, 92, 246, 0.1)') : 'none',
                              "&:hover": {
                                borderColor: errors.graphicType ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                              },
                              opacity: !isTaskCreator ? 0.7 : 1,
                              cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                          }}
                          placeholder="Select graphic type..."
                          isDisabled={!isTaskCreator}
                        />
                        {errors.graphicType && isTaskCreator && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.graphicType}
                          </p>
                        )}
                        <p className="text-xs text-purple-600">
                          Only shown when Graphic Design members are selected
                          {!isTaskCreator && ' (Read-only)'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Priority
                          <span className="text-red-500">*</span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </label>
                        <Select
                          options={priorityOptions}
                          value={taskData.priority}
                          onChange={isTaskCreator ? (selected) => handleSelectChange("priority", selected) : undefined}
                          classNamePrefix="react-select"
                          styles={{
                            ...priorityCustomStyles,
                            control: (provided, state) => ({
                              ...provided,
                              border: `2px solid ${errors.priority ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                              borderRadius: '0.75rem',
                              padding: '8px 4px',
                              backgroundColor: errors.priority ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                              minHeight: '52px',
                              boxShadow: state.isFocused && isTaskCreator ? (errors.priority ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                              "&:hover": {
                                borderColor: errors.priority ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                              },
                              opacity: !isTaskCreator ? 0.7 : 1,
                              cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                          }}
                          formatOptionLabel={formatOptionLabel}
                          placeholder="Select priority..."
                          isSearchable={false}
                          isDisabled={!isTaskCreator}
                        />
                        {errors.priority && isTaskCreator && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.priority}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Status
                          <span className="text-red-500">*</span>
                          {isTaskCreator && taskData.taskStatus && (
                            <span className="text-xs font-normal text-blue-500 italic">
                              (Task status: {taskData.taskStatus})
                            </span>
                          )}
                          {!isTaskCreator && loggedInUserStatus && (
                            <span className="text-xs font-normal text-blue-500 italic">
                              (Your status: {loggedInUserStatus})
                            </span>
                          )}
                          {!canEditStatus && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Not assigned)
                            </span>
                          )}
                        </label>
                        <Select
                          options={statusOptions}
                          value={taskData.status}
                          onChange={canEditStatus ? (selected) => handleSelectChange("status", selected) : undefined}
                          classNamePrefix="react-select"
                          styles={{
                            ...statusCustomStyles,
                            control: (provided, state) => ({
                              ...provided,
                              border: `2px solid ${errors.status ? '#fca5a5' : canEditStatus ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                              borderRadius: '0.75rem',
                              padding: '8px 4px',
                              backgroundColor: errors.status ? '#fef2f2' : (canEditStatus ? 'white' : '#f8fafc'),
                              minHeight: '52px',
                              boxShadow: state.isFocused && canEditStatus ? (errors.status ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                              "&:hover": {
                                borderColor: errors.status ? '#f87171' : (canEditStatus ? '#94a3b8' : '#e2e8f0'),
                              },
                              opacity: !canEditStatus ? 0.7 : 1,
                              cursor: canEditStatus ? 'pointer' : 'not-allowed',
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: canEditStatus ? 'flex' : 'none',
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              display: canEditStatus ? 'flex' : 'none',
                            }),
                          }}
                          formatOptionLabel={formatStatusOptionLabel}
                          placeholder={canEditStatus ? "Select status..." : "Not assigned to task"}
                          isSearchable={false}
                          isDisabled={!canEditStatus || loading}
                        />
                        {errors.status && canEditStatus && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.status}
                          </p>
                        )}
                        {!canEditStatus && (
                          <p className="text-xs text-amber-600 mt-1">
                            You are not assigned to this task. Only assigned users can update status.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        Deadline
                        <span className="text-red-500">*</span>
                        {!isTaskCreator && (
                          <span className="text-xs text-amber-600 font-normal">
                            (Read-only)
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="deadline"
                          value={taskData.deadline}
                          onChange={isTaskCreator ? handleChange : undefined}
                          min={taskData.created_date ? taskData.created_date : new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 pl-12 rounded-xl border-2 ${
                            errors.deadline 
                              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                              : isTaskCreator 
                                ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                : "border-slate-100 bg-slate-50/50"
                          } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all`}
                          readOnly={!isTaskCreator}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className={`w-5 h-5 ${errors.deadline ? 'text-red-500' : isTaskCreator ? 'text-blue-500' : 'text-slate-400'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      {errors.deadline && isTaskCreator ? (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.deadline}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          {taskData.created_date 
                            ? `Cannot select dates before ${taskData.created_date}` 
                            : 'Cannot select past dates'}
                          {!isTaskCreator && ' (Read-only)'}
                        </p>
                      )}
                    </div>

                    {isAnimatedReelSelected() ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <label className="text-sm font-semibold text-slate-700">
                            Time Slots for Graphic Design Members
                          </label>
                          <span className="text-red-500">*</span>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            Separate time slots required for Animated Reel
                          </span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {getGraphicDesignMembers().map((member) => (
                            <div key={member.emp_id || member.id} className="space-y-2">
                              <label className="text-sm font-semibold text-slate-700">
                                {member.name} - Time Slot
                              </label>
                              <Select
                                options={timeSlotOptions}
                                value={taskData.timeSlots[member.emp_id || member.id]}
                                onChange={isTaskCreator ? (selected) => handleTimeSlotChange(member.emp_id || member.id, selected) : undefined}
                                classNamePrefix="react-select"
                                styles={{
                                  ...timeSlotCustomStyles,
                                  control: (provided, state) => ({
                                    ...provided,
                                    border: `2px solid ${errors.time ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#8b5cf6' : '#e2e8f0') : '#e2e8f0'}`,
                                    borderRadius: '0.75rem',
                                    padding: '8px 4px',
                                    backgroundColor: errors.time ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                                    minHeight: '52px',
                                    boxShadow: state.isFocused && isTaskCreator ? (errors.time ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(139, 92, 246, 0.1)') : 'none',
                                    "&:hover": {
                                      borderColor: errors.time ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                                    },
                                    opacity: !isTaskCreator ? 0.7 : 1,
                                    cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                                  }),
                                  indicatorSeparator: (provided) => ({
                                    ...provided,
                                    display: isTaskCreator ? 'flex' : 'none',
                                  }),
                                  dropdownIndicator: (provided) => ({
                                    ...provided,
                                    display: isTaskCreator ? 'flex' : 'none',
                                  }),
                                }}
                                placeholder="Select time..."
                                isOptionDisabled={(option) => option.isDisabled}
                                isDisabled={!isTaskCreator}
                              />
                              <div className="text-xs text-slate-500">
                                {member.dept_name === "Graphic Design / Video Editor" ? 
                                  "Time slot for this graphic designer" : 
                                  "Regular team member - no time slot required"}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {errors.time && isTaskCreator && (
                          <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.time}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Time Slot
                          <span className="text-red-500">*</span>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            Graphic Design Only
                          </span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </label>
                        <Select
                          options={timeSlotOptions}
                          value={getSingleTimeSlotValue()}
                          onChange={isTaskCreator ? (selected) => {
                            const graphicMembers = getGraphicDesignMembers();
                            const newTimeSlots = {};
                            graphicMembers.forEach(member => {
                              const userId = member.emp_id || member.id;
                              newTimeSlots[userId] = selected;
                            });
                            setTaskData(prev => ({ ...prev, timeSlots: newTimeSlots }));
                          } : undefined}
                          classNamePrefix="react-select"
                          styles={{
                            ...timeSlotCustomStyles,
                            control: (provided, state) => ({
                              ...provided,
                              border: `2px solid ${errors.time ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#8b5cf6' : '#e2e8f0') : '#e2e8f0'}`,
                              borderRadius: '0.75rem',
                              padding: '8px 4px',
                              backgroundColor: errors.time ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                              minHeight: '52px',
                              boxShadow: state.isFocused && isTaskCreator ? (errors.time ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(139, 92, 246, 0.1)') : 'none',
                              "&:hover": {
                                borderColor: errors.time ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                              },
                              opacity: !isTaskCreator ? 0.7 : 1,
                              cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                          }}
                          placeholder="Select time..."
                          isOptionDisabled={(option) => option.isDisabled}
                          noOptionsMessage={() => {
                            if (taskData.deadline) {
                              const today = new Date();
                              const deadlineDate = new Date(taskData.deadline);
                              today.setHours(0, 0, 0, 0);
                              deadlineDate.setHours(0, 0, 0, 0);
                              
                              if (today.getTime() === deadlineDate.getTime()) {
                                const enabledSlots = timeSlotOptions.filter(slot => !slot.isDisabled);
                                if (enabledSlots.length === 0) {
                                  return "No available time slots for today. Please select a future deadline.";
                                }
                              }
                            }
                            return "No options available";
                          }}
                          isDisabled={!isTaskCreator}
                        />
                        {errors.time && isTaskCreator && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.time}
                          </p>
                        )}
                        {taskData.deadline && 
                        new Date(taskData.deadline).toDateString() === new Date().toDateString() && (
                          <p className="text-xs text-purple-600">
                            Showing only future time slots for today's deadline
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!hasGraphicDesignMember() && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        Task Name
                        <span className="text-red-500">*</span>
                        {!isTaskCreator && (
                          <span className="text-xs text-amber-600 font-normal">
                            (Read-only)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={taskData.name}
                        onChange={isTaskCreator ? handleChange : undefined}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${
                          errors.name 
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                            : isTaskCreator 
                              ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                              : "border-slate-100 bg-slate-50/50"
                        } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all`}
                        placeholder="Enter task name"
                        readOnly={!isTaskCreator}
                      />
                      {errors.name && isTaskCreator && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Required field</span>
                        <span className="text-slate-500">{taskData.name.length}/100 characters</span>
                        {!isTaskCreator && (
                          <span className="text-amber-600">Read-only</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Priority
                          <span className="text-red-500">*</span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </label>
                        <Select
                          options={priorityOptions}
                          value={taskData.priority}
                          onChange={isTaskCreator ? (selected) => handleSelectChange("priority", selected) : undefined}
                          classNamePrefix="react-select"
                          styles={{
                            ...priorityCustomStyles,
                            control: (provided, state) => ({
                              ...provided,
                              border: `2px solid ${errors.priority ? '#fca5a5' : isTaskCreator ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                              borderRadius: '0.75rem',
                              padding: '8px 4px',
                              backgroundColor: errors.priority ? '#fef2f2' : (isTaskCreator ? 'white' : '#f8fafc'),
                              minHeight: '52px',
                              boxShadow: state.isFocused && isTaskCreator ? (errors.priority ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                              "&:hover": {
                                borderColor: errors.priority ? '#f87171' : (isTaskCreator ? '#94a3b8' : '#e2e8f0'),
                              },
                              opacity: !isTaskCreator ? 0.7 : 1,
                              cursor: isTaskCreator ? 'pointer' : 'not-allowed',
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              display: isTaskCreator ? 'flex' : 'none',
                            }),
                          }}
                          formatOptionLabel={formatOptionLabel}
                          placeholder="Select priority..."
                          isSearchable={false}
                          isDisabled={!isTaskCreator}
                        />
                        {errors.priority && isTaskCreator && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.priority}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Status
                          <span className="text-red-500">*</span>
                          {isTaskCreator && taskData.taskStatus && (
                            <span className="text-xs font-normal text-blue-500 italic">
                              (Task status: {taskData.taskStatus})
                            </span>
                          )}
                          {!isTaskCreator && loggedInUserStatus && (
                            <span className="text-xs font-normal text-blue-500 italic">
                              (Your status: {loggedInUserStatus})
                            </span>
                          )}
                          {!canEditStatus && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Not assigned)
                            </span>
                          )}
                        </label>
                        <Select
                          options={statusOptions}
                          value={taskData.status}
                          onChange={canEditStatus ? (selected) => handleSelectChange("status", selected) : undefined}
                          classNamePrefix="react-select"
                          styles={{
                            ...statusCustomStyles,
                            control: (provided, state) => ({
                              ...provided,
                              border: `2px solid ${errors.status ? '#fca5a5' : canEditStatus ? (state.isFocused ? '#3b82f6' : '#e2e8f0') : '#e2e8f0'}`,
                              borderRadius: '0.75rem',
                              padding: '8px 4px',
                              backgroundColor: errors.status ? '#fef2f2' : (canEditStatus ? 'white' : '#f8fafc'),
                              minHeight: '52px',
                              boxShadow: state.isFocused && canEditStatus ? (errors.status ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.1)') : 'none',
                              "&:hover": {
                                borderColor: errors.status ? '#f87171' : (canEditStatus ? '#94a3b8' : '#e2e8f0'),
                              },
                              opacity: !canEditStatus ? 0.7 : 1,
                              cursor: canEditStatus ? 'pointer' : 'not-allowed',
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: canEditStatus ? 'flex' : 'none',
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              display: canEditStatus ? 'flex' : 'none',
                            }),
                          }}
                          formatOptionLabel={formatStatusOptionLabel}
                          placeholder={canEditStatus ? "Select status..." : "Not assigned to task"}
                          isSearchable={false}
                          isDisabled={!canEditStatus || loading}
                        />
                        {errors.status && canEditStatus && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.status}
                          </p>
                        )}
                        {!canEditStatus && (
                          <p className="text-xs text-amber-600 mt-1">
                            You are not assigned to this task. Only assigned users can update status.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Deadline
                          <span className="text-red-500">*</span>
                          {!isTaskCreator && (
                            <span className="text-xs text-amber-600 font-normal">
                              (Read-only)
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            name="deadline"
                            value={taskData.deadline}
                            onChange={isTaskCreator ? handleChange : undefined}
                            min={taskData.created_date ? taskData.created_date : new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-3 pl-12 rounded-xl border-2 ${
                              errors.deadline 
                                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                                : isTaskCreator 
                                  ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                  : "border-slate-100 bg-slate-50/50"
                            } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all`}
                            readOnly={!isTaskCreator}
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg
                              className={`w-5 h-5 ${errors.deadline ? 'text-red-500' : isTaskCreator ? 'text-blue-500' : 'text-slate-400'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                        {errors.deadline && isTaskCreator ? (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.deadline}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            {taskData.created_date 
                              ? `Cannot select dates before ${taskData.created_date}` 
                              : 'Cannot select past dates'}
                            {!isTaskCreator && ' (Read-only)'}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Remarks
                    {!isTaskCreator && (
                      <span className="text-xs text-amber-600 font-normal">
                        (Read-only)
                      </span>
                    )}
                  </label>
                  <textarea
                    name="remarks"
                    rows="3"
                    value={taskData.remarks}
                    onChange={isTaskCreator ? handleChange : undefined}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.remarks 
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100" 
                        : isTaskCreator 
                          ? "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                          : "border-slate-100 bg-slate-50/50"
                    } ${isTaskCreator ? 'focus:ring-4' : ''} outline-none transition-all resize-none`}
                    placeholder="Enter any additional remarks (optional)"
                    readOnly={!isTaskCreator}
                  ></textarea>
                  {errors.remarks && isTaskCreator && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.remarks}
                    </p>
                  )}
                  <div className="flex items-center justify-end text-xs">
                    <span className={taskData.remarks.length > 500 ? "text-red-500" : "text-slate-500"}>
                      {taskData.remarks.length}/500 characters
                    </span>
                    {!isTaskCreator && (
                      <span className="text-amber-600 ml-2">Read-only</span>
                    )}
                  </div>
                </div>

                {!isTaskCreator && !isUserAssignedToTask && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800">Limited Access</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You are not assigned to this task. You can only view the task details.
                          Only assigned users can update their task status, and only the task creator can modify other task details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!isTaskCreator && isUserAssignedToTask && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">Assigned User Access</h4>
                        <p className="text-sm text-green-700 mt-1">
                          You are assigned to this task. You can update your task status.
                          Only the task creator can modify other task details like task name, priority, deadline, etc.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            <div className="flex justify-end gap-4 mt-8 mb-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                onClick={() => {
                  navigate(-1);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center gap-2 ${
                  isSubmitting || loading
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-lg hover:shadow-blue-200 hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Task...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Task
                  </>
                )}
              </button>
            </div>
            <TaskComments />
          </div>
        </div>
      </div>
    </div>
  );
}