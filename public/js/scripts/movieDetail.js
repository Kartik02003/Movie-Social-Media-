import {
  fetchMovieDetails,
  fetchMovieCredits,
  fetchMovieImages,
  fetchSimilarMovies,
  fetchSeriesDetails,
} from "../API.js";

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
  setDoc,
  arrayUnion,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

// Your Firebase configuration

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get DOM elements
const userProfile = document.getElementById("userProfile");
const profilePic = document.getElementById("profilePic");
const logoutBtn = document.getElementById("logoutBtn");

// Check if user is already logged in when page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, update UI
    console.log("✅ User already logged in:", user);
    profilePic.src = user.photoURL || "img/images/pfpPlaceholder.jpg";
    userProfile.style.display = "flex";
  } else {
    // No user is signed in, redirect to login page
    window.location.href = "signup.html"; // Redirect to login page
  }
});

// Log Out Function
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "signup.html"; // Redirect to login page after logout
  } catch (error) {
    console.error("Logout Error:", error);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");

  console.log("Movie ID:", movieId);

  try {
    document.getElementById("preloader").style.display = "block";
    // Fetch movie details, credits, and images
    const movieDetails = await fetchMovieDetails(movieId);
    const movieCredits = await fetchMovieCredits(movieId);
    const movieImages = await fetchMovieImages(movieId);
    const similarMovies = await fetchSimilarMovies(movieId);

    // console.log("Movie Details:", movieDetails);
    // console.log("Movie Credits:", movieCredits);
    // console.log("Movie Images:", movieImages);

    const movieDetailsArea = document.querySelector(".movie-details-area");

    if (movieDetailsArea) {
      const backdropUrl = movieDetails.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
        : "img/default_backdrop.jpg";

      movieDetailsArea.setAttribute("data-background", backdropUrl);
      movieDetailsArea.style.backgroundImage = `url(${backdropUrl})`;
      movieDetailsArea.style.backgroundSize = "cover";
      movieDetailsArea.style.backgroundPosition = "center";
    } else {
      console.error("❌ movie-details-area element NOT found in the DOM!");
    }
    // Ensure elements exist before modifying them
    const movieTitleElement = document.getElementById("current-movie-title");
    const movieOverviewElement = document.getElementById(
      "current-movie-overview"
    );
    const moviePosterElement = document.getElementById("current-movie-poster");
    const movieTrailerElement = document.getElementById(
      "current-movie-trailer"
    );
    const movieDetailsElement = document.getElementById(
      "current-movie-details"
    );
    const movieImagesContainer = document.getElementById(
      "current-movie-images"
    );

    // Update movie title and release year
    if (movieTitleElement) {
      movieTitleElement.innerHTML = `${movieDetails.title} <span>(${
        movieDetails.release_date?.split("-")[0] || "N/A"
      })</span>`;
    }

    // Update movie overview
    if (movieOverviewElement) {
      movieOverviewElement.innerHTML = `<p>${
        movieDetails.overview || "No overview available."
      }</p>`;
    }

    // Update movie poster
    if (moviePosterElement) {
      moviePosterElement.src = movieDetails.poster_path
        ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
        : "img/default_poster.jpg"; // Fallback image
    }

    // Update movie trailer link
    if (movieTrailerElement && movieDetails.videos?.results.length > 0) {
      const trailerKey = movieDetails.videos.results[0].key;
      movieTrailerElement.href = `https://www.youtube.com/watch?v=${trailerKey}`;
    } else if (movieTrailerElement) {
      movieTrailerElement.style.display = "none"; // Hide if no trailer available
    }

    // Update movie details like rating, genre, and release year
    if (movieDetailsElement) {
      movieDetailsElement.innerHTML = `
          <ul>
            <li class="quality">
              <span>${movieDetails.adult ? "18+" : "PG"}</span>
              <span>HD</span>
            </li>
            <li class="category">
              ${
                movieDetails.genres
                  ?.map((genre) => `<a href="#">${genre.name}</a>`)
                  .join(", ") || "N/A"
              }
            </li>
            <li class="release-time">
              <span><i class="far fa-calendar-alt"></i> ${
                movieDetails.release_date?.split("-")[0] || "N/A"
              }</span>
              <span><i class="far fa-clock"></i> ${
                movieDetails.runtime || "N/A"
              } min</span>
            </li>
          </ul>
        `;
    }

    if (similarMovies.results.length > 0) {
      const seriesContainer = document.getElementById("series-list");
      seriesContainer.innerHTML = ""; // Clear existing content

      const seriesHTML = similarMovies.results
        .slice(0, 4) // Take only the first 4 results
        .map(
          (series) => `
              <div class="col-xl-3 col-lg-4 col-sm-6">
                  <div class="movie-item mb-50">
                      <div class="movie-poster">
                          <a href="series_details.html?id=${series.id}">
                              <img src="${
                                series.poster_path
                                  ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                                  : "img/default-poster.jpg"
                              }" 
                              alt="${series.title}">
                          </a>
                      </div>
                      <div class="movie-content">
                          <div class="top">
                              <h5 class="title">
                                  <a href="movie-details.html?id=${
                                    series.id
                                  }">${series.title}</a>
                              </h5>
                              <span class="date">${
                                series.release_date
                                  ? series.release_date.split("-")[0]
                                  : "N/A"
                              }</span>
                          </div>
                          <div class="bottom">
                              <ul>
                                  <li><span class="quality">HD</span></li>
                                  <li>
                                      <span class="rating">
                                          <i class="fas fa-thumbs-up"></i> ${series.vote_average.toFixed(
                                            1
                                          )}
                                      </span>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          `
        )
        .join("");

      seriesContainer.innerHTML = seriesHTML;
    }

    if (movieCredits.cast.length > 0) {
      console.log("Movie Cast:", movieCredits.cast);
      const creditsContainer = document.getElementById("movie-credits");
      creditsContainer.innerHTML = "";

      const cast = movieCredits.cast.slice(0, 10); // Limit to 10 cast members

      if (!cast || cast.length === 0) {
        creditsContainer.innerHTML = "<p>No cast information available.</p>";
        return;
      }

      const castItems = cast
        .map(
          (member) => `
          <div class="credit-card">
              <img src="${
                member.profile_path
                  ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                  : "img/images/profilePlaceholder.png"
              }" 
                  alt="${member.name}">
              <div class="credit-info">
                  <h5>${member.name}</h5>
                  <p>${member.character}</p>
              </div>
          </div>
      `
        )
        .join("");

      creditsContainer.innerHTML = castItems;
    }

    // Update movie images in carousel
    if (movieImagesContainer) {
      movieImagesContainer.innerHTML = ""; // Clear existing slides

      // Ensure there are movie images to display
      if (movieImages.backdrops && movieImages.backdrops.length > 0) {
        movieImages.backdrops.forEach((image, index) => {
          const slide = document.createElement("div");
          slide.classList.add("swiper-slide");

          const img = document.createElement("img");
          img.src = `https://image.tmdb.org/t/p/original${image.file_path}`;
          img.alt = `Movie Scene ${index + 1}`;
          img.loading = "lazy"; // Improves performance

          slide.appendChild(img);
          movieImagesContainer.appendChild(slide);
        });
      } else {
        // If no images, display a fallback message
        const noImagesMessage = document.createElement("p");
        noImagesMessage.textContent = "No images available for this movie.";
        movieImagesContainer.appendChild(noImagesMessage);
      }

      // Reinitialize Swiper after updating images
      new Swiper(".swiper-container", {
        loop: true,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
      });
    }
  } catch (e) {
    console.error("Error fetching movie details:", e);
  } finally {
    document.getElementById("preloader").style.display = "none";
  }

  // Get modal elements
  // Get modal elements
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const closeButton = document.querySelector(".close");

  // Function to open the modal on image click
  document.querySelectorAll(".swiper-slide img").forEach((img) => {
    img.addEventListener("click", function () {
      let highResSrc = this.src.replace("/w500/", "/original/"); // Get high-res version
      modal.style.display = "flex";
      modalImage.src = highResSrc;
      modalImage.onload = () => (modalImage.style.opacity = "1"); // Ensure smooth loading
      document.body.style.overflow = "hidden"; // Disable scrolling when modal is open
    });
  });

  // Close modal when clicking close button
  closeButton.addEventListener("click", function () {
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // Enable scrolling when modal is closed
  });

  // Close modal when clicking outside the image
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto"; // Enable scrolling
    }
  });
});

