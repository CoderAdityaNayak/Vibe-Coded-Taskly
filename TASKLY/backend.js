// backend.js

// This file is a template for your Firebase backend.
// Replace the placeholder values in the firebaseConfig object with your actual keys.
// This is not safe for a public repository unless you have a .gitignore file.

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Optional (only if you plan to use analytics)
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// Your Firebase configuration - replace these placeholder values with your own.
// You can find these values in your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;

// Use onAuthStateChanged to ensure we have a user before doing anything.
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    console.log("User signed in with ID:", userId);
  } else {
    userId = null;
    console.log("User signed out.");
  }
});

// A boilerplate sign-in function to handle authentication.
// This is essential for Firestore security rules.
async function authenticateUser() {
  try {
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
    } else {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.error("Authentication failed:", error);
  }
}

// Call the authentication function on load to ensure the user is signed in.
authenticateUser();

// ---- Firestore Logic ---- //

/**
 * Save an appointment to Firestore
 * @param {string} dateKey - The key for the date
 * @param {object} formState - The data to save
 */
export async function saveToFirestore(dateKey, formState) {
  // We check if userId is available before making a Firestore call.
  if (!userId) {
    console.error("❌ Cannot save to Firestore: User not authenticated.");
    return;
  }

  const ref = doc(db, "appointments", `${userId}_${dateKey}`);
  try {
    await setDoc(ref, {
      ...formState,
      userId, // Ensure the document includes the user's ID
      dateKey,
      timestamp: new Date().toISOString()
    });
    console.log("✅ Appointment synced to Firestore");
  } catch (err) {
    console.error("❌ Firestore sync error:", err);
  }
}

/**
 * Load a single appointment from Firestore
 * @param {string} dateKey - The key for the date
 * @returns {Promise<object|null>}
 */
export async function loadFromFirestore(dateKey) {
  // We check if userId is available before making a Firestore call.
  if (!userId) {
    console.error("❌ Cannot load from Firestore: User not authenticated.");
    return null;
  }

  const ref = doc(db, "appointments", `${userId}_${dateKey}`);
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("❌ Firestore read error:", err);
    return null;
  }
}
