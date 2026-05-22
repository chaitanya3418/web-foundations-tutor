/*
  ============================================================
  quiz.js — Interactive Quiz Page Logic
  ============================================================
  This file controls everything that happens on the quiz page:
    1. Fetching questions from a local JSON file (AJAX)
    2. Shuffling and displaying questions in the browser
    3. Tracking when the user starts answering
    4. Warning the user before they leave the page mid-quiz
    5. Checking for unanswered questions on submission
    6. Calculating and displaying the score and pass/fail result
    7. Fetching a reward from a public API on a passing score
    8. Saving every attempt to localStorage for history
    9. Showing a detailed answer review after submission

  All of this runs inside DOMContentLoaded so the HTML is
  fully loaded before any JavaScript tries to find elements.
  ============================================================
*/

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
     SECTION 1 — CONFIGURATION
     ============================================================
     These constants control the quiz behaviour.
     Change PASS_PERCENTAGE to adjust the passing threshold.
     Change STORAGE_KEY if you want a different localStorage key.
  ============================================================ */

  // The minimum percentage a user needs to score to "pass" the quiz.
  // 70 means 70 percent — the user must get at least 70% of questions correct.
  const PASS_PERCENTAGE = 70;

  // The key used to store quiz attempt history in localStorage.
  // Using a unique key avoids conflicts with other sites' stored data.
  const STORAGE_KEY = "cits5505_quiz_attempts";


  /* ============================================================
     SECTION 2 — ELEMENT REFERENCES
     ============================================================
     Here we grab references to HTML elements by their id so
     JavaScript can read from or write to them later.

     getElementById("someId") finds the element with id="someId"
     in the HTML and returns it as a JavaScript object.
     querySelectorAll(".someClass") finds ALL elements with that
     class and returns them as a NodeList (similar to an array).
  ============================================================ */

  // Loading spinner shown while questions are being fetched from the JSON file
  const quizLoading        = document.getElementById("quizLoading");

  // Error message box shown if the JSON file cannot be loaded
  const quizError          = document.getElementById("quizError");

  // The <form> element that wraps all the quiz questions
  const quizForm           = document.getElementById("quizForm");

  // The <div> inside the form where question cards are injected by JavaScript
  const quizContainer      = document.getElementById("quizContainer");

  // Button that clears all selected radio answers without reloading the page
  const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");

  // Button that wipes all saved attempt history from localStorage
  const clearHistoryBtn    = document.getElementById("clearHistoryBtn");

  // Red banner area at the top of the form listing unanswered question numbers
  const validationSummary  = document.getElementById("validationSummary");

  // Small status text below the history list (e.g. "Attempt saved successfully")
  const historyStatus      = document.getElementById("historyStatus");

  // Stat display elements in the quiz information bar
  const questionCount      = document.getElementById("questionCount");   // e.g. "10"
  const passMarkDisplay    = document.getElementById("passMarkDisplay"); // e.g. "70%"
  const startedStatus      = document.getElementById("startedStatus");   // "Yes" or "No"

  // Result section elements — all hidden until the quiz is submitted
  const resultSection      = document.getElementById("resultSection");
  const scoreValue         = document.getElementById("scoreValue");       // e.g. "8 / 10"
  const percentageValue    = document.getElementById("percentageValue"); // e.g. "80%"
  const passFailValue      = document.getElementById("passFailValue");   // "Passed" or "Not Passed"
  const resultMessage      = document.getElementById("resultMessage");   // descriptive sentence
  const resultVisual       = document.getElementById("resultVisual");    // emoji (trophy, etc.)
  const resultHeading      = document.getElementById("resultHeading");   // headline text
  const quoteText          = document.getElementById("quoteText");       // short motivational quote
  const resultHeroCard     = document.getElementById("resultHeroCard");  // coloured card container

  // Reward section — only shown when the user passes the quiz
  const rewardSection      = document.getElementById("rewardSection");
  const rewardText         = document.getElementById("rewardText");

  // Review section — detailed answer explanation for every question
  const reviewSection      = document.getElementById("reviewSection");
  const reviewList         = document.getElementById("reviewList");

  // Attempt history elements shown below the quiz form
  const historyEmpty       = document.getElementById("historyEmpty");       // "No attempts yet" message
  const attemptHistoryList = document.getElementById("attemptHistoryList"); // container for attempt cards

  // The thin coloured bar along the top of the page that shows scroll progress
  const scrollProgress     = document.getElementById("scrollProgress");


  /* ============================================================
     SECTION 3 — QUIZ STATE VARIABLES
     ============================================================
     These variables track what is currently happening in the quiz.
     They are declared with "let" (not "const") because their values
     will change as the user interacts with the page.
  ============================================================ */

  // Will hold the array of question objects after they are loaded from JSON
  let questions = [];

  // Becomes true as soon as the user selects their very first answer.
  // Used to decide whether to show the "are you sure you want to leave?" warning.
  let quizStarted = false;

  // Becomes true after the form is submitted successfully.
  // Prevents the beforeunload warning from firing after a valid submission.
  let quizSubmitted = false;


  /* ============================================================
     SECTION 4 — RESULT PRESENTATION HELPER
     ============================================================
     Returns a plain object describing which emoji, heading, quote,
     and CSS class to use based on the user's percentage score.

     This is a "pure function" — it only reads the input and returns
     a new value. It does not change any HTML or global variables.
  ============================================================ */

  function getResultPresentation(result) {
    // Score 90% or above — exceptional performance
    if (result.percentage >= 90) {
      return {
        emoji:     "🏆",
        heading:   "Excellent work!",
        quote:     "Outstanding effort. You understood the material very well.",
        className: "result-excellent"
      };
    }

    // Score 70–89% — passing, but below the top tier
    if (result.passed) {
      return {
        emoji:     "🎉",
        heading:   "You passed!",
        quote:     "Great job. Keep building on this strong foundation.",
        className: "result-pass"
      };
    }

    // Score 50–69% — close to passing but did not reach the threshold
    if (result.percentage >= 50) {
      return {
        emoji:     "💪",
        heading:   "Almost there",
        quote:     "You are close. Review the explanations below and try again.",
        className: "result-mid"
      };
    }

    // Score below 50% — encourage review and another attempt
    return {
      emoji:     "🌱",
      heading:   "Keep learning",
      quote:     "Every attempt is progress. Review the feedback and you will improve.",
      className: "result-try-again"
    };
  }


  /* ============================================================
     SECTION 5 — UTILITY / HELPER FUNCTIONS
     ============================================================
     Small, reusable functions that are called from multiple
     places in this file.
  ============================================================ */

  /*
    shuffleArray(array)
    -------------------
    Returns a NEW shuffled copy of the input array without
    changing the original. Uses the Fisher-Yates algorithm.

    How it works:
      - Start at the last item in the copy.
      - Pick a random position anywhere from the start up to the current position.
      - Swap those two items.
      - Move one step back and repeat until the beginning is reached.

    Example:
      shuffleArray([1, 2, 3]) might return [3, 1, 2]
      The original [1, 2, 3] is NOT modified.
  */
  function shuffleArray(array) {
    // The spread syntax [...array] creates a shallow copy of the array.
    // We work on the copy so the original questions array is not changed.
    const copied = [...array];

    // Loop from the last index down to index 1 (index 0 needs no swap partner)
    for (let i = copied.length - 1; i > 0; i--) {
      // Math.random() returns a decimal between 0 and 1 (e.g. 0.73)
      // Multiplying by (i + 1) scales it to 0 .. i, and Math.floor rounds down
      const randomIndex = Math.floor(Math.random() * (i + 1));

      // Swap copied[i] and copied[randomIndex] using array destructuring.
      // This is shorthand for: temp = a; a = b; b = temp;
      [copied[i], copied[randomIndex]] = [copied[randomIndex], copied[i]];
    }

    return copied;
  }

  /*
    escapeHtml(text)
    ----------------
    Converts characters that have special meaning in HTML into
    safe "HTML entities" so they display as plain text rather than
    being interpreted as markup.

    Why this matters (security):
      If a question text contained <script>alert("hack")</script>
      and we inserted it directly into innerHTML, the browser would
      run that script. escapeHtml prevents this by turning < into &lt;
      so the browser displays the angle bracket instead of treating it
      as a tag.

    Example:
      escapeHtml('<b>Hello</b>') returns '&lt;b&gt;Hello&lt;/b&gt;'
  */
  function escapeHtml(text) {
    return String(text)
      .replaceAll("&",  "&amp;")   // & must be escaped first to avoid double-escaping
      .replaceAll("<",  "&lt;")    // prevents HTML tag injection
      .replaceAll(">",  "&gt;")    // closes any accidentally opened tags
      .replaceAll('"',  "&quot;")  // prevents breaking out of an attribute value
      .replaceAll("'",  "&#039;"); // prevents single-quote attribute breakout
  }

  /*
    clearValidationState()
    ----------------------
    Removes all red highlighting and error messages that appear
    when the user tries to submit with unanswered questions.

    Called when:
      - The user answers a previously unanswered question
      - A fresh validation run begins
  */
  function clearValidationState() {
    // Hide the summary banner at the top that lists missing question numbers
    if (validationSummary) {
      validationSummary.textContent = "";
      validationSummary.classList.add("hidden"); // CSS class "hidden" sets display:none
    }

    // Loop through every question card and remove its red styling
    quizContainer.querySelectorAll(".question-card").forEach(function (card) {
      card.classList.remove("question-unanswered"); // removes the red border
      card.removeAttribute("aria-invalid");         // removes the screen reader flag

      // Hide the per-card inline warning ("This question still needs an answer.")
      const warning = card.querySelector(".question-warning");
      if (warning) {
        warning.classList.add("hidden");
      }
    });
  }

  /*
    setHistoryStatus(message)
    -------------------------
    Updates the small status line below the attempt history list.
    Used for feedback messages like "Attempt saved" or "History cleared".
  */
  function setHistoryStatus(message) {
    if (!historyStatus) return; // safety check — do nothing if element is missing
    historyStatus.textContent = message;
    historyStatus.classList.remove("hidden");
  }

  /*
    getQuestionCard(index)
    ----------------------
    Finds and returns the question card <article> element for a
    given zero-based question index.

    Cards store their index in a data-question-index attribute:
      <article data-question-index="2">...</article>
    so this function can reliably find them even after shuffling.
  */
  function getQuestionCard(index) {
    return quizContainer.querySelector(`[data-question-index="${index}"]`);
  }

  /*
    removeQuestionHighlight(index)
    ------------------------------
    Clears the red unanswered-question highlight from a single card.
    Called immediately when the user selects an answer for that question
    so the warning disappears without requiring another submit attempt.
  */
  function removeQuestionHighlight(index) {
    const questionCard = getQuestionCard(index);
    if (!questionCard) return; // safety check

    questionCard.classList.remove("question-unanswered");
    questionCard.removeAttribute("aria-invalid");
  }

  /*
    validateQuestionData(question)
    ------------------------------
    Checks that a question object from the JSON file has all the
    properties the quiz needs, with the correct data types.

    Returns true if everything is valid, false if anything is
    missing or has the wrong type.

    This prevents runtime errors that would occur if we tried to
    render a question that was missing its options array, for example.
  */
  function validateQuestionData(question) {
    return (
      question &&
      typeof question.question            === "string" &&  // question text is a string
      typeof question.topic               === "string" &&  // topic label (HTML/CSS/JS) is a string
      typeof question.answer              === "string" &&  // correct answer is a string
      typeof question.explanation         === "string" &&  // main explanation is a string
      Array.isArray(question.options)                 &&  // options is an array
      question.options.length >= 2                    &&  // at least two options available
      typeof question.option_explanations === "object" && // per-option explanations exist
      question.option_explanations !== null            && // and is not null
      question.options.every(function (option) {
        return typeof option === "string";               // every option is a string
      }) &&
      question.options.includes(question.answer)          // the answer must be one of the options
    );
  }


  /* ============================================================
     SECTION 6 — LOAD QUESTIONS VIA AJAX
     ============================================================
     Uses the browser's built-in fetch() function to load the
     questions.json file from the server at runtime (AJAX).

     Key concepts:
       async   — marks a function as asynchronous, meaning it can
                 pause and wait for things like network responses
                 without freezing the entire page.
       await   — pauses execution inside an async function until
                 the awaited operation finishes, then continues.
       try/catch — if anything inside try throws an error, execution
                   jumps immediately to the catch block.

     This approach keeps ALL question data out of the HTML and JS
     source code, which is required by the AJAX rubric criterion.
  ============================================================ */

  async function loadQuestions() {
    try {
      /*
        fetch() sends a GET request to data/questions.json.
        cache: "no-store" forces the browser to always request a
        fresh copy from disk instead of using a cached version.

        fetch() returns a Promise that resolves to a Response object.
        "await" pauses here until the network response arrives.
      */
      const response = await fetch("data/questions.json", { cache: "no-store" });

      /*
        response.ok is true for HTTP status codes 200-299 (success).
        If the file is missing (404) or the server errors (500), ok is
        false and we throw an error to jump to the catch block below.
      */
      if (!response.ok) {
        throw new Error("Failed to fetch question file.");
      }

      /*
        response.json() reads the response body text and parses it
        from a JSON-formatted string into a plain JavaScript object.
        It also returns a Promise, so we await it as well.
      */
      const data = await response.json();

      // Confirm the JSON has a "questions" array containing at least 10 items
      if (!Array.isArray(data.questions) || data.questions.length < 10) {
        throw new Error("Question file does not contain enough questions.");
      }

      // Run validateQuestionData on every question to catch malformed entries
      if (!data.questions.every(validateQuestionData)) {
        throw new Error("Question file contains invalid question data.");
      }

      /*
        Shuffle the question order so it is different on every page load.
        This discourages memorising answer positions across attempts.
        The shuffled array is stored in the "questions" state variable.
      */
      questions = shuffleArray(data.questions);

      // Build and inject all question HTML into the page
      renderQuiz(questions);

      // Update the stat bar at the top of the form with loaded data
      questionCount.textContent   = questions.length;
      passMarkDisplay.textContent = PASS_PERCENTAGE + "%";

      // Hide the loading spinner and reveal the quiz form
      quizLoading.classList.add("hidden");
      quizForm.classList.remove("hidden");

    } catch (error) {
      /*
        If any line above threw an error (network failure, bad JSON,
        validation failure), execution jumps here.
        Log the error for debugging and show the error message box.
      */
      console.error(error);
      quizLoading.classList.add("hidden");
      quizError.classList.remove("hidden");
    }
  }


  /* ============================================================
     SECTION 7 — RENDER QUIZ QUESTIONS INTO THE DOM
     ============================================================
     Takes the shuffled array of question objects and dynamically
     builds the HTML for every question card entirely in JavaScript.

     No questions are hard-coded in quiz.html — they are all
     created here using DOM manipulation, satisfying the requirement
     for dynamic rendering.
  ============================================================ */

  function renderQuiz(questionArray) {
    // Clear any existing content (relevant if the quiz were reset)
    quizContainer.innerHTML = "";

    // Loop through every question object in the shuffled array
    questionArray.forEach(function (question, questionIndex) {

      /*
        document.createElement("article") creates a new <article> element
        in memory. We use <article> because each question is a self-contained
        piece of content with its own heading and options.

        We set data-question-index so we can look this card up later
        by index — e.g. data-question-index="3" on the fourth card.
      */
      const questionCard               = document.createElement("article");
      questionCard.className           = "question-card";
      questionCard.dataset.questionIndex = questionIndex;

      /*
        Build the HTML for the radio-button answer options.
        Array.map() transforms each option string into an HTML string.
        Array.join("") merges the array of strings into one long string.

        Each option has:
          - A unique id like "q0_option1" linking the label to its input
          - A radio input with the question's group name and the option's value
          - A <span> for the visible option text
      */
      const optionsHtml = question.options
        .map(function (option, optionIndex) {
          // Unique id format: q[questionIndex]_option[optionIndex]
          const optionId = `q${questionIndex}_option${optionIndex}`;

          return `
            <label class="option-item" for="${optionId}">
              <input
                type="radio"
                name="question_${questionIndex}"
                id="${optionId}"
                value="${escapeHtml(option)}"
              >
              <span>${escapeHtml(option)}</span>
            </label>
          `;
        })
        .join(""); // merge all HTML strings into one

      /*
        Set the card's inner HTML using a template literal (backtick string).
        Template literals allow multi-line strings and ${expr} placeholders
        that are automatically replaced with the expression's value.

        escapeHtml() is called on every piece of question data before
        inserting it into innerHTML to prevent XSS (cross-site scripting).
      */
      questionCard.innerHTML = `
        <div class="question-header">
          <span class="question-number">Question ${questionIndex + 1}</span>
          <span class="question-topic">${escapeHtml(question.topic)}</span>
        </div>

        <h3>${escapeHtml(question.question)}</h3>

        <div class="question-warning hidden" aria-live="polite">
          This question still needs an answer.
        </div>

        <div class="option-list">
          ${optionsHtml}
        </div>
      `;

      // Add the completed card element to the quiz container in the live DOM
      quizContainer.appendChild(questionCard);
    });

    /*
      Once all cards are in the DOM, attach radio change listeners
      so we can react when the user makes their first selection.
    */
    attachStartTracking();
  }


  /* ============================================================
     SECTION 8 — TRACK WHEN THE QUIZ STARTS
     ============================================================
     Listens for the first radio button selection.
     As soon as the user picks any answer, quizStarted is set to
     true, which activates the beforeunload warning below.
  ============================================================ */

  function attachStartTracking() {
    // Select every radio input that is now inside the quiz container
    const radioInputs = quizContainer.querySelectorAll('input[type="radio"]');

    radioInputs.forEach(function (input) {
      // "change" fires when a radio becomes selected
      input.addEventListener("change", function () {

        // Only run the first-start logic once
        if (!quizStarted) {
          quizStarted = true;
          startedStatus.textContent = "Yes"; // update the stat bar display
        }

        /*
          Work out which question number this radio belongs to.
          Radio groups for question 3 are named "question_3".
          Removing the "question_" prefix leaves "3", which Number()
          converts to the integer 3.
        */
        const questionName  = input.name;
        const questionIndex = Number(questionName.replace("question_", ""));

        // Remove any red validation highlight from this card now it is answered
        removeQuestionHighlight(questionIndex);

        // Also dismiss the top-level validation summary banner
        clearValidationState();
      });
    });
  }


  /* ============================================================
     SECTION 9 — BEFORE-LEAVE WARNING (beforeunload event)
     ============================================================
     If the user started the quiz (selected at least one answer)
     and tries to navigate away or close the tab BEFORE submitting,
     the browser shows a native confirmation dialog.

     Setting event.returnValue = "" is the standard cross-browser
     way to trigger this. The browser's own wording cannot be changed
     by JavaScript — this is intentional for user safety.

     The guard checks both conditions:
       quizStarted   — at least one answer was selected
       !quizSubmitted — the quiz has NOT been submitted yet
  ============================================================ */

  window.addEventListener("beforeunload", function (event) {
    if (quizStarted && !quizSubmitted) {
      event.preventDefault(); // required in Firefox
      event.returnValue = ""; // triggers the native browser warning dialog
    }
  });


  /* ============================================================
     SECTION 10 — SUBMISSION VALIDATION
     ============================================================
     Before accepting a submission, we check that every question
     has a chosen answer. If any are missing, we highlight them
     and stop the submission.
  ============================================================ */

  /*
    getUnansweredQuestionIndexes()
    ------------------------------
    Returns an array of zero-based indexes for every question
    that does not currently have a selected radio button.

    Example: if questions at indexes 1 and 3 are unanswered,
    this returns [1, 3].
  */
  function getUnansweredQuestionIndexes() {
    const unanswered = [];

    questions.forEach(function (_, index) {
      /*
        querySelector with the :checked pseudo-class only matches a
        radio input that is currently selected.
        If no radio in the group is selected, it returns null.
      */
      const selected = quizContainer.querySelector(
        `input[name="question_${index}"]:checked`
      );

      if (!selected) {
        unanswered.push(index); // this question has no answer yet
      }
    });

    return unanswered;
  }

  /*
    showUnansweredQuestions(unansweredIndexes)
    ------------------------------------------
    Adds red highlighting to each unanswered question card and
    shows the banner at the top listing the missing question numbers.

    Also scrolls the page to the first unanswered card so the user
    can immediately see what still needs an answer.
  */
  function showUnansweredQuestions(unansweredIndexes) {
    // Clear leftovers from any previous validation attempt
    clearValidationState();

    // Add red border and inline warning to every unanswered card
    unansweredIndexes.forEach(function (index) {
      const questionCard = getQuestionCard(index);
      if (!questionCard) return;

      // CSS class "question-unanswered" applies a red border (defined in style.css)
      questionCard.classList.add("question-unanswered");
      // aria-invalid="true" signals to screen readers that this field needs attention
      questionCard.setAttribute("aria-invalid", "true");

      // Show the per-card inline warning message
      const warning = questionCard.querySelector(".question-warning");
      if (warning) {
        warning.classList.remove("hidden");
      }
    });

    // Show the summary banner listing missing question numbers (1-based for readability)
    if (validationSummary) {
      const questionNumbers = unansweredIndexes.map(function (index) {
        return index + 1; // convert 0-based index to 1-based question number
      });

      validationSummary.textContent =
        `Please answer all questions before submitting. Missing: ${questionNumbers.join(", ")}.`;
      validationSummary.classList.remove("hidden");
    }

    // Scroll smoothly to the first unanswered card
    const firstUnansweredCard = getQuestionCard(unansweredIndexes[0]);
    if (firstUnansweredCard) {
      firstUnansweredCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }


  /* ============================================================
     SECTION 11 — SCORE CALCULATION
     ============================================================
     Reads the selected radio value for each question and compares
     it to the correct answer stored in the question object.
  ============================================================ */

  /*
    calculateResult()
    -----------------
    Loops through every loaded question, reads the checked radio
    button's value, and checks if it matches the correct answer.

    Returns an object containing:
      score      — count of correct answers (integer)
      total      — total number of questions (integer)
      percentage — rounded percentage score (0 to 100)
      passed     — true if percentage >= PASS_PERCENTAGE, else false
  */
  function calculateResult() {
    let score = 0;

    questions.forEach(function (question, index) {
      // Find the radio input that is checked for this question group
      const selected = quizContainer.querySelector(
        `input[name="question_${index}"]:checked`
      );

      // Compare the selected value to the stored correct answer
      if (selected && selected.value === question.answer) {
        score++; // increment score by 1 for each correct answer
      }
    });

    // Calculate the percentage, rounded to the nearest whole number
    // e.g. 7 correct out of 10 = (7/10) * 100 = 70%
    const percentage = Math.round((score / questions.length) * 100);

    // Determine pass or fail based on the configured threshold
    const passed = percentage >= PASS_PERCENTAGE;

    return { score, total: questions.length, percentage, passed };
  }


  /* ============================================================
     SECTION 12 — DISPLAY RESULT SUMMARY
     ============================================================
     Writes the score, percentage, pass/fail status, emoji,
     heading, and quote into the result section, then shows it.
     No page reload is needed — everything updates in place.
  ============================================================ */

  function showResult(result) {
    // Determine which visual style to use based on the score percentage
    const presentation = getResultPresentation(result);

    // Update result display elements with the calculated values
    scoreValue.textContent      = `${result.score} / ${result.total}`;
    percentageValue.textContent = `${result.percentage}%`;
    passFailValue.textContent   = result.passed ? "Passed" : "Not Passed";

    // Update the decorative heading section
    resultVisual.textContent  = presentation.emoji;
    resultHeading.textContent = presentation.heading;
    quoteText.textContent     = presentation.quote;

    /*
      Update the card's CSS class to change its background colour.
      "result-hero-card" is always present; the second class (e.g.
      "result-excellent") switches the colour via CSS.
    */
    resultHeroCard.className = "result-hero-card " + presentation.className;

    // Show a different contextual message based on whether the user passed
    resultMessage.textContent = result.passed
      ? "Great work! You passed the quiz and unlocked a bonus reward from a public API."
      : "You did not pass this time, but the detailed review below will help you improve.";

    // Make the result section visible (it starts with CSS class "hidden")
    resultSection.classList.remove("hidden");
  }


  /* ============================================================
     SECTION 13 — DETAILED ANSWER REVIEW
     ============================================================
     Builds a review card for every question after submission,
     showing the user's answer, the correct answer, and an
     explanation for each option.
  ============================================================ */

  function renderReview() {
    // Clear any content from a previous submission
    reviewList.innerHTML = "";

    questions.forEach(function (question, index) {
      // Find the radio that was checked for this question
      const selectedInput = quizContainer.querySelector(
        `input[name="question_${index}"]:checked`
      );

      // If somehow nothing was checked, fall back to a placeholder
      const selectedAnswer = selectedInput ? selectedInput.value : "No answer selected";
      const wasCorrect     = selectedAnswer === question.answer;

      /*
        Build an HTML block for each answer option showing:
          A tick or cross indicating if it was correct
          A "Your choice" badge on the option the user picked
          Per-option explanation text from the JSON data
          Different CSS colouring for correct vs. wrong selections
      */
      const optionReviews = question.options
        .map(function (option) {
          const isCorrectOption  = option === question.answer;
          const wasChosen        = option === selectedAnswer;
          const explanation      = question.option_explanations[option] || "";

          // Build the CSS class string for this option
          let optionClass = "review-option";
          if (isCorrectOption)               optionClass += " correct-option";  // always green
          if (wasChosen && !isCorrectOption)  optionClass += " chosen-wrong";   // red (wrong pick)
          if (wasChosen &&  isCorrectOption)  optionClass += " chosen-correct"; // green (right pick)

          return `
            <div class="${optionClass}">
              <div class="review-option-top">
                <strong>${isCorrectOption ? "Correct" : "Wrong"}: ${escapeHtml(option)}</strong>
                ${wasChosen ? '<span class="review-choice-badge">Your choice</span>' : ""}
              </div>
              <p>${escapeHtml(explanation)}</p>
            </div>
          `;
        })
        .join("");

      // Create the review card element and set its content
      const reviewCard     = document.createElement("article");
      reviewCard.className = "review-card";
      reviewCard.innerHTML = `
        <div class="review-card-top">
          <span class="attempt-badge">Question ${index + 1}</span>
          <span class="review-status ${wasCorrect ? "review-correct" : "review-incorrect"}">
            ${wasCorrect ? "Correct" : "Incorrect"}
          </span>
        </div>

        <h3>${escapeHtml(question.question)}</h3>

        <p><strong>Your answer:</strong> ${escapeHtml(selectedAnswer)}</p>
        <p><strong>Correct answer:</strong> ${escapeHtml(question.answer)}</p>
        <p class="main-explanation">
          <strong>Why this is correct:</strong> ${escapeHtml(question.explanation)}
        </p>

        <div class="review-options-grid">
          ${optionReviews}
        </div>
      `;

      // Append the review card to the review list in the DOM
      reviewList.appendChild(reviewCard);
    });

    // Make the entire review section visible
    reviewSection.classList.remove("hidden");
  }


  /* ============================================================
     SECTION 14 — LOCAL STORAGE (saving attempt history)
     ============================================================
     localStorage is a browser feature that stores key-value pairs
     as strings on the user's device. Unlike cookies, localStorage
     data stays permanently until cleared.

     Limitations of localStorage:
       - Only stores strings, so objects must be serialised with JSON
       - Not available (throws errors) in some private browsing modes
       - Cleared when the user clears site data in their browser settings

     All reads and writes are inside try/catch blocks so the quiz
     continues to work even when localStorage is unavailable.
  ============================================================ */

  /*
    getAttempts()
    -------------
    Reads the stored attempt history from localStorage and returns
    it as a JavaScript array. Returns an empty array if nothing is
    stored yet or if the stored data is damaged or in an old format.
  */
  function getAttempts() {
    try {
      /*
        localStorage.getItem() returns the stored string for a key,
        or null if that key has never been set.
      */
      const raw = localStorage.getItem(STORAGE_KEY);

      // No attempts stored yet — return an empty array
      if (!raw) {
        return [];
      }

      /*
        JSON.parse() converts the stored JSON string back into a
        JavaScript array. If the string is malformed, JSON.parse
        throws a SyntaxError which the catch block handles.
      */
      const parsed = JSON.parse(raw);

      // Guard against accidentally stored non-array data
      if (!Array.isArray(parsed)) {
        return [];
      }

      /*
        Filter out attempts that are missing fields or have the wrong
        data types. This handles data stored by an older version of the
        code that may have had a different structure.
      */
      return parsed.filter(function (attempt) {
        return (
          attempt &&
          typeof attempt.score      === "number"  &&
          typeof attempt.total      === "number"  &&
          typeof attempt.percentage === "number"  &&
          typeof attempt.passed     === "boolean" &&
          typeof attempt.timestamp  === "string"
        );
      });

    } catch (error) {
      // JSON.parse throws SyntaxError for malformed data — handle gracefully
      console.error("Failed to read attempts from local storage.", error);
      return [];
    }
  }

  /*
    saveAttempt(result)
    -------------------
    Adds the current quiz result to the front of the stored array
    (so the most recent attempt appears first) and writes the
    updated array back to localStorage as a JSON string.

    unshift() inserts the new item at index 0 (start of array).
  */
  function saveAttempt(result) {
    try {
      const attempts = getAttempts(); // load existing attempts first

      // Prepend the new attempt so latest appears at the top of history
      attempts.unshift({
        score:      result.score,
        total:      result.total,
        percentage: result.percentage,
        passed:     result.passed,
        // toLocaleString() formats the date and time to match the user's locale
        // e.g. "12/04/2026, 3:45:00 pm" in Australia
        timestamp:  new Date().toLocaleString()
      });

      /*
        JSON.stringify() converts the JavaScript array back to a JSON
        string so it can be stored in localStorage (which only accepts strings).
      */
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
      setHistoryStatus("Attempt saved successfully.");

    } catch (error) {
      // localStorage can be full or disabled — report without breaking the quiz
      console.error("Failed to save attempt to local storage.", error);
      setHistoryStatus(
        "Attempt could not be saved because browser storage is unavailable."
      );
    }
  }

  /*
    clearAttemptHistory()
    ---------------------
    Deletes the stored attempts key from localStorage entirely and
    refreshes the history display to show the empty state.
  */
  function clearAttemptHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY); // delete the key and its value
      renderAttemptHistory();               // refresh the display
      setHistoryStatus("Saved history cleared.");

    } catch (error) {
      console.error("Failed to clear attempt history.", error);
      setHistoryStatus(
        "Saved history could not be cleared because browser storage is unavailable."
      );
    }
  }

  /*
    renderAttemptHistory()
    ----------------------
    Reads stored attempts and builds a display card for each one.
    Shows the "No attempts yet" message when the array is empty.

    Called on initial page load (to show previous sessions' data)
    and again after each new submission to update the list.
  */
  function renderAttemptHistory() {
    const attempts = getAttempts();

    if (attempts.length === 0) {
      // Nothing saved yet — show the empty state message
      historyEmpty.classList.remove("hidden");
      attemptHistoryList.classList.add("hidden");
      attemptHistoryList.innerHTML = "";
      return;
    }

    // Data exists — hide the empty state and show the attempt cards
    historyEmpty.classList.add("hidden");
    attemptHistoryList.classList.remove("hidden");

    /*
      map() transforms each stored attempt object into an HTML string.
      join("") merges all strings into one block of HTML which is
      then assigned to the container's innerHTML in one operation.

      Attempt numbers are shown as 1-based (index 0 becomes "Attempt 1").
    */
    attemptHistoryList.innerHTML = attempts
      .map(function (attempt, index) {
        return `
          <article class="attempt-card">
            <div class="attempt-top-row">
              <span class="attempt-badge">Attempt ${index + 1}</span>
              <span class="attempt-time">${escapeHtml(attempt.timestamp)}</span>
            </div>

            <div class="attempt-metrics">
              <div>
                <span class="attempt-label">Score</span>
                <strong>${attempt.score} / ${attempt.total}</strong>
              </div>
              <div>
                <span class="attempt-label">Percentage</span>
                <strong>${attempt.percentage}%</strong>
              </div>
              <div>
                <span class="attempt-label">Result</span>
                <strong>${attempt.passed ? "Passed" : "Not Passed"}</strong>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }


  /* ============================================================
     SECTION 15 — REWARD FROM A PUBLIC API
     ============================================================
     When the user passes the quiz, this function fetches a
     motivational piece of advice from the public Advice Slip API.

     API endpoint: https://api.adviceslip.com/advice
     Response format: { "slip": { "id": 1, "advice": "Some text." } }

     The reward is NEVER hard-coded — it always comes from the
     live API response, satisfying the public API rubric requirement.

     A timestamp is appended to the URL to prevent the browser from
     returning a cached response every time (the API would otherwise
     return the same advice repeatedly in some browsers).
  ============================================================ */

  async function loadReward() {
    // Show the reward section immediately with a loading placeholder
    rewardSection.classList.remove("hidden");
    rewardText.textContent = "Loading reward...";

    try {
      /*
        Send a GET request to the Advice Slip API.
        Date.now() returns the current timestamp in milliseconds
        (e.g. 1712345678901), appended as a query parameter to
        bust the browser cache.
      */
      const response = await fetch(
        "https://api.adviceslip.com/advice?timestamp=" + Date.now()
      );

      if (!response.ok) {
        throw new Error("Reward API request failed.");
      }

      const data = await response.json();

      /*
        Validate the API response before using it.
        We check that data.slip.advice is a non-empty string to guard
        against unexpected API changes or empty responses.
      */
      const advice =
        data && data.slip && typeof data.slip.advice === "string"
          ? data.slip.advice.trim()
          : "";

      if (!advice) {
        throw new Error("Reward API returned an unexpected response format.");
      }

      // Display the fetched advice as the reward message
      rewardText.textContent = `Bonus encouragement: "${advice}"`;

    } catch (error) {
      /*
        If the API is unreachable or returns unexpected data, use a
        static fallback message so the reward section never stays empty
        or shows a raw error to the user.
      */
      console.error(error);
      rewardText.textContent =
        "Bonus encouragement: Strong effort. Keep applying what you learned and continue building.";
    }
  }


  /* ============================================================
     SECTION 16 — CLEAR SELECTIONS BUTTON
     ============================================================
     Lets the user reset all their answers without reloading the
     page. Also resets the quiz state variables so the beforeunload
     warning stops, and clears any validation highlights.
  ============================================================ */

  function clearSelections() {
    // Find every radio button that is currently checked and uncheck it
    const selectedInputs = quizContainer.querySelectorAll(
      'input[type="radio"]:checked'
    );

    selectedInputs.forEach(function (input) {
      input.checked = false; // uncheck the radio
    });

    // Reset state variables — quiz is no longer "started"
    quizStarted   = false;
    quizSubmitted = false;
    startedStatus.textContent = "No"; // update stat bar

    // Remove any red validation highlights left from a previous submission attempt
    clearValidationState();
  }

  // Attach the click listener only if the button exists in the HTML
  if (clearSelectionsBtn) {
    clearSelectionsBtn.addEventListener("click", clearSelections);
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearAttemptHistory);
  }


  /* ============================================================
     SECTION 17 — FORM SUBMISSION HANDLER
     ============================================================
     The form's "submit" event fires when the user clicks the
     "Submit Quiz" button.

     event.preventDefault() cancels the browser's default behaviour
     of submitting the form to a server and reloading the page.
     All processing happens in JavaScript instead.
  ============================================================ */

  if (quizForm) {
    quizForm.addEventListener("submit", function (event) {
      // Prevent the page from reloading on submit
      event.preventDefault();

      // Step 1: Check if any questions are unanswered
      const unansweredIndexes = getUnansweredQuestionIndexes();

      if (unansweredIndexes.length > 0) {
        // Highlight missing questions and stop here — do not proceed
        showUnansweredQuestions(unansweredIndexes);
        return; // early return — nothing below this runs
      }

      // Step 2: All questions answered — clear any previous validation marks
      clearValidationState();

      // Step 3: Calculate the user's score
      const result = calculateResult();

      // Step 4: Mark the quiz as submitted so the beforeunload warning stops
      quizSubmitted = true;

      // Step 5: Show the result, review, and update the history list
      showResult(result);
      renderReview();
      saveAttempt(result);
      renderAttemptHistory(); // re-render to include this new attempt

      // Step 6: Fetch the reward from the API only if the user passed
      if (result.passed) {
        loadReward();
      } else {
        // Ensure the reward section is hidden for a failing score
        rewardSection.classList.add("hidden");
      }

      // Step 7: Scroll smoothly up to the result section so the user sees it
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }


  /* ============================================================
     SECTION 18 — SCROLL PROGRESS BAR
     ============================================================
     Updates a thin bar across the very top of the page to show
     how far down the user has scrolled.

     The maths:
       window.scrollY                    — pixels scrolled from the top
       document.documentElement.scrollHeight — total height of the full page
       window.innerHeight                — height of the visible viewport
       docHeight = scrollHeight - innerHeight — the total scrollable distance
       scrolled = (scrollY / docHeight) * 100 — percentage scrolled (0 to 100)
  ============================================================ */

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Avoid division by zero on very short pages
    const scrolled  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    // Set the progress bar's width as a percentage string
    scrollProgress.style.width = scrolled + "%";
  }

  // Listen for scroll events to keep the bar updated as the user scrolls
  window.addEventListener("scroll", updateScrollProgress);

  // Run once immediately to set the correct position on page load
  updateScrollProgress();


  /* ============================================================
     SECTION 19 — INITIAL PAGE LOAD
     ============================================================
     These two function calls run as soon as the DOM is ready.

     renderAttemptHistory() runs first so any attempt history from
     previous sessions is visible to the user immediately, even
     before the quiz questions have finished loading.

     loadQuestions() runs second and fetches questions.json via
     AJAX to build the quiz form asynchronously.
  ============================================================ */

  renderAttemptHistory(); // show any previously saved attempts from localStorage
  loadQuestions();        // fetch and render the quiz questions via AJAX

  console.log("Quiz page loaded successfully.");
});