const watchlistOpenBtn = document.getElementById("watchlistOpenBtn");
const watchlistModal = document.getElementById("watchlistModal");
const watchlistCloseBtn = document.getElementById("watchlistCloseBtn");
const watchlistContainer = document.getElementById("watchlistContainer");
const watchlistCreateInput = document.getElementById("watchlistCreateInput");
const watchlistCreateBtn = document.getElementById("watchlistCreateBtn");

let userUID = null;
let currentMovieID = null;
let currentMovieTitle = null;

// 🔹 Check if User is Logged In
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userUID = user.uid;
  }
});

// 🔹 Open Modal & Load Watchlists
watchlistOpenBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!userUID) {
    alert("You need to be logged in to use this feature!");
    return;
  }

  // Get Movie/Series Details
  const urlParams = new URLSearchParams(window.location.search);
  currentMovieID = urlParams.get("id");
  currentMovieTitle = document.querySelector(
    ".movie-details-content h2"
  ).innerText;

  // Show Modal
  watchlistModal.style.display = "flex";

  // Load User Watchlists
  await loadUserWatchlists();
});

// 🔹 Close Modal
watchlistCloseBtn.addEventListener("click", () => {
  watchlistModal.style.display = "none";
});

// 🔹 Load User Watchlists from Firestore
async function loadUserWatchlists() {
  watchlistContainer.innerHTML = ""; // Clear previous watchlists
  const watchlistTitle = document.querySelector("#watchlistModal h3");
  const userRef = doc(db, "users", userUID);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const watchlists = userSnap.data().watchlist || [];
    if (watchlists.length === 0) {
      watchlistTitle.textContent = "No Watchlists Available";

      return;
    }

    for (let watchlist of watchlists) {
      let watchlistPoster = "img/images/default-poster.jpg"; // Default poster

      if (watchlist.media && watchlist.media.length > 0) {
        // Pick a random movie/series from the watchlist
        let randomMedia =
          watchlist.media[Math.floor(Math.random() * watchlist.media.length)];

        let watchlistData = null;

        // 🔹 Fetch poster dynamically based on type
        if (randomMedia.type === "m") {
          watchlistData = await fetchMovieDetails(randomMedia.id);
        } else if (randomMedia.type === "s") {
          watchlistData = await fetchSeriesDetails(randomMedia.id);
        }

        if (watchlistData && watchlistData.poster_path) {
          watchlistPoster = `https://image.tmdb.org/t/p/w500${watchlistData.poster_path}`;
        }
      }

      // Create Watchlist UI Element
      const watchlistDiv = document.createElement("div");
      watchlistDiv.classList.add("watchlist-item");
      watchlistDiv.innerHTML = `
        <div class="watchlist-header">
          <p>${watchlist.name}</p>
          <button class="watchlist-add-btn" data-watchlist="${watchlist.name}">Add</button>
        </div>
        <img src="${watchlistPoster}" alt="${watchlist.name}" class="watchlist-poster" />
      `;

      watchlistContainer.appendChild(watchlistDiv);

      // Attach event listener to "Add" button
      watchlistDiv
        .querySelector(".watchlist-add-btn")
        .addEventListener("click", async () => {
          await addToWatchlist(watchlist.name);
        });
    }
  }
}

