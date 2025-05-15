import {
  fetchTrendingSeries,
  fetchPopularSeries,
  fetchSeriesDetails,
  searchMulti,
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
    profilePic.src =
      user?.photoURL?.replace("s96-c", "s400-c") ||
      "img/images/pfpPlaceholder.jpg";
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
  try {
    document.getElementById("preloader").style.display = "block";
    // Fetch movies
    const trending = await fetchTrendingSeries();

    const moviesPerPage = 8;
    let currentPage = 1;
    let allMovies = [];

    const movieContainer = document.querySelector(".tr-movie-active");
    const paginationContainer = document.querySelector(".pagination-wrap ul");

    try {
      // Fetch trending movies
      const trending = await fetchTrendingSeries();

      if (trending && trending.results && trending.results.length > 0) {
        allMovies = trending.results;
        renderMovies();
        renderPagination();
      } else {
        console.log("No trending movies found.");
      }
    } catch (e) {
      console.error("Error fetching movies", e);
    }

    // Render movies for the current page
    async function renderMovies() {
      const startIndex = (currentPage - 1) * moviesPerPage;
      const endIndex = startIndex + moviesPerPage;
      const moviesToDisplay = allMovies.slice(startIndex, endIndex);

      const movieDetails = await Promise.all(
        moviesToDisplay.map((movie) => fetchSeriesDetails(movie.id))
      );

      console.log("Movie Details:", movieDetails);
      // Generate HTML with fetched details
      const moviesHTML = movieDetails
        .map((movie) => {
          const posterPath = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
            : "img/default-poster.jpg";
          const releaseDate = movie.first_air_date
            ? movie.first_air_date.split("-")[0]
            : "Unknown";
          const rating = movie.vote_average
            ? movie.vote_average.toFixed(1)
            : "N/A";

          return `
            <div class="col-xl-3 col-lg-4 col-sm-6 grid-item grid-sizer cat-two">
              <div class="movie-item movie-item-three mb-50">
                <div class="movie-poster">
                  <img src="${posterPath}" alt="${movie.name}">
                  <div class="gradient-overlay"></div>
                  <ul class="overlay-btn">
                    
                    <li>
                      <a href="series_details.html?id=${
                        movie.id
                      }" class="btn">Details</a>
                    </li>
                  </ul>
                </div>
                <div class="movie-content">
                  <div class="top">
                    <h5 class="title">
                      <a href="series_details.html?id=${movie.id}">${
            movie.name
          }</a>
                    </h5>
                    <span class="date">${releaseDate}</span>
                  </div>
                  <div class="bottom">
                    <ul>
                      <li><span>${movie.original_language}</span></li>
                      <li>
                        <span class="duration">${
                          movie.number_of_seasons || "N/A"
                        } Seasons </span>
                        <span class="rating"><i class="fas fa-thumbs-up"></i> ${rating}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>`;
        })
        .join("");

      movieContainer.innerHTML = moviesHTML;
    }

    // Render pagination controls
    function renderPagination() {
      const totalPages = Math.ceil(allMovies.length / moviesPerPage);
      let paginationHTML = "";

      for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<li class="${
          i === currentPage ? "active" : ""
        }"><a href="#" data-page="${i}">${i}</a></li>`;
      }

      paginationContainer.innerHTML = paginationHTML;

      // Add event listeners to pagination links
      const paginationLinks = paginationContainer.querySelectorAll("a");
      paginationLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          currentPage = parseInt(event.target.dataset.page);
          renderMovies();
          renderPagination();
        });
      });
    }

    // Update the hero banner with the first trending movie's backdrop
    if (trending && trending.results && trending.results.length > 0) {
      const heroPosterpath = trending.results[0].backdrop_path;
      const imageBaseUrl = "https://image.tmdb.org/t/p/original";
      const heroImageUrl = `${imageBaseUrl}${heroPosterpath}`;

      const heroBanner = document.getElementById("heroBanner");
      if (heroBanner) {
        heroBanner.style.backgroundImage = `url(${heroImageUrl})`;
      }
    }
  } catch (e) {
    console.error("Error fetching movies", e);
  } finally {
    document.getElementById("preloader").style.display = "none";
  }
  (() => {
    let currentPage = 1;
    let totalPages = 1;
    let currentQuery = "";

    document
      .getElementById("searchForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const query = document.getElementById("searchInput").value.trim();
        if (!query) {
          alert("Please enter a search term.");
          return;
        }

        currentPage = 1; // Reset pagination
        await fetchSearchResults(query, currentPage);
      });

    async function fetchSearchResults(query, page) {
      try {
        console.log(`🔍 Fetching results for: "${query}" (Page: ${page})`);

        const results = await searchMulti(query, page);
        console.log("✅ API Response:", results);

        currentQuery = query;
        totalPages = results.total_pages || 1; // Update total pages
        displaySearchResults(results, page);
      } catch (error) {
        console.error("❌ Search Error:", error);
        alert("Failed to fetch search results.");
      }
    }

    function displaySearchResults(results, page) {
      console.log("📌 Displaying search results:", results);

      const resultsGrid = document.getElementById("searchResultsGrid");
      const searchResultsContainer = document.getElementById("searchResults");
      const paginationContainer = document.getElementById(
        "pagination-container"
      );
      const prevPageButton = document.getElementById("prevPageBtn");
      const nextPageButton = document.getElementById("nextPageBtn");
      const pageIndicator = document.getElementById("pageIndicator");

      if (!Array.isArray(results.results)) {
        console.error("❌ Unexpected API response format:", results);
        alert("Unexpected API response. Check the console for details.");
        return;
      }

      let filteredResults = results.results.filter(
        (movie) => movie.media_type !== "person"
      );

      resultsGrid.innerHTML = ""; // Clear previous results

      if (filteredResults.length === 0) {
        resultsGrid.innerHTML = "<p>No results found.</p>";
        paginationContainer.style.display = "none"; // Hide pagination
      } else {
        filteredResults.forEach((movie) => {
          const card = document.createElement("div");
          card.classList.add("movie-card");

          card.innerHTML = `
                <a href="${
                  movie.media_type === "movie"
                    ? "movie-details.html?id=" + movie.id
                    : "series_details.html?id=" + movie.id
                }" class="movie-card">
                  <div class="blog-post-item">
                    <div class="blog-post-thumb">
                      <img src="${
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                          : "img/images/default-poster.jpg"
                      }" alt="${movie.title || movie.name || "Unknown Title"}">
                    </div>
                    <div class="blog-post-content">
                      <div class="content-overlay"></div> <!-- Gradient Overlay -->
                      <h4 class="title">${
                        movie.title || movie.name || "Unknown Title"
                      }</h4>
                      <span class="date"><i class="far fa-calendar-alt"></i> ${
                        movie.release_date ||
                        movie.first_air_date ||
                        "Unknown Date"
                      }</span>
                      <p><i class="far fa-star"></i> ${
                        movie.vote_average || "N/A"
                      }/10</p>
                      <div class="read-more">
                        <span>Watch Now <i class="fas fa-play"></i></span>
                      </div>
                    </div>
                  </div>
                </a>
              `;

          resultsGrid.appendChild(card);
        });

        // Show Pagination if there are multiple pages
        if (totalPages > 1) {
          paginationContainer.style.display = "flex";
          pageIndicator.innerText = `Page ${page} of ${totalPages}`;
        } else {
          paginationContainer.style.display = "none";
        }

        // Enable/Disable Pagination Buttons
        prevPageButton.disabled = page === 1;
        nextPageButton.disabled = page === totalPages;

        searchResultsContainer.style.display = "block";
      }

      console.log("✅ Search results updated.");
    }

    // Pagination Event Listeners
    document
      .getElementById("nextPageBtn")
      .addEventListener("click", async () => {
        if (currentPage < totalPages) {
          currentPage++;
          await fetchSearchResults(currentQuery, currentPage);
        }
      });

    document
      .getElementById("prevPageBtn")
      .addEventListener("click", async () => {
        if (currentPage > 1) {
          currentPage--;
          await fetchSearchResults(currentQuery, currentPage);
        }
      });
  })();
});
