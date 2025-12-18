// src/routes.jsx
import {
  HomeIcon,
  UserCircleIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  IdentificationIcon,
  MapPinIcon,
  ServerStackIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon
} from "@heroicons/react/24/solid";

import {
  Home,
  User,
} from "@/pages/dashboard";

import AddUser from "@/pages/dashboard/employee/adduser";
import ViewUser from "@/pages/dashboard/employee/viewuser";
import Edituser from "@/pages/dashboard/employee/edituser";
import Createusertask from "@/pages/dashboard/task-management/createtask"
import ViewUsertask from "@/pages/dashboard/task-management/viewusertask";
import Profile from "@/pages/dashboard/profile";
import Adddept from "@/pages/dashboard/department/adddept";
import Managedept from "@/pages/dashboard/department/managedept";
import Editdept from "@/pages/dashboard/department/editdept";


import { SignIn, SignUp } from "@/pages/auth";
import LogoutButton from "./Components/LogoutButton";
import { element } from "prop-types";


const icon = { className: "w-5 h-5 text-inherit" };

const routes = [
  {
    layout: "dashboard",
    title: "Main",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "Dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Employee",
        collapse: [
          {
            name: "Add Employee",
            path: "/users/add-user",
            element: <AddUser />,
          },
          {
            name: "Manage Employees",
            path: "/users/view-users",
            element: <ViewUser />,
          },
          {
            name: "Edit Employee",
            path: "/employee/edit-user",
            element: <Edituser/>,
            hidden: true,
          },
        ],
      },
       {
        icon: <UsersIcon {...icon} />,
        name: "Departments",
        collapse: [
          {
            name: "Add Department",
            path: "/department/add-department",
            element: <Adddept />,
          },
          {
            name: "Manage Deptartments",
            path: "/department/managedept",
            element: <Managedept />,
          },
           {
            name: "Edit Deptartments",
            path: "/department/edit-dept",
            element: <Editdept />,
            hidden: true,
          },
          
        ],
      },
      
      {
        icon: <UsersIcon {...icon} />,
        name: "Task Management",
        collapse: [
          {
            name: "Create Task",
            path: "/users/create-task",
            element: <Createusertask />,
          },
          {
            name: "Manage Task",
            path: "/users/viewtask",
            element: <ViewUsertask />,
          },
    
        ],
      },
         {
        icon: <IdentificationIcon {...icon} />,
        name: "Profile",
        element: <Profile />,
        path: "/profile",
       
      },
    ],
  },
  
  {
    layout: "auth",
    title: "Auth Pages",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        hidden: true,
        name: "Sign In",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <ServerStackIcon {...icon} />,
        hidden: true,
        name: "Sign Up",
        path: "/sign-up",
        element: <SignUp />,
      },
      {
        icon: <ArrowRightOnRectangleIcon {...icon} />,
        name: "Sign Out",
        path: "auth/sign-in",
        element: <LogoutButton />,
      },
    ],
  },
  
  
];

export default routes;




// // src/routes.jsx
// import {
//   HomeIcon,
//   UserCircleIcon,
//   UsersIcon,
//   WrenchScrewdriverIcon,
//   IdentificationIcon,
//   MapPinIcon,
//   ServerStackIcon,
//   ArrowRightOnRectangleIcon,
//   EyeIcon 

// } from "@heroicons/react/24/solid";

// import {
//   Home,
//   Profile,
//   User,
// } from "@/pages/dashboard";


// import AddUser from "@/pages/dashboard/employee/adduser";
// import ViewUser from "@/pages/dashboard/viewuser";
// import EditUserForm from "@/pages/dashboard/edituser";


// import { SignIn, SignUp } from "@/pages/auth";
// import LogoutButton from "./Components/LogoutButton";

// import RoleProtectedRoute from "@/components/RoleProtectedRoute";
// import { Eye } from "lucide-react";

// const icon = { className: "w-5 h-5 text-inherit" };

// const routes = [
//   {
//     layout: "dashboard",
//     title: "Main",
//     pages: [
//       {
//         icon: <HomeIcon {...icon} />,
//         name: "Dashboard",
//         path: "/home",
//         allowedRoles: ["admin", "manager", "technician"],
//         element: (
//           <RoleProtectedRoute
//             element={<Home />}
//             allowedRoles={["admin", "manager", "technician"]}
//           />
//         ),
//       },
//       {
//         icon: <UserCircleIcon {...icon} />,
//         name: "Employee",
//         allowedRoles: ["admin"],
//         collapse: [
//           {
//             name: "Add Employee",
//             path: "/users/add",
//             allowedRoles: ["admin"],
//             element: (
//               <RoleProtectedRoute element={<AddUser />} allowedRoles={["admin"]} />
//             ),
//           },
//           {
//             name: "Manage Employees",
//             path: "/users/viewusers",
//             allowedRoles: ["admin"],
//             element: (
//               <RoleProtectedRoute element={<ViewUser />} allowedRoles={["admin"]} />
//             ),
//           },
//           {
//             name: "Edit Employee",
//             path: "/users/edituser/:id",
//             allowedRoles: ["admin"],
//             element: (
//               <RoleProtectedRoute element={<EditUserForm />} allowedRoles={["admin"]} />
//             ),
//             hidden: true,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     layout: "auth",
//     title: "Auth Pages",
//     pages: [
//       {
//         icon: <ServerStackIcon {...icon} />,
//         hidden: true,
//         name: "Sign In",
//         path: "/sign-in",
//         element: <SignIn />,
//       },
//       {
//         icon: <ServerStackIcon {...icon} />,
//         hidden: true,
//         name: "Sign Up",
//         path: "/sign-up",
//         element: <SignUp />,
//       },
//       {
//         icon: <ArrowRightOnRectangleIcon {...icon} />,
//         name: "Sign Out",
//         path: "auth/sign-in",
//         element: <LogoutButton />,
//       },
//     ],
//   },
// ];

// export default routes;
