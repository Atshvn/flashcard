import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update profile with display name
  await updateProfile(userCredential.user, { displayName });

  // Create user profile in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    uid: userCredential.user.uid,
    email,
    displayName,
    createdAt: Timestamp.now(),
  });

  return userCredential.user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
