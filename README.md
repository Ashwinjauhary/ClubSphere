# 🌐 ClubSphere - The Future of Campus Management

![ClubSphere Banner](https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop)

<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Mobile Ready](https://img.shields.io/badge/Mobile-Capacitor%206-blue?style=flat-square)](https://capacitorjs.com)
[![Status](https://img.shields.io/badge/Status-Active%20Development-success?style=flat-square)]()

</div>

---

## 📖 Introduction

**ClubSphere** is a next-generation, full-stack campus management ecosystem designed to bridge the gap between Student Bodies, Club Administrators, and University Deans. It replaces fragmented workflows (Paper forms, WhatsApp groups, spreadsheets) with a unified, digital-first platform.

Whether you are a student looking for the next hackathon, a club lead needing budget approval, or a dean monitoring campus activity, ClubSphere provides a seamless, real-time experience across **Web** and **Android**.

---

## 🚀 Key Features

### 🧠 AI-Powered Intelligence (Gemini 1.5)
*   **Event Architect**: Staring at a blank page? The AI generates complete event proposals (Title, Budget, Rules, Schedule) based on just a club's mission.
*   **Resilient Connectivity**: Features a **Multi-Key Rotation System** with aggressive retries (50+ attempts) and **Procedural Fallback generators**, ensuring the AI *never* leaves you hanging, even during API outages.
*   **Smart Reporting**: Auto-analyzes event metrics to generate "Dean-Ready" impact reports with sentiment analysis and strategic roadmaps.

### 📱 Native & Mobile First
*   **Android Native App**: Built with **Capacitor**, offering a truly native feel with haptic feedback, safe-area insets, and smooth transitions.
*   **Offline-Ready PWA**: Installable on iOS and Desktop. Works even when the campus Wi-Fi drops.

### 🛠️ Powerful Tools
*   **Dynamic Form Builder**: A Drag-and-Drop form creator (similar to Google Forms) with support for file uploads, ratings, and logic.
*   **Role-Based Access Control (RBAC)**: Strict data isolation using Supabase RLS. Deans see everything; Club Leads see their club; Students see public events.
*   **Real-Time Workflows**: Push notifications and live status updates for proposal approvals.

---

## 🏗️ System Architecture

ClubSphere utilizes a modern **Serverless** architecture to ensure scalability and low maintenance.

```mermaid
flowchart TD
    subgraph "Client Layer"
        Web application["React 18 + Vite"]
        Mobile["Android Build (Capacitor)"]
    end

    subgraph "Edge Network"
        CDN["Vercel Edge"]
    end

    subgraph "Backend Services (Supabase)"
        Auth["Authentication (JWT)"]
        DB[("PostgreSQL Database")]
        Storage["File Storage (Buckets)"]
        Realtime["Real-time Subscriptions"]
    end

    subgraph "Intelligence Layer"
        AI_Service["AI Logic Handler"]
        Gemini["Google Gemini API (Multi-Key)"]
    end

    Mobile --> Web application
    Web application --> CDN
    Web application --> AI_Service
    AI_Service --> Gemini
    Web application --> Auth
    Web application --> DB
    Web application --> Storage
```

---

## 🛠️ Technology Stack (A-Z)

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript | Core application logic and component structure. |
| **Build Tool** | Vite | Lightning-fast HMR and optimized production builds. |
| **Styling** | Tailwind CSS | Utility-first styling for rapid UI development. |
| **Animations** | Framer Motion, GSAP | Complex page transitions and micro-interactions. |
| **Mobile** | Capacitor 6 | Converting the React web app into a native Android APK. |
| **Backend** | Supabase | Postgres Database, Auth, Storage, and Real-time listeners. |
| **AI Model** | Gemini 1.5 Flash | High-speed text generation for creative and analytical tasks. |
| **State** | Zustand | efficient, global state management without boilerplate. |
| **Forms** | React Hook Form + Zod | Type-safe form validation and handling. |
| **Icons** | Lucide React | Consistent, lightweight SVG icons. |

---

## 📂 Project Structure

```bash
ClubSphere/
├── android/                 # Native Android project files (Auto-generated)
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable UI atoms (Buttons, Cards, Modals)
│   │   └── Layout.tsx      # Main application shell
│   ├── pages/              # Route components (Dashboard, Events, Login)
│   ├── services/
│   │   ├── aiService.ts    # Gemini integration (Retry logic, Fallbacks, Prompts)
│   │   └── supabase.ts     # Database client configuration
│   ├── store/              # Zustand stores (Auth, Theme)
│   ├── types/              # TypeScript interfaces (Global)
│   └── App.tsx             # Main entry point with Routes
├── supabase/               # SQL migrations and Seed data
├── capacitor.config.ts     # Mobile build configuration
└── vite.config.ts          # Build optimization settings
```

---

## ⚡ Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A Supabase Project (Free Tier is fine)
*   Google Gemini API Key(s)

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Configuration (Supports comma-separated keys for rotation)
VITE_GEMINI_API_KEY=key1,key2,key3
```

### 3. Installation & Run

```bash
# Clone the repository
git clone https://github.com/Ashwinjauhary/ClubSphere.git

# Navigate to directory
cd ClubSphere

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Android Build (Optional)

```bash
# Build the web assets
npm run build

# Sync with Native Android project
npx cap sync

# Open in Android Studio
npx cap open android
```

---

## 🛡️ Best Practices Implemented

*   **Security**: No API keys are exposed in the client bundle (except public anon keys). RLS policies prevent unauthorized data access.
*   **Performance**: Code splitting via Vite, lazy loading of heavy routes, and optimized image delivery.
*   **Resilience**: The AI service implements an exponential backoff strategy and an automated procedural generator fallback to ensure 99.9% availability.
*   **Accessibility**: All UI components follow ARIA standards for accessibility.

---

## 🤝 Contribution Guidelines

We love community contributions! To contribute:

1.  **Fork** the repository.
2.  Create a **Feature Branch** (`git checkout -b feature/NewCoolThing`).
3.  Commit your changes (`git commit -m 'Add some cool thing'`).
4.  Push to the branch (`git push origin feature/NewCoolThing`).
5.  Open a **Pull Request**.

---

## 📄 License

This project is open-source and available under the **MIT License**.

---

<div align="center">

**Developed with ❤️ by Ashwin Jauhary**
*Building for the next generation of campus leaders.*

</div>
