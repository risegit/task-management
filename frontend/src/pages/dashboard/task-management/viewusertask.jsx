import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* TOP NAV */}
     

      {/* MAIN CONTENT */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 border rounded-lg w-full sm:w-60 focus:ring-2 focus:ring-blue-500"
          />

          <select className="px-3 py-2 border rounded-lg w-full sm:w-40 focus:ring-2 focus:ring-blue-500">
            <option>Assigned By</option>
            <option>John</option>
            <option>Alice</option>
          </select>

          <input
            type="date"
            className="px-3 py-2 border rounded-lg w-full sm:w-40 focus:ring-2 focus:ring-blue-500"
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto">
            Add New Tasks
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-600 bg-gray-100">
                <th className="py-3 px-4">Assigned By</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* ROW 1 */}
              <tr className="border-b">
                <td className="py-3 px-4">John Smith</td>
                <td className="py-3 px-4">Alice John</td>
                <td className="py-3 px-4">2025-01-12</td>
                <td className="py-3 px-4 text-yellow-600 font-medium">
                  Pending
                </td>
                <td className="py-3 px-4">...</td>
                <td className="py-3 px-4 flex gap-3 text-gray-600">
                  <FiEye className="cursor-pointer hover:text-blue-600" size={18} />
                  <FiEdit className="cursor-pointer hover:text-green-600" size={18} />
                  <FiTrash2 className="cursor-pointer hover:text-red-600" size={18} />
                </td>
              </tr>

              {/* ROW 2 */}
              <tr className="border-b">
                <td className="py-3 px-4">Bob Will</td>
                <td className="py-3 px-4">John Smith</td>
                <td className="py-3 px-4">2025-01-15</td>
                <td className="py-3 px-4 text-red-600 font-medium">
                  Overdue
                </td>
                <td className="py-3 px-4">...</td>
                <td className="py-3 px-4 flex gap-3 text-gray-600">
                  <FiEye className="cursor-pointer hover:text-blue-600" size={18} />
                  <FiEdit className="cursor-pointer hover:text-green-600" size={18} />
                  <FiTrash2 className="cursor-pointer hover:text-red-600" size={18} />
                </td>
              </tr>

              {/* ROW 3 */}
              <tr>
                <td className="py-3 px-4">Alice John</td>
                <td className="py-3 px-4">Steve Roy</td>
                <td className="py-3 px-4">2025-01-10</td>
                <td className="py-3 px-4 text-green-600 font-medium">
                  Completed
                </td>
                <td className="py-3 px-4">...</td>
                <td className="py-3 px-4 flex gap-3 text-gray-600">
                  <FiEye className="cursor-pointer hover:text-blue-600" size={18} />
                  <FiEdit className="cursor-pointer hover:text-green-600" size={18} />
                  <FiTrash2 className="cursor-pointer hover:text-red-600" size={18} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-end items-center gap-3 mt-4 text-gray-700">
          <button className="hover:text-blue-600">Prev</button>
          <button className="font-medium text-blue-600">1</button>
          <button className="hover:text-blue-600">2</button>
          <button className="hover:text-blue-600">3</button>
          <button className="hover:text-blue-600">Next</button>
        </div>
      </div>
    </div>
  );
}
