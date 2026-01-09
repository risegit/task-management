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
import Createtask from "@/pages/dashboard/task-management/createtask"
import Viewtask from "@/pages/dashboard/task-management/view-task";
import EditTask from "@/pages/dashboard/task-management/edit-task";
import Profile from "@/pages/dashboard/profile";
import OthersActivities from "@/pages/dashboard/otheractivities";

import Adddept from "@/pages/dashboard/department/add-deptartment";
import Managedept from "@/pages/dashboard/department/manage-deptartment";
import Editdept from "@/pages/dashboard/department/edit-deptartment";
import Addproject from "@/pages/dashboard/projects/add-project";
import Manageprojects from "@/pages/dashboard/projects/manage-projects";
import Editproject from "@/pages/dashboard/projects/edit-project";
import EditTaskComment from "@/pages/dashboard/task-management/edittask";


import { SignIn, SignUp } from "@/pages/auth";
import LogoutButton from "./Components/LogoutButton";
import RoleProtectedRoute from "./Components/RoleProtectedRoute";


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
        allowedRoles: ["admin", "staff", "manager"],
        element: (
          <RoleProtectedRoute
            element={<Home />}
            allowedRoles={["admin", "staff", "manager"]}
          />
        ),
      },
      {
        icon: <BuildingOfficeIcon {...icon} />,
        name: "Departments",
        allowedRoles: ["admin", "manager"],
        collapse: [
          {
            name: "Add Department",
            path: "/department/add-department",
            allowedRoles: ["admin"],
            element: (
              <RoleProtectedRoute
                element={<Adddept />}
                allowedRoles={["admin"]}
              />
            ),
          },
          {
            name: "Manage Departments",
            path: "/department/manage-deptartment",
            allowedRoles: ["admin", "manager", "staff"],
            element: (
              <RoleProtectedRoute
                element={<Managedept />}
                allowedRoles={["admin", "manager", "staff"]}
              />
            )
          },
          {
            name: "Edit Department",
            path: "/department/edit-deptartment/:id",
            hidden: true,
            allowedRoles: ["admin"],
            element: (
              <RoleProtectedRoute
                element={<Editdept />}
                allowedRoles={["admin"]}
              />
            )},
        ],
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Employee",
        allowedRoles: ["admin", "manager"],
        collapse: [
          {
            name: "Add Employee",
            path: "/employee/add-employee",
            allowedRoles: ["admin", "manager"],
            element: (
              <RoleProtectedRoute
                element={<AddEmployee />}
                allowedRoles={["admin", "manager"]}
              />
            )},
          {
            name: "Manage Employees",
            path: "/employee/view-employee",
            allowedRoles: ["admin", "manager"],
            element: (
              <RoleProtectedRoute
                element={<ViewEmployee />}
                allowedRoles={["admin", "manager"]}
              />
            )},
          {
            name: "Edit Employee",
            path: "/employee/edit-employee/:id",
            hidden: true,
            allowedRoles: ["admin", "manager"],
            element: (
              <RoleProtectedRoute
                element={<EditEmployee />}
                allowedRoles={["admin", "manager"]}
              />
            )},
        ],
      },
      {
        icon: <UserGroupIcon {...icon} />,
        name: "Projects",
        allowedRoles: ["admin", "manager","staff"],
        collapse: [
          {
            name: "Add Project",
            path: "/projects/add-project",
            allowedRoles: ["admin", "manager"],
            element: (
              <RoleProtectedRoute
                element={<Addproject />}
                allowedRoles={["admin", "manager"]}
              />
            ),
          },
          {
            name: "Manage Projects",
            path: "/projects/manage-project",
            allowedRoles: ["admin", "manager","staff"],
            element: (
              <RoleProtectedRoute
                element={<Manageprojects />}
                allowedRoles={["admin", "manager","staff"]}
              />
            ),
          },
          {
            name: "Edit Project",
            path: "/projects/edit-project/:id",
            hidden: true,
            allowedRoles: ["admin", "manager"],
            element: (
              <RoleProtectedRoute
                element={<Editproject />}
                allowedRoles={["admin", "manager"]}
              />
            ),
          },
        ],
      },
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "Task Management",
        allowedRoles: ["admin", "staff", "manager"],
        collapse: [
          {
            name: "Create Task",
            path: "/task-management/create-task",
            allowedRoles: ["admin", "manager","staff"],
            element: (
              <RoleProtectedRoute
                element={<Createtask />}
                allowedRoles={["admin", "manager","staff"]}
              />
            ),
          },
          {
            name: "Manage Tasks",
            path: "/task-management/view-task",
            allowedRoles: ["admin", "staff", "manager"],
            element: (
              <RoleProtectedRoute
                element={<Viewtask />}
                allowedRoles={["admin", "staff", "manager"]}
              />
            ),
          },
          {
            name: "Edit Task",
            path: "/task-management/edit-task/:id",
            hidden: true,
            allowedRoles: ["admin", "manager","staff"],
            element: (
              <RoleProtectedRoute
                element={<EditTask />}
                allowedRoles={["admin", "manager","staff"]}
              />
            ),
          },
          {
            name: "Edit Task Comment",
            path: "/task-management/edittask/:id",
            hidden: true,
            allowedRoles: ["admin", "manager","staff"],
            element: (
              <RoleProtectedRoute
                element={<EditTaskComment />}
                allowedRoles={["admin", "manager","staff"]}
              />
            ),
          },
        ],
      },
      {
        icon: <SpeakerWaveIcon {...icon} />,
        name: "Announcements",
        allowedRoles: ["admin", "", "manager"],
        path: "/otheractivities",
        element: (
          <RoleProtectedRoute
            element={<OthersActivities />}
            allowedRoles={["admin", "staff", "manager"]}
          />
        ),
      },
      {
        icon: <IdentificationIcon {...icon} />,
        name: "Profile",
        allowedRoles: ["admin", "staff", "manager"],
        path: "/profile",
        element: (
          <RoleProtectedRoute
            element={<Profile />}
            allowedRoles={["admin", "staff", "manager"]}
          />
        ),
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
        allowedRoles: ["admin", "staff", "manager"],
        path: "/sign-out",
        element: <LogoutButton />,
      },
    ],
  },
];

export default routes;