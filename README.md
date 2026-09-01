# Journova — Secure Personal Journal & Reflective AI Assistant

Journova is a production-ready, authenticated web application designed to give users a secure, private environment for personal reflection, daily writing, and multi-turn brainstorming. Built using serverless infrastructure, strict database isolation, and runtime secret management, the app ensures complete data privacy and personalized AI-assisted insight generation.

---

## Technical Architecture & Core Features

* **User Authentication:** Integrated with Firebase Authentication (Google Sign-In) to establish verified user identities and enforce strict account boundaries.
* **Isolated Cloud Storage:** Operates on Google Cloud Firestore using user-isolated document paths (`users/{uid}/journals`) to prevent cross-account data leakage.
* **Multi-Turn AI Brainstorming:** Features an interactive assistant configured with custom companion personas (Creative Partner, Socratic Mentor, Action Planner) to deliver contextual synthesis and structured journal reflections.
* **Secure Key Management:** Leverages Google Cloud Secret Manager to retrieve API credentials dynamically at runtime, eliminating hardcoded keys and ensuring enterprise security standards.
* **Serverless Backend:** Engineered for deployment on Google Cloud Run to provide low-latency execution and automatic scaling.

---

## Tech Stack

* **Frontend:** HTML5, Modern CSS, JavaScript (ES6 Modules)
* **Backend:** Node.js, Express.js
* **Authentication:** Firebase Auth
* **Database:** Google Cloud Firestore
* **Security & Configuration:** Google Cloud Secret Manager
* **Hosting / Infrastructure:** Google Cloud Run

---

## Application Structure
