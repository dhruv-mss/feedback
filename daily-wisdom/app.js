/* ===================== Daily Wisdom — app logic =====================
   No backend, no analytics, no third-party calls. All state lives in
   localStorage on this device only. */

(function () {
  "use strict";

  var STORAGE = {
    lang: "dw_lang",
    onboarded: "dw_onboarded",
    installAsked: "dw_install_asked",
    daily: "dw_daily_state",
    streak: "dw_streak",
    history: "dw_history"
  };

  var PRINCIPLES = window.PRINCIPLES || [];
  var PRINCIPLES_BY_ID = {};
  PRINCIPLES.forEach(function (p) { PRINCIPLES_BY_ID[p.id] = p; });

  var TEXT = {
    en: {
      appName: "Daily Wisdom",
      chooseTitle: "Choose your language",
      chooseSub: "Please choose the language you'd like to read in.",
      obTitle: "Welcome",
      obBody: [
        "Each day, this app shares one life principle from the teachings of Pujya Shri Rajyogi Narendraji.",
        "Read it, sit with it for a quiet moment, and let us know whether you reflected on it or tried to apply it today.",
        "Come back daily — each visit gently adds to your streak. This isn't about performance, it's simply about showing up.",
        "Whenever you like, you can also read all 100 principles at once, at your own pace."
      ],
      obContinue: "Begin",
      homeApp: "Daily Wisdom",
      langToggle: "ગુજરાતી",
      aiNote: "This is an AI-assisted translation. For the original meaning and nuance, we recommend reading it in Gujarati.",
      checkinQuestion: "Did you reflect on or apply this today?",
      optYes: "Yes",
      optSomewhat: "Somewhat",
      optNot: "Not today",
      thanks: "Thank you for showing up today.",
      streakPrefix: "🪔",
      streakSuffix: function (n) { return n === 1 ? "day in a row" : "days in a row"; },
      longest: function (n) { return "Longest: " + n + (n === 1 ? " day" : " days"); },
      last30: "Your last 30 days",
      readAll: "Read All 100",
      readAllTitle: "All 100 Principles",
      back: "← Back",
      footerCredit: "Pujya Shri Rajyogi Narendraji",
      number: function (n) { return "Principle " + n + " of 100"; },
      installTitle: "Add to Your Home Screen",
      installBody: "Install Daily Wisdom on your device so it opens like an app, right from your home screen — no browser bar, no searching for a link.",
      installBodyIOS: "On iPhone or iPad: tap the Share icon, then choose \"Add to Home Screen.\"",
      installBtn: "Add to Home Screen",
      installNotNow: "Not now"
    },
    gu: {
      appName: "રોજનું જ્ઞાન",
      chooseTitle: "તમારી ભાષા પસંદ કરો",
      chooseSub: "કૃપા કરી તમે જે ભાષામાં વાંચવા ઈચ્છો છો તે પસંદ કરો.",
      obTitle: "સ્વાગત છે",
      obBody: [
        "આ એપ દરરોજ પૂજ્ય શ્રી રાજયોગી નરેન્દ્રજીના ઉપદેશોમાંથી એક જીવન સિદ્ધાંત આપની સાથે વહેંચે છે.",
        "તેને વાંચો, થોડી ક્ષણ તેના પર શાંતિથી ચિંતન કરો, અને આજે તમે તેના પર વિચાર્યું કે તેને અમલમાં મૂક્યું કે નહીં તે અમને જણાવો.",
        "દરરોજ પાછા આવો — દરેક મુલાકાત તમારી નિયમિતતામાં ધીરેથી ઉમેરો કરે છે. આ કોઈ સ્પર્ધા નથી, ફક્ત નિયમિત હાજરી છે.",
        "તમે ઈચ્છો ત્યારે, બધા ૧૦૦ સિદ્ધાંતો પણ એકસાથે, તમારી અનુકૂળતાએ વાંચી શકો છો."
      ],
      obContinue: "શરૂ કરો",
      homeApp: "રોજનું જ્ઞાન",
      langToggle: "English",
      aiNote: "",
      checkinQuestion: "શું આજે તમે આના પર ચિંતન કર્યું કે તેને અમલમાં મૂક્યું?",
      optYes: "હા",
      optSomewhat: "થોડું ઘણું",
      optNot: "આજે નહીં",
      thanks: "આજે અહીં આવવા બદલ આભાર.",
      streakPrefix: "🪔",
      streakSuffix: function (n) { return "દિવસથી સતત"; },
      longest: function (n) { return "સૌથી લાંબો: " + n + " દિવસ"; },
      last30: "તમારા છેલ્લા ૩૦ દિવસ",
      readAll: "બધા ૧૦૦ વાંચો",
      readAllTitle: "બધા ૧૦૦ સિદ્ધાંતો",
      back: "← પાછા",
      footerCredit: "પૂજ્ય શ્રી રાજયોગી નરેન્દ્રજી",
      number: function (n) { return "સિદ્ધાંત " + n + " / 100"; },
      installTitle: "તમારી હોમ સ્ક્રીન પર ઉમેરો",
      installBody: "Daily Wisdom ને તમારા ડિવાઇસ પર ઇન્સ્ટોલ કરો, જેથી તે એપની જેમ સીધું તમારી હોમ સ્ક્રીન પરથી ખૂલે — બ્રાઉઝર બાર કે લિંક શોધવાની જરૂર નહીં.",
      installBodyIOS: "આઇફોન અથવા આઇપેડ પર: Share (શેર) આઇકન દબાવો, પછી \"Add to Home Screen\" પસંદ કરો.",
      installBtn: "હોમ સ્ક્રીન પર ઉમેરો",
      installNotNow: "અત્યારે નહીં"
    }
  };

  var lang = "en"; // current view language, resolved on init

  // ---------------- date helpers ----------------
  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function dateFromStr(s) {
    var parts = s.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function daysBetween(dateStrA, dateStrB) {
    var a = dateFromStr(dateStrA);
    var b = dateFromStr(dateStrB);
    var msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((b - a) / msPerDay);
  }

  function addDaysStr(dateStr, n) {
    var d = dateFromStr(dateStr);
    d.setDate(d.getDate() + n);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  // ---------------- storage helpers ----------------
  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      /* localStorage unavailable — app still works for this session */
    }
  }

  // ---------------- shuffle ----------------
  function shuffledIds() {
    var ids = PRINCIPLES.map(function (p) { return p.id; });
    for (var i = ids.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
    }
    return ids;
  }

  // ---------------- daily rotation state ----------------
  function getDailyState() {
    var today = todayStr();
    var state = loadJSON(STORAGE.daily, null);

    if (!state || !Array.isArray(state.order) || state.order.length !== PRINCIPLES.length) {
      state = { order: shuffledIds(), index: 0, lastShownDate: today };
      saveJSON(STORAGE.daily, state);
      return state;
    }

    var diff = daysBetween(state.lastShownDate, today);
    if (diff > 0) {
      for (var i = 0; i < diff; i++) {
        state.index += 1;
        if (state.index >= state.order.length) {
          state.order = shuffledIds();
          state.index = 0;
        }
      }
      state.lastShownDate = today;
      saveJSON(STORAGE.daily, state);
    } else if (diff < 0) {
      // clock moved backwards — don't rewind progress, just re-stamp today
      state.lastShownDate = today;
      saveJSON(STORAGE.daily, state);
    }

    return state;
  }

  function todaysPrincipleId() {
    var state = getDailyState();
    return state.order[state.index];
  }

  // ---------------- streak + history ----------------
  function getStreak() {
    return loadJSON(STORAGE.streak, { current: 0, longest: 0, lastCheckinDate: null });
  }

  function getHistory() {
    return loadJSON(STORAGE.history, {});
  }

  function effectiveCurrentStreak() {
    var streak = getStreak();
    if (!streak.lastCheckinDate) return 0;
    var today = todayStr();
    var diff = daysBetween(streak.lastCheckinDate, today);
    if (diff <= 1) return streak.current; // still today or unbroken since yesterday
    return 0; // a day was missed — streak has lapsed
  }

  function recordCheckin(response) {
    var today = todayStr();
    var history = getHistory();
    var principleId = todaysPrincipleId();
    history[today] = { principleId: principleId, response: response };
    saveJSON(STORAGE.history, history);

    var streak = getStreak();
    if (streak.lastCheckinDate === today) {
      // already checked in today — just update which response was given
      saveJSON(STORAGE.streak, streak);
      return;
    }

    var diff = streak.lastCheckinDate ? daysBetween(streak.lastCheckinDate, today) : null;
    if (diff === 1) {
      streak.current += 1;
    } else {
      streak.current = 1;
    }
    streak.longest = Math.max(streak.longest || 0, streak.current);
    streak.lastCheckinDate = today;
    saveJSON(STORAGE.streak, streak);
  }

  // ---------------- rendering ----------------
  var els = {};

  function q(id) { return document.getElementById(id); }

  function cacheEls() {
    [
      "screen-language", "screen-onboarding", "screen-install", "screen-home", "screen-readall",
      "ob-title", "ob-body", "ob-continue",
      "install-title", "install-body", "install-ios-note", "install-btn", "install-not-now",
      "home-app-name", "lang-toggle", "home-date",
      "principle-number", "principle-text", "ai-note",
      "checkin-question", "checkin-options", "checkin-thanks",
      "streak-main", "streak-longest", "last30-heading", "dot-grid",
      "btn-read-all", "footer-credit",
      "readall-back", "readall-title", "readall-lang-toggle", "readall-list"
    ].forEach(function (id) { els[id] = q(id); });
  }

  function showScreen(name) {
    ["screen-language", "screen-onboarding", "screen-install", "screen-home", "screen-readall"].forEach(function (id) {
      els[id].hidden = (id !== name);
    });
    window.scrollTo(0, 0);
  }

  function t() { return TEXT[lang]; }

  // ---------------- install prompt (Add to Home Screen) ----------------
  var deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  function isStandaloneDisplay() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }

  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function shouldShowInstallScreen() {
    return !loadJSON(STORAGE.installAsked, false) && !isStandaloneDisplay();
  }

  function renderInstall() {
    els["install-title"].textContent = t().installTitle;
    els["install-title"].className = "screen-title" + (lang === "gu" ? " gu" : "");
    els["install-body"].textContent = t().installBody;
    els["install-body"].className = "onboarding-body" + (lang === "gu" ? " gu" : "");

    if (isIOSDevice()) {
      els["install-ios-note"].hidden = false;
      els["install-ios-note"].textContent = t().installBodyIOS;
      els["install-ios-note"].className = "muted" + (lang === "gu" ? " gu" : "");
    } else {
      els["install-ios-note"].hidden = true;
    }

    els["install-btn"].textContent = t().installBtn;
    els["install-not-now"].textContent = t().installNotNow;
  }

  function renderOnboarding() {
    els["ob-title"].textContent = t().obTitle;
    els["ob-title"].className = "screen-title" + (lang === "gu" ? " gu" : "");
    els["ob-body"].innerHTML = "";
    els["ob-body"].className = "onboarding-body" + (lang === "gu" ? " gu" : "");
    t().obBody.forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      els["ob-body"].appendChild(p);
    });
    els["ob-continue"].textContent = t().obContinue;
  }

  function renderHome() {
    var id = todaysPrincipleId();
    var principle = PRINCIPLES_BY_ID[id];

    els["home-app-name"].textContent = t().homeApp;
    els["home-app-name"].className = "brand" + (lang === "gu" ? " gu" : "");
    els["lang-toggle"].textContent = t().langToggle;

    var d = new Date();
    els["home-date"].textContent = d.toLocaleDateString(lang === "gu" ? "gu-IN" : "en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    els["principle-number"].textContent = t().number(id);
    els["principle-text"].textContent = principle ? principle[lang] : "";
    els["principle-text"].className = "principle-text" + (lang === "gu" ? " gu" : "");

    if (lang === "en") {
      els["ai-note"].hidden = false;
      els["ai-note"].textContent = t().aiNote;
    } else {
      els["ai-note"].hidden = true;
    }

    els["checkin-question"].textContent = t().checkinQuestion;
    els["checkin-question"].className = "checkin-question" + (lang === "gu" ? " gu" : "");

    var history = getHistory();
    var today = todayStr();
    var todaysEntry = history[today];

    var options = [
      { key: "yes", label: t().optYes },
      { key: "somewhat", label: t().optSomewhat },
      { key: "not_today", label: t().optNot }
    ];

    els["checkin-options"].innerHTML = "";
    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.className = "checkin-btn" + (lang === "gu" ? " gu" : "") +
        (todaysEntry && todaysEntry.response === opt.key ? " selected" : "");
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        recordCheckin(opt.key);
        renderHome();
      });
      els["checkin-options"].appendChild(btn);
    });

    if (todaysEntry) {
      els["checkin-thanks"].hidden = false;
      els["checkin-thanks"].textContent = t().thanks;
      els["checkin-thanks"].className = "checkin-thanks" + (lang === "gu" ? " gu" : "");
    } else {
      els["checkin-thanks"].hidden = true;
    }

    var streakCount = effectiveCurrentStreak();
    var streak = getStreak();
    els["streak-main"].innerHTML = "";
    var prefixSpan = document.createElement("span");
    prefixSpan.textContent = t().streakPrefix + " " + streakCount + " ";
    var suffixSpan = document.createElement("span");
    suffixSpan.textContent = t().streakSuffix(streakCount);
    els["streak-main"].appendChild(prefixSpan);
    els["streak-main"].appendChild(suffixSpan);
    els["streak-main"].className = "streak-main" + (lang === "gu" ? " gu" : "");

    els["streak-longest"].textContent = t().longest(streak.longest || 0);
    els["streak-longest"].className = "streak-longest" + (lang === "gu" ? " gu" : "");

    els["last30-heading"].textContent = t().last30;
    els["last30-heading"].className = "last30-heading" + (lang === "gu" ? " gu" : "");

    renderDotGrid(history, today);

    els["btn-read-all"].textContent = t().readAll;
    els["btn-read-all"].className = "btn btn-secondary btn-wide" + (lang === "gu" ? " gu" : "");

    els["footer-credit"].textContent = t().footerCredit;
    els["footer-credit"].className = lang === "gu" ? "gu" : "";
  }

  function renderDotGrid(history, today) {
    els["dot-grid"].innerHTML = "";
    for (var i = 29; i >= 0; i--) {
      var dateStr = addDaysStr(today, -i);
      var entry = history[dateStr];
      var dot = document.createElement("div");
      dot.className = "dot" + (entry ? " resp-" + entry.response : "") + (dateStr === today ? " is-today" : "");
      dot.title = dateStr;
      els["dot-grid"].appendChild(dot);
    }
  }

  function renderReadAll() {
    els["readall-back"].textContent = t().back;
    els["readall-title"].textContent = t().readAllTitle;
    els["readall-title"].className = "brand" + (lang === "gu" ? " gu" : "");
    els["readall-lang-toggle"].textContent = t().langToggle;

    els["readall-list"].innerHTML = "";
    PRINCIPLES.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "readall-card";

      var num = document.createElement("p");
      num.className = "readall-number";
      num.textContent = t().number(p.id);

      var text = document.createElement("p");
      text.className = "readall-text" + (lang === "gu" ? " gu" : "");
      text.textContent = p[lang];

      card.appendChild(num);
      card.appendChild(text);
      els["readall-list"].appendChild(card);
    });
  }

  // ---------------- init / flow ----------------
  function setLang(newLang) {
    lang = newLang;
    saveJSON(STORAGE.lang, newLang);
  }

  function init() {
    cacheEls();

    els["ob-continue"].addEventListener("click", function () {
      saveJSON(STORAGE.onboarded, true);
      proceedPastOnboarding();
    });

    els["install-btn"].addEventListener("click", function () {
      saveJSON(STORAGE.installAsked, true);
      if (deferredInstallPrompt) {
        var promptEvent = deferredInstallPrompt;
        deferredInstallPrompt = null;
        promptEvent.prompt();
        promptEvent.userChoice.then(function () { enterHome(); });
      } else {
        enterHome();
      }
    });

    els["install-not-now"].addEventListener("click", function () {
      saveJSON(STORAGE.installAsked, true);
      enterHome();
    });

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("./sw.js").catch(function () { /* offline caching is a nice-to-have */ });
      });
    }

    var storedLang = loadJSON(STORAGE.lang, null);
    var onboarded = loadJSON(STORAGE.onboarded, false);

    if (!storedLang) {
      // First-ever visit: ask for language before anything else.
      showScreen("screen-language");
      document.querySelectorAll(".btn-lang").forEach(function (btn) {
        btn.addEventListener("click", function () {
          setLang(btn.getAttribute("data-lang"));
          renderOnboarding();
          showScreen("screen-onboarding");
        });
      });
      return;
    }

    lang = storedLang;

    if (!onboarded) {
      renderOnboarding();
      showScreen("screen-onboarding");
      return;
    }

    proceedPastOnboarding();
  }

  function proceedPastOnboarding() {
    if (shouldShowInstallScreen()) {
      renderInstall();
      showScreen("screen-install");
      return;
    }
    enterHome();
  }

  function enterHome() {
    renderHome();
    showScreen("screen-home");

    els["lang-toggle"].addEventListener("click", function () {
      setLang(lang === "en" ? "gu" : "en");
      renderHome();
    });

    els["btn-read-all"].addEventListener("click", function () {
      renderReadAll();
      showScreen("screen-readall");
    });

    els["readall-back"].addEventListener("click", function () {
      renderHome();
      showScreen("screen-home");
    });

    els["readall-lang-toggle"].addEventListener("click", function () {
      setLang(lang === "en" ? "gu" : "en");
      renderReadAll();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
