import {
  fetchTrendingMovies,
  fetchPopularSeries,
  fetchPopularMovies,
  fetchSeriesDetails,
  fetchMovieDetails,
} from "../API.js";

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

import { firebaseConfig } from "../firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ✅ Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ User already logged in:", user);
    window.location.href = "index.html"; // Redirect to homepage
  }
});

// ✅ Handle Email/Password Sign-Up
document.getElementById("signUpForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("❌ Passwords do not match!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("✅ Email Sign-Up:", user);
    alert("✅ Signup successful!");

    // Send user data to backend for storage
    await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: user.email, username }),
    });

    // ✅ Redirect user after successful signup
    window.location.href = "index.html";
  } catch (error) {
    console.error("❌ Email Sign-Up Error:", error.message);
    alert(error.message);
  }
});

// ✅ Handle Email/Password Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("✅ Email Login:", user);
    alert("✅ Login successful!");

    // ✅ Redirect user after successful login
    window.location.href = "index.html";
  } catch (error) {
    console.error("❌ Email Login Error:", error.message);
    alert(error.message);
  }
});

// ✅ Handle Google Sign-Up
document.getElementById("googleSignUp").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("✅ Google Sign-In (Sign Up):", user);
    alert("✅ Google Sign-Up successful!");

    // Send user data to backend for storage
    await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        username: user.displayName,
      }),
    });

    // ✅ Redirect user after successful Google sign-up
    window.location.href = "index.html";
  } catch (error) {
    console.error("❌ Google Sign-In Error (Sign Up):", error.message);
    alert(error.message);
  }
});

// ✅ Handle Google Login
document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("✅ Google Sign-In (Login):", user);
    alert("✅ Google Login successful!");

    // ✅ Redirect user after successful Google login
    window.location.href = "index.html";
  } catch (error) {
    console.error("❌ Google Sign-In Error (Login):", error.message);
    alert(error.message);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch trending movies
    const trending = await fetchTrendingMovies();
    const popularMovies = await fetchPopularMovies();
    const popularSeries = await fetchPopularSeries();
    let heroPosterpath = "";
    if (trending && trending.results && trending.results.length > 0) {
      console.log(
        "Trending Movie Backdrop Path:",
        trending.results[0].backdrop_path
      );
      heroPosterpath = trending.results[0].backdrop_path;

      // Constructing the image URL for the hero banner
      const imageBaseUrl = "https://image.tmdb.org/t/p/original";
      const heroImageUrl = `${imageBaseUrl}${heroPosterpath}`;
      console.log("Hero Image URL:", heroImageUrl);

      // Update the hero banner with the first trending movie's backdrop image
      const heroBanner = document.getElementById("heroBanner");
      if (heroBanner) {
        console.log("Got Hero Banner");
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
            console.log("Movie Details:", JSON.stringify(movieDetail, null, 2));

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
                <h2 class="title wow fadeInUp" data-wow-delay=".4s" data-wow-duration="1.8s">Welcome to Cinema</h2>
                <div class="banner-meta wow fadeInUp" data-wow-delay=".6s" data-wow-duration="1.8s">
                  <ul>
                    
                    <li class="category">
                      Join our movie community platform to discover, discuss, and enjoy the latest movies and series with fellow enthusiasts. Stay updated with trending content and exclusive insights.
                    </li>
                    
                  </ul>
                </div>
                <a href="#signUpFormSection" class="banner-btn btn popup-video wow fadeInUp" data-wow-delay=".8s" data-wow-duration="1.8s"><i class="fas fa-user"></i> Sign Up</a>
              </div>
            `;
            carouselContainer.appendChild(slide);
          } catch (error) {
            console.error("Error fetching movie details:", error);
          }
        }
      })();

      // Fetch popular movies

      // Function to change the slide every 5 seconds
      let currentSlide = 0;
      const slides = document.querySelectorAll(".banner-item");
      const totalSlides = slides.length;

      function showSlide(index) {
        slides.forEach((slide, i) => {
          slide.classList.remove("active");
          if (i === index) {
            slide.classList.add("active");
            // Update the hero banner background image with the current carousel item
            const currentMovie = moviesToShow[i];
            const currentBackdropPath = currentMovie.backdrop_path;
            const currentImageUrl = `${imageBaseUrl}${currentBackdropPath}`;
            if (heroBanner) {
              heroBanner.style.backgroundImage = `url(${currentImageUrl})`;
            }
          }
        });
      }

      // Change the slide every 5 seconds
      setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
      }, 5000);

      // Initially show the first slide
      showSlide(currentSlide);
    } else {
      console.log("No trending movies found or invalid response.");
    }
  } catch (error) {
    console.error("Error during API call or DOM manipulation:", error);
  }

  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");

  loginForm.style.display = "none";
  signUpForm.style.display = "block";

  document.getElementById("loginTab").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "block";
    signUpForm.style.display = "none";
  });
  document.getElementById("signUpTab").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    signUpForm.style.display = "block";
  });
});
