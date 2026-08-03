# 🚀 CVision: AI-Powered CV Analyzer and Career Recommendation Platform

The project I'm currently working on: **CVision**

CVision is a SaaS-based platform designed to help students, graduates, and job seekers analyze and improve their CVs before applying for internships and jobs.

---

## 🎯 Key Features:

* Users can register and securely log in to the platform
* Users can upload CV files in **PDF or TXT format**
* The system extracts and analyzes CV content automatically
* Provides a **CV score** based on multiple evaluation criteria
* Detects key sections such as education, experience, and skills
* Evaluates **ATS (Applicant Tracking System) compatibility**
* Generates **personalized improvement suggestions**
* Recommends suitable **career roles** based on user profiles
* Supports **multi-user SaaS architecture** with data isolation
* Includes **analysis history and status tracking (pending → processing → completed)**

---

## 🧠 How It Works:

1. User uploads a CV
2. The system extracts text from the file
3. A rule-based analysis engine evaluates:

   * CV structure
   * keyword relevance
   * skills and experience
4. The system computes a score and generates suggestions
5. Career recommendations are generated based on predefined role profiles

---

## ⚙️ Technologies Used:

* **Backend:** Python (FastAPI)
* **Frontend:** React + TypeScript + Vite
* **Database:** SQLite (development) / PostgreSQL (scalable option)
* **ORM:** SQLAlchemy + Alembic
* **File Processing:** PyMuPDF (PDF parsing)
* **Authentication:** JWT-based authentication
* **Architecture:** Modular SaaS architecture (routers, services, analysis modules)

---

## 🏗️ System Architecture:

* **Frontend (React):** User interface and API interaction
* **Backend (FastAPI):** Handles requests, authentication, and business logic
* **Analysis Engine:** Modular rule-based CV evaluation system
* **Database:** Stores users, CVs, and analysis results

---

## 🔄 SaaS Capabilities:

* Multi-user system with strict **user data isolation**
* Background processing for CV analysis
* Real-time **analysis status tracking**
* Scalable and modular backend design
* API-based communication between components

---

## 🌱 Future Improvements:

* AI/LLM-based advanced CV feedback
* Cloud storage integration (e.g., AWS S3)
* Real-time updates (WebSocket support)
* Advanced analytics dashboard
* Resume comparison feature

---

## 💡 Project Goal:

CVision aims to provide an **accessible, explainable, and scalable solution** for CV evaluation, combining software engineering principles with a real-world problem in recruitment and career preparation.

---

## 📄 License

Copyright (C) 2026 Fatih Çatalçam

Licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](LICENSE).

The source is open to read, learn from and contribute to. The AGPL adds one
condition beyond the GPL that matters for a hosted product like this one: if you
run a modified version of CVision as a network service, you have to make your
modified source available to its users. Running the unmodified project, or using
it privately, carries no such obligation.

CVision is also operated as a commercial service at
[cvisionapp.com](https://www.cvisionapp.com); the licence covers this source
code, not the hosted service or the CVision name.
