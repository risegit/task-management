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
    dark: "bg-gradient-to-br from-green-800 to-green-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const handleToggle = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Auto-open dropdown if inside child route
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

  // ----------- MOBILE AUTO-CLOSE HANDLER ------------
  const handleMobileClose = () => {
    if (window.innerWidth < 1280) {
      setOpenSidenav(dispatch, false);
    }
  };
  // ---------------------------------------------------

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-green-500`}
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
            className="h-20 w-auto object-contain"
          />
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
            {/* {brandName} */}
          </Typography>

          {role ? (
            <p className="text-m font-weight-500 mt-1 capitalize">
              Role: {role}<br/>
              <span className="text-borange font-weight-500">{username}</span>
            </p>
          ) : (
            <p className="text-sm text-red-300 mt-1">
              Role: (none)
            </p>
          )}
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

      {/* Routes */}
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
                {collapse && collapse.length > 0 ? (
                  <>
                    <Button
                      variant={openDropdown === name ? "gradient" : "text"}
                      color="green"
                      className={`flex items-center justify-between gap-2 px-2 capitalize w-full text-left ${
                        openDropdown === name
                          ? "bg-green-500 text-white"
                          : "text-green-700 hover:bg-green-700/30"
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

                    <Collapse open={openDropdown === name}>
                      <ul className="ml-5 mt-1 flex flex-col gap-1 border-l border-green-400 pl-3">
                        {collapse.map(({ name: subName, path: subPath }) => (
                          <li key={subName}>
                            <NavLink
                              to={`/${layout}${subPath}`}
                              onClick={handleMobileClose}
                            >
                              {({ isActive }) => (
                                <Button
                                  variant={isActive ? "gradient" : "text"}
                                  color="green"
                                  className={`flex items-center gap-2 px-2 text-sm capitalize ${
                                    isActive
                                      ? "bg-green-500 text-white"
                                      : "text-green-700 hover:bg-green-700/30"
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
                  <NavLink
                    to={`/${layout}${path}`}
                    onClick={handleMobileClose}
                  >
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        color="green"
                        className={`flex items-center gap-2 px-2 capitalize ${
                          isActive
                            ? "bg-green-500 text-white"
                            : "text-green-700 hover:bg-green-700/30"
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