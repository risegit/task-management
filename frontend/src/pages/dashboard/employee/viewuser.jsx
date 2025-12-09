import React, { useState } from "react";

export default function UserList() {
  const [users] = useState([
    { name: "John Smith", email: "john.smith@example.com", role: "Admin" },
    { name: "Alice John", email: "alice.john@example.com", role: "Assignee" },
    { name: "Bob Will", email: "bob.will@example.com", role: "Assigner" }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full  bg-white shadow-md rounded-xl p-6">

        {/* Title */}
        <h2 className="text-2xl font-bold text-left mb-6">User List</h2>

        {/* Search + Add New */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search"
            className="flex-1 border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
          />
          {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add New
          </button> */}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Role</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Button */}
        {/* <button className="w-full bg-blue-600 text-white py-2 mt-6 rounded-lg hover:bg-blue-700">
          Create
        </button> */}

        {/* Login Redirect */}
     

      </div>
    </div>
  );
}
