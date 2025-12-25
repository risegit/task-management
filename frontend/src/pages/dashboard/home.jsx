import React from "react";
import { useEffect, useState } from "react";


const Card = ({ title, children, icon }) => (
  <div className="bg-white rounded-xl shadow p-4 h-full">
    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
      <span className="text-teal-600">{icon}</span>
      {title}
    </div>
    {children}
  </div>
);

// const currentAnnouncements = sortedDepartments.slice(indexOfFirstItem, indexOfLastItem);

const Home = () => {

  const [currentAnnouncements, setCurrentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}api/announcement.php`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }

        const data = await response.json();
        console.log("data=", data.data);
        // Ensure API response is an array
        setCurrentAnnouncements(data.data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setError("Unable to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <Card title="Today's Thought" icon="💬">
          <p className="text-sm text-gray-600 italic">
            “If you aspire to the highest place, it is no disgrace to stop at
            the second or even the third place.”
          </p>
        </Card>

        <Card title="Birthday" icon="🎂">
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No One’s Birthday Today
          </div>
        </Card>

        <Card title="Time" icon="⏰">
          <div className="flex items-center justify-center h-full">
            <div className="w-32 h-32 rounded-full border-4 border-teal-500 flex items-center justify-center text-lg font-semibold">
              12:45
            </div>
          </div>
        </Card>

        <Card title="Work Anniversary" icon="🎉">
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No Work Anniversary Today
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            📅 Calendar
          </div>

          <div className="grid grid-cols-7 gap-3 text-center text-sm text-gray-600">
            {Array.from({ length: 31 }, (_, i) => (
              <div
                key={i}
                className={`rounded-full w-8 h-8 flex items-center justify-center ${i === 23
                  ? "bg-green-500 text-white"
                  : "hover:bg-gray-200"
                  }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Guidelines */}
        <Card title="Corporate Guidelines" icon="📘">
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Details Not Available
          </div>
        </Card>

        {/* Events & Announcements */}
        {/* <Card title="Events and Announcements" icon="📢">
          {currentAnnouncements.map((announce) => (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              <p className="text-sm text-gray-600 mb-4">{announce.name || "No name"}</p>
              <p className="text-sm text-gray-600 mb-4">{announce.description || "No description"}</p>
            </div>
          ))}
        </Card> */}
        <Card title="Events and Announcements" icon="📢">
          {loading ? (
            <p className="text-gray-400 text-sm text-center">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-sm text-center">{error}</p>
          ) : currentAnnouncements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center">
              No announcements found
            </p>
          ) : (
            currentAnnouncements.map((announce) => (
              <div
                key={announce.id}
                className="flex flex-col items-center justify-center h-48 text-sm"
              >
                <p className="text-gray-700 font-medium mb-2">
                  {announce.name || "No name"}
                </p>
                <p className="text-gray-600 text-center">
                  {announce.description || "No description"}
                </p>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

export default Home;
