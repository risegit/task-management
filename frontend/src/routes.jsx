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
  EyeIcon,
  BuildingOfficeIcon, 
  ClipboardDocumentCheckIcon,
  UserGroupIcon, 
  SpeakerWaveIcon
} from "@heroicons/react/24/solid";

import {
  User
} from "@/pages/dashboard";


import Home from "@/pages/dashboard/home";
import AddEmployee from "@/pages/dashboard/employee/add-employee";
import ViewEmployee from "@/pages/dashboard/employee/manage-employee";
import EditEmployee from "@/pages/dashboard/employee/edit-employee";
import Createusertask from "@/pages/dashboard/task-management/createtask"
import ViewUsertask from "@/pages/dashboard/task-management/viewusertask";
import Profile from "@/pages/dashboard/profile";
import OthersActivities from "@/pages/dashboard/otheractivities";

<<<<<<< HEAD
import Adddept from "@/pages/dashboard/department/adddept";
import Managedept from "@/pages/dashboard/department/managedept";
import Editdept from "@/pages/dashboard/department/editdept";
import Addproject from "@/pages/dashboard/projects/addproject";
import Manageprojects from "@/pages/dashboard/projects/manageprojects";
import Editproject from "@/pages/dashboard/projects/editproject";
import Edittask from "@/pages/dashboard/task-management/edittask";
=======
import Adddept from "@/pages/dashboard/department/add-deptartment";
import Managedept from "@/pages/dashboard/department/manage-deptartment";
import Editdept from "@/pages/dashboard/department/edit-deptartment";
import Addproject from "@/pages/dashboard/projects/add-project";
import Manageprojects from "@/pages/dashboard/projects/manage-projects";
import Editproject from "@/pages/dashboard/projects/edit-project";
>>>>>>> main


import { SignIn, SignUp } from "@/pages/auth";
import LogoutButton from "./Components/LogoutButton";
import { element } from "prop-types";
import { SpeakerIcon } from "lucide-react";


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
        icon: <BuildingOfficeIcon {...icon} />,
        name: "Departments",
        collapse: [
          {
            name: "Add Department",
            path: "/department/add-department",
            element: <Adddept />,
          },
          {
            name: "Manage Deptartments",
            path: "/department/manage-deptartment",
            element: <Managedept />,
          },
           {
            name: "Edit Deptartments",
            path: "/department/edit-deptartment/:id",
            element: <Editdept />,
            hidden: true,
          },
          
        ],
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Employee",
        collapse: [
          {
            name: "Add Employee",
            path: "/employee/add-employee",
            element: <AddEmployee />,
          },
          {
            name: "Manage Employees",
            path: "/employee/view-employee",
            element: <ViewEmployee />,
          },
          {
            name: "Edit Employee",
            path: "/employee/edit-employee/:id",
            element: <EditEmployee/>,
            hidden: true,
          },
        ],
      },

        {
       icon: <UserGroupIcon {...icon} />,
       name: "Projects",
       collapse: [
         {
           name: "Add Project",
           path: "/projects/add-project",
           element: <Addproject />,
         },
          {
           name: "Manage Project",
           path: "/projects/manage-project",
           element: <Manageprojects />,
         },
           {
           name: "Edit Project",
           path: "/projects/edit-project/:id",
           element: <Editproject />,
           hidden:'true'
         },
       ],
     },
     
      
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "Task Management",
        collapse: [
          {
            name: "Create Task",
            path: "/task-management/create-task",
            element: <Createusertask />,
          },
          {
            name: "Manage Task",
            path: "/task-management/viewtask",
            element: <ViewUsertask />,
          },
             {
            name: "Edit Task",
            path: "/task-management/edit-task/:id",
            element: <Edittask />,
            hidden:'true'
          },
          
    
        ],
      },

   
        
        {
        icon: <SpeakerWaveIcon {...icon} />,
        name: "Announcements",
        element: <OthersActivities />,
        path: "/otheractivities",
       
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
