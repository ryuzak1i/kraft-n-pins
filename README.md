# ⋆˚꩜ kraft n' pins — Official Website

Welcome to the frontend repository for **kraft n' pins**! This is a vibrant, interactive, and fully responsive single-page website built using **HTML5, CSS3**, and **Vanilla JavaScript**. The design perfectly captures the cute, pastel, and student-friendly aesthetic of our local button-pin business based in Imus, Cavite and Manila! ♡

Live Demo: https://ryuzak1i.github.io/kraft-n-pins/ 

## Features & Navigation (˶ᵔ ᵕ ᵔ˶)

The website utilizes a seamless single-page architecture with smooth scrolling navigation, broken down into the following sections:

- **Home:** A cozy welcome hero section introducing our passion project.
- **Shop Pins:** A visual grid displaying our customizable sizes (25mm, 32mm, 58mm) and budget-friendly bundles (**Solo, Trio, Squad**).
- **How to Order:** A simple, step-by-step guide explaining how buyers can order.
- **About Us:** The story of two sister-students who started this business in February 2025 to bring your imagination to life.
- **FAQ:** Quick answers regarding our student-friendly policies (no minimum orders, pricing, and local operations).
- **Order Now (Interactive Checkout):** A fully functional custom order form with a live basket and file uploads.

## 🚀 Advanced Interactive Features (New!)

Our latest update transformed the site from a static page into a fully interactive web app:

- **Dynamic Basket & Live Calculation:** Users can select sizes, bundles, and toggle **Rainbow Holographic Upgrades**. The basket updates quantities and calculates totals in real-time.
- **Drag & Drop File Uploads:** A custom drag-and-drop zone that dynamically generates based on the items in your basket. It accepts PNG/JPEG files, enforces limits, and includes a square-grid gallery preview of uploaded designs.
- **Rush Order Toggle & Processing UI:** A sleek custom toggle that updates estimated processing times automatically based on whether it's a standard, bulk, or priority rush order.
- **Google Apps Script Backend Integration:** The frontend converts uploaded images to Base64 and sends a structured JSON payload via the Fetch API to a Google Apps Script backend. This automates adding the order to a Google Sheet and sends a beautifully formatted HTML email receipt!

## Design & UX Highlights （＾ω＾）

- **Responsive Layout:** Built mobile-first using modern **CSS Flexbox and Grid** to ensure it looks flawless on smartphones, tablets, and desktops.
- **Cohesive Branding:** Features a soft, pastel color palette (pinks, creams, and yellow accents) tailored to our student community.
- **Micro-Interactions:** Includes playful hover states, custom radio buttons, dynamic scaling cards, and smooth state transitions (like the sweeping holographic toggle animation).
- **Custom Modals:** Clean, blur-backed overlays for the image preview gallery and the final checkout receipt.

## Tech Stack (꒪▿꒪)

- **HTML5:** Structured, semantic markup.
- **CSS3:** Custom properties (`:root`), Flexbox, Grid layout, advanced selectors, keyframe animations, and Media Queries for responsiveness.
- **JavaScript (ES6):** Vanilla JS handling DOM manipulation, File API (FileReader), Base64 encoding, state management for the basket/uploads, and async/await Fetch API requests.