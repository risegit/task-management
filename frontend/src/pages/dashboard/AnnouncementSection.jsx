// components/AnnouncementSection.jsx
import React from "react";

const AnnouncementSection = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-dashed p-6 text-center text-gray-400">
        No announcements available
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-4">
      {announcements.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl bg-blue-50 border border-blue-200 p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-blue-900">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-blue-800">
            {item.message}
          </p>
          <span className="mt-2 block text-xs text-blue-600">
            {item.date}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementSection;
