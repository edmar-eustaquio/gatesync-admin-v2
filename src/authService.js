import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Register Admin User
export const registerUser = async (email, password, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user details in Firestore under the "admin" collection
    await setDoc(doc(db, "admin", user.uid), {
      uid: user.uid,
      email,
      fullName,
      role: "admin", // Optional: Assign a role field for better access control
      createdAt: new Date(), // Timestamp to track when the admin was created
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login Admin User
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout User
export const logoutUser = async () => {
  await signOut(auth);
};
