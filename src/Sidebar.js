import React, { useState, useEffect } from "react";
import { AiOutlineSchedule, AiOutlineBell, AiOutlineLogout, AiOutlineDashboard } from "react-icons/ai";
import { db } from "./firebase"; // Import your Firestore configuration
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

const Sidebar = ({ setActivePage }) => {
  const [pendingCount, setPendingCount] = useState(0); // Initializing state for pending count
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Combine counts of "Emergency" and "scanned_ids" collections
    let emergencyCount = 0;
    let scannedCount = 0;

    const unsubscribeEmergencies = onSnapshot(
      query(collection(db, "Emergency"), where("status", "==", "Pending")),
      (querySnapshot) => {
        emergencyCount = querySnapshot.size;
        setPendingCount(emergencyCount + scannedCount); // Update the count
      },
      (error) => {
        console.error("Error fetching pending requests from Emergency collection: ", error);
      }
    );

    const unsubscribeScannedIds = onSnapshot(
      query(collection(db, "scanned_ids"), where("status", "==", "Pending")),
      (querySnapshot) => {
        scannedCount = querySnapshot.size;
        setPendingCount(emergencyCount + scannedCount); // Update the count
      },
      (error) => {
        console.error("Error fetching pending requests from scanned_ids collection: ", error);
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribeEmergencies();
      unsubscribeScannedIds();
    };
  }, []); // Empty dependency array to run the effect only once

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <div className="h-screen w-64 bg-blue-900 text-white flex flex-col py-6 px-4 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Admin Panel</h2>
      <ul className="space-y-4">
        <li
          className="flex items-center space-x-3 p-3 hover:bg-blue-700 cursor-pointer transition"
          onClick={() => setActivePage("students")}
        >
          <AiOutlineDashboard size={22} />
          <span>Dashboard</span>
        </li>
        <li
          className="flex items-center space-x-3 p-3 hover:bg-blue-700 cursor-pointer transition"
          onClick={() => setActivePage("schedules")}
        >
          <AiOutlineSchedule size={22} />
          <span>Schedules</span>
        </li>
        <li
          className="flex items-center space-x-3 p-3 hover:bg-blue-700 cursor-pointer transition"
          onClick={() => setActivePage("notifications")}
        >
          <AiOutlineBell size={22} />
          <span className="flex-1">Notifications</span>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-xs text-white rounded-full px-2 py-0.5 ml-2">
              {pendingCount}
            </span>
          )}
        </li>
        <li
          className="flex items-center space-x-3 p-3 hover:bg-blue-700 cursor-pointer transition"
          onClick={() => setShowLogoutModal(true)}
        >
          <AiOutlineLogout size={22} />
          <span>Logout</span>
        </li>
      </ul>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black">
            <p className="mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
