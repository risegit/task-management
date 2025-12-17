import React from "react";

const Profile = () => {
  // Dynamic-ready dummy data
  const user = {
    profilePic: "https://i.pravatar.cc/150?img=32",   // dummy
    fullName: "John Doe",
    email: "johndoe@gmail.com",
    gender: "Male",
    department: "Development",
    designation: "Senior Engineer",
    emailCreated: "1 month ago"
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm p-6 md:p-10">
      
      {/* Top Profile Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        
        {/* Profile Info */}
        <div className="flex items-center space-x-4">
          <img
            src={user.profilePic}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold">{user.fullName}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Edit Button */}
        <button className="mt-4 sm:mt-0 bg-blue-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-600 transition">
          Edit
        </button>
      </div>

      {/* Form Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">

        {/* Full Name */}
        <div>
          <label className="text-gray-600 text-sm font-medium">Full Name</label>
          <input
            type="text"
            defaultValue={user.fullName}
            className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="text-gray-600 text-sm font-medium">Gender</label>
          <select
            defaultValue={user.gender}
            className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="text-gray-600 text-sm font-medium">Department</label>
          <input
            type="text"
            defaultValue={user.department}
            className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none"
          />
        </div>

        {/* Designation */}
        <div>
          <label className="text-gray-600 text-sm font-medium">Designation</label>
          <input
            type="text"
            defaultValue={user.designation}
            className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none"
          />
          </div> 
      </div>

      {/* Email Section */}
      <div className="mt-10">
        <h3 className="font-semibold text-gray-800">My Email Address</h3>

        <div className="flex items-center gap-4 mt-5 border border-gray-200 p-4 rounded-xl w-full sm:w-2/3">
          <span className="bg-blue-100 p-2 rounded-full text-blue-600">📧</span>
          <div>
            <p className="text-gray-700 text-sm">{user.email}</p>
            <p className="text-xs text-gray-400">{user.emailCreated}</p>
          </div>
        </div>

        {/* <button className="mt-4 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
          + Add Email Address
        </button> */}
      </div>
    </div>
  );
};

export default Profile;
