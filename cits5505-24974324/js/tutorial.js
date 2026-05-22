/*
  ============================================================
  tutorial.js — Interactive Tutorial Page Logic
  ============================================================
  This file powers all the interactive demonstrations on the
  tutorial page. It contains five separate interactive widgets:

    1. HTML Explorer  — click topic buttons to update a code panel
    2. HTML Builder   — choose a tag and text to see live output
    3. CSS Playground — sliders and colour pickers update a card
    4. JS Event Demo  — a live greeting and an increment counter
    5. Style Playground — apply heading, colour, and size to a card

  Plus utility features:
    - Reveal animation (elements fade in as you scroll)
    - Scroll progress bar across the top of the page
    - Active floating shortcut highlighting

  All code runs inside DOMContentLoaded to guarantee the HTML
  elements exist before JavaScript tries to access them.
  ============================================================
*/

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
     WIDGET 1 — HTML EXPLORER
     ============================================================
     The HTML Explorer shows a different explanation and code
     snippet when the user clicks a topic button.

     How it works:
       - All topic content is stored in a plain JavaScript object.
       - Clicking a button reads its data-topic attribute to know
         which topic to display.
       - The content is then written into the panel on the right.

     This is a common pattern in single-page apps: store all data
     in JavaScript and update the DOM when the user interacts.
  ============================================================ */

  // References to the three parts of the explorer display panel
  const explorerTitle   = document.getElementById("explorerTitle");
  const explorerText    = document.getElementById("explorerText");
  const explorerCode    = document.getElementById("explorerCode");

  // All the buttons in the explorer (class="explorer-btn")
  const explorerButtons = document.querySelectorAll(".explorer-btn");

  /*
    htmlTopics is a plain JavaScript object used as a lookup table.
    The keys (e.g. "structure", "semantic") match the data-topic
    attribute values set on each explorer button in the HTML.
    Each value is an object with the title, explanation text, and
    a code snippet to display in the panel.
  */
  const htmlTopics = {
    structure: {
      title: "Document Structure",
      text:  "A standard HTML5 page begins with a doctype declaration, then uses html as the root element and splits the document into head and body. The head stores metadata such as title and linked files, while the body contains the visible page content.",
      /*
        The code value uses a template literal (backtick string) to
        allow the snippet to span multiple lines without concatenation.
        When displayed, these line breaks are preserved in a <pre> block.
      */
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`
    },
    semantic: {
      title: "Semantic Elements",
      text:  "Semantic elements describe the role of content. Tags like header, nav, section, article, aside, and footer make the page easier to understand. They are better than using generic containers everywhere because they give meaning to the structure.",
      code: `<header>
  <h1>My Website</h1>
</header>

<nav>
  <a href="quiz.html">Quiz</a>
</nav>

<section>
  <article>
    <h2>News Item</h2>
    <p>This article can stand alone.</p>
  </article>
</section>

<footer>
  <p>Footer content</p>
</footer>`
    },
    links: {
      title: "Links and Images",
      text:  "Links use the anchor tag and images use the img tag. Inside the same site, relative links are preferred because they work within the project folder. Images should include alt text so the meaning is still available if the image cannot be seen.",
      code: `<a href="quiz.html">Go to Quiz</a>

<img src="images/web-dev.gif"
     alt="Animated web development illustration">`
    },
    lists: {
      title: "Lists",
      text:  "Use unordered lists for bullet points and ordered lists when sequence matters. Lists are useful for grouping related items clearly instead of writing everything in one paragraph.",
      code: `<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>

<ol>
  <li>Open the page</li>
  <li>Read the tutorial</li>
  <li>Take the quiz</li>
</ol>`
    },
    forms: {
      title: "Forms and Validation",
      text:  "Forms collect user input. Labels improve usability because users can clearly see what each field is for. Native validation can be added with required, min, max, pattern, and special input types such as email.",
      code: `<form>
  <label for="email">Email</label>
  <input type="email" id="email" required>

  <label for="age">Age</label>
  <input type="number" id="age" min="18" max="100">

  <button type="submit">Submit</button>
</form>`
    }
  };

  /*
    updateExplorer(topicKey)
    ------------------------
    Looks up the given key in htmlTopics and writes its content
    into the three display elements of the explorer panel.

    "topicKey" is a string like "structure" or "semantic" that
    matches a key in the htmlTopics object above.
  */
  function updateExplorer(topicKey) {
    const topic = htmlTopics[topicKey]; // bracket notation to look up by variable key
    if (!topic) return;                 // safety check — do nothing if key not found

    explorerTitle.textContent = topic.title; // update the heading
    explorerText.textContent  = topic.text;  // update the explanation paragraph
    explorerCode.textContent  = topic.code;  // update the code block (textContent is safe here)
  }

  /*
    Attach a click event listener to each explorer button.
    When clicked:
      1. Remove the "active" class from ALL buttons (clears previous highlight)
      2. Add "active" to the clicked button (highlights it)
      3. Call updateExplorer() with the button's data-topic value
  */
  explorerButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      // Deactivate all buttons first
      explorerButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });

      // Activate only the clicked button
      button.classList.add("active");

      // Read the data-topic attribute set in the HTML (e.g. data-topic="semantic")
      updateExplorer(button.dataset.topic);
    });
  });

  // Show the first topic ("structure") immediately when the page loads
  if (explorerCode) {
    updateExplorer("structure");
  }


  /* ============================================================
     WIDGET 2 — HTML BUILDER (live element creator)
     ============================================================
     Lets the user choose an HTML tag, type some content, and
     optionally add a href, then see the element rendered live
     alongside the generated HTML code.

     The builder reacts to:
       - Changing the tag dropdown (show/hide href field)
       - Typing in the text input (live preview update)
       - Typing in the href input (live preview update)
       - Clicking the "Update" button (manual refresh)
  ============================================================ */

  // Form controls for the builder
  const builderTag        = document.getElementById("builderTag");        // <select> dropdown
  const builderText       = document.getElementById("builderText");       // text content input
  const builderHref       = document.getElementById("builderHref");       // href URL input
  const builderHrefRow    = document.getElementById("builderHrefRow");    // row to show/hide href
  const builderUpdateBtn  = document.getElementById("builderUpdateBtn");  // manual update button

  // Output areas
  const builderPreview    = document.getElementById("builderPreview");    // live rendered element
  const builderCode       = document.getElementById("builderCode");       // generated HTML code text

  /*
    updateBuilderVisibility()
    -------------------------
    Shows the href input row only when the "a" (anchor) tag is selected,
    because href is only meaningful for links.
    Hides it for all other tags (p, h2, button, etc.).
  */
  function updateBuilderVisibility() {
    if (!builderTag || !builderHrefRow) return;
    // CSS display property — "block" shows the row, "none" hides it
    builderHrefRow.style.display = builderTag.value === "a" ? "block" : "none";
  }

  /*
    updateBuilder()
    ---------------
    Reads the current values from the form controls, creates a real
    DOM element dynamically, appends it to the preview area, and
    updates the code display to match.

    This demonstrates three core JavaScript skills:
      1. Reading form values with .value
      2. Creating elements with document.createElement()
      3. Setting properties and appending to the DOM
  */
  function updateBuilder() {
    if (!builderPreview || !builderCode || !builderTag || !builderText) return;

    const selectedTag = builderTag.value;                          // e.g. "p", "h2", "a"
    const textValue   = builderText.value.trim() || "Sample content"; // fallback if empty
    const hrefValue   = builderHref.value.trim() || "quiz.html";   // fallback href

    // Clear the previous preview before inserting the new element
    builderPreview.innerHTML = "";

    // Declare the variable that will hold the created element
    let newElement;

    if (selectedTag === "a") {
      /*
        Anchor elements need a href attribute and a class for styling.
        We create a real <a> element (not just HTML text) so clicking
        the preview link would actually navigate.
      */
      newElement          = document.createElement("a");
      newElement.href     = hrefValue;
      newElement.textContent = textValue;
      newElement.className  = "builder-link-demo";

      // Show the equivalent HTML code the user would write by hand
      builderCode.textContent = `<a href="${hrefValue}">${textValue}</a>`;

    } else if (selectedTag === "button") {
      /*
        Button elements need type="button" to prevent them from
        accidentally submitting a form if they are inside one.
      */
      newElement          = document.createElement("button");
      newElement.type     = "button";
      newElement.textContent = textValue;
      newElement.className  = "builder-button-demo";

      builderCode.textContent = `<button type="button">${textValue}</button>`;

    } else {
      /*
        For all other tags (p, h1, h2, h3, span, strong, em, li)
        we can use the same simple approach — create the element,
        set its text, and display the matching HTML.
      */
      newElement = document.createElement(selectedTag); // e.g. creates <p>
      newElement.textContent = textValue;

      builderCode.textContent = `<${selectedTag}>${textValue}</${selectedTag}>`;
    }

    // Add the newly created element to the preview area in the page
    builderPreview.appendChild(newElement);
  }

  // Listen for changes to the tag dropdown — update visibility and preview
  if (builderTag) {
    builderTag.addEventListener("change", function () {
      updateBuilderVisibility();
      updateBuilder();
    });
  }

  // Live update as the user types in the text input
  if (builderText) {
    builderText.addEventListener("input", updateBuilder);
  }

  // Live update as the user types a URL in the href input
  if (builderHref) {
    builderHref.addEventListener("input", updateBuilder);
  }

  // Manual refresh button (useful if auto-update was missed)
  if (builderUpdateBtn) {
    builderUpdateBtn.addEventListener("click", updateBuilder);
  }

  // Set up the builder correctly on page load
  updateBuilderVisibility();
  updateBuilder();


  /* ============================================================
     WIDGET 3 — CSS PLAYGROUND (live style editor)
     ============================================================
     Colour pickers and range sliders update a preview card in
     real time so the user can see exactly how CSS properties
     affect an element's appearance.

     CSS properties used:
       background-color  — the card's background colour
       color             — the text colour inside the card
       padding           — space between the text and the card edge
       border-radius     — how rounded the corners are

     The matching CSS code is displayed below the card so the user
     can see the exact rule they would write in a stylesheet.
  ============================================================ */

  // Colour picker inputs (type="color" shows a native colour chooser)
  const cssBgColor   = document.getElementById("cssBgColor");
  const cssTextColor = document.getElementById("cssTextColor");

  // Range slider inputs (type="range" shows a draggable slider)
  const cssPadding   = document.getElementById("cssPadding");
  const cssRadius    = document.getElementById("cssRadius");

  // Text labels showing the current slider value (e.g. "16px")
  const cssPaddingValue = document.getElementById("cssPaddingValue");
  const cssRadiusValue  = document.getElementById("cssRadiusValue");

  // The live preview card that receives the style changes
  const cssPreviewCard  = document.getElementById("cssPreviewCard");

  // The <code> element that displays the generated CSS rule
  const cssCode         = document.getElementById("cssCode");

  /*
    updateCssDemo()
    ---------------
    Reads the current values of all four controls and:
      1. Applies the corresponding CSS styles to the preview card
      2. Updates the numeric labels next to the sliders
      3. Writes the matching CSS rule into the code display

    This function runs whenever any of the four controls changes.
  */
  function updateCssDemo() {
    if (!cssPreviewCard || !cssCode) return;

    // Read the current value from each control element
    const bg      = cssBgColor.value;   // hex string like "#3b82f6"
    const text    = cssTextColor.value; // hex string like "#ffffff"
    const padding = cssPadding.value;   // numeric string like "16"
    const radius  = cssRadius.value;    // numeric string like "8"

    // Apply CSS directly to the preview card's style property
    cssPreviewCard.style.backgroundColor = bg;
    cssPreviewCard.style.color           = text;
    cssPreviewCard.style.padding         = padding + "px"; // append unit
    cssPreviewCard.style.borderRadius    = radius  + "px"; // append unit

    // Update the slider value labels so the user sees the number change
    cssPaddingValue.textContent = padding + "px";
    cssRadiusValue.textContent  = radius  + "px";

    /*
      Display a formatted CSS rule that matches what the user would
      write in a .css file. Template literals make multi-line strings
      easy to build without messy string concatenation.
    */
    cssCode.textContent = `.card {
  background-color: ${bg};
  color: ${text};
  padding: ${padding}px;
  border-radius: ${radius}px;
}`;
  }

  // Attach updateCssDemo to all four controls so it runs on any change
  [cssBgColor, cssTextColor, cssPadding, cssRadius].forEach(function (control) {
    if (control) {
      control.addEventListener("input", updateCssDemo); // "input" fires on every change
    }
  });

  // Run once on page load to set the initial preview state
  updateCssDemo();


  /* ============================================================
     WIDGET 4 — JAVASCRIPT EVENT DEMO (greeting + counter)
     ============================================================
     Demonstrates two fundamental JavaScript event patterns:

     A) The "input" event — fires on every keystroke.
        The greeting updates in real time as the user types.
        This shows how JavaScript can react instantly to user input.

     B) Button "click" events — fires when the button is clicked.
        Three buttons increment, decrement, and reset a counter.
        This shows how JavaScript maintains and displays state.
  ============================================================ */

  const liveNameInput   = document.getElementById("liveNameInput");   // text input for the name
  const liveGreeting    = document.getElementById("liveGreeting");    // paragraph showing greeting
  const incrementBtn    = document.getElementById("incrementBtn");    // + button
  const decrementBtn    = document.getElementById("decrementBtn");    // - button
  const resetCounterBtn = document.getElementById("resetCounterBtn"); // reset button
  const counterValue    = document.getElementById("counterValue");    // number display

  // "counter" is a state variable — it holds the current count as a number
  let counter = 0;

  /*
    Listen to the "input" event on the name field.
    "input" fires every time the value changes — after each keystroke,
    paste, or delete — giving a true live-update experience.
    "keyup" would miss some inputs (like paste via mouse).
  */
  if (liveNameInput) {
    liveNameInput.addEventListener("input", function () {
      // .trim() removes any leading or trailing whitespace from the value
      const name = liveNameInput.value.trim();

      if (name === "") {
        // Input is empty — show the generic placeholder greeting
        liveGreeting.textContent =
          "Hello! JavaScript will personalise this message.";
      } else {
        // Input has text — build a personalised greeting using the name
        liveGreeting.textContent =
          "Hello, " + name + "! This text changed because of a JavaScript input event.";
      }
    });
  }

  // Increment button — adds 1 to the counter and updates the display
  if (incrementBtn) {
    incrementBtn.addEventListener("click", function () {
      counter++;                          // shorthand for counter = counter + 1
      counterValue.textContent = counter; // write the new value into the page
    });
  }

  // Decrement button — subtracts 1 from the counter and updates the display
  if (decrementBtn) {
    decrementBtn.addEventListener("click", function () {
      counter--;                          // shorthand for counter = counter - 1
      counterValue.textContent = counter;
    });
  }

  // Reset button — sets the counter back to 0
  if (resetCounterBtn) {
    resetCounterBtn.addEventListener("click", function () {
      counter = 0;
      counterValue.textContent = counter;
    });
  }


  /* ============================================================
     WIDGET 5 — STYLE PLAYGROUND (interactive card styler)
     ============================================================
     Demonstrates how JavaScript can read user input from multiple
     form controls and use the values to update the DOM.

     The user can:
       - Type a custom heading text
       - Pick a colour for the heading
       - Drag a slider to change the font size

     Then click "Apply" to see all changes applied to a preview card.
     "Reset" restores everything to the default state.

     This is a more hands-on demo than the CSS Playground because
     the user has to click Apply — which clearly illustrates that
     JavaScript reacts to events, not passively watching values.
  ============================================================ */

  const applyDemoBtn      = document.getElementById("applyDemoBtn");      // Apply button
  const resetDemoBtn      = document.getElementById("resetDemoBtn");      // Reset button
  const demoHeadingInput  = document.getElementById("demoHeading");       // text input for heading
  const demoColorSelect   = document.getElementById("demoColor");         // colour picker
  const demoSizeInput     = document.getElementById("demoSize");          // font size slider
  const sizeValue         = document.getElementById("sizeValue");         // label showing px value
  const demoCard          = document.getElementById("demoCard");          // the preview card
  const demoCardTitle     = document.getElementById("demoCardTitle");     // heading inside the card
  const demoText          = document.getElementById("demoText");          // status text inside card

  /*
    defaultState stores the original values so the Reset button can
    restore everything without reloading the page.
  */
  const defaultState = {
    heading: "My Styled Card",
    color:   "#2563eb",  // a medium blue — matches the site's primary colour
    size:    "24"        // 24px font size as a string (slider values are strings)
  };

  /*
    updateSizeLabel()
    -----------------
    Reads the slider's current value and updates the text label
    that shows the current font size in pixels (e.g. "32px").
    Called on every slider move so the label stays in sync.
  */
  function updateSizeLabel() {
    if (sizeValue && demoSizeInput) {
      sizeValue.textContent = demoSizeInput.value + "px";
    }
  }

  /*
    applyChanges()
    --------------
    Reads the three input controls and applies them to the preview card.
    Demonstrates how .value reads form input, and how .style and
    .textContent update element properties dynamically.
  */
  function applyChanges() {
    if (!demoCard || !demoCardTitle || !demoText) return;

    // Read the current value from each control (with a fallback for empty text)
    const selectedHeading = demoHeadingInput.value.trim() || defaultState.heading;
    const selectedColor   = demoColorSelect.value;
    const selectedSize    = demoSizeInput.value;

    // Update the card heading text and styles
    demoCardTitle.textContent       = selectedHeading;
    demoCardTitle.style.color       = selectedColor;
    demoCardTitle.style.fontSize    = selectedSize + "px";

    // Update the card's border colour to match the heading colour
    demoCard.style.borderColor      = selectedColor;

    // Update the status message inside the card to confirm the event fired
    demoText.textContent =
      "JavaScript handled the event and updated the card instantly in the browser.";
  }

  /*
    resetDemo()
    -----------
    Restores all controls and the card to the defaultState values.
    This shows that JavaScript can also SET control values, not just read them.
  */
  function resetDemo() {
    // Restore input control values using the defaultState object
    demoHeadingInput.value   = defaultState.heading;
    demoColorSelect.value    = defaultState.color;
    demoSizeInput.value      = defaultState.size;

    // Update the size label to match the restored slider value
    updateSizeLabel();

    // Apply the default values to the preview card
    applyChanges();

    // Show a message confirming the reset happened
    demoText.textContent =
      "The demo has been reset to its default state using JavaScript.";
  }

  // Keep the size label in sync as the user drags the slider
  if (demoSizeInput) {
    demoSizeInput.addEventListener("input", updateSizeLabel);
    updateSizeLabel(); // set the label correctly on page load
  }

  // Apply and Reset buttons
  if (applyDemoBtn) {
    applyDemoBtn.addEventListener("click", applyChanges);
  }

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", resetDemo);
  }


  /* ============================================================
     REVEAL ANIMATION (fade-in on scroll)
     ============================================================
     Adds a subtle fade-in and slide-up animation to major content
     sections as they come into the user's viewport.

     How it works:
       1. All target elements are given the "reveal" CSS class
          which sets opacity to 0 (invisible) and translates them
          slightly downward.
       2. An IntersectionObserver watches each element.
       3. When an element enters the viewport (is "intersecting"),
          the "show" class is added, which triggers a CSS transition
          back to full opacity and no translation.
       4. The threshold: 0.12 means the animation starts when 12%
          of the element is visible — giving a smooth staggered feel.

     If IntersectionObserver is not supported (very old browsers),
     all elements are shown immediately without animation.
  ============================================================ */

  // Select all the elements that should animate on scroll
  const revealItems = document.querySelectorAll(
    ".content-section, .topic-card, .info-card, .hero-side-card, .learn-card"
  );

  // Add the "reveal" class to each element to set the starting invisible state
  revealItems.forEach(function (item) {
    item.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    /*
      IntersectionObserver takes a callback and an options object.
      The callback receives an array of "entries" (one per observed element)
      and fires whenever any of them crosses the threshold.

      threshold: 0.12 — fire when 12% of the element is in the viewport.
    */
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Element is now visible — add "show" to trigger the CSS animation
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.12 }
    );

    // Start observing every target element
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });

  } else {
    // Fallback for browsers that do not support IntersectionObserver —
    // show all elements immediately with no animation.
    revealItems.forEach(function (item) {
      item.classList.add("show");
    });
  }


  /* ============================================================
     SCROLL PROGRESS BAR
     ============================================================
     A thin coloured bar along the very top of the page that grows
     from left to right as the user scrolls down.

     scrollY          — pixels scrolled from the top of the page
     scrollHeight     — total height of the page in pixels
     innerHeight      — height of the visible browser window
     docHeight        — total scrollable distance (page - window)
     scrolled         — percentage scrolled (0 to 100)
  ============================================================ */

  const scrollProgress = document.getElementById("scrollProgress");

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Guard against dividing by zero on very short pages
    const scrolled  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    scrollProgress.style.width = scrolled + "%";
  }

  window.addEventListener("scroll", updateScrollProgress);
  updateScrollProgress(); // initialise on page load


  /* ============================================================
     FLOATING SHORTCUT HIGHLIGHTING
     ============================================================
     The floating shortcut panel on the right side highlights
     whichever section the user is currently reading.

     How it works:
       1. Sections that should be tracked have the class "track-section"
          and each has a unique id (e.g. id="html-section").
       2. Floating shortcut links have a data-target attribute set to
          the id of the section they link to.
       3. On every scroll event, we check which section's top and
          bottom bounds bracket the current scrollY position.
       4. The shortcut link whose data-target matches that section id
          gets the "active-shortcut" class.
  ============================================================ */

  const trackedSections = document.querySelectorAll(".track-section");
  const shortcutLinks   = document.querySelectorAll(".floating-link[data-target]");

  function updateActiveShortcut() {
    let currentId = ""; // will hold the id of the section the user is in

    trackedSections.forEach(function (section) {
      // offsetTop is the distance from the element's top to the page top.
      // We subtract 180px to account for the sticky navigation bar height,
      // so the section is considered "active" a bit before reaching its top.
      const top    = section.offsetTop - 180;
      const bottom = top + section.offsetHeight;

      // If the scroll position is within this section's range, record its id
      if (window.scrollY >= top && window.scrollY < bottom) {
        currentId = section.id;
      }
    });

    // Update each shortcut link's active state
    shortcutLinks.forEach(function (link) {
      link.classList.remove("active-shortcut"); // clear all first

      if (link.dataset.target === currentId) {
        link.classList.add("active-shortcut"); // highlight matching shortcut
      }
    });
  }

  window.addEventListener("scroll", updateActiveShortcut);
  updateActiveShortcut(); // run once on load to highlight the correct shortcut

  console.log("Interactive tutorial page loaded successfully.");
});
