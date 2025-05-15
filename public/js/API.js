// Utility function for API calls
import { TMDB_BEARER_TOKEN } from "./secureKeys.js";
const imageBaseUrl = "https://image.tmdb.org/t/p/";
const originalImgURL = (path) =>
  path ? `${imageBaseUrl}original${path}` : null;

async function apiCall(endpoint, method = "GET", body = null, headers = {}) {
  const baseUrl = "https://api.themoviedb.org/3"; // TMDB base URL
  const apiKey = TMDB_BEARER_TOKEN; // Replace with your TMDB API key
  const url = `${baseUrl}${endpoint}?api_key=${apiKey}`;

  const options = {
    method,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
}

// Example endpoints for TMDB
const endpoints = {
  trendingMovies: "/trending/movie/week",
  popularMovies: "/movie/popular",
  movieDetails: (movieId) => `/movie/${movieId}`,
  searchMovies: (query, page = 1) =>
    `/search/movie?query=${query}&include_adult=true&page=${page}`,
  nowPlaying: "/movie/now_playing",
  movieCredits: (movieId) => `/movie/${movieId}/credits`,
  movieImages: (movieId) => `/movie/${movieId}/images`,
  similarMovies: (movieId) => `/movie/${movieId}/similar`,

  // Series endpoints
  trendingSeries: "/trending/tv/week",
  seriesDetails: (seriesId) => `/tv/${seriesId}`,
  searchSeries: (query, page = 1) =>
    `/search/tv?query=${query}&include_adult=false&page=${page}`,
  airingToday: "/tv/airing_today",
  onTheAir: "/tv/on_the_air",
  topRatedSeries: "/tv/top_rated",
  popularSeries: "/tv/popular",
  seasonDeatils: (seriesId, seasonNumber) =>
    `/tv/${seriesId}/season/${seasonNumber}`,
  seriesImages: (seriesId) => `/tv/${seriesId}/images`,
  seriesCredits: (seriesId) => `/tv/${seriesId}/credits`,
  similarSeries: (seriesId) => `/tv/${seriesId}/similar`,

  //Common endpoints
  searchMulti: (query, page = 1) =>
    `/search/multi?query=${query}&include_adult=false&page=${page}`,
};

// Example usage of the API call function

// Fetch trending movies
async function fetchTrendingMovies() {
  return await apiCall(endpoints.trendingMovies);
}

async function fetchPopularMovies() {
  return await apiCall(endpoints.popularMovies);
}

// Fetch details of a specific movie
async function fetchMovieDetails(movieId) {
  return await apiCall(endpoints.movieDetails(movieId));
}

async function fetchMovieCredits(movieId) {
  return await apiCall(endpoints.movieCredits(movieId));
}

async function fetchSimilarMovies(movieId) {
  return await apiCall(endpoints.similarMovies(movieId));
}

async function fetchMovieImages(movieId) {
  return await apiCall(endpoints.movieImages(movieId));
}
// Search for movies by title
async function searchMovies(query, page) {
  return await apiCall(endpoints.searchMovies(query, page));
}

async function searchMulti(query, page) {
  return await apiCall(endpoints.searchMulti(query, page));
}

// Fetch movies currently playing in theaters
async function fetchNowPlayingMovies() {
  return await apiCall(endpoints.nowPlaying);
}

async function fetchTrendingSeries() {
  return await apiCall(endpoints.trendingSeries);
}

// Fetch details of a specific series
async function fetchSeriesDetails(seriesId) {
  return await apiCall(endpoints.seriesDetails(seriesId));
}

async function fetchSeasonDetails(seriesId, seasonNumber) {
  return await apiCall(endpoints.seasonDeatils(seriesId, seasonNumber));
}

async function fetchSimilarSeries(seriesId) {
  return await apiCall(endpoints.similarSeries(seriesId));
}

// Search for TV series by title
async function searchSeries(query, page) {
  return await apiCall(endpoints.searchSeries(query, page));
}

// Fetch series airing today
async function fetchAiringTodaySeries() {
  return await apiCall(endpoints.airingToday);
}

// Fetch series currently on the air
async function fetchOnTheAirSeries() {
  return await apiCall(endpoints.onTheAir);
}

// Fetch top-rated TV series
async function fetchTopRatedSeries() {
  return await apiCall(endpoints.topRatedSeries);
}

// Fetch popular TV series
async function fetchPopularSeries() {
  return await apiCall(endpoints.popularSeries);
}

async function fetchSeriesImages(seriesId) {
  return await apiCall(endpoints.seriesImages(seriesId));
}

async function fetchSeriesCredits(seriesId) {
  return await apiCall(endpoints.seriesCredits(seriesId));
}

async function fetchMediaPoster(id) {
  return `https://image.tmdb.org/t/p/w500/${id}`;
}
// Exporting functions for use in other files
// API.js (Converted to ES6 export syntax)

export {
  fetchTrendingMovies,
  fetchMovieDetails,
  searchMovies,
  fetchNowPlayingMovies,
  fetchTrendingSeries,
  fetchSeriesDetails,
  searchSeries,
  fetchAiringTodaySeries,
  fetchOnTheAirSeries,
  fetchTopRatedSeries,
  fetchPopularSeries,
  fetchPopularMovies,
  fetchMovieCredits,
  fetchMovieImages,
  searchMulti,
  fetchSeasonDetails,
  fetchSeriesImages,
  fetchSeriesCredits,
  fetchSimilarMovies,
  fetchSimilarSeries,
};

// Example calls
// (async () => {
//   try {
//     // Fetch trending movies
//     // const trending = await fetchTrendingMovies();
//     // if (trending && trending.results) {
//     //   console.log("Trending Movie:", trending.results[0]); // Corrected access
//     // } else {
//     //   console.log("No trending movies found.");
//     // }

//     // // Fetch details of a specific movie
//     // const movieDetails = await fetchMovieDetails(550); // Example movie ID: Fight Club
//     // console.log("Movie Details:", movieDetails); // No index needed since it's a single object

//     // // Search for movies by title
//     // const searchResults = await searchMovies("Inception", 1);
//     // if (searchResults && searchResults.results) {
//     //   console.log("Search Result:", searchResults); // Corrected access
//     // } else {
//     //   console.log("No search results found.");
//     // }

//     // // Fetch now-playing movies
//     // const nowPlaying = await fetchNowPlayingMovies();
//     // if (nowPlaying && nowPlaying.results) {
//     //   console.log("Now Playing Movie:", nowPlaying.results[0]); // Corrected access
//     // } else {
//     //   console.log("No now-playing movies found.");
//     // }

//     const trendingSeries = await fetchTrendingSeries();
//     if (trendingSeries && trendingSeries.results) {
//       console.log("Trending Series:", trendingSeries.results[0]); // Corrected access
//     } else {
//       console.log("No trending series found.");
//     }

//     // Fetch details of a specific series
//     const seriesDetails = await fetchSeriesDetails(1399); // Example series ID: Game of Thrones
//     console.log("Series Details:", seriesDetails); // No index needed since it's a single object

//     // Search for TV series by title
//     const seriesSearchResults = await searchSeries("Breaking Bad", 1);
//     if (seriesSearchResults && seriesSearchResults.results) {
//       console.log("Search Result (Series):", seriesSearchResults.results[0]); // Corrected access
//     } else {
//       console.log("No series search results found.");
//     }

//     // Fetch series airing today
//     const airingToday = await fetchAiringTodaySeries();
//     if (airingToday && airingToday.results) {
//       console.log("Airing Today Series:", airingToday.results[0]); // Corrected access
//     } else {
//       console.log("No series airing today found.");
//     }

//     // Fetch popular series
//     const popularSeries = await fetchPopularSeries();
//     if (popularSeries && popularSeries.results) {
//       console.log("Popular Series:", popularSeries.results[0]); // Corrected access
//     } else {
//       console.log("No popular series found.");
//     }
//   } catch (error) {
//     console.error("Error during TMDB API calls:", error);
//   }
// })();
