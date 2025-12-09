import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
  Collapse,
} from "@material-tailwind/react";
import { useState, useEffect, useMemo } from "react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav, sidenavType } = controller;
  const [openDropdown, setOpenDropdown] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const location = useLocation();

  // ---- Read role ----
  const rawRole = localStorage.getItem("role");
  const rawUser = localStorage.getItem("user");
  let role = rawRole ?? null;
  const rawUsername = JSON.parse(localStorage.getItem("user"));
  const username = rawUsername?.name;

  try {
    if (!role && rawUser) {
      const parsed = JSON.parse(rawUser);
      role = parsed?.role ?? null;
    }
  } catch (e) {
    console.warn("Sidenav: failed to parse user", e);
  }

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-blue-800 to-blue-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const handleToggle = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleProfileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setProfileImage(event.target.result);
          // Optionally save to localStorage
          localStorage.setItem('profileImage', event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Load profile image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  // Auto-open dropdown when inside a sub-route
  useEffect(() => {
    routes.forEach(({ layout, pages }) => {
      pages.forEach(({ name, collapse }) => {
        if (
          collapse?.some(
            ({ path: subPath }) =>
              location.pathname === `/${layout}${subPath}`
          )
        ) {
          setOpenDropdown(name);
        }
      });
    });
  }, [location.pathname, routes]);

  // Role-based filtering
  const isPageAllowed = (page) => {
    if (page.allowedRoles && Array.isArray(page.allowedRoles)) {
      return page.allowedRoles.includes(role);
    }
    if (page.collapse && Array.isArray(page.collapse)) {
      const anyChildHasExplicitRoles = page.collapse.some(
        (sub) => Array.isArray(sub.allowedRoles)
      );
      if (anyChildHasExplicitRoles) {
        return page.collapse.some((sub) =>
          sub.allowedRoles ? sub.allowedRoles.includes(role) : false
        );
      }
    }
    return true;
  };

  const filteredRoutes = useMemo(() => {
    return routes.map((routeGroup) => {
      const filteredPages = (routeGroup.pages || [])
        .filter((page) => !page.hidden && isPageAllowed(page))
        .map((page) => {
          if (Array.isArray(page.collapse)) {
            const filteredCollapse = page.collapse
              .filter((sub) => !sub.hidden)
              .filter((sub) => {
                if (sub.allowedRoles && Array.isArray(sub.allowedRoles)) {
                  return sub.allowedRoles.includes(role);
                }
                if (page.allowedRoles && Array.isArray(page.allowedRoles)) {
                  return page.allowedRoles.includes(role);
                }
                return true;
              });
            return { ...page, collapse: filteredCollapse };
          }
          return page;
        });

      return { ...routeGroup, pages: filteredPages };
    });
  }, [routes, role]);

  // Auto close sidebar on mobile
  const handleMobileClose = () => {
    if (window.innerWidth < 1280) {
      setOpenSidenav(dispatch, false);
    }
  };

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${openSidenav ? "translate-x-0" : "-translate-x-80"
        } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-500`}
    >
      {/* Logo */}
      <div>
        <NavLink
          to="/dashboard/home"
          className="py-2 px-8 flex flex-col items-center justify-center gap-2"
          onClick={handleMobileClose}
        >
          <img
            src={`${import.meta.env.BASE_URL}img/rise-it-Logo.png`}
            alt="Riseit Logo"
            className="h-23 w-auto object-contain"
          />

          {/* Profile and Role Section */}
      <div className="flex items-center gap-4 mt-4 w-full">
  {/* Profile Picture Placeholder - Increased size */}
  <div className="relative">
    {profileImage ? (
      <div
        className="h-16 w-16 rounded-full bg-cover bg-center shadow-lg border-3 border-white cursor-pointer"
        style={{ backgroundImage: `url(${profileImage})` }}
        onClick={handleProfileClick}
      />
    ) : (
      <div
        className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-3 border-white cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleProfileClick}
      >
        {username ? username.charAt(0).toUpperCase() : "U"}
      </div>
    )}

    {/* Change Profile Picture Button - Slightly larger */}
    <button
      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 flex items-center justify-center text-white text-xs transition-colors shadow-md"
      onClick={handleProfileClick}
      title="Change profile picture"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    </button>
  </div>

  {/* Role and Username */}
  <div className="flex-1 min-w-0">
    {role ? (
      <div className="text-left">
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate capitalize">
          {username || "User"}
        </p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
          Role: <span className="text-blue-600 dark:text-blue-400 font-bold">{role}</span>
        </p>
      </div>
    ) : (
      <p className="text-base font-medium text-red-400">Role: (none)</p>
    )}
  </div>
</div>  
        </NavLink>

        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className="absolute right-3 top-3 grid rounded-br-none rounded-tl-none xl:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-7 w-7 text-black" />
        </IconButton>
      </div>

      {/* Route List */}
      <div className="m-4">
        {filteredRoutes.map(({ layout, title, pages }, key) => (
          <ul key={key} className="mb-4 flex flex-col gap-1">
            {title && (
              <li className="mx-3.5 mt-4 mb-2">
                <Typography
                  variant="small"
                  color={sidenavType === "dark" ? "white" : "blue-gray"}
                  className="font-black uppercase opacity-75"
                >
                  {title}
                </Typography>
              </li>
            )}

            {pages.map(({ icon, name, path, collapse }) => (
              <li key={name}>
                {/* Dropdown Group */}
                {collapse && collapse.length > 0 ? (
                  <>
                    <Button
                      variant={openDropdown === name ? "gradient" : "text"}
                      color="blue"
                      className={`flex items-center justify-between gap-2 px-2 capitalize w-full text-left ${openDropdown === name
                          ? "bg-blue-00 text-white"
                          : "text-blue-700 hover:bg-blue-300/30"
                        }`}
                      fullWidth
                      onClick={() => handleToggle(name)}
                    >
                      <div className="flex items-center gap-2">
                        {icon}
                        <Typography color="inherit" className="font-medium capitalize">
                          {name}
                        </Typography>
                      </div>

                      {openDropdown === name ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Collapsed Items */}
                    <Collapse open={openDropdown === name}>
                      <ul className="ml-5 mt-1 flex flex-col gap-1 border-l border-blue-400 pl-3">
                        {collapse.map(({ name: subName, path: subPath }) => (
                          <li key={subName}>
                            <NavLink
                              to={`/${layout}${subPath}`}
                              onClick={handleMobileClose}
                            >
                              {({ isActive }) => (
                                <Button
                                  variant={isActive ? "gradient" : "text"}
                                  color="blue"
                                  className={`flex items-center gap-2 px-2 text-sm capitalize ${isActive
                                      ? "bg-blue-500 text-white"
                                      : "text-blue-700 hover:bg-blue-700/30"
                                    }`}
                                  fullWidth
                                >
                                  <Typography color="inherit">{subName}</Typography>
                                </Button>
                              )}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </Collapse>
                  </>
                ) : (
                  // Normal Route Button
                  <NavLink
                    to={`/${layout}${path}`}
                    onClick={handleMobileClose}
                  >
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        color="blue"
                        className={`flex items-center gap-2 px-2 capitalize ${isActive
                            ? "bg-blue-500 text-white"
                            : "text-blue-700 hover:bg-blue-700/30"
                          }`}
                        fullWidth
                      >
                        {icon}
                        <Typography color="inherit" className="font-medium capitalize">
                          {name}
                        </Typography>
                      </Button>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/rise-it-Logo.png",
  brandName: "Riseit",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;