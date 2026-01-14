import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Navbar,
  Typography,
  Button,
  IconButton,
  Breadcrumbs,
  Input,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  BellSlashIcon,
  ClockIcon,
  XMarkIcon,
  CreditCardIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
  setOpenSidenav,
} from "@/context";

import NotificationBell from "../../pages/dashboard/NotificationBell";
import { getCurrentUser } from "../../utils/api";
import { initNotificationSound } from "@/utils/notificationSound";
// Add this import line near the top with your other imports
import { showDesktopNotification } from "../../utils/notifications";

export function DashboardNavbar() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const { pathname } = useLocation();
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
  const user = getCurrentUser();

  const [permissionState, setPermissionState] = useState(null); // null | "request" | "denied"

    /* -----------------------------------------
     CHECK NOTIFICATION PERMISSION
  ----------------------------------------- */
// useEffect(() => {
//   if (!("Notification" in window)) return;

//   if (Notification.permission === "default") {
//     setPermissionState("request"); // show Turn On
//   }

//   if (Notification.permission === "denied") {
//     setPermissionState("denied"); // show blocked message
//   }

//   if (Notification.permission === "granted") {
//     setPermissionState(null); // hide banner
//   }
// }, []);


  useEffect(() => {
    if (localStorage.getItem("sound_unlocked") === "1") return;

    const unlockSound = () => {
      initNotificationSound();
      document.removeEventListener("click", unlockSound);
    };

    document.addEventListener("click", unlockSound);

    return () => {
      document.removeEventListener("click", unlockSound);
    };
  }, []);

//   useEffect(() => {
//   const interval = setInterval(() => {
//     if (!("Notification" in window)) return;

//     if (Notification.permission === "granted") {
//       setPermissionState(null);
//     }

//     if (Notification.permission === "denied") {
//       setPermissionState("denied");
//     }

//     if (Notification.permission === "default") {
//       setPermissionState("request");
//     }
//   }, 15000);

//   return () => clearInterval(interval);
// }, []);



  /* -----------------------------------------
     REQUEST NOTIFICATION PERMISSION
  ----------------------------------------- */
  const enableNotifications = async () => {
    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setPermissionState(null);
      initNotificationSound();

      new Notification("Notifications enabled 🎉", {
        body: "You will now receive task updates.",
      });
    }

    if (permission === "denied") {
      setPermissionState("denied");
    }
  };


  /* -----------------------------------------
     UNLOCK SOUND ON FIRST USER ACTION
  ----------------------------------------- */
  useEffect(() => {
    const unlock = () => {
      initNotificationSound();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };

    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <>
    {/* 🔔 NOTIFICATION PERMISSION BANNER */}
    {permissionState && (
      <div className="mx-4 mt-3 flex items-center justify-between rounded-lg bg-green-900 px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <BellSlashIcon className="h-6 w-6 text-green-300" />

          <div>
            <Typography className="font-semibold">
              Notifications are off
            </Typography>

            {permissionState === "request" && (
              <Typography className="text-sm text-green-200">
                Get notifications for task updates.
                <span
                  onClick={enableNotifications}
                  className="ml-1 cursor-pointer font-semibold underline"
                >
                  Turn on
                </span>
              </Typography>
            )}

            {permissionState === "denied" && (
              <Typography className="text-sm text-green-200">
                Notifications are blocked.
                <span className="ml-1 font-semibold">
                  Enable from browser settings
                </span>
              </Typography>
            )}
          </div>
        </div>

        <IconButton
          variant="text"
          color="white"
          onClick={() => setPermissionState(null)}
        >
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </div>
    )}

    <Navbar
      color={fixedNavbar ? "white" : "transparent"}
      className={`rounded-xl transition-all ${
        fixedNavbar
          ? "sticky top-4 z-40 py-3 shadow-md shadow-blue-gray-500/5"
          : "px-0 py-1"
      }`}
      fullWidth
      blurred={fixedNavbar}
    >
      <div className="flex flex-col-reverse justify-between gap-6 md:flex-row md:items-center">
        <div className="capitalize">
{/* <button
  onClick={() => {
    // Test notification
    showDesktopNotification({
      id: 999,
      message: "Test notification - please ignore",
      reference_id: 1
    });
  }}
  style={{
    marginLeft: '10px',
    padding: '5px 10px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Test Notification
</button> */}
          <Breadcrumbs
            className={`bg-transparent p-0 transition-all ${
              fixedNavbar ? "mt-1" : ""
            }`}
          >
            <Link to={`/${layout}`}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal opacity-50 transition-all hover:text-blue-500 hover:opacity-100"
              >
                {layout}
              </Typography>
            </Link>
            <Typography
              variant="small"
              color="blue-gray"
              className="font-normal"
            >
              {page}
            </Typography>
          </Breadcrumbs>
          <Typography variant="h6" color="blue-gray">
            {page}
          </Typography>
        </div>
        <div className="flex items-center">
            
          <IconButton
            variant="text"
            color="blue-gray"
            className="grid xl:hidden"
            onClick={() => setOpenSidenav(dispatch, !openSidenav)}
          >
            <Bars3Icon strokeWidth={3} className="h-6 w-6 text-blue-gray-500" />
          </IconButton>
          <NotificationBell userId={user?.id} />
          
          <Link to="/auth/sign-in">
            <Button
              variant="text"
              color="blue-gray"
              className="hidden items-center gap-1 px-4 xl:flex normal-case"
            >
              <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
              Sign Out
            </Button>
            <IconButton
              variant="text"
              color="blue-gray"
              className="grid xl:hidden"
            >
              <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
            </IconButton>
          </Link>
          <Menu>
  
            <MenuList className="w-max border-0">
              <MenuItem className="flex items-center gap-3">
                <Avatar
                  src="https://demos.creative-tim.com/material-dashboard/assets/img/team-2.jpg"
                  alt="item-1"
                  size="sm"
                  variant="circular"
                />
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-1 font-normal"
                  >
                    <strong>New message</strong> from Laur
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="flex items-center gap-1 text-xs font-normal opacity-60"
                  >
                    <ClockIcon className="h-3.5 w-3.5" /> 13 minutes ago
                  </Typography>
                </div>
              </MenuItem>
              <MenuItem className="flex items-center gap-4">
                <Avatar
                  src="https://demos.creative-tim.com/material-dashboard/assets/img/small-logos/logo-spotify.svg"
                  alt="item-1"
                  size="sm"
                  variant="circular"
                />
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-1 font-normal"
                  >
                    <strong>New album</strong> by Travis Scott
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="flex items-center gap-1 text-xs font-normal opacity-60"
                  >
                    <ClockIcon className="h-3.5 w-3.5" /> 1 day ago
                  </Typography>
                </div>
              </MenuItem>
              <MenuItem className="flex items-center gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-blue-gray-800 to-blue-gray-900">
                  <CreditCardIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-1 font-normal"
                  >
                    Payment successfully completed
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="flex items-center gap-1 text-xs font-normal opacity-60"
                  >
                    <ClockIcon className="h-3.5 w-3.5" /> 2 days ago
                  </Typography>
                </div>
              </MenuItem>
            </MenuList>
          </Menu>
          {/* <IconButton
            variant="text"
            color="blue-gray"
            onClick={() => setOpenConfigurator(dispatch, true)}
          >
            <Cog6ToothIcon className="h-5 w-5 text-blue-gray-500" />
          </IconButton> */}
        </div>
      </div>
    </Navbar>
    </>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
