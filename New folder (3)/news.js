// ======= CONFIG =======
const API_KEY = "b5d151f6d26c4fd5bead6ff4f2689eb1";
const BASE_URL = "https://newsapi.org/v2/everything?q=";

// ======= INITIAL LOAD =======
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    const dt = document.getElementById("dark-toggle");
    if (dt) dt.textContent = "☀️";
  }
  fetchNews("India");
  renderSavedNews();
});

// ======= RELOAD =======
function reload() { window.location.reload(); }

// ======= ELEMENTS =======
const cardsContainer = document.getElementById("cards-container");
const newsCardTemplate = document.getElementById("template-news-card");
const savedCardTemplate = document.getElementById("template-saved-card");
const loader = document.getElementById("loader");
const toast = document.getElementById("toast");
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");
const suggestionsBox = document.getElementById("suggestions");
const backToTop = document.getElementById("back-to-top");
const savedSection = document.getElementById("saved-section");
const newsSection = document.getElementById("news-section");
const clearSavedBtn = document.getElementById("clear-saved");
const backToNewsBtn = document.getElementById("back-to-news");
const darkToggle = document.getElementById("dark-toggle");

// Overlay sections
const overlaySections = {
  about: document.getElementById("about"),
  goals: document.getElementById("goals"),
  services: document.getElementById("services")
};

// ======= STATE =======
let curSelectedNav = null;
let savedNews = loadSaved();