// 🔹 Add Movie/Series to a Watchlist
async function addToWatchlist(watchlistName) {
  if (!currentMovieID) return alert("Something went wrong!");

  const mediaType = "m"; // Example method, update as needed

  try {
    const userRef = doc(db, "users", userUID);
    const userSnap = await getDoc(userRef);

    let userData = userSnap.exists() ? userSnap.data() : { watchlist: [] };

    let watchlistIndex = userData.watchlist.findIndex(
      (w) => w.name === watchlistName
    );

    if (watchlistIndex === -1) return alert("Watchlist not found!");

    let watchlist = userData.watchlist[watchlistIndex];

    // Ensure 'movies' array exists
    if (!watchlist.media) {
      watchlist.media = [];
    }

    // Prevent duplicate movies
    if (watchlist.media.some((m) => m.id === currentMovieID)) {
      return alert("Movie/Series is already in this watchlist!");
    }

    watchlist.media.push({ id: currentMovieID, type: mediaType });
    userData.watchlist[watchlistIndex] = watchlist;

    await updateDoc(userRef, { watchlist: userData.watchlist });

    alert(`Added to "${watchlistName}"!`);
    watchlistModal.style.display = "none";
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    alert("Failed to add to watchlist.");
  }
}

// 🔹 Create a New Watchlist
watchlistCreateBtn.addEventListener("click", async () => {
  const newWatchlistName = watchlistCreateInput.value.trim();
  if (!newWatchlistName) return alert("Enter a valid watchlist name!");

  try {
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: userUID,
        name: newWatchlistName,
        poster: "", // Optional, can be updated later
      }),
    });

    const data = await response.json();

    if (!response.ok)
      throw new Error(data.error || "Failed to create watchlist");

    alert(`Watchlist "${newWatchlistName}" created!`);
    watchlistCreateInput.value = ""; // Clear input
    await loadUserWatchlists(); // Refresh the watchlist UI
  } catch (error) {
    console.error("❌ Error creating watchlist:", error);
    alert(error.message);
  }
});

document
  .getElementById("chatButton")
  .addEventListener("click", async function () {
    // 🔹 Get Movie ID and Title (assuming it's available in dataset)
    const Id = new URLSearchParams(window.location.search).get("id");
    const movieTitle = document.title || "Unknown Movie"; // Fallback if title is missing

    if (!Id) {
      alert("Movie ID is missing!");
      return;
    }

    try {
      // 🔹 Call backend to check/create chat
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Id }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = `/chat.html?id=${Id}&type=movie`;
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Failed to create/join chat:", error);
      alert("Something went wrong. Please try again.");
    }
  });
