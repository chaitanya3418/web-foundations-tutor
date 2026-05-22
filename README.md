Paste this into **README.md**:

````markdown
# CITS5505 Web Foundations Tutor

A multi-page interactive web project designed to teach the basics of **HTML**, **CSS**, and **JavaScript**.  
The website includes a tutorial page, quiz page, personalised CV page, and AI reflection page.

---

## Project Overview

This project is a static front-end website built using HTML, CSS, JavaScript, JSON, and browser APIs.  
It is designed for beginner web development learners who want to understand how websites are structured, styled, and made interactive.

The main purpose of this project is to demonstrate:

- Semantic HTML structure
- Modern CSS styling and responsive layout
- JavaScript DOM interaction
- Dynamic data loading from JSON files
- Quiz logic and browser storage
- Responsible use of AI during development

---

## Main Pages

| Page | File | Description |
|---|---|---|
| Tutorial Page | `tutorial.html` | Explains HTML, CSS, and JavaScript with interactive examples |
| Quiz Page | `quiz.html` | Tests knowledge using multiple-choice questions loaded from JSON |
| CV Page | `cv.html` | Displays a personalised CV using dynamic JSON data |
| AI Reflection Page | `reflection.html` | Explains how AI was used during planning, coding, debugging, and improvement |

---

## Features

### Tutorial Page

The tutorial page helps users learn the basics of web development.

It includes:

- HTML, CSS, and JavaScript explanations
- Interactive HTML element builder
- CSS styling playground
- JavaScript counter and greeting examples
- Live preview areas
- Scroll progress indicator
- Active section highlighting
- Beginner-friendly explanations

---

### Quiz Page

The quiz page tests the user's understanding of web development concepts.

It includes:

- Questions loaded from `data/questions.json`
- Randomised question order
- Multiple-choice answers
- Validation for unanswered questions
- Score calculation
- Pass/fail result display
- Detailed answer explanations
- Review section after submission
- Attempt history saved using `localStorage`
- Option to clear previous attempts
- Reward/advice message using an external API

---

### Personalised CV Page

The CV page presents a personal portfolio-style curriculum vitae.

It includes:

- Personal profile information
- Technical skills
- Projects and experience
- Education details
- Dynamic CV cards loaded from `data/cv-data.json`
- Category filters
- Animated statistics
- Contact reveal feature
- Responsive layout

---

### AI Reflection Page

The reflection page explains how AI was used during the project.

It includes:

- Planning support
- Development support
- Debugging support
- Prompt examples
- Manual improvements made after AI suggestions
- Ethical reflection
- Limitations of AI use
- Learning outcomes

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and semantic content |
| CSS3 | Styling, layout, responsiveness, and visual design |
| JavaScript | Interactivity and dynamic behaviour |
| JSON | Storing quiz and CV data |
| Fetch API | Loading external JSON files |
| LocalStorage API | Saving quiz attempt history |
| Advice Slip API | Showing reward/advice content after quiz completion |

---

## Folder Structure

```text
cits5505-web-foundations-tutor/
│
├── tutorial.html
├── quiz.html
├── cv.html
├── reflection.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── tutorial.js
│   ├── quiz.js
│   ├── cv.js
│   └── reflection.js
│
├── data/
│   ├── questions.json
│   └── cv-data.json
│
├── images/
│   ├── chaitanya-photo.jpg
│   ├── hero-bg.jpg
│   └── web-dev.gif
│
└── README.md
```

---

## How to Run the Project

This is a static website, so no backend server or database is required.

### Recommended Method: VS Code Live Server

1. Download or clone the repository.
2. Open the project folder in Visual Studio Code.
3. Install the **Live Server** extension.
4. Right-click `tutorial.html`.
5. Select **Open with Live Server**.
6. The website will open in your browser.

---

### Alternative Method: Python Local Server

Open a terminal inside the project folder and run:

```bash
python -m http.server 8000
```

Then open this link in your browser:

```text
http://localhost:8000/tutorial.html
```

---

## Important Note

Do not open the HTML files directly using `file://` if the quiz or CV data does not load.

Some browsers block JavaScript `fetch()` requests when files are opened directly.  
Using **Live Server** or a local Python server is recommended because the project loads JSON files dynamically.

