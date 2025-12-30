// src/pages/dashboard/index.jsx
import { Routes, Route } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import { Sidenav, DashboardNavbar, Configurator, Footer } from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import React, { useState, useEffect } from "react";

// Helper function to filter routes based on user role
const filterRoutesByRole = (routes, userRole) => {
  if (!userRole) return routes;
  
  const filteredRoutes = routes.map(routeGroup => {
    if (routeGroup.layout === "dashboard") {
      const filteredPages = routeGroup.pages.filter(page => {
        // Skip hidden pages
        if (page.hidden) return false;
        
        // Check if page has allowedRoles property
        if (page.allowedRoles) {
          return page.allowedRoles.includes(userRole);
        }
        
        // For collapsible items, filter the collapse items
        if (page.collapse) {
          const filteredCollapse = page.collapse.filter(collapseItem => {
            if (collapseItem.hidden) return false;
            if (collapseItem.allowedRoles) {
              return collapseItem.allowedRoles.includes(userRole);
            }
            return true;
          });
          
          // Only show parent if there are visible collapse items
          if (filteredCollapse.length > 0) {
            // Create a copy to avoid mutating original
            const pageCopy = { ...page };
            pageCopy.collapse = filteredCollapse;
            return pageCopy;
          }
          return false;
        }
        
        return true; // If no role restriction, show it
      });
      
      return {
        ...routeGroup,
        pages: filteredPages
      };
    }
    
    return routeGroup;
  });
  
  return filteredRoutes;
};

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const [userRole, setUserRole] = useState(null);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user role from localStorage
  useEffect(() => {
    const getUserData = () => {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const user = JSON.parse(rawUser);
          const role = user?.role || null;
          setUserRole(role);
          
          // Filter routes based on role
          const filtered = filterRoutesByRole(routes, role);
          setFilteredRoutes(filtered);
        } else {
          // If no user in localStorage, show empty routes
          setFilteredRoutes([]);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setFilteredRoutes([]);
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();
    
    // Listen for storage changes (if user logs in/out in another tab)
    const handleStorageChange = () => getUserData();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={filteredRoutes}
        brandImg={sidenavType === "dark" ? "/img/logo-ct.png" : "/img/rise-it-Logo.png"}
      />
      <div className="p-4 xl:ml-80 pt-15">
        <DashboardNavbar />
        <Configurator />
        
        {/* Optional: Settings button (commented out in your code) */}
        {/* <IconButton
          size="lg"
          color="white"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
          ripple={false}
          onClick={() => setOpenConfigurator(dispatch, true)}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </IconButton> */}

        {/* Routes - Use filteredRoutes for rendering */}
        <Routes>
          {filteredRoutes.map(({ layout, pages }) => {
            if (layout === "dashboard") {
              const routeElements = [];
              
              pages.forEach((page) => {
                // Add main route if it has a path
                if (page.path && page.element) {
                  routeElements.push(
                    <Route key={page.path} path={page.path} element={page.element} />
                  );
                }
                
                // Add collapse routes
                if (page.collapse) {
                  page.collapse.forEach((collapsePage) => {
                    if (collapsePage.path && collapsePage.element) {
                      routeElements.push(
                        <Route 
                          key={collapsePage.path} 
                          path={collapsePage.path} 
                          element={collapsePage.element} 
                        />
                      );
                    }
                  });
                }
              });
              
              return routeElements;
            }
            return null;
          })}
          
          {/* Also include auth routes */}
          {routes.map(({ layout, pages }) => {
            if (layout === "auth") {
              return pages.map((page) => (
                page.path && page.element && (
                  <Route key={page.path} path={page.path} element={page.element} />
                )
              ));
            }
            return null;
          })}
        </Routes>
        
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;