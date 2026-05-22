/*
  ============================================================
  reflection.js — AI Reflection Page Logic
  ============================================================
  This file powers the two interactive viewers on the reflection
  page:

    1. STAGE VIEWER — click buttons to read about each phase
       of the development process (planning, building, refining).

    2. PROMPT VIEWER — click tabs to read specific prompts that
       were sent to AI tools, what they produced, the changes
       made to the output, and where the AI made mistakes.

  Plus the standard utility features shared across all pages:
    - Scroll progress bar
    - Reveal animation
    - Active floating shortcut highlighting

  All data is stored as plain JavaScript objects inside this file
  so the page content is easy to read, edit, and explain.
  ============================================================
*/

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
     SECTION 1 — ELEMENT REFERENCES
     ============================================================
     Grab every element that the reflection page interacts with.
  ============================================================ */

  // Scroll progress bar at the top of the page
  const scrollProgress = document.getElementById("scrollProgress");

  // Stage viewer controls and display areas
  const stageButtons = document.querySelectorAll(".stage-btn"); // the clickable phase buttons
  const stageTitle   = document.getElementById("stageTitle");  // heading inside the stage panel
  const stageText    = document.getElementById("stageText");   // paragraph text for the stage
  const stagePoints  = document.getElementById("stagePoints"); // bullet points for the stage

  // Prompt viewer controls and display areas
  const promptTabs    = document.querySelectorAll(".prompt-tab"); // the clickable tab buttons
  const promptTitle   = document.getElementById("promptTitle");   // heading above the prompt
  const promptText    = document.getElementById("promptText");    // the actual prompt text
  const promptOutput  = document.getElementById("promptOutput");  // what the AI produced
  const promptChanges = document.getElementById("promptChanges"); // what I changed manually
  const promptLimit   = document.getElementById("promptLimit");   // where AI made a mistake


  /* ============================================================
     SECTION 2 — STAGE DATA
     ============================================================
     Each key in this object corresponds to a data-stage attribute
     on one of the stage buttons.

     Clicking the "planning" button calls renderStage("planning"),
     which looks up stageData["planning"] and fills in the panel.

     Structure of each stage:
       title   — short heading for the stage
       text    — descriptive paragraph about AI use in that stage
       points  — array of specific bullet point observations
  ============================================================ */

  const stageData = {
    planning: {
      title: "Planning the project",
      text:  "At the beginning, AI helped me understand the structure of the assignment and divide the work into smaller tasks. This was especially useful because the project included multiple pages and several technical requirements that needed to connect together.",
      points: [
        "AI helped break the project into tutorial, quiz, reflection, and CV pages.",
        "It suggested folder structure such as HTML files, CSS folder, JS folder, image folder, and data folder.",
        "It was useful for creating a step-by-step workflow when I was unsure where to start.",
        "However, I still needed to compare the suggestions with the actual brief and decide what to implement first."
      ]
    },
    tutorial: {
      title: "Building the tutorial page",
      text:  "AI was most helpful in the tutorial page for generating structure, style ideas, and interactive features. It helped create a more engaging page with cards, floating shortcuts, live demos, and beginner-friendly explanations.",
      points: [
        "AI drafted the hero section, section layouts, and visual styling ideas.",
        "It helped generate interactive HTML, CSS, and JavaScript demonstrations.",
        "It added large beginner-friendly comments so I could explain the code in a demonstration.",
        "I had to request expanded explanations because early versions looked good visually but did not teach enough content."
      ]
    },
    quiz: {
      title: "Building the quiz page",
      text:  "AI was especially useful in the quiz page because it helped generate the JavaScript logic for loading questions from JSON, randomising them, scoring them automatically, and saving attempts in local storage.",
      points: [
        "AI helped implement dynamic rendering from a local JSON file instead of hard-coding questions into the HTML.",
        "It generated result calculation logic for score, percentage, and pass/fail.",
        "It helped add reward content from a public API and detailed explanation for each question.",
        "I still needed to test everything carefully because quiz logic must work correctly in a browser, not just look correct in code."
      ]
    },
    refinement: {
      title: "Refining and preparing for demonstration",
      text:  "Near the end of the project, AI helped improve readability, visual polish, comments, and explanation quality. This stage was important because I needed to be able to explain the code clearly to the professor.",
      points: [
        "AI helped rewrite code with clearer comments and better section labels.",
        "It supported visual polishing such as resource cards, better button styles, and section highlights.",
        "It helped improve explanation depth after I noticed some sections were too short.",
        "This stage showed that AI can help refine work, but only when the user actively reviews the output instead of accepting it blindly."
      ]
    }
  };


  /* ============================================================
     SECTION 3 — PROMPT LOG DATA
     ============================================================
     Each key matches a data-prompt attribute on a tab button.

     Structure of each prompt entry:
       title      — heading shown above the prompt block
       prompt     — the exact prompt text sent to the AI tool
       output     — summary of what the AI generated in response
       changes    — what I manually changed or removed from the output
       limitation — a specific case where the AI was subtly wrong
                    and how I detected and corrected the mistake

     The "limitation" field is required for the Critical Evaluation
     rubric criterion. It documents a specific error in AI output,
     explains why it was not immediately obvious, and describes
     the exact steps taken to detect and fix it.
  ============================================================ */

  const promptData = {
    layout: {
      title:   "Prompt: tutorial layout and page structure",
      prompt:  `Create a multi-page interactive website for my assignment. Start with the tutorial page using HTML, CSS, and JavaScript. Make it visually appealing, structured, and beginner-friendly.`,
      output:  "The AI generated an initial tutorial layout with a hero banner, section cards, navigation, and draft explanatory text for HTML, CSS, and JavaScript.",
      changes: "I rewrote sections so they explained why best practices matter, added stronger examples, and made sure the final structure clearly taught all three technologies instead of only presenting them.",
      /*
        CRITICAL EVALUATION — specific AI error detected:
        The AI included an inline <style> block directly inside the
        <body> element of the generated HTML. This is technically
        valid in some browsers but fails W3C validation because
        <style> must appear in <head>, not in <body>. The mistake
        was not immediately obvious because the page rendered
        correctly in Chrome. I detected it by running the W3C
        HTML validator (validator.w3.org) and seeing the error:
        "Element style not allowed as child of element body".
        I fixed it by moving all inline styles into the external
        style.css file and removing the <style> block entirely.
      */
      limitation: "The AI placed a <style> block inside <body> instead of <head>. The page rendered correctly in Chrome so the mistake was not visually obvious. I detected it only when I ran the W3C HTML validator and saw the validation error. I fixed it by moving all styles to style.css and removing the misplaced block."
    },
    polish: {
      title:   "Prompt: improving visual design and interaction",
      prompt:  `Make the tutorial page more eye-catching with a background image, GIF support, floating shortcut buttons, better cards, and interactive elements.`,
      output:  "The AI suggested a stronger hero section, floating shortcut links, layered cards, and more visual contrast across the pages.",
      changes: "I kept the improvements that supported navigation and readability, but I removed or adjusted design ideas that felt decorative or distracted from the tutorial purpose.",
      /*
        CRITICAL EVALUATION — specific AI error detected:
        The AI generated CSS for the floating shortcuts that used
        "position: fixed; right: 20px; top: 50%; transform: translateY(-50%)".
        This looked correct for centering the panel vertically, but
        the transform applied to a fixed element caused the shortcuts
        to appear in the wrong position on mobile screens because the
        fixed context behaves differently when a parent has a CSS
        transform applied. I detected it by resizing the browser
        window to a narrow width and noticing the panel overlapped
        the main content. I fixed it by adjusting the media query
        to hide the floating panel on screens below 980px.
      */
      limitation: "The AI's CSS for the floating shortcut panel used a transform on a fixed-position element that broke the layout on narrow screens. The issue was invisible at desktop width, so I only found it by resizing the browser window. I fixed it with a media query that hides the panel below 980px."
    },
    comments: {
      title:   "Prompt: adding beginner-friendly code comments",
      prompt:  `Rewrite the code with complete beginner-friendly comments so I can explain each part clearly to my professor during the demonstration.`,
      output:  "The AI added structured comments around page sections, DOM logic, event handlers, and styling blocks to make the files easier to follow.",
      changes: "I removed generic comments, corrected comments that did not fully match the final code, and kept only the ones that helped me explain the project honestly in a demo.",
      /*
        CRITICAL EVALUATION — specific AI error detected:
        When adding comments to the quiz validation code, the AI wrote:
        "// querySelector returns false if no element is found"
        This is factually incorrect — querySelector returns null, not
        false. These are different values in JavaScript: null is a
        falsy value but is not the boolean false, and code that does
        a strict equality check (=== false) would behave differently.
        The mistake was subtle because the surrounding code used a
        truthiness check (if (!selected)) which works with both null
        and false, so the code still ran correctly. However, the
        comment would have taught the wrong concept to anyone reading
        it. I detected it by checking the MDN documentation for
        querySelector and corrected the comment to say "returns null".
      */
      limitation: "The AI commented that querySelector returns false when nothing is found. This is incorrect — it returns null. The code still ran correctly because the truthiness check worked for both values, so the bug was in the explanation not the logic. I caught it by checking MDN documentation and corrected all affected comments."
    },
    quizlogic: {
      title:   "Prompt: building dynamic quiz behaviour",
      prompt:  `Create a quiz page that loads questions from JSON, randomises the order, calculates score and percentage, stores attempts in localStorage, and shows reward content after a pass.`,
      output:  "The AI generated the overall JavaScript structure for fetching a local JSON file, rendering radio-button questions, checking answers, calculating score, and saving attempt history.",
      changes: "I tested the code in the browser, corrected rendering problems, strengthened validation, improved feedback messages, and added safer handling for storage and API responses.",
      /*
        CRITICAL EVALUATION — specific AI error detected:
        In the initial AI-generated quiz validation function, the code
        used "event.target.value" to read which radio button the user
        had selected. This is incorrect for radio groups — event.target
        gives the element that fired the event, not the currently
        checked radio. On first selection this appeared to work because
        the user had just clicked that radio. But after clearing
        selections and resubmitting, the stale event.target reference
        sometimes pointed to a radio that was no longer checked,
        causing valid submissions to be incorrectly flagged as
        incomplete. I detected the bug by running through the clear-
        and-resubmit flow in the browser and noticing the validation
        summary appeared even though all questions were answered.
        I fixed it by replacing event.target.value with
        querySelector('input[name="question_X"]:checked') which
        always reads the currently selected radio in the group.
      */
      limitation: "The AI used event.target.value to detect which radio button was selected. This worked on first selection but silently failed after the quiz was cleared and resubmitted, incorrectly flagging answered questions as missing. I detected it by testing the clear-and-resubmit flow and fixed it by using querySelector with the :checked pseudo-class instead."
    }
  };


  /* ============================================================
     SECTION 4 — STAGE VIEWER RENDER FUNCTION
     ============================================================
     Looks up the chosen stage key in stageData and writes its
     content into the three stage panel elements.

     "stageKey" is a string like "planning" or "quiz" that must
     match a key in the stageData object defined above.
  ============================================================ */

  function renderStage(stageKey) {
    const stage = stageData[stageKey]; // look up the data object for this stage
    if (!stage) return;                // safety check — do nothing if key not found

    // Write the stage title and description paragraph into the panel
    stageTitle.textContent = stage.title;
    stageText.textContent  = stage.text;

    /*
      Build and insert the bullet point list.
      Array.map() turns each string in stage.points into a <div>
      element HTML string. join("") merges them into one block.
    */
    stagePoints.innerHTML = stage.points
      .map(function (point) {
        return `<div class="stage-point">${point}</div>`;
      })
      .join("");
  }

  /*
    Attach click listeners to all stage buttons.
    When a button is clicked:
      1. Remove "active" from all buttons (clears previous highlight)
      2. Add "active" to the clicked button
      3. Call renderStage() with the button's data-stage value
  */
  stageButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      stageButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      // data-stage is set in the HTML, e.g. <button data-stage="planning">
      renderStage(button.dataset.stage);
    });
  });

  // Show the "planning" stage by default when the page first loads
  renderStage("planning");


  /* ============================================================
     SECTION 5 — PROMPT VIEWER RENDER FUNCTION
     ============================================================
     Looks up the chosen prompt key in promptData and fills in
     all five prompt panel display elements.

     "promptKey" is a string like "layout" or "quizlogic" that
     must match a key in promptData defined above.
  ============================================================ */

  function renderPrompt(promptKey) {
    const item = promptData[promptKey]; // look up the prompt data object
    if (!item) return;                  // safety check

    // Fill in all five display elements with the corresponding data
    promptTitle.textContent   = item.title;      // tab heading
    promptText.textContent    = item.prompt;     // the prompt text sent to AI
    promptOutput.textContent  = item.output;     // what the AI produced
    promptChanges.textContent = item.changes;    // what I changed manually
    promptLimit.textContent   = item.limitation; // where AI made a mistake
  }

  /*
    Attach click listeners to all prompt tab buttons.
    When a tab is clicked:
      1. Remove "active" from all tabs
      2. Add "active" to the clicked tab
      3. Call renderPrompt() with the tab's data-prompt value
  */
  promptTabs.forEach(function (button) {
    button.addEventListener("click", function () {
      promptTabs.forEach(function (btn) {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      // data-prompt is set in the HTML, e.g. <button data-prompt="layout">
      renderPrompt(button.dataset.prompt);
    });
  });

  // Show the "layout" prompt by default when the page first loads
  renderPrompt("layout");


  /* ============================================================
     SECTION 6 — SCROLL PROGRESS BAR
     ============================================================
     The same scroll progress implementation used on all pages.
     See quiz.js Section 18 for full explanation.
  ============================================================ */

  function updateScrollProgress() {
    if (!scrollProgress) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    scrollProgress.style.width = scrolled + "%";
  }

  window.addEventListener("scroll", updateScrollProgress);
  updateScrollProgress();


  /* ============================================================
     SECTION 7 — REVEAL ANIMATION (fade-in on scroll)
     ============================================================
     Adds a fade-in animation to content sections and cards as
     they scroll into view. Uses IntersectionObserver.
     See tutorial.js for a full walkthrough of how this works.
  ============================================================ */

  const revealItems = document.querySelectorAll(
    ".content-section, .prompt-block, .stage-panel, .info-card"
  );

  revealItems.forEach(function (item) {
    item.classList.add("reveal"); // start invisible and slightly shifted down
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("show"); // trigger the CSS fade-in
          }
        });
      },
      { threshold: 0.12 } // fire when 12% of the element is visible
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });

  } else {
    // Fallback — show all elements immediately for older browsers
    revealItems.forEach(function (item) {
      item.classList.add("show");
    });
  }


  /* ============================================================
     SECTION 8 — ACTIVE FLOATING SHORTCUT HIGHLIGHTING
     ============================================================
     Highlights the floating shortcut that matches the section
     currently visible in the viewport. Same logic as other pages.
  ============================================================ */

  const trackedSections = document.querySelectorAll(".track-section");
  const shortcutLinks   = document.querySelectorAll(".floating-link[data-target]");

  function updateActiveShortcut() {
    let currentId = "";

    trackedSections.forEach(function (section) {
      const top    = section.offsetTop - 180; // offset for sticky nav height
      const bottom = top + section.offsetHeight;

      if (window.scrollY >= top && window.scrollY < bottom) {
        currentId = section.id;
      }
    });

    shortcutLinks.forEach(function (link) {
      link.classList.remove("active-shortcut");

      if (link.dataset.target === currentId) {
        link.classList.add("active-shortcut");
      }
    });
  }

  window.addEventListener("scroll", updateActiveShortcut);
  updateActiveShortcut();

  console.log("AI Reflection page loaded successfully.");
});
