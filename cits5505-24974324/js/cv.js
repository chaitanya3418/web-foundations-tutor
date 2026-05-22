/*
  ============================================================
  cv.js — CV Page Logic
  ============================================================
  This file controls the interactive elements on the CV page:

    1. Toggle contact details visibility (show/hide section)
    2. Load CV card data from a local JSON file via AJAX
    3. Filter displayed cards by category
    4. Animate stat counters on page load
    5. Update the scroll progress bar
    6. Highlight the active floating shortcut
    7. Fade-in elements as they scroll into view

  As with all other pages, everything runs inside the
  DOMContentLoaded callback so the HTML exists before
  JavaScript tries to interact with it.
  ============================================================
*/

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
     SECTION 1 — ELEMENT REFERENCES
     ============================================================
     Grab all the DOM elements this file will work with.
     These are assigned once at the top so every function below
     can use them without calling getElementById repeatedly.
  ============================================================ */

  // Progress bar along the top of the page
  const scrollProgress       = document.getElementById("scrollProgress");

  // Contact section toggle button and the box it shows/hides
  const toggleContactBtn     = document.getElementById("toggleContactBtn");
  const contactPlaceholderBox = document.getElementById("contactPlaceholderBox");

  // CV card grid — loading spinner, error state, and the grid container
  const cvLoading            = document.getElementById("cvLoading");  // spinner during fetch
  const cvError              = document.getElementById("cvError");    // shown on fetch failure
  const cvCardGrid           = document.getElementById("cvCardGrid"); // holds the rendered cards

  // Filter buttons (All / Education / Projects / Skills / Work)
  const filterButtons        = document.querySelectorAll(".filter-btn");

  // Number elements that animate from 0 up to a target value
  const metricValues         = document.querySelectorAll(".metric-value");


  /* ============================================================
     SECTION 2 — DATA STATE
     ============================================================
     "cvItems" will hold the array of CV entry objects loaded
     from cv-data.json. It starts empty and is filled after
     the AJAX request completes.

     "currentFilter" tracks which category is selected so we can
     re-render correctly when switching filters.
  ============================================================ */

  let cvItems       = [];       // all CV entries (filled after AJAX)
  let currentFilter = "all";   // currently active category filter


  /* ============================================================
     SECTION 3 — TOGGLE CONTACT DETAILS
     ============================================================
     The contact section is hidden by default to keep personal
     information off the screen for privacy during demonstrations.

     Clicking the toggle button:
       - Toggles the "hidden" class on the contact box
       - Updates the button label to match the new state
       - Updates the aria-expanded attribute for screen readers

     classList.toggle("hidden") adds the class if it is missing
     and removes it if it is already present — one call handles both.
  ============================================================ */

  if (toggleContactBtn && contactPlaceholderBox) {
    toggleContactBtn.addEventListener("click", function () {
      // Toggle the "hidden" CSS class (hidden sets display: none)
      contactPlaceholderBox.classList.toggle("hidden");

      if (contactPlaceholderBox.classList.contains("hidden")) {
        // Box is now hidden — update button to invite the user to show it
        toggleContactBtn.textContent = "Show Contact Details";
        toggleContactBtn.setAttribute("aria-expanded", "false");
      } else {
        // Box is now visible — update button to invite the user to hide it
        toggleContactBtn.textContent = "Hide Contact Details";
        toggleContactBtn.setAttribute("aria-expanded", "true");
      }
    });
  }


  /* ============================================================
     SECTION 4 — FETCH CV DATA FROM LOCAL JSON (AJAX)
     ============================================================
     Uses fetch() to load cv-data.json at runtime.
     The CV card entries are NOT hard-coded in cv.html — they
     come from the JSON file, keeping content separate from markup.

     "async/await" makes the asynchronous fetch call readable
     in a linear, top-to-bottom style rather than using callbacks.
  ============================================================ */

  async function loadCvData() {
    try {
      /*
        fetch() sends a GET request to the local cv-data.json file.
        cache: "no-store" prevents the browser from returning a
        cached version — it always reads the file fresh from disk.
      */
      const response = await fetch("data/cv-data.json", { cache: "no-store" });

      /*
        response.ok is true for HTTP 200-299 status codes.
        A 404 (file not found) or 500 (server error) would be false.
      */
      if (!response.ok) {
        throw new Error("Failed to fetch CV data.");
      }

      // Parse the JSON response body into a plain JavaScript object
      const data = await response.json();

      // Check that the expected "items" array exists in the JSON
      if (!Array.isArray(data.items)) {
        throw new Error("CV data format is invalid.");
      }

      // Store the items in our state variable
      cvItems = data.items;

      // Render the cards with the default "all" filter applied
      renderCvCards(currentFilter);

      // Hide the loading spinner and show the card grid
      cvLoading.classList.add("hidden");
      cvCardGrid.classList.remove("hidden");

    } catch (error) {
      /*
        If anything threw above — network failure, bad JSON,
        missing items array — show the error message instead.
        The error is also logged to the console for debugging.
      */
      console.error(error);
      cvLoading.classList.add("hidden");
      cvError.classList.remove("hidden");
    }
  }


  /* ============================================================
     SECTION 5 — RENDER CV CARDS
     ============================================================
     Filters the full cvItems array by the selected category and
     builds an HTML card for each matching item.

     When filter is "all", every item is displayed.
     When filter is a category string (e.g. "education"), only
     items whose category property matches are shown.
  ============================================================ */

  function renderCvCards(filter) {
    /*
      Array.filter() returns a new array containing only items
      that pass the test in the callback. When filter is "all",
      the ternary operator skips the filter and uses all items.
    */
    const filteredItems =
      filter === "all"
        ? cvItems                                  // no filter — use all items
        : cvItems.filter(function (item) {
            return item.category === filter;       // only items matching the chosen category
          });

    /*
      Array.map() transforms each item object into an HTML string.
      join("") merges the array of strings into one large HTML string.
      The whole string is assigned to innerHTML in a single operation,
      which is more efficient than appending items one by one.
    */
    cvCardGrid.innerHTML = filteredItems
      .map(function (item) {
        return `
          <article class="cv-data-card">
            <div class="cv-data-top">
              <!-- Category label badge, e.g. "Education" or "Project" -->
              <span class="attempt-badge">${item.categoryLabel}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </article>
        `;
      })
      .join(""); // merge all card HTML strings into one
  }


  /* ============================================================
     SECTION 6 — CATEGORY FILTER BUTTONS
     ============================================================
     Each filter button has a data-filter attribute set in the HTML
     (e.g. data-filter="education").

     When clicked:
       1. Remove the "active" class from all buttons
       2. Add "active" to the clicked button (for highlight styling)
       3. Update currentFilter to the button's data-filter value
       4. Re-render the card grid with the new filter applied
  ============================================================ */

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      // Remove active styling from all filter buttons
      filterButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });

      // Highlight the button that was just clicked
      button.classList.add("active");

      // Read the filter value from the data attribute and store it
      currentFilter = button.dataset.filter;

      // Re-render the card grid with the updated filter
      renderCvCards(currentFilter);
    });
  });


  /* ============================================================
     SECTION 7 — ANIMATED STAT COUNTERS
     ============================================================
     The metric cards on the CV page display numbers (e.g. years
     of experience, number of projects) that count up from 0 to
     their target value when the page loads.

     Each element has a data-target attribute in the HTML that
     stores the final number (e.g. data-target="12").

     How the animation works:
       1. Read the target number from data-target
       2. Calculate a step size (how much to add each interval)
       3. Use setInterval() to fire a callback every 40ms
       4. Each callback adds the step to "current" and updates the text
       5. When current reaches the target, stop the interval

     setInterval(fn, 40) runs fn every 40 milliseconds.
     clearInterval(interval) stops it from running again.
  ============================================================ */

  function animateCounter(element) {
    // Read the target number from the element's data-target attribute
    const target = Number(element.dataset.target);

    // Start counting from 0
    let current  = 0;

    /*
      Calculate a step size so the counter reaches the target in
      roughly 30 increments regardless of how large the target is.
      Math.max(1, ...) ensures the step is at least 1 (avoids 0 for small targets).
    */
    const step = Math.max(1, Math.ceil(target / 30));

    /*
      setInterval returns an ID that we store so we can stop it later.
      The callback runs every 40ms (25 times per second).
    */
    const interval = setInterval(function () {
      current += step; // add step to the running total

      if (current >= target) {
        // Clamp to exact target to avoid overshooting (e.g. showing 13 when target is 12)
        current = target;
        clearInterval(interval); // stop the interval — we have reached the target
      }

      // Update the element's visible number
      element.textContent = current;
    }, 40); // fires every 40 milliseconds
  }

  // Start the counter animation for each metric element on the page
  metricValues.forEach(function (metric) {
    animateCounter(metric);
  });


  /* ============================================================
     SECTION 8 — SCROLL PROGRESS BAR
     ============================================================
     Same approach used on all pages — updates a thin bar at the
     top of the page to show how far the user has scrolled.

     The calculation:
       scrollY      — pixels scrolled from the very top
       scrollHeight — full height of the page in pixels
       innerHeight  — height of the visible browser window
       docHeight    — total scrollable distance (full page minus window)
       scrolled     — percentage scrolled as a number from 0 to 100
  ============================================================ */

  function updateScrollProgress() {
    if (!scrollProgress) return; // element might not exist on some pages

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Avoid division by zero if the page content is shorter than the window
    const scrolled  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    scrollProgress.style.width = scrolled + "%";
  }

  window.addEventListener("scroll", updateScrollProgress);
  updateScrollProgress(); // set correct position on page load


  /* ============================================================
     SECTION 9 — ACTIVE FLOATING SHORTCUT HIGHLIGHTING
     ============================================================
     Updates the floating shortcut panel to highlight whichever
     section the user is currently viewing.

     Sections with class "track-section" are monitored.
     Shortcut links with data-target matching a section's id
     receive the "active-shortcut" class when that section is on screen.
  ============================================================ */

  const trackedSections = document.querySelectorAll(".track-section");
  const shortcutLinks   = document.querySelectorAll(".floating-link[data-target]");

  function updateActiveShortcut() {
    let currentId = "";

    trackedSections.forEach(function (section) {
      // Offset by 180px to account for the sticky navigation bar height
      const top    = section.offsetTop - 180;
      const bottom = top + section.offsetHeight;

      // Check if the current scroll position falls within this section
      if (window.scrollY >= top && window.scrollY < bottom) {
        currentId = section.id;
      }
    });

    // Highlight only the shortcut that matches the current section
    shortcutLinks.forEach(function (link) {
      link.classList.remove("active-shortcut"); // clear all highlights first

      if (link.dataset.target === currentId) {
        link.classList.add("active-shortcut"); // apply highlight to matching shortcut
      }
    });
  }

  window.addEventListener("scroll", updateActiveShortcut);
  updateActiveShortcut(); // run once on page load


  /* ============================================================
     SECTION 10 — REVEAL ANIMATION (fade-in on scroll)
     ============================================================
     Elements with the matching selectors below start invisible
     and fade in as they scroll into the viewport.

     The "reveal" class (added here in JS) sets opacity to 0
     and slightly shifts the element down.
     The "show" class (added by IntersectionObserver) triggers
     a CSS transition back to full opacity and no shift.

     IntersectionObserver is the modern, performant alternative
     to listening for scroll events and manually calculating
     whether elements are in view.
  ============================================================ */

  const revealItems = document.querySelectorAll(
    ".content-section, .correction-card, .reference-card, .cv-data-card, .metric-card"
  );

  // Give every target element the initial hidden state
  revealItems.forEach(function (item) {
    item.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    /*
      threshold: 0.12 means the callback fires when 12% of the
      element is visible in the viewport.
    */
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Element entered the viewport — trigger the fade-in animation
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.12 }
    );

    // Register each element to be watched by the observer
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });

  } else {
    // For browsers without IntersectionObserver — skip animation, show immediately
    revealItems.forEach(function (item) {
      item.classList.add("show");
    });
  }


  /* ============================================================
     SECTION 11 — INITIAL LOAD
     ============================================================
     This single function call kicks off the AJAX fetch for
     cv-data.json, which then renders the card grid on success.
     Everything else (counters, scroll bar, shortcuts) is already
     set up via event listeners above.
  ============================================================ */

  loadCvData();

  console.log("CV page loaded successfully.");
});
