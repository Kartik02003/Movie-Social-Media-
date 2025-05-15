import {
  fetchSeriesDetails,
  fetchSeasonDetails,
  fetchSeriesCredits,
  fetchSeriesImages,
  fetchTrendingSeries,
  fetchMovieDetails,
  fetchSimilarSeries,
} from "../API.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
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
  const seriesID = urlParams.get("id");

  try {
    document.getElementById("preloader").style.display = "block";
    // Fetch movie details, credits, and images
    const [seriesDetails, seriesCredits, seriesImages, similarSeries] =
      await Promise.all([
        fetchSeriesDetails(seriesID),
        fetchSeriesCredits(seriesID),
        fetchSeriesImages(seriesID),
        fetchSimilarSeries(seriesID),
      ]);

    // Selecting the section
    const seriesDetailsArea = document.querySelector(".movie-details-area");

    // Updating the background image
    if (seriesDetailsArea) {
      const backdropUrl = seriesDetails.backdrop_path
        ? `https://image.tmdb.org/t/p/original${seriesDetails.backdrop_path}`
        : "img/bg/movie_details_bg.jpg";

      seriesDetailsArea.setAttribute("data-background", backdropUrl);
      seriesDetailsArea.style.backgroundImage = `url(${backdropUrl})`;
      seriesDetailsArea.style.backgroundSize = "cover";
      seriesDetailsArea.style.backgroundPosition = "center";
    } else {
      console.error("❌ movie-details-area element NOT found in the DOM!");
    }

    // Selecting elements for update
    const seriesTitleElement = document.querySelector(
      ".movie-details-content h2"
    );
    const seriesOverviewElement = document.querySelector(
      ".movie-details-content p"
    );
    const seriesPosterElement = document.querySelector(
      ".movie-details-img img"
    );
    const seriesTrailerElement = document.querySelector(".popup-video");
    const seriesDetailsElement = document.querySelector(".banner-meta ul");
    const streamingInfoElement = document.querySelector(".streaming h6");

    // Update series title
    if (seriesTitleElement) {
      seriesTitleElement.innerHTML = `${seriesDetails.name} <span>(${
        seriesDetails.first_air_date?.split("-")[0] || "N/A"
      })</span>`;
    }

    // Update series overview
    if (seriesOverviewElement) {
      seriesOverviewElement.textContent =
        seriesDetails.overview || "No overview available.";
    }

    // Update series poster
    if (seriesPosterElement) {
      seriesPosterElement.src = seriesDetails.poster_path
        ? `https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}`
        : "img/poster/movie_details_img.jpg"; // Fallback image
    }

    // Update trailer link
    if (seriesTrailerElement && seriesDetails.videos?.results.length > 0) {
      const trailerKey = seriesDetails.videos.results[0].key;
      seriesTrailerElement.href = `https://www.youtube.com/watch?v=${trailerKey}`;
    } else if (seriesTrailerElement) {
      seriesTrailerElement.style.display = "none"; // Hide if no trailer available
    }

    // Update series details (rating, genres, release year, runtime)
    if (seriesDetailsElement) {
      seriesDetailsElement.innerHTML = `
        <li class="quality">
          <span>${seriesDetails.adult ? "18+" : "PG"}</span>
          <span>HD</span>
        </li>
        <li class="category">
          ${
            seriesDetails.genres
              ?.map((genre) => `<a href="#">${genre.name}</a>`)
              .join(", ") || "N/A"
          }
        </li>
        <li class="release-time">
          <span><i class="far fa-calendar-alt"></i> ${
            seriesDetails.first_air_date?.split("-")[0] || "N/A"
          }</span>
          <span><i class="far fa-clock"></i> ${
            seriesDetails.episode_run_time?.[0] || "N/A"
          } min</span>
        </li>
      `;
    }

    // Update streaming service info (if available)
    if (streamingInfoElement) {
      streamingInfoElement.textContent = "Available on Prime Video"; // You can make this dynamic if required
    }

    if (similarSeries.results.length > 0) {
      const seriesContainer = document.getElementById("series-list");
      seriesContainer.innerHTML = ""; // Clear existing content

      const seriesHTML = similarSeries.results
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
                              alt="${series.name}">
                          </a>
                      </div>
                      <div class="movie-content">
                          <div class="top">
                              <h5 class="title">
                                  <a href="series_details.html?id=${
                                    series.id
                                  }">${series.name}</a>
                              </h5>
                              <span class="date">${
                                series.first_air_date
                                  ? series.first_air_date.split("-")[0]
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

    if (seriesCredits.cast.length > 0) {
      const creditsContainer = document.getElementById("movie-credits");
      creditsContainer.innerHTML = ""; // Clear existing cast list

      const cast = seriesCredits.cast.slice(0, 10); // Limit to 10 cast members

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

    const seriesImagesContainer = document.getElementById(
      "current-movie-images"
    );
    if (seriesImagesContainer) {
      seriesImagesContainer.innerHTML = ""; // Clear existing slides

      // Ensure there are series images to display
      if (seriesImages.backdrops && seriesImages.backdrops.length > 0) {
        seriesImages.backdrops.forEach((image, index) => {
          const slide = document.createElement("div");
          slide.classList.add("swiper-slide");

          const img = document.createElement("img");
          img.src = `https://image.tmdb.org/t/p/original${image.file_path}`;
          img.alt = `Series Scene ${index + 1}`;
          img.loading = "lazy"; // Improves performance

          slide.appendChild(img);
          seriesImagesContainer.appendChild(slide);
        });
      } else {
        // If no images, display a fallback message
        const noImagesMessage = document.createElement("p");
        noImagesMessage.textContent = "No images available for this series.";
        seriesImagesContainer.appendChild(noImagesMessage);
      }

      // ✅ Reinitialize Swiper for the updated images
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

    const episodeContainer = document.querySelector(
      ".episode-watch-wrap .accordion"
    );

    if (!episodeContainer) {
      console.error("❌ Episode container NOT found in the DOM!");
      return;
    }

    // Clear existing content before appending new data
    episodeContainer.innerHTML = "";

    // Check if seasons data exists
    if (seriesDetails.seasons?.length > 0) {
      const episodeImage = document.querySelector(".episode-img img");
      const firstSeason = seriesDetails.seasons.find(
        (season) => season.season_number === 1
      );

      // ✅ Set Default Image to Season 1 Poster (AFTER data is loaded)
      if (firstSeason && firstSeason.poster_path) {
        episodeImage.src = `https://image.tmdb.org/t/p/w500${firstSeason.poster_path}`;
      } else {
        episodeImage.src = "img/images/default.jpg"; // Fallback image if no poster found
      }
      seriesDetails.seasons.forEach((season, seasonIndex) => {
        const seasonID = `season-${seasonIndex}`;
        // Create season card
        const seasonCard = document.createElement("div");
        seasonCard.classList.add("card");

        seasonCard.innerHTML = `
          <div class="card-header" id="heading-${seasonIndex}">
            <button class="btn-block text-left ${
              seasonIndex === 0 ? "" : "collapsed"
            }" 
              type="button" data-toggle="collapse" 
              data-target="#${seasonID}" 
              aria-expanded="${seasonIndex === 0 ? "true" : "false"}"
              aria-controls="${seasonID}">
              <span class="season">${
                season.name || "Season " + season.season_number
              }</span>
              <span class="video-count">${
                season.episode_count || 0
              } Full Episodes</span>
            </button>
          </div>
          <div id="${seasonID}" class="collapse ${
          seasonIndex === 0 ? "show" : ""
        }" 
            aria-labelledby="heading-${seasonIndex}" 
            data-parent="#accordionExample">
            <div class="card-body">
            <!-- ✅ Season Overview -->
            <p class="season-overview">
              ${
                season.overview?.trim()
                  ? season.overview
                  : "No overview available."
              }
            </p>

            <!-- ✅ Episode List -->
            <ul id="episode-list-${seasonIndex}"></ul>
          </div>
          </div>
        `;

        episodeContainer.appendChild(seasonCard);

        // Fetch episodes for each season
        fetchSeasonDetails(seriesID, season.season_number)
          .then((seasonDetails) => {
            if (!seasonDetails || !Array.isArray(seasonDetails.episodes)) {
              console.error(
                "❌ Episodes data is invalid:",
                seasonDetails.episodes
              );
              return;
            }

            const episodes = seasonDetails.episodes;
            const episodeList = document.getElementById(
              `episode-list-${seasonIndex}`
            );
            if (episodeList) {
              episodes.forEach((episode) => {
                const episodeItem = document.createElement("li");

                // Add episode link
                episodeItem.innerHTML = `
                  <a href="https://www.youtube.com/watch?v=${
                    episode.videoKey || "R2gbPxeNk2E"
                  }" 
                    class="popup-video episode-link">
                    <i class="fas fa-play"></i> Episode ${
                      episode.episode_number
                    } - ${episode.name}
                  </a>
                  <span class="duration"><i class="far fa-clock"></i> ${
                    episode.runtime || "N/A"
                  } Min</span>
                `;

                // Attach click event to show/hide overview
                episodeItem.addEventListener("click", function (event) {
                  event.preventDefault();

                  let existingOverview =
                    episodeItem.querySelector(".episode-overview");

                  if (existingOverview) {
                    existingOverview.remove();
                  } else {
                    const overview = document.createElement("p");
                    overview.className = "episode-overview";
                    overview.innerText =
                      episode.overview.trim() !== ""
                        ? episode.overview
                        : "No overview available.";
                    overview.style.marginTop = "10px";

                    episodeItem.appendChild(overview);
                  }
                });

                episodeList.appendChild(episodeItem);
              });
            }
          })
          .catch((error) =>
            console.error("❌ Error fetching episodes:", error)
          );

        // **✅ Update Image When Clicking on a Season**
        seasonCard
          .querySelector("button")
          .addEventListener("click", function () {
            if (season.poster_path) {
              // Use the season's poster image if available
              episodeImage.src = `https://image.tmdb.org/t/p/w500${season.poster_path}`;
            } else {
              // Fallback image if no poster is available
              episodeImage.src = `https://image.tmdb.org/t/p/w500${firstSeason.poster_path}`;
            }
          });
      });
    } else {
      console.error("❌ No seasons found for this series.");
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

// 🎬 Watchlist Modal Elements
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
// 🔹 Load User Watchlists from Firestore
// 🔹 Load User Watchlists from Firestore
async function loadUserWatchlists() {
  watchlistContainer.innerHTML = ""; // Clear previous watchlists
  const watchlistTitle = document.querySelector("#watchlistModal h3");
  const userRef = doc(db, "users", userUID);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const watchlists = userSnap.data().watchlist || [];

    for (let watchlist of watchlists) {
      let watchlistPoster = "img/images/default-poster.jpg"; // Default poster
      if (watchlists.length === 0) {
        watchlistTitle.textContent = "No Watchlists Available";

        return;
      }

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

  const mediaType = "s"; // Example method, update as needed

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
        // 🔹 Redirect to chat page
        window.location.href = `/chat.html?id=${Id}&type=series`;
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Failed to create/join chat:", error);
      alert("Something went wrong. Please try again.");
    }
  });
