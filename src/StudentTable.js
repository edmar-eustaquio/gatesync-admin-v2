import React, { useState, useEffect } from "react";
import { collection, deleteDoc, doc, updateDoc, onSnapshot, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { AiOutlineEdit, AiOutlineDelete, AiOutlineEye } from "react-icons/ai";

const StudentTable = () => {
  const [students, setStudents] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [updatedData, setUpdatedData] = useState({ name: "", idNumber: "", course: "", yearLevel: "" });

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'Student'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudents(studentList);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (student) => {
    setEditingStudent(student);
    setUpdatedData({
      name: student.name || "",
      idNumber: student.idNumber || "",
      course: student.course || "",
      yearLevel: student.yearLevel || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingStudent) return;

    if (
      updatedData.name.trim() == '' ||
      updatedData.idNumber.trim() == '' ||
      updatedData.course.trim() == '' ||
      updatedData.yearLevel.trim() == ''
    ){
      alert("Please fill all the fields!!!")
      return
    }
    
    const q = await getDocs(query(collection(db, 'users'), where('idNumber', '==', updatedData.idNumber)))
    for (const dc of q.docs){
      if (dc.id != editingStudent.id){
        alert("ID Number already taken!!!")
        return
      }
    }

    await updateDoc(doc(db, "users", editingStudent.id), updatedData);
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = (student) => {
    setDeletingStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
  
    try {
      const studentRef = doc(db, "students", deletingStudent.id);
      const linkedParentRef = collection(studentRef, "LinkedParent");
  
      // Step 1: Delete all LinkedParent documents
      const linkedParentSnapshot = await getDocs(linkedParentRef);
      if (!linkedParentSnapshot.empty) {
        const deleteLinkedParentPromises = linkedParentSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deleteLinkedParentPromises);
      }
  
      // Step 2: Delete related Emergency documents
      const emergencyQuery = query(collection(db, "Emergency"), where("uid", "==", deletingStudent.uid));
      const emergencySnapshot = await getDocs(emergencyQuery);
  
      if (!emergencySnapshot.empty) {
        const deleteEmergencyPromises = emergencySnapshot.docs.map((emergencyDoc) =>
          deleteDoc(doc(db, "Emergency", emergencyDoc.id))
        );
        await Promise.all(deleteEmergencyPromises);
      }
  
      // Step 3: Find and delete matching LinkedStudent documents inside parents
      const parentsQuery = collection(db, "parent");
      const parentsSnapshot = await getDocs(parentsQuery);
  
      if (!parentsSnapshot.empty) {
        const deleteLinkedStudentPromises = [];
  
        for (const parentDoc of parentsSnapshot.docs) {
          const linkedStudentRef = collection(parentDoc.ref, "LinkedStudent");
          const linkedStudentQuery = query(linkedStudentRef, where("uid", "==", deletingStudent.uid));
          const linkedStudentSnapshot = await getDocs(linkedStudentQuery);
  
          if (!linkedStudentSnapshot.empty) {
            linkedStudentSnapshot.docs.forEach((linkedStudentDoc) => {
              deleteLinkedStudentPromises.push(deleteDoc(linkedStudentDoc.ref));
            });
          }
        }
  
        await Promise.all(deleteLinkedStudentPromises);
      }
  
      // Step 4: Delete the Student document
      await deleteDoc(studentRef);
  
      // Close modal after deletion
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting student, emergency records, LinkedParent, or LinkedStudent:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard - Student Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-md rounded-lg">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-4 px-6 text-center">UID</th>
              <th className="py-4 px-6 text-center">Student Name</th>
              <th className="py-4 px-6 text-center">Course</th>
              <th className="py-4 px-6 text-center">Year Level</th>
              <th className="py-4 px-6 text-center">ID Number</th>
              <th className="py-4 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} border-b border-gray-300`}>
                <td className="py-4 px-6 text-center">{student.id || "N/A"}</td>
                <td className="py-4 px-6 text-center">{student.name || "N/A"}</td>
                <td className="py-4 px-6 text-center">{student.course || "N/A"}</td>
                <td className="py-4 px-6 text-center">{student.yearLevel || "N/A"}</td>
                <td className="py-4 px-6 text-center">{student.idNumber || "N/A"}</td>
                <td className="py-4 px-6 flex justify-center space-x-4">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      setViewingStudent(student);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <AiOutlineEye size={22} />
                  </button>
                  <button className="text-yellow-500 hover:text-yellow-700" onClick={() => handleEdit(student)}>
                    <AiOutlineEdit size={22} />
                  </button>
                  <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteClick(student)}>
                    <AiOutlineDelete size={22} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Edit Student</h2>
            <input type="text" className="w-full p-2 border rounded mb-4" value={updatedData.name} onChange={(e) => setUpdatedData({ ...updatedData, name: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded mb-4" value={updatedData.course} onChange={(e) => setUpdatedData({ ...updatedData, course: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded mb-4" value={updatedData.yearLevel} onChange={(e) => setUpdatedData({ ...updatedData, yearLevel: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded mb-4" value={updatedData.idNumber} onChange={(e) => setUpdatedData({ ...updatedData, idNumber: e.target.value })} />

            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>Save</button>
            <button className="bg-gray-400 text-white px-4 py-2 rounded ml-2" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-xl font-semibold mb-4 text-center text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{deletingStudent?.name}</strong>?
            </p>
            <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded ml-2" onClick={handleDeleteConfirm}>Delete</button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Student Details</h2>
            <p className="mb-2"><strong>Name:</strong> {viewingStudent.name}</p>
            <p className="mb-2"><strong>ID Number:</strong> {viewingStudent.idNumber}</p>
            <p className="mb-2"><strong>Course:</strong> {viewingStudent.course}</p>
            <p className="mb-2"><strong>Year Level:</strong> {viewingStudent.yearLevel}</p>
            <button className="bg-gray-500 text-white px-4 py-2 rounded mt-4" onClick={() => setIsViewModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
