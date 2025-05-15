const express = require("express");
const path = require("path");
const admin = require("firebase-admin");
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ------------------------
// 🔹 Initialize Firebase Admin (Backend)
// ------------------------
const serviceAccount = require("./firebase-service-account.json"); // Ensure this file is added

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://website-2588a.firebaseio.com",
  });
  console.log("✅ Firebase Admin Initialized");
} catch (error) {
  console.error("❌ Error initializing Firebase Admin:", error);
}

// Firestore Reference
const db = admin.firestore();

// ------------------------
// 🔹 Initialize Firebase (Frontend)
// ------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBikmm0HstpLVaHaDpaT-0ZD1P5OEOHlVA",
  authDomain: "website-2588a.firebaseapp.com",
  projectId: "website-2588a",
  storageBucket: "website-2588a.appspot.com",
  messagingSenderId: "1028540900971",
  appId: "1:1028540900971:web:a11366de4313da8c28b32e",
  measurementId: "G-54S89LJL4F",
};

firebase.initializeApp(firebaseConfig);
console.log("✅ Firebase Frontend Initialized");

// ------------------------
// 🔹 User Authentication Routes
// ------------------------

// Register User
app.post("/register", async (req, res) => {
  const { email, username, uid } = req.body; // Accept UID from frontend

  if (!email || !username || !uid) {
    return res.status(400).json({ error: "All fields are required" });
  }

  console.log("📩 Register Request:", email, username, "UID:", uid);

  try {
    // Store user data in Firestore (NO need to create user in Auth again)
    await db.collection("users").doc(uid).set({
      username,
      email,
      watchlist: [],
      ratedMovies: {},
    });

    console.log("✅ User Data Stored in Firestore:", uid);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Firestore Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login User (Verify Firebase Token)
app.post("/login", async (req, res) => {
  const { idToken } = req.body; // Expecting Firebase ID Token from frontend

  if (!idToken) {
    return res.status(400).json({ error: "ID Token is required" });
  }

  console.log("🔑 Verifying Login Token...");

  try {
    // Verify the Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    console.log("✅ Token Verified for UID:", uid);

    // Fetch user details from Firestore
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found in Firestore" });
    }

    res.status(200).json({
      message: "Login successful",
      uid,
      user: userDoc.data(),
    });
  } catch (error) {
    console.error("❌ Token Verification Failed:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ------------------------
// 🔹 Watchlist Routes
// ------------------------

// 1️⃣ Create a Watchlist (Stored in User's Watchlists Array)
app.post("/api/watchlist", async (req, res) => {
  const { uid, name, poster } = req.body;

  if (!uid || !name) {
    return res.status(400).json({ error: "User ID and name are required" });
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    let userData = userSnap.exists ? userSnap.data() : { watchlist: [] };

    // Check if watchlist with the same name already exists
    if (userData.watchlist.some((w) => w.name === name)) {
      return res.status(400).json({ error: "Watchlist name already exists!" });
    }

    const newWatchlist = {
      name,
      poster: poster || "", // Optional poster URL
      items: [], // Empty list of movies/series
    };

    // First, add the watchlist array
    await userRef.update({
      watchlist: admin.firestore.FieldValue.arrayUnion(newWatchlist),
    });

    // Then, update `createdAt` separately at the document level
    await userRef.update({
      [`watchlistTimestamps.${name}`]:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "Watchlist created successfully!" });
  } catch (error) {
    console.error("❌ Error creating watchlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2️⃣ Get All Watchlists for a User
app.get("/api/watchlists/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const { watchlist = [] } = userSnap.data();
    console.log("📋 Watchlists:", watchlist);
    res.status(200).json(watchlist);
  } catch (error) {
    console.error("❌ Error fetching watchlists:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3️⃣ Get a Specific Watchlist by Name
app.get("/api/watchlist/:uid/:watchlistName", async (req, res) => {
  const { uid, watchlistName } = req.params;

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    console.log("🔍 Fetching watchlists for UID:", uid);
    console.log("User Data:", userSnap.data());

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const watchlist = userSnap
      .data()
      .watchlist.find((w) => w.name === watchlistName);

    if (!watchlist) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    res.status(200).json(watchlist);
  } catch (error) {
    console.error("❌ Error fetching watchlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4️⃣ Rename a Watchlist
app.put("/api/watchlist/:uid/:watchlistName", async (req, res) => {
  const { uid, watchlistName } = req.params;
  const { newName, poster } = req.body;

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    let watchlists = userSnap.data().watchlist || [];

    const watchlistIndex = watchlists.findIndex(
      (w) => w.name === watchlistName
    );

    if (watchlistIndex === -1) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    watchlists[watchlistIndex].name =
      newName || watchlists[watchlistIndex].name;
    watchlists[watchlistIndex].poster =
      poster || watchlists[watchlistIndex].poster;

    await userRef.update({ watchlist: watchlists });

    res.status(200).json({ message: "Watchlist updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating watchlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5️⃣ Delete a Watchlist
app.delete("/api/watchlist/:uid/:watchlistName", async (req, res) => {
  const { uid, watchlistName } = req.params;
  // Log the UID and watchlist name for debugging

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    console.log("🔍 Deleting watchlists for UID:", uid);
    console.log("User Data:", userSnap.data());

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    let watchlists = userSnap.data().watchlist || [];

    watchlists = watchlists.filter((w) => w.name !== watchlistName);

    await userRef.update({ watchlist: watchlists });

    res.status(200).json({ message: "Watchlist deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting watchlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6️⃣ Add a Movie/Series to a Watchlist
app.post("/api/watchlist/:uid/:watchlistName/add", async (req, res) => {
  const { uid, watchlistName } = req.params;
  const { ID, mediaType } = req.body;

  if (!ID || !mediaType) {
    return res
      .status(400)
      .json({ error: "Both ID and mediaType are required" });
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    let watchlists = userSnap.data().watchlist || [];

    const watchlistIndex = watchlists.findIndex(
      (w) => w.name === watchlistName
    );
    if (watchlistIndex === -1) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    const watchlist = watchlists[watchlistIndex];

    // Prevent duplicate entries
    if (watchlist.media.some((m) => m.ID === ID && m.mediaType === mediaType)) {
      return res.status(400).json({ error: "Already in watchlist" });
    }

    watchlist.media.push({ ID, mediaType });

    await userRef.update({ watchlist: watchlists });

    res.status(200).json({ message: "Movie/Series added to watchlist!" });
  } catch (error) {
    console.error("❌ Error adding to watchlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7️⃣ Remove a Movie/Series from a Watchlist
app.delete("/api/watchlist/:uid/:watchlistName/remove", async (req, res) => {
  const { uid, watchlistName } = req.params;
  const { ID, mediaType } = req.body;

  if (!ID || !mediaType) {
    return res
      .status(400)
      .json({ error: "Both ID and mediaType are required" });
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    let watchlists = userSnap.data().watchlist || [];

    const watchlistIndex = watchlists.findIndex(
      (w) => w.name === watchlistName
    );
    if (watchlistIndex === -1) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    let watchlist = watchlists[watchlistIndex];

    // Remove movie/series by ID and mediaType
    watchlist.movies = watchlist.movies.filter(
      (m) => m.ID !== ID || m.mediaType !== mediaType
    );

    watchlists[watchlistIndex] = watchlist;
    await userRef.update({ watchlist: watchlists });

    res.status(200).json({ message: "Movie/Series removed from watchlist!" });
  } catch (error) {
    console.error("❌ Error removing movie/series:", error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------
// 🔹 Chat Routes
// ------------------------

// 1️⃣ Create/Get a Chat Room
app.post("/api/chat/create", async (req, res) => {
  console.log(req.body); // Log the request body for debugging
  const { Id } = req.body;

  if (!Id) {
    return res.status(400).json({ error: "Movie ID required" });
  }

  try {
    const chatRef = db.collection("chats").doc(Id);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      await chatRef.set({ messages: [] });
      console.log(`✅ Chat room created for: ${Id}`);
    }

    res.status(200).json({ message: "Chat room ready", Id });
  } catch (error) {
    console.error("❌ Error creating chat room:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2️⃣ Send a message
app.post("/api/chat/:movieId/send", async (req, res) => {
  const { movieId } = req.params;
  const { userId, username, message, profilePic } = req.body; // 🔹 Include profilePic

  if (!userId || !username || !message || !profilePic) {
    return res.status(400).json({
      error: "User ID, username, message, and profile picture are required",
    });
  }

  try {
    const chatRef = db.collection("chats").doc(movieId);

    await chatRef.update({
      messages: admin.firestore.FieldValue.arrayUnion({
        userId,
        username,
        profilePic, // 🔹 Save profile picture
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3️⃣ Get all messages for a Chat Room
app.get("/api/chat/:movieId/messages", async (req, res) => {
  const { movieId } = req.params;

  try {
    const chatRef = db.collection("chats").doc(movieId);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const { messages } = chatSnap.data();
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------
// 🔹 Serve Frontend
// ------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// ------------------------
// 🔹 Start Server
// ------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
