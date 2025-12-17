import { FiEye, FiEdit, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import Select from "react-select";
import { toast } from 'react-toastify';

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignedBy, setSelectedAssignedBy] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignedTo, setAssignedTo] = useState([]);
  const [assignedBy, setAssignedBy] = useState([]);


  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const assignedByOptions = [
    ...new Set(allTasks.map(task => task.assignedBy.name))
  ].map(name => ({
    value: name,
    label: name
  }));

  
  const assignedToOptions = assignedTo
  .filter(u => Number(u.id) !== Number(userId))
  .map(s => ({
    value: Number(s.id),
    label: s.name,
  }));



  // Get unique assigned by names for filter
  const uniqueAssignedBy = [...new Set(allTasks.map(task => task.assignedBy.name))];

  // Filter tasks
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignedBy = selectedAssignedBy === "all" || task.assignedBy.name === selectedAssignedBy;
    const matchesDate = !selectedDate || task.deadline === selectedDate;
    
    return matchesSearch && matchesAssignedBy && matchesDate;
  });

  const getStatusStyle = (status) => {
    switch(status) {
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  useEffect(() => {
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/task-management.php?view-task=viewTask&user_code=${user?.user_code}&id=${user?.id}`
      );
      const result = await response.json();

      console.log("API response:", result);

      // Convert API data into UI format
   const formatted = result.data.map((t) => ({
  id: t.id,
  name: t.task_name,

  assignedBy: {
    id: Number(t.assignedby),
    name: t.assignedby_name,
    initials: t.assignedby_name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    color: "from-purple-400 to-purple-600",
  },

  assignedTo: {
    id: Number(t.assignedto),
    name: t.assignedto_name,
    initials: t.assignedto_name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    color: "from-blue-400 to-blue-600",
  },

  deadline: t.deadline,
  status: t.status,
  remarks: t.remarks
}));

      
      setAllTasks(formatted);
      setAssignedTo(result.staff); 
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchTasks();
}, []);


  const handleEdit = (task) => {
  const assignedToId = Number(task.assignedTo.id);

  const selectedStaff = assignedToOptions.filter(opt =>
    opt.value === assignedToId
  );

  setEditingTask({
    id: task.id,
    name: task.name,
    deadline: task.deadline,
    status: task.status,
    remarks: task.remarks,

    assignedBySelect: {
      value: task.assignedBy.id,
      label: task.assignedBy.name,
    },

    assignedToSelect: selectedStaff
  });

  setIsEditModalOpen(true);
};




  const handleDelete = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
        setAllTasks(allTasks.filter(task => task.id !== taskId));
      }
    };

    const handleUpdateTask = async () => {
    if (!editingTask) return;

    // 🔹 VALIDATION
    if (!editingTask.name?.trim()) {
      alert("Task name is required");
      return;
    }

    if (!editingTask.deadline) {
      alert("Deadline is required");
      return;
    }

    if (!editingTask.status) {
      alert("Please select a status");
      return;
    }

    setLoading(true);

    try {
      // 🔹 Prepare form data
      const form = new FormData();

      form.append("task_id", editingTask.id);
      form.append("task_name", editingTask.name);
      form.append("task_name", editingTask.name);
      form.append("deadline", editingTask.deadline);
      form.append("status", editingTask.status);
      form.append("remarks", editingTask.remarks || "");
      const assignedIds = (editingTask.assignedToSelect || []).map(u => u.value);
      form.append("assignedTo", JSON.stringify(assignedIds));

      form.append('_method', 'PUT');

      console.log("Updating task with:");
      for (let pair of form.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }

      // 🔹 SEND to backend API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/task-management.php?id=${user?.id}`,
        {
          method: "POST",
          body: form,
        }
      );

      const result = await response.json();
      console.log("Update Response:", result);

      if (result.status === "success") {
        toast.success(result.message);

        // 🔹 Update task list instantly
        setAllTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id
              ? {
                  ...task,
                  name: editingTask.name,
                  deadline: editingTask.deadline,
                  status: editingTask.status,
                  remarks: editingTask.remarks,
                }
              : task
          )
        );

        setIsEditModalOpen(false);
        setEditingTask(null);
      } else {
        toast.success(result.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.success("Something went wrong while updating the task!");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      {/* MAIN CONTENT */}
      <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
            {filteredTasks.length} Active Tasks
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <select 
            value={selectedAssignedBy}
            onChange={(e) => setSelectedAssignedBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full sm:w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
          >
            <option value="all">All Assigners</option>
            {uniqueAssignedBy.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full sm:w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned By
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="py-4 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-6 text-center text-gray-500">
                    No tasks found matching your filters
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${task.assignedBy.color} flex items-center justify-center text-white font-semibold text-sm`}>
                          {task.assignedBy.initials}
                        </div>
                        <span className="font-medium text-gray-800">{task.assignedBy.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${task.assignedTo.color} flex items-center justify-center text-white font-semibold text-sm`}>
                          {task.assignedTo.initials}
                        </div>
                        <span className="font-medium text-gray-800">{task.assignedTo.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">{task.deadline}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(task.status)}`}>
                        ● {task.status}
                      </span>
                    </td>
<td className="py-4 px-6 text-gray-500 relative group">
  <span className="">{task.name}</span>

  {/* Tooltip */}
  {/* <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg shadow-lg bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
    {task.remarks || "No remarks"}
  </div> */}
</td>



                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleEdit(task)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                        >
                          <FiEdit className="text-gray-600 group-hover:text-green-600 transition-colors" size={18} />
                        </button>
                        {/* <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        >
                          <FiTrash2 className="text-gray-600 group-hover:text-red-600 transition-colors" size={18} />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">Showing {filteredTasks.length} of {allTasks.length} results</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              Prev
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm">
              1
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              2
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              3
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-800">Edit Task</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Task Name */}
              <label className="block text-sm font-medium mb-1">Task Name</label>
              <input
                type="text"
                value={editingTask.name}
                readOnly={editingTask.assignedBySelect.value !== Number(userId)}
                onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />

              {/* Assigned By / Assigned To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assigned By
                  </label>

                  <p className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {editingTask.assignedBySelect.label}
                  </p>
                </div>
                {
  editingTask.assignedToSelect &&
  editingTask.assignedToSelect.length > 0 && (
    <div>
      <label className="block text-sm font-medium mb-1">
        Assigned To <span className="text-red-500">*</span>
      </label>

      <Select
        isMulti
        options={assignedToOptions}
        value={editingTask.assignedToSelect}
        onChange={(selected) =>
          setEditingTask({
            ...editingTask,
            assignedToSelect: selected.length ? selected : editingTask.assignedToSelect
          })
        }
      />
    </div>
  )
}

              </div>

              {/* Deadline, Status in one row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={editingTask.deadline}
                      disabled={editingTask.assignedBySelect.value !== Number(userId)}
                      onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                      size={18}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <div className="flex items-center gap-3 text-sm h-10">

                    {/* Pending */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="pending"
                        checked={editingTask.status === "pending"}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, status: e.target.value })
                        }
                        className="cursor-pointer"
                      />
                      Pending
                    </label>

                    {/* In-progress */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="in-progress"
                        checked={editingTask.status === "in-progress"}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, status: e.target.value })
                        }
                        className="cursor-pointer"
                      />
                      In-progress
                    </label>

                    {/* Completed */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="completed"
                        checked={editingTask.status === "completed"}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, status: e.target.value })
                        }
                        className="cursor-pointer"
                      />
                      Completed
                    </label>

                  </div>
                </div>

              </div>

              {/* Remarks */}
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                rows="3"
                value={editingTask.remarks}
                readOnly={editingTask.assignedBySelect.value !== Number(userId)}
                onChange={(e) => setEditingTask({ ...editingTask, remarks: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              ></textarea>

              {/* Modal Footer - Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}