import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import Select from "react-select";

export default function CreateTask() {
  // const [allAssignedBy, setAssignedBy] = useState([]);
  const [allAssignedTo, setAssignedTo] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const [taskData, setTaskData] = useState({
    name: "",
    assignedBy: null,
    assignedTo: [],
    deadline: "",
    remarks: "",
  });



  // Sample options for dropdowns
  const assignedByOptions = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "teamlead", label: "Team Lead" },
  ];

  const assignedToOptions = [
    { value: "user1", label: "User 1" },
    { value: "user2", label: "User 2" },
    { value: "user3", label: "User 3" },
    { value: "user4", label: "User 4" },
  ];

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  // 🔹 Fetch data from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-management.php`);
        const data = await response.json();

        console.log("API response:", data);

        // Assigned By = ALL users
        // const assignedByUsers = data.data.map(user => ({
        //   value: user.id,
        //   label: user.name
        // }));

        // Assigned To = ALL users EXCEPT logged-in user
        const assignedToUsers = data.data
          .filter(user => user.id !== userId)   // ⬅️ remove logged-in user
          .map(user => ({
            value: user.id,
            label: user.name
          }));

        // setAssignedBy(assignedByUsers);
        setAssignedTo(assignedToUsers);

      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId]);

  const handleSubmit = async () => {
  
  if (!taskData.name.trim()) {
    alert("Task name is required");
    return;
  }

  if (taskData.assignedTo.length === 0) {
    alert("Please select at least one user to assign task");
    return;
  }

  if (!taskData.deadline) {
    alert("Deadline is required");
    return;
  }

  setLoading(true);

  try {
    const form = new FormData();

    form.append("task_name", taskData.name);
    form.append("assignedBy", userId);  // logged-in user
    form.append(
      "assignedTo",
      JSON.stringify(taskData.assignedTo.map(u => u.value))
    );
    form.append("deadline", taskData.deadline);
    form.append("remarks", taskData.remarks);

    // 🔍 EXACT CONSOLE OUTPUT LIKE YOU WANT
    console.log("Submitting form data...");
    for (let pair of form.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/task-management.php?id=${user?.id}`,
      {
        method: "POST",
        body: form,
      }
    );

    const result = await response.json();
    console.log("API result:", result);

    if (result.status === "success") {
      toast.success(result.message);
      // alert("Task created successfully!");

      // Reset form
      setTaskData({
        name: "",
        assignedTo: [],
        deadline: "",
        remarks: "",
      });
    } else {
      alert(result.message || "Failed to create task");
    }
  } catch (error) {
    console.error("Submit Error:", error);
    alert("Something went wrong!");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="w-full min-h-screen flex justify-center py-10 bg-gray-50">
      <div className="w-full bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6">Create Task</h2>

        {/* Task Name */}
        <label className="block text-sm font-medium mb-1">Task Name</label>
        <input
          type="text"
          name="name"
          value={taskData.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />

        {/* Assigned By / Assigned To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* <div>
            <label className="block text-sm font-medium mb-1">
              Assigned By <span className="text-red-500">*</span>
            </label>
            <Select
              options={allAssignedBy}
              value={taskData.assignedBy}
              onChange={(selected) =>
                setTaskData({ ...taskData, assignedBy: selected })
              }
              classNamePrefix="react-select"
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                control: (provided) => ({
                  ...provided,
                  borderColor: "#d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.125rem",
                }),
              }}
              placeholder="Select..."
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium mb-1">
              Assigned To <span className="text-red-500">*</span>
            </label>
            <Select
              isMulti
              options={allAssignedTo}
              value={taskData.assignedTo}
              onChange={(selected) =>
                setTaskData({ ...taskData, assignedTo: selected })
              }
              classNamePrefix="react-select"
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                control: (provided) => ({
                  ...provided,
                  borderColor: "#d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.125rem",
                }),
              }}
              placeholder="Select multiple..."
            />
          </div>
          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <div className="relative">
              <input
                type="date"
                name="deadline"
                value={taskData.deadline}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
              />
              <Calendar
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* Status in one row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Status */}
          {/* <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex items-center gap-3 text-sm h-10">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={taskData.status === "pending"}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
                Pending
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={taskData.status === "completed"}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
                Completed
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="overdue"
                  checked={taskData.status === "overdue"}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
                Overdue
              </label>
            </div>
          </div> */}
        </div>

        {/* Remarks */}
        <label className="block text-sm font-medium mb-1">Remarks</label>
        <textarea
          name="remarks"
          rows="3"
          value={taskData.remarks}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        ></textarea>

        {/* Button - Small, Right Bottom Corner */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}