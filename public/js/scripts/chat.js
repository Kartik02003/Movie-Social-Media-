// 🔹 Firebase Authentication & Firestore Import
import { fetchMovieDetails, fetchSeriesDetails } from "../API.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check if user is already logged in when page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, update UI
    console.log("✅ User already logged in:", user);
    profilePic.src =
      user?.photoURL?.replace("s96-c", "s400-c") ||
      "img/images/pfpPlaceholder.jpg";
    userProfile.style.display = "flex";
  } else {
    // No user is signed in, redirect to login page
    window.location.href = "signup.html"; // Redirect to login page
  }
});

// 🔹 Extract Movie/Series ID from URL
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const mediaType = urlParams.get("type");

if (!id) {
  alert("❌ Movie ID not found!");
  window.location.href = "index.html"; // Redirect if no movie ID
} else {
  document.getElementById("preloader").style.display = "block";
  const movieDetailsArea = document.getElementById("media-bg");
  const title = document.getElementById("media-title");
  const titleSub = document.getElementById("media-title-sub");
  console.log("Media ID:", id);
  console.log("Media Type:", mediaType);
  if (movieDetailsArea) {
    // Fetch movie details and update the background
    let mediaDetails = null;
    if (mediaType === "movie") {
      mediaDetails = await fetchMovieDetails(id);
    } else {
      mediaDetails = await fetchSeriesDetails(id);
    }
    console.log("Media Details:", mediaDetails);
    title.innerText = mediaDetails.title || mediaDetails.name;
    titleSub.innerText = mediaDetails.title || mediaDetails.name;

    const backdropUrl = mediaDetails.backdrop_path
      ? `https://image.tmdb.org/t/p/original${mediaDetails.backdrop_path}`
      : "img/default_backdrop.jpg";

    movieDetailsArea.setAttribute("data-background", backdropUrl);
    movieDetailsArea.style.backgroundImage = `url(${backdropUrl})`;
    // movieDetailsArea.style.backgroundSize = "cover";
    // movieDetailsArea.style.backgroundPosition = "center";
    document.getElementById("preloader").style.display = "none";
  } else {
    console.error("❌ movie-details-area element NOT found in the DOM!");
  }
  document.getElementById("preloader").style.display = "none";
  let currentUserId = null;
  let currentUsername = "User";
  let profilePic = "img/images/pfpPlaceholder.jpg"; // Default profile picture

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      currentUsername = user.displayName || "User";
      profilePic = user.photoURL
        ? user.photoURL.replace("s96-c", "s400-c")
        : "img/images/pfpPlaceholder.jpg";

      console.log("✅ User logged in:", currentUsername);

      // Start listening to chat messages after authentication
      listenForChatUpdates();
    } else {
      window.location.href = "signup.html"; // Redirect to login page
    }
  });

  // 🔹 Selectors (Avoiding Name Conflicts)
  const chatContainer = document.getElementById("chatMessages");
  const chatInputField = document.getElementById("messageInput");
  const chatSendButton = document.querySelector(".chat-input button");

  // 🔹 Get Current Timestamp
  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 🔹 Create Chat Message Element
  function createMessageElement(
    message,
    sender,
    senderProfilePic,
    isCurrentUser
  ) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add(
      "message-container",
      isCurrentUser ? "user-message-container" : "other-message-container"
    );

    const profileImage = document.createElement("img");
    profileImage.src = senderProfilePic || "img/images/pfpPlaceholder.jpg"; // Default if missing
    profileImage.alt = sender;
    profileImage.classList.add("profile-icon");

    const messageContent = document.createElement("div");
    messageContent.classList.add(
      "message",
      isCurrentUser ? "user-message" : "other-message"
    );
    messageContent.innerHTML = `<p>${message}</p>`;

    const timestamp = document.createElement("div");
    timestamp.classList.add("timestamp");
    timestamp.textContent = getCurrentTime();

    const messageBox = document.createElement("div");
    messageBox.classList.add(
      isCurrentUser ? "my-message-content" : "other-message-content"
    );

    if (isCurrentUser) {
      messageBox.appendChild(timestamp);
      messageBox.appendChild(messageContent);
      messageWrapper.appendChild(messageBox);
      messageWrapper.appendChild(profileImage); // User's profile on the right
    } else {
      messageWrapper.appendChild(profileImage);
      messageBox.appendChild(messageContent);
      messageBox.appendChild(timestamp);
      messageWrapper.appendChild(messageBox);
    }

    return messageWrapper;
  }

  // 🔹 Send Chat Message
  async function sendChatMessage() {
    if (!currentUserId) {
      alert("❌ You must be logged in to send messages!");
      return;
    }

    const messageText = chatInputField.value.trim();
    if (!messageText) return;

    const chatDocRef = doc(db, "chats", id);

    try {
      // Ensure the chat document exists
      const chatDoc = await getDoc(chatDocRef);
      if (!chatDoc.exists()) {
        await setDoc(chatDocRef, { messages: [] }, { merge: true });
      }

      await updateDoc(chatDocRef, {
        messages: arrayUnion({
          userId: currentUserId,
          username: currentUsername,
          profilePic: profilePic, // 🔹 Store profile picture URL
          message: messageText,
          timestamp: new Date(),
        }),
      });

      chatInputField.value = "";
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  }

  // 🔹 Listen for Real-Time Messages
  function listenForChatUpdates() {
    if (!currentUserId) return; // Ensure user is authenticated

    const chatDocRef = doc(db, "chats", id);

    onSnapshot(chatDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const chatMessages = docSnapshot.data().messages || [];
        displayChatMessages(chatMessages);
      }
    });
  }

  // 🔹 Display Chat Messages
  function displayChatMessages(messages) {
    chatContainer.innerHTML = "";

    // Ensure messages are sorted by timestamp
    messages.sort(
      (a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
    );

    messages.forEach((msg) => {
      const isCurrentUser = msg.userId === currentUserId;
      const messageElement = createMessageElement(
        msg.message,
        msg.username,
        msg.profilePic, // 🔹 Pass the sender's profile picture
        isCurrentUser
      );
      chatContainer.appendChild(messageElement);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to latest message
  }

  // 🔹 Event Listeners
  chatSendButton.addEventListener("click", sendChatMessage);
  chatInputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });
}
