# The Literary Nexus — Event Landing Page

A single-page website for **The Literary Nexus** event in Portland. Built with vanilla HTML, CSS, and JS, featuring a dark/light theme toggle, dynamic author loading, schedule filtering, and RSVP booking.

---

## 🎨 Theme & Typography

Styling is configured using CSS variables in [main.css](file:///c:/Users/hp/Desktop/Indie Bookstore/assets/css/main.css):

*   **Colors:** Crimson (`#A30000`), Cream (`#F8F0E3`), and Gold (`#D4AF37`) for accents.
*   **Fonts:** `Merriweather` (serif) for headings and `Open Sans` (sans-serif) for body text.
*   **Transitions:** Standard transitions for the dark mode toggle, modals, and hover states.

---

## 🛠 Features

### 1. Countdown & API Fallback
*   Fetches the event title, date, and location dynamically on load.
*   Falls back to a default date if the API fails, so the countdown doesn't show an expired state.
*   The countdown digits trigger a CSS animation only when their value changes to avoid page repaints.

### 2. Dynamic Author Profiles
*   Fetches user data from the JSONPlaceholder API.
*   Shows skeleton loader cards while waiting for the network response.
*   Clicking an author opens a modal with a bio, contact email, and book list.

### 3. Schedule & Filters
*   Filters event sessions by type (Reception, Readings, Discussions, Networking).
*   Dynamically generates Google Calendar links when clicking the "Add to Calendar" buttons.

### 4. RSVP Booking & Confirmation
*   Form validation with custom inline error messages.
*   Submits form data via a POST request to `httpbin.org`.
*   Displays a print-ready confirmation ticket with a barcode and confetti effect upon success.

### 5. Accessibility & SEO
*   Includes a skip-to-content link, keyboard focus outlines, and Esc key modal closing.
*   Semantic HTML layout (`<header>`, `<main>`, `<section>`, `<footer>`) and standard SEO meta description tags.

---

## 🚀 Quick Start

### 1. Install Dependencies
Run the following in the project root:
```bash
npm install
```

### 2. Run local server
Start the local dev server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📂 Project Structure

```
├── assets/
│   ├── css/
│   │   └── main.css     # Styles, layout, theme toggles, and modal animations
│   ├── js/
│   │   └── app.js       # Countdown, API fetching, filtering, and modal handlers
│   └── images/          # Images and background assets
├── index.html           # Main markup template
└── package.json         # Scripts and server configuration
```

---

## 🔧 API Configuration

To change the endpoint for event details, update `fetchEventData` in [app.js](file:///c:/Users/hp/Desktop/Indie Bookstore/assets/js/app.js):

```javascript
async function fetchEventData() {
  try {
    const res = await fetch('YOUR_API_ENDPOINT');
    // ...
  }
}
```

To point the RSVP form submissions to your own database or backend, modify the `RSVP_API` constant at the top of [app.js](file:///c:/Users/hp/Desktop/Indie Bookstore/assets/js/app.js):

```javascript
const RSVP_API = 'YOUR_SUBMISSION_ENDPOINT';
```
