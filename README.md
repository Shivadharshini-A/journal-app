# Journova — Secure Personal Journal and Reflective AI Assistant

Journova is a secure web-based personal journal application that provides users with a private space to write, organize, and reflect on their thoughts with the assistance of AI.

The application uses Google Cloud services to provide authenticated access, isolated data storage, secure API key management, and scalable serverless deployment.

## Features

* User authentication with Firebase Authentication and Google Sign-In
* Personal journal creation, editing, and deletion
* User-isolated journal storage using Cloud Firestore
* AI-powered brainstorming and reflection using Gemini
* Multi-turn conversations with AI companion personas
* Mood tracking, tags, and journal themes
* Secure API key management using Google Cloud Secret Manager
* Serverless backend deployment using Google Cloud Run

## Tech Stack

| Component         | Technology                           |
| ----------------- | ------------------------------------ |
| Frontend          | HTML5, CSS, JavaScript (ES6 Modules) |
| Backend           | Node.js, Express.js                  |
| Authentication    | Firebase Authentication              |
| Database          | Google Cloud Firestore               |
| AI                | Gemini / AI Studio                   |
| Secret Management | Google Cloud Secret Manager          |
| Deployment        | Google Cloud Run                     |

## Architecture

```text
User
  |
  v
Journova Web Application
  |
  +---- Firebase Authentication
  |
  +---- Cloud Run Backend
           |
           +---- Cloud Firestore
           |
           +---- Gemini AI
           |
           +---- Secret Manager
```

## Data Isolation

Journal data is stored using user-specific Firestore paths:

```text
users/{uid}/journals
```

This structure ensures that journal data is associated with the authenticated user's account and helps prevent cross-user data access.

## Project Structure

```text
Journova/
├── public/
│   └── index.html
├── server.js
├── package.json
└── README.md
```

## Deployment

Journova is designed to run on Google Cloud Run using a Node.js and Express.js backend.

The application uses Google Cloud Secret Manager for sensitive credentials and Cloud Firestore for persistent user data.

## Project Information

**Project Name:** Journova
**Project Type:** Secure Personal Journal and Reflective AI Assistant
**Primary Track:** Ideathon Challenge
**Deployment Target:** Google Cloud Run
**Initiative:** Accelerate AI with Cloud Run

## Objective

The objective of Journova is to combine secure personal journaling with AI-assisted reflection while demonstrating the use of modern Google Cloud services for authentication, data storage, secret management, AI integration, and serverless deployment.

---