---

## How to Use the Website

1. Open `tutorial.html`.
2. Read the tutorial sections about HTML, CSS, and JavaScript.
3. Try the interactive examples.
4. Open `quiz.html`.
5. Complete the quiz and submit your answers.
6. Review your score and explanations.
7. Open `cv.html` to view the personalised CV page.
8. Open `reflection.html` to read the AI usage reflection.

---

## JavaScript Files

### `tutorial.js`

Controls the interactive tutorial features, including:

- HTML topic explorer
- HTML element builder
- CSS demo playground
- JavaScript counter demo
- Greeting demo
- Scroll progress bar
- Active shortcut highlighting

### `quiz.js`

Controls the quiz functionality, including:

- Loading questions from JSON
- Rendering question cards
- Randomising question order
- Validating unanswered questions
- Calculating score
- Showing review feedback
- Saving attempt history
- Loading advice/reward content

### `cv.js`

Controls the personalised CV page, including:

- Loading CV data from JSON
- Rendering skill and experience cards
- Filtering CV categories
- Animating counters
- Revealing contact information
- Scroll progress and section highlighting

### `reflection.js`

Controls the AI reflection page, including:

- Interactive AI usage stages
- Prompt example tabs
- Reflection content display
- Scroll progress
- Active section highlighting

---

## Data Files

### `data/questions.json`

Stores quiz questions, answer options, correct answers, and explanations.

### `data/cv-data.json`

Stores CV content such as skills, tools, experience, and project-related information.

Keeping this information in JSON files makes the website easier to update and maintain.

---

## Design

The website uses a modern dark-themed design with clear sections, cards, buttons, and interactive areas.

The design focuses on:

- Clean layout
- Readable content
- Consistent navigation
- Responsive structure
- Smooth visual effects
- Beginner-friendly interface
- Clear separation between sections
- Usable layout on different screen sizes

---

## Accessibility and Usability

The project includes usability-focused design features such as:

- Clear headings
- Consistent navigation
- Readable colour contrast
- Helpful button labels
- Form validation messages
- Quiz feedback
- Section shortcuts
- Scroll progress indicator
- Responsive page layout

---

## Testing Checklist

Before submitting or publishing, check the following:

- [ ] `tutorial.html` opens correctly
- [ ] `quiz.html` opens correctly
- [ ] `cv.html` opens correctly
- [ ] `reflection.html` opens correctly
- [ ] Navigation links work between all pages
- [ ] CSS file loads correctly
- [ ] JavaScript files load correctly
- [ ] Images display correctly
- [ ] Tutorial interactions work
- [ ] Quiz questions load from `questions.json`
- [ ] Quiz score is calculated correctly
- [ ] Quiz explanations display after submission
- [ ] Quiz history is saved in the browser
- [ ] Clear history button works
- [ ] CV data loads from `cv-data.json`
- [ ] CV filters work correctly
- [ ] Reflection page interactions work
- [ ] Website works on different screen sizes
- [ ] Browser console has no major errors

---

## Known Limitations

- This project is front-end only.
- There is no backend database.
- Quiz history is saved only in the user's browser.
- If browser storage is cleared, quiz history will be removed.
- The external advice feature requires an internet connection.
- JSON loading may not work correctly if files are opened directly without a local server.

---

## Future Improvements

Possible future improvements include:

- Add an `index.html` homepage
- Add more quiz questions
- Add different quiz difficulty levels
- Add a light and dark mode toggle
- Add more interactive coding exercises
- Add user progress tracking
- Add a completion certificate
- Add more accessibility improvements
- Add backend support for saving quiz results permanently

---

## Author

**Chaitanya Neerukattu**

GitHub: [chaitanya3418](https://github.com/chaitanya3418)

---

## Project Status

This project is complete and ready to upload to GitHub.

It includes:

- Tutorial page
- Quiz page
- Personalised CV page
- AI reflection page
- CSS styling
- JavaScript interaction
- JSON data loading
- Images and media
- Browser storage features

---

## License

This project was created for educational purposes as part of a web development assignment.

If the repository is made public, a license can be added later to explain how others may use, modify, or share the code.
````
