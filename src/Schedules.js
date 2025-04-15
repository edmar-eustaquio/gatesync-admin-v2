import React, { useState, useEffect } from "react";
import { collection, getDocs, where } from "firebase/firestore";
import { db } from "./firebase";

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let students = {};
        const studentsSnapshot = await getDocs(
          collection(db, "users"),
          where("role", "==", "Student")
        );
        for (const dc of studentsSnapshot.docs) {
          const data = dc.data();
          students[dc.id] = {
            name: data.name,
            course: data.course,
            yearLevel: data.yearLevel,
          };
        }

        // Fetch schedules
        const scheduleSnapshot = await getDocs(collection(db, "schedules"));
        let temp = [];
        for (const dc of scheduleSnapshot.docs) {
          const data = dc.data();
          temp.push({
            id: dc.id,
            ...data,
            ...students[data.studentId],
          });
        }
        setSchedules(temp);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg overflow-auto max-h-[95vh]">
      <h2 className="text-2xl font-bold mb-6 text-center">Schedules</h2>
      <table className="w-full border-collapse bg-white shadow-md rounded-lg">
        <thead className="bg-blue-600 text-white">
          <tr className="text-center">
            <th className="py-4 px-6">UID</th>
            <th className="py-4 px-6">Student Name</th>
            <th className="py-4 px-6">Course</th>
            <th className="py-4 px-6">Year Level</th>
            <th className="py-4 px-6">Date</th>
            <th className="py-4 px-6">Class Start</th>
            <th className="py-4 px-6">Class End</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length > 0 ? (
            schedules.map((schedule, index) => (
              <tr
                key={schedule.id}
                className={`text-center border-b border-gray-300 ${
                  index % 2 === 0 ? "bg-gray-100" : "bg-white"
                } hover:bg-gray-200 transition`}
              >
                <td className="py-4 px-6">{schedule.id}</td>
                <td className="py-4 px-6">
                  {schedule.name || "Unknown Student"}
                </td>
                <td className="py-4 px-6">{schedule.course || "N/A"}</td>
                <td className="py-4 px-6">{schedule.yearLevel || "N/A"}</td>
                <td className="py-4 px-6">{schedule.date || "N/A"}</td>
                <td className="py-4 px-6">{schedule.timeIn || "N/A"}</td>
                <td className="py-4 px-6">{schedule.timeOut || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-6 text-gray-600">
                No schedules found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Schedules;
