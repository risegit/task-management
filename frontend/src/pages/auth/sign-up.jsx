// Sign-up

import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import axios from "axios";

export function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {    
    const fetchDepartments = async () => {
      setFetchingDepartments(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/department.php`,
          {
            params: { 
              'all_dept': 'true',
            }, 
          }
        );
        
        const result = response.data;
        console.log("Fetch Department Response:", result);
        
        if (result.status === "success" && result.data?.length > 0) {
          // Filter out "Admin" department from the list
          const filteredDepartments = result.data.filter(
            dept => dept.name.toLowerCase() !== "admin"
          );
          
          // Sort alphabetically
          const sortedDepartments = filteredDepartments.sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          
          setDepartments(sortedDepartments);
          
          // Set default department to the first one (if available)
          if (sortedDepartments.length > 0) {
            setDepartment(sortedDepartments[0].name);
          }
        } else {
          console.warn("No departments found or API returned empty data");
          setDepartments([]);
        }
      } catch (error) {
        console.error("Axios error:", error);
        toast.error("Failed to fetch departments. Please try again.");
        setDepartments([]);
      } finally {
        setFetchingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password || !email || !department) {
      setError("Please fill all fields");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(riseit\.in|riseit\.com)$/;

    if (!emailRegex.test(email)) {
      toast.error("Invalid email domain");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("department", department);
      formData.append("role", 'staff');
      formData.append("signin", "signup");

      console.log("FORM DATA:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}api/signin-out.php`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      console.log("Login API Response:", data);

      if (data.status === 'success') {
        toast.success(data.message);
        // navigate("/auth/sign-in", { replace: true });
      } else {
        toast.error(data.message);
      }
      
    } catch (err) {
      console.error("Login Error:", err);
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError("");

    if (!value.includes("@")) {
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(riseit\.in|riseit\.com)$/;

    if (!emailRegex.test(value)) {
      setEmailError("Only riseit.in or riseit.com email addresses are allowed.");
    }
  };

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
        />
      </div>
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Sign Up</Typography>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
          <div className="mb-1 flex flex-col gap-6">
            {/* Department Dropdown - Using native select */}
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Department
            </Typography>
            
            <div className="relative">
              <select
                value={department}
                onChange={handleDepartmentChange}
                className="w-full px-3 py-2.5 bg-white border border-blue-gray-200 rounded-lg 
                         focus:border-gray-900 focus:outline-none focus:ring-0 
                         text-blue-gray-700 text-base appearance-none"
                disabled={fetchingDepartments || departments.length === 0}
              >
                {fetchingDepartments ? (
                  <option value="">Loading departments...</option>
                ) : departments.length === 0 ? (
                  <option value="">No departments available</option>
                ) : (
                  <>
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            
            {fetchingDepartments && (
              <p className="text-blue-500 text-sm">Loading departments...</p>
            )}
            
            {!fetchingDepartments && departments.length === 0 && (
              <p className="text-red-500 text-sm">No departments available. Please contact administrator.</p>
            )}

            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Your Name
            </Typography>
            <Input
              size="lg"
              placeholder="Enter Name"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />

            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Your Email
            </Typography>
            <Input
              size="lg"
              placeholder="Enter email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />

            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}

            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Your Password
            </Typography>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                size="lg"
                placeholder="********"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="mt-6" 
            fullWidth
            disabled={fetchingDepartments || departments.length === 0 || loading || !department}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>

          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            Already have an account?
            <Link to="/auth/sign-in" className="text-gray-900 ml-1">Sign in</Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;