// ======= FETCH NEWS =======
async function fetchNews(query) {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}${encodeURIComponent(query)}&apiKey=${API_KEY}`);
    const data = await res.json();
    if (data.status !== "ok") {
      showToast(data.message || "Failed to fetch news.");
      cardsContainer.innerHTML = "";
      return;
    }
    bindData(data.articles || []);
    showNewsSection();
  } catch (err) {
    showToast("Network error. Please try again.");
  } finally {
    hideLoader();
  }
}

// ======= RENDER NEWS CARDS =======
function bindData(articles) {
  cardsContainer.innerHTML = "";
  if (!articles || articles.length === 0) {
    showToast("No articles found for this search.");
    return;
  }
  articles.forEach((article) => {
    if (!article?.urlToImage || !article?.url) return;
    const cardClone = newsCardTemplate.content.cloneNode(true);
    fillNewsCard(cardClone, article);
    cardsContainer.appendChild(cardClone);
  });
}

function fillNewsCard(cardClone, article) {
  const newsImg = cardClone.querySelector("#news-img");
  const newsTitle = cardClone.querySelector("#news-title");
  const newsSource = cardClone.querySelector("#news-source");
  const newsDesc = cardClone.querySelector("#news-desc");
  const saveBtn = cardClone.querySelector(".bookmark-btn");

  newsImg.src = article.urlToImage;
  newsImg.alt = article.title || "news image";
  newsTitle.textContent = article.title || "Untitled";
  newsDesc.textContent = article.description || "";

  const date = new Date(article.publishedAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  newsSource.textContent = `${article?.source?.name || "Unknown"} · ${date}`;

  cardClone.firstElementChild.addEventListener("click", () => {
    window.open(article.url, "_blank", "noopener");
  });

  saveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveArticle(article);
  });
}

// ======= NAVBAR HANDLING =======
function onNavItemClick(id) {
  if (id === "saved") { showSavedSection(); return; }
  fetchNews(id);
  const navItem = document.getElementById(id);
  setActiveNav(navItem);
}

function setActiveNav(navItem) {
  curSelectedNav?.classList.remove("active");
  curSelectedNav = navItem;
  curSelectedNav?.classList.add("active");
  const savedLink = document.getElementById("saved-link");
  if (savedLink && curSelectedNav !== savedLink) savedLink.classList.remove("active");
}

// ======= SEARCH =======
searchButton.addEventListener("click", () => {
  const query = searchText.value.trim();
  if (!query) return;
  fetchNews(query);
  setActiveNav(null);
});

searchText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = searchText.value.trim();
    if (!q) return;
    fetchNews(q);
    setActiveNav(null);
    suggestionsBox.style.display = "none";
  }
});

// ======= AUTOCOMPLETE =======
const topics = ["India","Science","Technology","Finance","Health","Politics","Sports","Weather","Movies","Education","Startups","AI","Space"];
searchText.addEventListener("input", () => {
  const input = searchText.value.toLowerCase();
  suggestionsBox.innerHTML = "";
  if (!input) { suggestionsBox.style.display = "none"; return; }
  const filtered = topics.filter((t) => t.toLowerCase().startsWith(input)).slice(0,6);
  if (!filtered.length) { suggestionsBox.style.display="none"; return; }
  suggestionsBox.style.display="block";
  filtered.forEach((topic)=>{
    const div = document.createElement("div");
    div.textContent=topic;
    div.addEventListener("click",()=>{
      searchText.value=topic;
      suggestionsBox.style.display="none";
      fetchNews(topic);
      setActiveNav(null);
    });
    suggestionsBox.appendChild(div);
  });
});
document.addEventListener("click",(e)=>{
  if(!e.target.closest(".search-bar")) suggestionsBox.style.display="none";
});

// ======= LOADER & TOAST =======
function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }
function showToast(message){
  toast.textContent = message;
  toast.classList.remove("hidden");
  requestAnimationFrame(()=>toast.classList.add("show"));
  setTimeout(()=>{
    toast.classList.remove("show");
    setTimeout(()=>toast.classList.add("hidden"),300);
  },2500);
}

// ======= BACK TO TOP =======
window.addEventListener("scroll", ()=>{
  if(window.scrollY>300) backToTop.classList.remove("hidden");
  else backToTop.classList.add("hidden");
});
backToTop.addEventListener("click", ()=>window.scrollTo({top:0,behavior:"smooth"}));

// ======= DARK MODE =======
darkToggle.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkToggle.textContent = isDark?"☀️":"🌙";
  localStorage.setItem("theme", isDark?"dark":"light");
});

// ======= SAVED / READ LATER =======
function loadSaved(){ try{return JSON.parse(localStorage.getItem("savedNews"))||[];}catch{return [];} }
function persistSaved(){ localStorage.setItem("savedNews",JSON.stringify(savedNews)); }

function saveArticle(article){
  if(savedNews.some(a=>a.url===article.url)){ showToast("Already saved!"); return; }
  const {title,description,url,urlToImage,source,publishedAt}=article;
  savedNews.unshift({title,description,url,urlToImage,source,publishedAt});
  persistSaved();
  showToast("Saved for later! 📌");
  if(!savedSection.classList.contains("hidden")) renderSavedNews();
}

function renderSavedNews(){
  const savedContainer=document.getElementById("saved-container");
  savedContainer.innerHTML="";
  if(savedNews.length===0){
    const empty=document.createElement("p");
    empty.textContent="No saved news yet.";
    empty.className="container news-desc";
    savedContainer.appendChild(empty);
    return;
  }
  savedNews.forEach(article=>{
    const cardClone=savedCardTemplate.content.cloneNode(true);
    const img=cardClone.querySelector("#news-img");
    const title=cardClone.querySelector("#news-title");
    const src=cardClone.querySelector("#news-source");
    const desc=cardClone.querySelector("#news-desc");
    const readLink=cardClone.querySelector(".read-link");
    const removeBtn=cardClone.querySelector("[data-action='remove']");
    img.src=article.urlToImage||"https://via.placeholder.com/400x200";
    img.alt=article.title||"news image";
    title.textContent=article.title||"Untitled";
    desc.textContent=article.description||"";
    const date=new Date(article.publishedAt).toLocaleString("en-US",{timeZone:"Asia/Kolkata"});
    src.textContent=`${article?.source?.name||"Unknown"} · ${date}`;
    readLink.href=article.url;
    removeBtn.addEventListener("click",()=>{ removeSaved(article.url); });
    savedContainer.appendChild(cardClone);
  });
}

function removeSaved(url){ savedNews=savedNews.filter(a=>a.url!==url); persistSaved(); renderSavedNews(); showToast("Removed from saved."); }
function clearAllSaved(){ if(savedNews.length===0){ showToast("Nothing to clear!"); return; } if(!confirm("Clear all saved articles?")) return; savedNews=[]; persistSaved(); renderSavedNews(); showToast("Cleared all saved articles."); }
function showSavedSection(){ newsSection.classList.add("hidden"); savedSection.classList.remove("hidden"); renderSavedNews(); const savedLink=document.getElementById("saved-link"); setActiveNav(savedLink); }
function showNewsSection(){ savedSection.classList.add("hidden"); newsSection.classList.remove("hidden"); }

// Saved section controls
clearSavedBtn.addEventListener("click", clearAllSaved);
backToNewsBtn.addEventListener("click",()=>{ showNewsSection(); setActiveNav(null); });

// ======= OVERLAY SECTIONS =======
function openOverlay(id) {
  // Hide main sections
  newsSection.classList.add("hidden");
  savedSection.classList.add("hidden");

  // Hide all overlays first
  for (const key in overlaySections) {
    overlaySections[key].classList.remove("overlay-active");
  }

  const overlay = overlaySections[id];
  if (!overlay) return;

  overlay.classList.add("overlay-active");

  // Add close button only once
  if (!overlay.querySelector(".overlay-close")) {
    const btn = document.createElement("button");
    btn.className = "overlay-close";
    btn.textContent = "❌";
    btn.addEventListener("click", closeOverlay);
    overlay.appendChild(btn);
  }
}

function closeOverlay() {
  // Hide all overlays
  for (const key in overlaySections) {
    overlaySections[key].classList.remove("overlay-active");
  }

  // Show main news section again
  newsSection.classList.remove("hidden");
  savedSection.classList.add("hidden");

  // Scroll to top for better UX
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Sidebar links open overlays
const sidebarLinks = document.querySelectorAll(".sidebar ul li a");
sidebarLinks.forEach(link=>{
  link.addEventListener("click", (e)=>{
    e.preventDefault();
    const targetId = link.getAttribute("href").slice(1);
    openOverlay(targetId);
  });
});




