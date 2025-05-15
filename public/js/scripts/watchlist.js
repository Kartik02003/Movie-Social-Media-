import { fetchSeriesDetails, fetchMovieDetails } from "../API.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get DOM elements
const userProfile = document.getElementById("userProfile");
const profilePic = document.getElementById("profilePic");
const logoutBtn = document.getElementById("logoutBtn");
const watchlistContainer = document.getElementById("watchlistContainer");
const paginationContainer = document.querySelector(".pagination-wrap nav ul"); // Pagination container

// Pagination variables
const itemsPerPage = 6;
let currentPage = 1;
let watchlistData = [];

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ User logged in:", user);
    profilePic.src =
      user?.photoURL?.replace("s96-c", "s400-c") ||
      "img/images/pfpPlaceholder.jpg";
    userProfile.style.display = "flex";

    // Load Watchlist Items
    const urlParams = new URLSearchParams(window.location.search);
    const watchlistName = urlParams.get("name");
    if (watchlistName) {
      loadWatchlistItems(user.uid, watchlistName);
    }
  } else {
    window.location.href = "signup.html"; // Redirect if not logged in
  }
});

async function updateBreadcrumb() {
  const breadcrumbTitle = document.querySelector(".breadcrumb-content .title");
  const breadcrumbItem = document.querySelector(
    ".breadcrumb .breadcrumb-item.active"
  );
  const breadcrumbSection = document.querySelector(".breadcrumb-area");

  // Get watchlist name from URL
  const urlParams = new URLSearchParams(window.location.search);
  const watchlistName = urlParams.get("name");

  if (watchlistName) {
    breadcrumbTitle.textContent = watchlistName; // Set watchlist name as title
  }

  if (watchlistData.length > 0) {
    breadcrumbItem.textContent = `${watchlistData.length} Items`; // Set number of items

    // Select a random movie/series for backdrop
    const randomItem =
      watchlistData[Math.floor(Math.random() * watchlistData.length)];
    let details;

    if (randomItem.type === "m") {
      details = await fetchMovieDetails(randomItem.id);
    } else if (randomItem.type === "s") {
      details = await fetchSeriesDetails(randomItem.id);
    }

    if (details && details.backdrop_path) {
      breadcrumbSection.setAttribute(
        "data-background",
        `https://image.tmdb.org/t/p/original${details.backdrop_path}`
      );
      breadcrumbSection.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${details.backdrop_path})`;
    }
  }
}

async function updateCategories() {
  const genreCounts = {}; // Object to store genre counts

  for (const item of watchlistData) {
    let details;
    if (item.type === "m") {
      details = await fetchMovieDetails(item.id);
    } else if (item.type === "s") {
      details = await fetchSeriesDetails(item.id);
    }

    if (!details || !details.genres) continue;

    details.genres.forEach((genre) => {
      genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
    });
  }

  // Get the category container
  const categoryContainer = document.querySelector(".sidebar-cat ul");
  categoryContainer.innerHTML = ""; // Clear previous categories

  // Render genres dynamically
  for (const [genre, count] of Object.entries(genreCounts)) {
    categoryContainer.innerHTML += `
      <li><a href="#">${genre}</a> <span>${count}</span></li>
    `;
  }
}

function renderRecentWatchlist() {
  const recentWatchlistContainer = document.querySelector(".rc-post ul");
  recentWatchlistContainer.innerHTML = ""; // Clear previous content

  // Get the latest two items (assuming they are stored in reverse order)
  const recentItems = watchlistData.slice(-2).reverse();

  for (const item of recentItems) {
    let details;
    if (item.type === "m") {
      details = fetchMovieDetails(item.id);
    } else if (item.type === "s") {
      details = fetchSeriesDetails(item.id);
    }

    details.then((data) => {
      if (!data) return;

      const backdropURL = data.backdrop_path
        ? `https://image.tmdb.org/t/p/w500${data.backdrop_path}`
        : "img/default-backdrop.jpg"; // Fallback image

      const recentHTML = `
        <li class="rc-post-item" style="background: url('${backdropURL}') center/cover no-repeat; padding: 20px; border-radius: 8px; position: relative; color: white;">
          <div class="content" style="position: relative; z-index: 2;">
            <h5 class="title">
              <a href="watch-details.html?id=${item.id}&type=${
        item.type
      }" style="color: white; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);">
                ${data.title || data.name}
              </a>
            </h5>
            <span class="date">
              <i class="far fa-calendar-alt"></i> ${
                data.release_date || data.first_air_date
              }
            </span>
          </div>
          <div class="overlay" style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); border-radius: 8px;"></div>
        </li>`;

      recentWatchlistContainer.innerHTML += recentHTML;
    });
  }
}
// Fetch and Display Watchlist
async function loadWatchlistItems(userUID, watchlistName) {
  const userRef = doc(db, "users", userUID);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log("User not found!");
    return;
  }

  const watchlists = userSnap.data().watchlist || [];
  const selectedWatchlist = watchlists.find((w) => w.name === watchlistName);

  if (!selectedWatchlist || !selectedWatchlist.media.length) {
    document.getElementById("preloader").style.display = "none";
    watchlistContainer.innerHTML = `<p>No items in this watchlist.</p>`;
    paginationContainer.innerHTML = ""; // Clear pagination if empty
    return;
  }

  watchlistData = selectedWatchlist.media; // Store fetched data globally
  currentPage = 1; // Reset to first page
  renderWatchlist(currentPage); // Render first page
  renderPagination();
  renderRecentWatchlist(); // Show pagination
  updateCategories();
  updateBreadcrumb();
}

