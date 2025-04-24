import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  where,
  addDoc,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { FaExclamationTriangle, FaIdCard } from "react-icons/fa";
import { Timestamp } from "firebase/firestore";

const Notifications = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [scannedEntries, setScannedEntries] = useState([]);
  const [selectedScannedEntry, setSelectedScannedEntry] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [selectingEmergency, setSelectingEmergency] = useState(false);
  const [selectedAllEmergencies, setSelectedAllEmergencies] = useState(false);
  const [selectedEmergencies, setSelectedEmergencies] = useState({});

  const [selectingScan, setSelectingScan] = useState(false);
  const [selectedAllScans, setSelectedAllScans] = useState(false);
  const [selectedScans, setSelectedScans] = useState({});

  const [students, setStudents] = useState({});
  const [parents, setParents] = useState({});

  useEffect(() => {
    // Fetch all students and map { idNumber: { username, course, yearLevel } }
    // let students = {};
    let temp = {};
    let unsubscribeEmergencies = null;
    let unsubscribeScanned = null;
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "users");
        const studentSnapshot = await getDocs(studentsRef);

        for (const dc of studentSnapshot.docs) {
          const data = dc.data();

          if (data.role === "Student")
            temp[data.idNumber] = {
              id: dc.id,
              name: data.name,
              idNumber: data.idNumber,
              course: data.course,
              yearLevel: data.yearLevel,
            };
        }
        setStudents(temp);

        const snap = await getDocs(
          query(collection(db, "linkings"), where("status", "==", "Accepted"))
        );
        let ptemp = {};
        for (const dc of snap.docs) {
          const data = dc.data();

          if (!ptemp[data.studentId]) {
            ptemp[data.studentId] = [data.parentId];
            continue;
          }
          ptemp[data.studentId].push(data.parentId);
        }
        setParents(ptemp);

        const emergencyQuery = query(
          collection(db, "emergencies"),
          where("status", "==", "Pending")
        );
        unsubscribeEmergencies = onSnapshot(emergencyQuery, (querySnapshot) => {
          let t = {};
          let emergencyList = [];
          for (const dc of querySnapshot.docs) {
            const d = dc.data();
            t[dc.id] = false;
            emergencyList.push({
              id: dc.id,
              ...d,
              ...temp[d.studentId],
            });
          }

          setSelectedEmergencies(t);
          setEmergencies(emergencyList);

          setPendingCount(
            (prevCount) => emergencyList.length + scannedEntries.length
          );
        });

        const scannedQuery = query(
          collection(db, "scanned_ids"),
          where("status", "==", "Pending")
        );

        unsubscribeScanned = onSnapshot(scannedQuery, (querySnapshot) => {
          let scannedList = [];
          let t = {};
          for (const dc of querySnapshot.docs) {
            const d = dc.data();
            let studentDetails = {}; // Get the student details from the map
            for (const key in temp) {
              const dc = temp[key];
              if (dc.idNumber == d.idNumber) {
                studentDetails = dc;
                break;
              }
            }

            t[dc.id] = false;
            scannedList.push({
              id: dc.id,
              ...d,
              studentUsername: studentDetails.name || "Unknown Student",
              studentCourse: studentDetails.course || "Unknown Course",
              studentYearLevel:
                studentDetails.yearLevel || "Unknown Year Level",
              timestamp:
                d.timestamp instanceof Timestamp
                  ? d.timestamp.toDate()
                  : d.timestamp,
            });
          }

          setSelectedScans(t);
          setScannedEntries(scannedList);

          setPendingCount(
            (prevCount) => emergencies.length + scannedList.length
          );
        });
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();

    return () => {
      if (unsubscribeEmergencies) unsubscribeEmergencies();
      if (unsubscribeScanned) unsubscribeScanned();
    };
  }, []);

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmergency(null);
    setSelectedScannedEntry(null); // Add this line to clear selectedScannedEntry when modal closes
  };

  // Open modal and update Emergency status to "In Progress"
  const handleOpenModal = async (emergency) => {
    if (selectingEmergency) {
      const data = {
        ...selectedEmergencies,
        [emergency.id]: selectedEmergencies[emergency.id] ? false : true,
      };
      setSelectedEmergencies(data);
      let hasSelected = false;
      let hasNoSelected = false;
      for (const i in data) {
        const l = data[i];

        if (l) hasSelected = true;
        else hasNoSelected = true;
        if (hasSelected && hasNoSelected) break;
      }
      if (!hasNoSelected) {
        setSelectedAllEmergencies(true);
        return;
      }
      if (!hasSelected) {
        setSelectedAllEmergencies(false);
        return;
      }
      return;
    }
    // if (emergency.status === "Pending") {
    //   try {
    //     const emergencyRef = doc(db, "emergencies", emergency.id);
    //     await updateDoc(emergencyRef, { status: "In Progress" });

    //     setEmergencies((prev) =>
    //       prev.map((e) =>
    //         e.id === emergency.id ? { ...e, status: "In Progress" } : e
    //       )
    //     );
    //   } catch (error) {
    //     console.error("Error updating emergency status to In Progress:", error);
    //   }
    // }
    setSelectedEmergency(emergency);
    setIsModalOpen(true);
  };

  // Open modal and update Scanned Entry status to "In Progress"
  const handleOpenScannedModal = async (entry) => {
    if (selectingScan) {
      const data = {
        ...selectedScans,
        [entry.id]: selectedScans[entry.id] ? false : true,
      };
      setSelectedScans(data);
      let hasSelected = false;
      let hasNoSelected = false;
      for (const i in data) {
        const l = data[i];

        if (l) hasSelected = true;
        else hasNoSelected = true;
        if (hasSelected && hasNoSelected) break;
      }
      if (!hasNoSelected) {
        setSelectedAllScans(true);
        return;
      }
      if (!hasSelected) {
        setSelectedAllScans(false);
        return;
      }
      return;
    }
    // if (entry.status === "Pending") {
    //   try {
    //     const scannedRef = doc(db, "scanned_ids", entry.id);
    //     await updateDoc(scannedRef, { status: "In Progress" });

    //     setScannedEntries((prev) =>
    //       prev.map((e) =>
    //         e.id === entry.id ? { ...e, status: "In Progress" } : e
    //       )
    //     );
    //   } catch (error) {
    //     console.error(
    //       "Error updating scanned entry status to In Progress:",
    //       error
    //     );
    //   }
    // }
    setSelectedScannedEntry(entry);
    setIsModalOpen(true);
  };

  const onSelectAll = (isSelect) => {
    setSelectedAllEmergencies(isSelect);
    setSelectedEmergencies((prev) => {
      for (const i in prev) prev[i] = isSelect;

      return { ...prev };
    });
  };

  const onConfirm = async (accept) => {
    let hasSelected = false;
    for (const i in selectedEmergencies) {
      if (selectedEmergencies[i]) {
        hasSelected = true;
        break;
      }
    }
    if (!hasSelected) {
      alert(`No selected emergency to ${accept ? "accept" : "decline"}!!!`);
      return;
    }

    const status = accept ? "Accepted" : "Declined";

    setSelectingEmergency(false);

    for (const id in selectedEmergencies) {
      if (!selectedEmergencies[id]) continue;

      await updateDoc(doc(db, "emergencies", id), { status });
      let studentId = null;
      let studentName = null;
      for (const i in emergencies) {
        const st = emergencies[i];
        if (st.id === id) {
          studentId = st.studentId;
          studentName = st.name;
          break;
        }
      }
      if (!studentId) continue;

      addDoc(collection(db, "notifications"), {
        receiverId: studentId,
        title: "Emergency Status",
        emergencyId: id,
        message: `Your emergency request is ${accept ? "S" : "Uns"}uccessful.`,
        route: "/(studenttabs)/notification",
        date: serverTimestamp(),
        prompt: false,
      });

      const parentIds = parents[studentId];
      if (!parentIds) continue;

      for (const parentId of parentIds)
        addDoc(collection(db, "notifications"), {
          receiverId: parentId,
          title: "Emergency Status",
          emergencyId: id,
          message: `${studentName} emergency request is ${accept ? "S" : "Uns"}uccessful.`,
          route: "/(parenttabs)/notification",
          date: serverTimestamp(),
          prompt: false,
        });
    }
    // onSelectAll(false);
  };

  const onSelectAllScans = (isSelect) => {
    setSelectedAllScans(isSelect);
    setSelectedScans((prev) => {
      for (const i in prev) prev[i] = isSelect;

      return { ...prev };
    });
  };

  const onConfirmScans = async (accept) => {
    let hasSelected = false;
    for (const i in selectedScans) {
      if (selectedScans[i]) {
        hasSelected = true;
        break;
      }
    }
    if (!hasSelected) {
      alert(`No selected scanned entry to ${accept ? "accept" : "decline"}!!!`);
      return;
    }

    const status = accept ? "Accepted" : "Declined";

    setSelectingScan(false);

    for (const id in selectedScans) {
      if (!selectedScans[id]) continue;

      await updateDoc(doc(db, "scanned_ids", id), { status });
      let studentId = null;
      let studentName = null;
      for (const i in scannedEntries) {
        const st = scannedEntries[i];
        if (st.id === id) {
          const student = students[st.idNumber];
          if (student) {
            studentId = student.id;
            studentName = student.name;
          }
          break;
        }
      }
      if (!studentId) continue;

      addDoc(collection(db, "notifications"), {
        receiverId: studentId,
        title: "Scan Entry Status",
        scanId: id,
        message: `Your scan entry is ${accept ? "S" : "Uns"}uccessful.`,
        route: "/(studenttabs)/notification",
        date: serverTimestamp(),
        prompt: false,
      });

      const parentIds = parents[studentId];
      if (!parentIds) continue;

      for (const parentId of parentIds)
        addDoc(collection(db, "notifications"), {
          receiverId: parentId,
          title: "Scan Entry Status",
          scanId: id,
          message: `${studentName} scan entry is ${accept ? "S" : "Uns"}uccessful.`,
          route: "/(parenttabs)/notification",
          date: serverTimestamp(),
          prompt: false,
        });
    }
    // onSelectAll(false);
  };

  // // Open modal for scanned entry details
  // const handleOpenScannedModal = (entry) => {
  //   setSelectedScannedEntry(entry);
  //   setIsModalOpen(true);
  // };

  return (
    <div className="p-6 bg-gray-100 overflow-auto max-h-[95vh]">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Notifications</h2>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-700">
          Emergencies and Scanned Entries: {pendingCount}
        </h3>
      </div>

      <div className="flex justify-between my-2 gap-2 flex-wrap">
        {selectingEmergency ? (
          <>
            <button
              className="px-3 bg-red-600 hover:bg-red-800 rounded-md text-white"
              onClick={() => {
                setSelectingEmergency(false);
                onSelectAll(false);
              }}
            >
              Cancel
            </button>
            <div className="flex gap-2 flex-wrap">
              <button
                className="px-3 bg-cyan-600 hover:bg-cyan-800 rounded-md text-white"
                onClick={() => onSelectAll(!selectedAllEmergencies)}
              >
                {selectedAllEmergencies ? "Uns" : "S"}elect All
              </button>
              <button
                className="px-3 bg-teal-600 hover:bg-teal-800 rounded-md text-white"
                onClick={() => onConfirm(true)}
              >
                Accept
              </button>
              <button
                className="px-3 bg-red-600 hover:bg-red-800 rounded-md text-white"
                onClick={() => onConfirm(false)}
              >
                Decline
              </button>
            </div>
          </>
        ) : (
          <button
            className="px-3 bg-cyan-600 hover:bg-cyan-800 rounded-md text-white"
            onClick={() => setSelectingEmergency(true)}
          >
            Select
          </button>
        )}
      </div>

      {/* Emergency Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emergencies.length > 0 ? (
          emergencies.map((emergency) => (
            <div
              key={emergency.id}
              className="bg-white shadow-lg rounded-lg p-5 transition transform hover:scale-105 cursor-pointer border-l-4 border-gray-500 hover:border-gray-700"
              onClick={() => handleOpenModal(emergency)}
            >
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-500 text-xl" />
                <h3 className="text-lg font-semibold">{emergency.reason}</h3>
              </div>
              <p className="text-gray-600 mt-2">
                <strong>Student Name:</strong> {emergency.name}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Scan Time:</strong>{" "}
                {emergency.timestamp
                  ? new Date(emergency.timestamp.toDate()).toLocaleString()
                  : "No timestamp"}
              </p>

              {selectingEmergency && (
                <input
                  readOnly
                  checked={selectedEmergencies[emergency.id]}
                  className="peer absolute right-[10px] bottom-[10px] appearance-none w-4 h-4 border-2 border-cyan-500 rounded-full checked:bg-cyan-500 transition-colors
                    before:content-['✓'] before:text-white before:text-[10px] before:font-bold before:flex before:items-center before:justify-center
                    before:w-full before:h-full before:opacity-0 checked:before:opacity-100"
                  type="checkbox"
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No emergency notifications available.</p>
        )}
      </div>

      {/* Scanned Entries */}
      <h3 className="text-2xl font-bold text-gray-700 mt-8 mb-4">
        Scanned Entries
      </h3>

      <div className="flex justify-between mb-2 gap-2 flex-wrap">
        {selectingScan ? (
          <>
            <button
              className="px-3 bg-red-600 hover:bg-red-800 rounded-md text-white"
              onClick={() => {
                setSelectingScan(false);
                onSelectAllScans(false);
              }}
            >
              Cancel
            </button>
            <div className="flex gap-2 flex-wrap">
              <button
                className="px-3 bg-cyan-600 hover:bg-cyan-800 rounded-md text-white"
                onClick={() => onSelectAllScans(!selectedAllScans)}
              >
                {selectedAllScans ? "Uns" : "S"}elect All
              </button>
              <button
                className="px-3 bg-teal-600 hover:bg-teal-800 rounded-md text-white"
                onClick={() => onConfirmScans(true)}
              >
                Accept
              </button>
              <button
                className="px-3 bg-red-600 hover:bg-red-800 rounded-md text-white"
                onClick={() => onConfirmScans(false)}
              >
                Decline
              </button>
            </div>
          </>
        ) : (
          <button
            className="px-3 bg-cyan-600 hover:bg-cyan-800 rounded-md text-white"
            onClick={() => setSelectingScan(true)}
          >
            Select
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scannedEntries.length > 0 ? (
          scannedEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white shadow-lg rounded-lg p-5 transition transform hover:scale-105 cursor-pointer border-l-4 border-blue-500 hover:border-blue-700"
              onClick={() => handleOpenScannedModal(entry)}
            >
              <div className="flex items-center gap-3">
                <FaIdCard className="text-blue-500 text-xl" />
                <h3 className="text-lg font-semibold">Scanned Entry</h3>
              </div>
              <p className="text-gray-600">
                <strong>Student Name:</strong> {entry.studentUsername}
              </p>
              <p className="text-gray-600 mt-2">
                <strong>ID Number:</strong> {entry.idNumber}
              </p>
              <p className="text-gray-600">
                <strong>Course:</strong> {entry.studentCourse}
              </p>
              <p className="text-gray-600">
                <strong>Year Level:</strong> {entry.studentYearLevel}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Scan Time:</strong>{" "}
                {entry.timestamp
                  ? new Date(entry.timestamp).toLocaleString()
                  : "No timestamp"}
              </p>

              {selectingScan && (
                <input
                  readOnly
                  checked={selectedScans[entry.id]}
                  className="peer absolute right-[10px] bottom-[10px] appearance-none w-4 h-4 border-2 border-cyan-500 rounded-full checked:bg-cyan-500 transition-colors
                    before:content-['✓'] before:text-white before:text-[10px] before:font-bold before:flex before:items-center before:justify-center
                    before:w-full before:h-full before:opacity-0 checked:before:opacity-100"
                  type="checkbox"
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No scanned entries available.</p>
        )}
      </div>

      {/* Modal for viewing emergency details */}
      {isModalOpen && selectedEmergency && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              🆘 Emergency Request Details
            </h3>
            <p className="text-gray-700">
              <strong>Reason:</strong> {selectedEmergency.reason}
            </p>
            <p className="text-gray-700">
              <strong>Requested By:</strong> {selectedEmergency.name}
            </p>
            <p className="text-gray-600 text-sm">
              <strong>Scan Time:</strong>{" "}
              {selectedEmergency.timestamp
                ? new Date(
                    selectedEmergency.timestamp.toDate()
                  ).toLocaleString()
                : "No timestamp"}
            </p>

            <div className="flex justify-center mt-6">
              <button
                className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white font-medium rounded-lg shadow-md transition"
                onClick={handleCloseModal}
              >
                🔙 Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for scanned entry details */}
      {isModalOpen && selectedScannedEntry && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              🆔 Scanned Entry Details
            </h3>
            <p className="text-gray-700">
              <strong>Student Name:</strong>{" "}
              {selectedScannedEntry.studentUsername}
            </p>
            <p className="text-gray-700">
              <strong>ID Number:</strong> {selectedScannedEntry.idNumber}
            </p>
            <p className="text-gray-700">
              <strong>Course:</strong> {selectedScannedEntry.studentCourse}
            </p>
            <p className="text-gray-700">
              <strong>Year Level:</strong>{" "}
              {selectedScannedEntry.studentYearLevel}
            </p>
            <p className="text-sm text-gray-500">
              <strong>Scan Time:</strong>{" "}
              {selectedScannedEntry.timestamp
                ? new Date(selectedScannedEntry.timestamp).toLocaleString()
                : "No timestamp"}
            </p>

            <div className="flex justify-center mt-6">
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-md transition"
                onClick={handleCloseModal}
              >
                🔙 Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
