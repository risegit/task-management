import { useEffect, useState } from "react";

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="relative w-40 h-40 rounded-full bg-white border-[6px] border-teal-600 shadow-md">
      
      {/* Minute / Hour ticks */}
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className={`absolute left-1/2 top-1/2 ${
            i % 5 === 0 ? "w-1 h-3 bg-gray-700" : "w-0.5 h-2 bg-teal-500"
          }`}
          style={{
            transform: `rotate(${i * 6}deg) translateY(-78px)`
          }}
        />
      ))}

      {/* Hour hand */}
      <div
        className="absolute left-1/2 top-1/2 w-2 h-12 bg-gray-800 rounded origin-bottom"
        style={{
          transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`
        }}
      />

      {/* Minute hand */}
      <div
        className="absolute left-1/2 top-1/2 w-1.5 h-16 bg-gray-600 rounded origin-bottom"
        style={{
          transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`
        }}
      />

      {/* Second hand */}
      <div
        className="absolute left-1/2 top-1/2 w-0.5 h-18 bg-red-500 origin-bottom"
        style={{
          transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`
        }}
      />

      {/* Center cap */}
      <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20" />
    </div>
  );
}