async function removeFromWatchlist(userUID, watchlistName, movieID, mediaType) {
  const userRef = doc(db, "users", userUID);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const watchlists = userSnap.data().watchlist || [];
  let updatedWatchlists = watchlists.map((w) => {
    if (w.name === watchlistName) {
      return {
        ...w,
        media: w.media.filter(
          (m) => !(m.id === movieID && m.type === mediaType)
        ),
      };
    }
    return w;
  });

  // ✅ Remove empty watchlists
  updatedWatchlists = updatedWatchlists.filter((w) => w.media.length > 0);

  await updateDoc(userRef, { watchlist: updatedWatchlists });

  alert("Removed from watchlist!");

  // ✅ Check if the watchlist is empty after deletion
  if (updatedWatchlists.length === 0) {
    watchlistContainer.innerHTML = `
      <div class="empty-watchlist">
        <p>Your watchlist is empty. Add some movies or shows!</p>
      </div>`;
    paginationContainer.innerHTML = ""; // ✅ Clear pagination
    document.getElementById("preloader").style.display = "none"; // ✅ Stop preloader
    return;
  }

  loadWatchlistItems(userUID, watchlistName); // ✅ Refresh watchlist
  updateBreadcrumb(); // ✅ Update breadcrumb
  updateCategories(); // ✅ Update categories
}

window.removeFromWatchlist = removeFromWatchlist;

// Function to Render Watchlist Items for a Given Page
async function renderWatchlist(page) {
  document.getElementById("preloader").style.display = "block";
  watchlistContainer.innerHTML = ""; // ✅ Clear previous content

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = watchlistData.slice(start, end);

  // ✅ Stop preloader if watchlist is empty
  if (watchlistData.length === 0) {
    document.getElementById("preloader").style.display = "none";
    watchlistContainer.innerHTML = `
      <div class="empty-watchlist">
        <p>Your watchlist is empty. Add some movies or shows!</p>
      </div>`;
    paginationContainer.innerHTML = ""; // ✅ Clear pagination
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const watchlistName = urlParams.get("name");

  for (const item of paginatedItems) {
    let details;
    let redirect;
    if (item.type === "m") {
      details = await fetchMovieDetails(item.id);
      redirect = `movie-details.html?id=${item.id}`;
    } else if (item.type === "s") {
      details = await fetchSeriesDetails(item.id);
      redirect = `series_details.html?id=${item.id}`;
    }

    if (!details) continue;

    const cardHTML = `
        <div class="col-lg-4 col-md-6" style="margin-bottom: 20px;">
            <div class="blog-post-item" style="position: relative;">
                <div class="blog-post-thumb">
                    <a href="${redirect}">
                        <img src="https://image.tmdb.org/t/p/w500${
                          details.poster_path
                        }" alt="${details.title || details.name}">
                    </a>
                </div>
                <div class="blog-post-content">                 
                    <h4 class="title">
                        <a href="watch-details.html?id=${item.id}&type=${
      item.type
    }">
                            ${details.title || details.name}
                        </a>
                    </h4>
                    <span class="date"><i class="far fa-calendar-alt"></i> ${
                      details.release_date || details.first_air_date
                    }</span>
                    <p>Genre: ${
                      details.genres
                        ? details.genres.map((g) => g.name).join(", ")
                        : "N/A"
                    }</p>
                    <p><i class="far fa-star"></i> ${
                      details.vote_average
                    }/10</p>
                </div>
                <img src="img/images/delete.png" 
                        alt="Delete" 
                        class="delete-icon" 
                        onclick="removeFromWatchlist('${
                          auth.currentUser.uid
                        }', '${watchlistName}', '${item.id}', '${item.type}')">
            </div>
        </div>`;

    watchlistContainer.innerHTML += cardHTML;
  }
  document.getElementById("preloader").style.display = "none"; // ✅ Stop preloader
}

// Function to Render Pagination Buttons
function renderPagination() {
  const totalPages = Math.ceil(watchlistData.length / itemsPerPage);
  paginationContainer.innerHTML = ""; // ✅ Clear existing pagination

  if (totalPages <= 1) return; // ✅ Hide pagination if only 1 page exists

  // Previous Button
  paginationContainer.innerHTML += `<li class="${
    currentPage === 1 ? "disabled" : ""
  }">
        <a href="javascript:void(0)" onclick="changePage(${
          currentPage - 1
        })">Previous</a>
    </li>`;

  // Numbered Pages
  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.innerHTML += `<li class="${
      currentPage === i ? "active" : ""
    }">
            <a href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
        </li>`;
  }

  // Next Button
  paginationContainer.innerHTML += `<li class="${
    currentPage === totalPages ? "disabled" : ""
  }">
        <a href="javascript:void(0)" onclick="changePage(${
          currentPage + 1
        })">Next</a>
    </li>`;
}

// Function to Change Page
// Function to Change Page
function changePage(page) {
  const totalPages = Math.ceil(watchlistData.length / itemsPerPage);
  if (page < 1 || page > totalPages) return; // Prevent out-of-range pages

  currentPage = page;
  renderWatchlist(currentPage);
  renderPagination(); // ✅ Update pagination UI dynamically
}

// ✅ Make changePage globally accessible
window.changePage = changePage;

// Remove Movie/Series from Watchlist

// Log Out
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "signup.html";
  } catch (error) {
    console.error("Logout Error:", error);
  }
});
