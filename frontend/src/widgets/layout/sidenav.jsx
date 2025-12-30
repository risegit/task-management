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
      className={`${openSidenav ? "translate-x-0" : "-translate-x-80"
        } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-2xl transition-transform duration-300 xl:translate-x-0 bg-white shadow-xl border border-slate-200`}
    >
      {/* Logo Section */}
      <div className="border-b border-slate-200 p-6">
        <NavLink
          to="/dashboard/home"
          className="flex items-center gap-3 mb-6"
          onClick={handleMobileClose}
        >
          {/* Logo Image Container */}
          <div className="w-48 h-12 flex items-center justify-center">
            <img
              src={brandImg}
              alt={brandName}
              className="h-full w-auto object-contain"
            />
          </div>
          
          {/* Close button for mobile */}
          <IconButton
            variant="text"
            size="sm"
            ripple={false}
            className="absolute right-3 top-3 xl:hidden rounded-lg hover:bg-slate-100"
            onClick={() => setOpenSidenav(dispatch, false)}
          >
            <XMarkIcon strokeWidth={2.5} className="h-6 w-6 text-slate-600" />
          </IconButton>
        </NavLink>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {profileImage ? (
              <div
                className="h-12 w-12 rounded-full bg-cover bg-center shadow-lg ring-4 ring-purple-100 cursor-pointer transition-all group-hover:ring-purple-200"
                style={{ backgroundImage: `url(${profileImage})` }}
                onClick={handleProfileClick}
              />
            ) : (
              <div
                className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-purple-100 cursor-pointer transition-all group-hover:ring-purple-200"
                onClick={handleProfileClick}
              >
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            {/* Edit indicator */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white shadow-md flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {username || "User"}
            </p>
            <p className="text-xs text-blue-600 font-medium capitalize">
              {role || "No Role"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredRoutes.map(({ layout, title, pages }, key) => (
          <div key={key} className="mb-6">
            {title && (
              <p className="text-xs font-semibold text-slate-500 mb-3 px-3 uppercase">
                {title}
              </p>
            )}

            <ul className="space-y-2">
              {pages.map(({ icon, name, path, collapse }) => (
                <li key={name}>
                  {/* Dropdown Group */}
                  {collapse && collapse.length > 0 ? (
                    <>
                      <button
                        className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all font-medium ${
                          openDropdown === name
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                        onClick={() => handleToggle(name)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 flex items-center justify-center">
                            {icon}
                          </span>
                          <span className="capitalize">{name}</span>
                        </div>
                        {openDropdown === name ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Collapsed Items */}
                      <Collapse open={openDropdown === name}>
                        <ul className="ml-8 mt-2 space-y-1 border-l-2 border-slate-200 pl-4">
                          {collapse.map(({ name: subName, path: subPath }) => (
                            <li key={subName}>
                              <NavLink
                                to={`/${layout}${subPath}`}
                                onClick={handleMobileClose}
                              >
                                {({ isActive }) => (
                                  <button
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                                      isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {subName}
                                  </button>
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
                        <button
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="w-5 h-5 flex items-center justify-center">
                            {icon}
                          </span>
                          <span className="capitalize">{name}</span>
                        </button>
                      )}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
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