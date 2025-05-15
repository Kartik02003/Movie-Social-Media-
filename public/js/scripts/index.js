import {
  fetchTrendingMovies,
  fetchPopularSeries,
  fetchPopularMovies,
  fetchSeriesDetails,
  fetchMovieDetails,
  searchMulti,
} from "../API.js";

// Firebase Authentication Import
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

let globalUserId = null;

// Check if user is already logged in when page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, update UI
    console.log("✅ User already logged in:", user);
    profilePic.src =
      user?.photoURL?.replace("s96-c", "s400-c") ||
      "img/images/pfpPlaceholder.jpg";
    userProfile.style.display = "flex";
    globalUserId = user.uid; // Store the user ID globally
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

    const trending = await fetchTrendingMovies();

    let heroPosterpath = "";
    if (trending && trending.results && trending.results.length > 0) {
      heroPosterpath = trending.results[0].backdrop_path;

      // Constructing the image URL for the hero banner
      const imageBaseUrl = "https://image.tmdb.org/t/p/original";
      const heroImageUrl = `${imageBaseUrl}${heroPosterpath}`;

      // Update the hero banner with the first trending movie's backdrop image
      const heroBanner = document.getElementById("heroBanner");
      if (heroBanner) {
        heroBanner.style.backgroundImage = `url(${heroImageUrl})`;
      } else {
        console.log("No Hero Banner element found.");
      }

      const moviesToShow = trending.results.slice(0, 4);

      const carouselContainer = document.querySelector(".banner-carousel");
      carouselContainer.innerHTML = "";

      const preloadedImages = [];
      (async () => {
        for (const [index, movie] of moviesToShow.entries()) {
          try {
            const imageUrl = `${imageBaseUrl}${movie.backdrop_path}`;
            const img = new Image();
            img.src = imageUrl;
            preloadedImages.push(img);

            // Fetch detailed movie information
            const movieDetail = await fetchMovieDetails(movie.id);

            // Creating carousel slide for each movie
            const slide = document.createElement("div");
            slide.classList.add("banner-item");
            if (index === 0) {
              slide.classList.add("active");
            }

            // Generate content for each carousel item
            slide.innerHTML = `
              <div class="banner-content">
                <h6 class="sub-title wow fadeInUp" data-wow-delay=".2s" data-wow-duration="1.8s">Movflx</h6>
                <h2 class="title wow fadeInUp" data-wow-delay=".4s" data-wow-duration="1.8s">${
                  movieDetail.title || movieDetail.name
                }</h2>
                <div class="banner-meta wow fadeInUp" data-wow-delay=".6s" data-wow-duration="1.8s">
                  <ul>
                    <li class="quality">
                      <span>Pg ${movieDetail.adult ? "18" : "13"}</span>
                      <span>hd</span>
                    </li>
                    <li class="category">
                      <a href="#">${movieDetail.genres
                        .map((g) => g.name)
                        .slice(0, 2)
                        .join(", ")}</a>
                    </li>
                    <li class="release-time">
                      <span><i class="far fa-calendar-alt"></i> ${
                        movieDetail.release_date || movieDetail.first_air_date
                      }</span>
                      <span><i class="far fa-clock"></i> ${
                        movieDetail.runtime || 0
                      } min</span>
                    </li>
                  </ul>
                </div>
                <a href="movie-details.html?id=${
                  movieDetail.id
                }" class="banner-btn btn popup-video wow fadeInUp" data-wow-delay=".8s" data-wow-duration="1.8s"><i class="fas fa-play"></i> Check Now</a>
              </div>
            `;
            carouselContainer.appendChild(slide);
          } catch (error) {
            console.error("Error fetching movie details:", error);
          }
        }
      })();

      let currentSlide = 0;
      const slides = document.querySelectorAll(".banner-item");
      const totalSlides = slides.length;

      function showSlide(index) {
        slides.forEach((slide, i) => {
          slide.classList.remove("active");
          if (i === index) {
            slide.classList.add("active");

            const currentMovie = moviesToShow[i];
            const currentBackdropPath = currentMovie.backdrop_path;
            const currentImageUrl = `${imageBaseUrl}${currentBackdropPath}`;
            if (heroBanner) {
              heroBanner.style.backgroundImage = `url(${currentImageUrl})`;
            }
          }
        });
      }
      setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
      }, 5000);
      showSlide(currentSlide);
    }
  } catch (error) {
    console.error("Error during API call or DOM manipulation:", error);
  }

  try {
    const carousel = document.querySelector(
      "#popularMoviesCarousel .swiper-wrapper"
    );
    carousel.innerHTML = '<div class="loader">Loading...</div>';

    const popularMovies = await fetchPopularMovies();
    if (popularMovies?.results?.length > 0) {
      carousel.innerHTML = "";
      try {
        const movieDetailsArray = await Promise.all(
          popularMovies.results.map(async (movie) => {
            try {
              const details = await fetchMovieDetails(movie.id);
              return { movie, details };
            } catch (error) {
              console.error(
                `Failed to fetch details for movie ID: ${movie.id}`,
                error
              );
              return { movie, details: null };
            }
          })
        );

        const movieItems = movieDetailsArray
          .map(({ movie, details }) => {
            const releaseYear = movie.release_date
              ? movie.release_date.split("-")[0]
              : "Unknown";
            const popularityRating = movie.popularity
              ? movie.popularity.toFixed(1)
              : "N/A";

            return `
            <div class="swiper-slide">
            <a href="movie-details.html?id=${movie.id}">
              <div class="movie-item mb-50">
                <div class="gradient-overlay"></div>
                <div class="movie-poster">
                  <img
                    src="${
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                        : "img/default-poster.jpg"
                    }"
                    alt="${movie.title}"
                  />
                  <div class="movie-content">
                    <div class="content-inner">
                      <div class="top">
                        <h5 class="title">
                          <a href="movie-details.html?id=${movie.id}">${
              movie.title
            }</a>
                        </h5>
                        <span class="date">${releaseYear}</span>
                      </div>
                      <div class="bottom">
                        <ul>
                          <li>
                            <span>${details.status || "No Status"}</span>
                          </li>
                          <li>
                            <span class="duration">
                              <i class="far fa-clock"></i> ${
                                details.runtime || "N/A"
                              } min
                            </span>
                            <span class="rating">
                              <i class="fas fa-thumbs-up"></i> ${popularityRating}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </a>
            </div>
          `;
          })
          .join("");

        carousel.innerHTML = movieItems; // Add all movie items to carousel

        // Initialize Swiper.js
        new Swiper("#popularMoviesCarousel", {
          slidesPerView: 3,
          spaceBetween: 30,
          loop: true,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          loopAdditionalSlides: 3,
          breakpoints: {
            0: {
              slidesPerView: 1,
            },
            600: {
              slidesPerView: 2,
            },
            1000: {
              slidesPerView: 3,
            },
          },
        });
      } catch (error) {
        console.error("Error fetching popular movies:", error);
      }
    } else {
      carousel.innerHTML = "No popular movies found.";
    }
  } catch (error) {
    console.error("Error during API call or DOM manipulation:", error);
  }

  try {
    const carousel = document.querySelector(
      "#popularTVShowCarousel .swiper-wrapper"
    );
    carousel.innerHTML = '<div class="loader">Loading...</div>'; // Show loading message

    const popularSeries = await fetchPopularSeries();
    if (popularSeries?.results?.length > 0) {
      carousel.innerHTML = ""; // Clear loading message

      try {
        // Fetch all series details in parallel
        const seriesDetailsArray = await Promise.all(
          popularSeries.results.map(async (series) => {
            try {
              const details = await fetchSeriesDetails(series.id);
              return { series, details };
            } catch (error) {
              console.error(
                `Failed to fetch details for series ID: ${series.id}`,
                error
              );
              return { series, details: null };
            }
          })
        );

        // Construct HTML for series
        const seriesItems = seriesDetailsArray
          .map(({ series, details }) => {
            const releaseYear = series.first_air_date
              ? series.first_air_date.split("-")[0]
              : "Unknown";
            const popularityRating = series.popularity
              ? series.popularity.toFixed(1)
              : "N/A";

            return `
            <div class="swiper-slide">
             <a href="series_details.html?id=${series.id}">
              <div class="movie-item mb-50">
                <div class="gradient-overlay"></div>
                <div class="movie-poster">
                  <img
                    src="${
                      series.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${series.poster_path}`
                        : "img/default-poster.jpg"
                    }"
                    alt="${series.name}"
                  />
                  <div class="movie-content">
                    <div class="content-inner">
                      <div class="top">
                        <h5 class="title">
                          <a href="series_details.html?id=${series.id}">${
              series.name
            }</a>
                        </h5>
                        <span class="date">${releaseYear}</span>
                      </div>
                      <div class="bottom">
                        <ul>
                          <li>
                            <span>Seasons: ${
                              details?.number_of_seasons || "N/A"
                            }</span>
                          </li>
                          <li>
                            <span class="rating">
                              <i class="fas fa-thumbs-up"></i> ${popularityRating}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </a>
            </div>
          `;
          })
          .join("");

        // Update the carousel with series items
        carousel.innerHTML = seriesItems;

        // Initialize Swiper.js
        new Swiper("#popularTVShowCarousel", {
          slidesPerView: 3,
          spaceBetween: 30,
          loop: true,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          loopAdditionalSlides: 3,
          breakpoints: {
            0: {
              slidesPerView: 1,
            },
            600: {
              slidesPerView: 2,
            },
            1000: {
              slidesPerView: 3,
            },
          },
        });
      } catch (error) {
        console.error("Error fetching series details:", error);
      }
    } else {
      carousel.innerHTML = "No popular series found.";
    }
  } catch (error) {
    console.error("Error during API call or DOM manipulation:", error);
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
                      <h4 class="title" style="font-size : 20px">${
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
                        <span>Check Now <i class="fas fa-play"></i></span>
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

let currentPage = 1;
const watchlistsPerPage = 4;
let watchlists = [];

// 🔹 Function to Display Watchlists Based on Page Number
async function updateWatchlistDisplay() {
  const watchlistContainer = document.getElementById("watchlistContainer");
  watchlistContainer.innerHTML = ""; // Clear existing items

  const startIndex = (currentPage - 1) * watchlistsPerPage;
  const endIndex = startIndex + watchlistsPerPage;
  const paginatedWatchlists = watchlists.slice(startIndex, endIndex);

  for (let watchlist of paginatedWatchlists) {
    let watchlistPoster = "img/images/default-poster.jpg"; // Default poster

    if (watchlist.media && watchlist.media.length > 0) {
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

    const watchlistDiv = document.createElement("div");
    watchlistDiv.classList.add("col-xl-3", "col-lg-4", "col-sm-6");
    watchlistDiv.innerHTML = `
            <div class="blog-post-item" style="position: relative;" data-watchlist="${
              watchlist.name
            }">
                <div class="blog-post-thumb">
                    <a href="watchlist.html?name=${watchlist.name}">
                        <img src="https://image.tmdb.org/t/p/w500${watchlistPoster}" alt="${
      watchlist.name
    }">
                    </a>
                </div>
                <div class="blog-post-content">                 
                    <h4 class="title">
                        <a href="watchlist.html?name=${watchlist.name}">
                            ${watchlist.name}
                        </a>
                    </h4>
                    <p>${
                      watchlist?.media?.length ? watchlist.media.length : 0
                    } items</p>
                    
                </div>
                <img src="img/images/delete.png" 
                        alt="Delete" 
                        class="delete-icon" 
                        onclick="deleteWatchlist('${watchlist.name}')">
            </div>

`;

    watchlistContainer.appendChild(watchlistDiv);
  }
}

async function deleteWatchlist(watchlistName) {
  const confirmDelete = confirm(
    `Are you sure you want to delete "${watchlistName}"?`
  );
  if (!confirmDelete) return;
  const userRef = doc(db, "users", globalUserId);

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      alert("⚠ User not found!");
      return;
    }

    let userData = userSnap.data();
    let userWatchlists = userData.watchlist || [];

    if (!userWatchlists.some((w) => w.name === watchlistName)) {
      alert("⚠ Watchlist not found!");
      return;
    }

    watchlists = userWatchlists.filter((w) => w.name !== watchlistName);

    if (
      userData.watchlistTimestamps &&
      userData.watchlistTimestamps[watchlistName]
    ) {
      delete userData.watchlistTimestamps[watchlistName];
    }

    await updateDoc(userRef, {
      watchlist: watchlists,
      watchlistTimestamps: userData.watchlistTimestamps || {},
    });

    document.querySelector(`[data-watchlist="${watchlistName}"]`)?.remove();

    updatePagination();
    await updateWatchlistDisplay();

    alert("✅ Watchlist deleted successfully!");
  } catch (error) {
    console.error("❌ Deletion failed:", error);
    alert("⚠ Something went wrong!");
  }
}

window.deleteWatchlist = deleteWatchlist;

async function loadUserWatchlists() {
  const watchlistContainer = document.getElementById("watchlistContainer");
  watchlistContainer.innerHTML = ""; // Clear previous watchlists

  try {
    // 🔹 Ensure user is authenticated
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("No user logged in");
        window.location.href = "signup.html"; // Redirect if not logged in
        return;
      }

      const userUID = user.uid;
      console.log("User ID:", userUID);

      // 🔹 Fetch user's watchlists
      const userRef = doc(db, "users", userUID);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("User not found!");
        return;
      }

      watchlists = userSnap.data().watchlist || []; // ✅ Assign to global variable

      await updateWatchlistDisplay(); // ✅ Display watchlists for the first page
      updatePagination(); // ✅ Update pagination UI
    });
  } catch (error) {
    console.error("❌ Error loading watchlists:", error);
  }
}

// 🔹 Function to Change Page
window.changePage = async function (page) {
  // ✅ Ensure it's globally accessible
  if (page < 1 || page > Math.ceil(watchlists.length / watchlistsPerPage))
    return; // ✅ Prevent invalid pages
  currentPage = page;
  await updateWatchlistDisplay();
  updatePagination();
};

// 🔹 Function to Update Pagination UI
function updatePagination() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return; // ✅ Avoid error if pagination does not exist

  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(watchlists.length / watchlistsPerPage);

  // 🔹 Add "Previous" button
  if (currentPage > 1) {
    const prevItem = document.createElement("li");
    const prevLink = document.createElement("a");
    prevLink.href = "#";
    prevLink.innerText = "Previous";
    prevLink.addEventListener("click", function (event) {
      event.preventDefault(); // ✅ Prevents full-page reload
      changePage(currentPage - 1);
    });

    prevItem.appendChild(prevLink);
    paginationContainer.appendChild(prevItem);
  }

  // 🔹 Add Numbered Page Buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement("li");
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.innerText = i;
    pageLink.addEventListener("click", function (event) {
      event.preventDefault(); // ✅ Prevents full-page reload
      changePage(i);
    });

    if (i === currentPage) {
      pageItem.classList.add("active");
    }

    pageItem.appendChild(pageLink);
    paginationContainer.appendChild(pageItem);
  }

  // 🔹 Add "Next" button
  if (currentPage < totalPages) {
    const nextItem = document.createElement("li");
    const nextLink = document.createElement("a");
    nextLink.href = "#";
    nextLink.innerText = "Next";
    nextLink.addEventListener("click", function (event) {
      event.preventDefault(); // ✅ Prevents full-page reload
      changePage(currentPage + 1);
    });

    nextItem.appendChild(nextLink);
    paginationContainer.appendChild(nextItem);
  }
}

// ✅ Load watchlists when the page loads
window.onload = loadUserWatchlists;
