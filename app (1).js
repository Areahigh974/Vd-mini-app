/**
 * Myanmar 2D/3D Lottery App Logic
 * Designed for Telegram Mini App
 */

// --- CONFIGURATION ---
const ADSGRAM_BLOCK_ID = "YOUR_ADSGRAM_BLOCK_ID"; // <<< အရေးကြီး: သင်၏ Adsgram Block ID ဖြင့် အစားထိုးပါ။
const API_URL = "https://api.thaistock2d.com/live"; // Placeholder for real API

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Apply Telegram theme colors if needed
        // document.body.style.backgroundColor = tg.backgroundColor;
    }

    // Initialize UI Elements
    initApp();
    
    // Setup Event Listeners
    document.getElementById("generate-btn").addEventListener("click", handleLuckyNumberGeneration);
});

/**
 * Initialize application data and timers
 */
function initApp() {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initial data fetch
    fetchLotteryData();
    
    // Auto-refresh every 60 seconds for live results
    setInterval(fetchLotteryData, 60000);
    
    // Load past results
    loadPastResults();

    // Initialize Adsgram for banner ad
    initAdsgramBanner();
}

/**
 * Update the UI clock
 */
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { 
        hour12: false, 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
    });
    document.getElementById("current-time").innerText = timeString;
}

/**
 * Fetch Live 2D/3D data from Thai SET Index
 * Since we don't have a specific free API key, we'll use a mock function
 * with real logic structure that can be easily connected.
 */
async function fetchLotteryData() {
    showLoading(true);
    
    try {
        // In a real scenario, you would fetch from a proxy or real API:
        // const response = await fetch(API_URL);
        // const data = await response.json();
        
        // For this demo, we simulate real-time data
        const mockData = getMockLiveResult();
        updateLiveUI(mockData);
        
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        showLoading(false);
    }
}

/**
 * Update UI with fetched data
 */
function updateLiveUI(data) {
    document.getElementById("live-set").innerText = data.set;
    document.getElementById("live-value").innerText = data.value;
    document.getElementById("live-2d").innerText = data.twod;
    document.getElementById("live-3d").innerText = data.threed;
    document.getElementById("last-update").innerText = data.time;
    
    // Update today's history if applicable
    if (data.history) {
        if (data.history["12:01"]) document.getElementById("history-1201").innerText = data.history["12:01"];
        if (data.history["04:30"]) document.getElementById("history-0430").innerText = data.history["04:30"];
    }
}

/**
 * Generate mock data for demonstration
 */
function getMockLiveResult() {
    const now = new Date();
    const set = (1300 + Math.random() * 50).toFixed(2);
    const value = (30000 + Math.random() * 10000).toFixed(2);
    
    // 2D is the last digit of SET and last digit of Value
    const twod = set.split(".")[1].slice(-1) + value.split(".")[1].slice(-1);
    
    // 3D is usually derived from SET and other values (simplified here)
    const threed = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    
    return {
        set: set,
        value: value,
        twod: twod,
        threed: threed,
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        history: {
            "12:01": "45",
            "04:30": "--"
        }
    };
}

/**
 * Load and display past 7 days results
 */
function loadPastResults() {
    const tableBody = document.getElementById("past-results-body");
    const pastData = [
        { date: "2026-06-24", am: "12", pm: "89" },
        { date: "2026-06-23", am: "45", pm: "21" },
        { date: "2026-06-22", am: "78", pm: "33" },
        { date: "2026-06-21", am: "--", pm: "--" }, // Sunday
        { date: "2026-06-20", am: "--", pm: "--" }, // Saturday
        { date: "2026-06-19", am: "09", pm: "56" },
        { date: "2026-06-18", am: "23", pm: "77" }
    ];
    
    tableBody.innerHTML = "";
    pastData.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.am}</td>
            <td>${row.pm}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Handle Lucky Number Generation with Ad Trigger
 */
function handleLuckyNumberGeneration() {
    // Show Ad before giving lucky number
    showInterstitialAd(() => {
        const lucky = Math.floor(Math.random() * 100).toString().padStart(2, "0");
        document.getElementById("lucky-number").innerText = lucky;
        
        // Haptic feedback if in Telegram
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
        }
    });
}

/**
 * Adsgram Banner Integration
 */
function initAdsgramBanner() {
    if (window.Adsgram && ADSGRAM_BLOCK_ID !== "YOUR_ADSGRAM_BLOCK_ID") {
        const bannerAdContainer = document.getElementById("banner-ad");
        if (bannerAdContainer) {
            const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
            AdController.showBanner(bannerAdContainer, { /* options */ }); // Assuming showBanner exists
        }
    } else if (ADSGRAM_BLOCK_ID === "YOUR_ADSGRAM_BLOCK_ID") {
        console.warn("Adsgram Banner: Please replace YOUR_ADSGRAM_BLOCK_ID with your actual block ID.");
    }
}

/**
 * Adsgram Interstitial/Rewarded Ad Integration Helper
 */
function showInterstitialAd(callback) {
    if (window.Adsgram && ADSGRAM_BLOCK_ID !== "YOUR_ADSGRAM_BLOCK_ID") {
        const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        
        showLoading(true);
        AdController.show().then((result) => {
            // Ad watched or closed
            console.log("Adsgram Interstitial Ad result:", result);
            callback();
        }).catch((error) => {
            console.error("Adsgram Interstitial Ad error:", error);
            // Even if ad fails, we usually let the user proceed
            callback();
        }).finally(() => {
            showLoading(false);
        });
    } else {
        // Adsgram not loaded or block ID not set (e.g. standalone browser or not configured)
        console.warn("Adsgram Interstitial Ad: Not loaded or Block ID not set. Skipping ad.");
        callback();
    }
}

/**
 * Loading Overlay Helper
 */
function showLoading(isVisible) {
    const loader = document.getElementById("loading-overlay");
    if (isVisible) {
        loader.classList.remove("hidden");
    } else {
        loader.classList.add("hidden");
    }
}
