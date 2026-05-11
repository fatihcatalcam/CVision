# Requirements Elicitation and Analysis Document (READ)
**Project Name:** CVision — AI-powered CV Analysis Platform
**Document Version:** 1.0

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Requirements Elicitation and Analysis Document (READ) is to definitively outline the functional requirements, non-functional requirements, constraints, and assumptions for the CVision platform. This document serves as the formal baseline for the development, testing, and validation phases, ensuring all stakeholders share a rigorous understanding of the system's expected behavior.

### 1.2 Scope
CVision is a web-based educational and professional tool operating as a SaaS platform. The system permits users to upload CV files (PDF/TXT), parses the documents using deterministic rule-based engines, and selectively interfaces with the OpenAI GPT API to augment the analysis. Core deliverables managed by the system include quantitative ATS compatibility scoring, skills extraction mapping, actionable textual suggestions, and targeted career role recommendations based on established industry profiles.

### 1.3 Stakeholders
* **Guest (Misafir):** Unauthenticated visitors exploring the landing page.
* **User (Kayıtlı Kullanıcı):** Authenticated standard users utilizing core upload and rule-based analysis tools.
* **Premium User:** Authenticated subscribers utilizing AI-enhanced features (GPT rewriting/summaries).
* **Admin:** System administrators managing users and platform health.
* **AI System:** External service (OpenAI GPT) supplying generative NLP capabilities.
* **Payment System:** External services (Iyzico, Stripe) managing financial transactions.

---

## 2. Requirements

### 2.1 Functional Requirements (FR)

| ID | Description | Priority | Source |
| :--- | :--- | :--- | :--- |
| FR-SYS-01 | The system shall extract text characters from uploaded files formatted with the .pdf extension. | Must Have | Core Parsing |
| FR-SYS-02 | The system shall extract text strings from uploaded files formatted with the .txt extension. | Must Have | Core Parsing |
| FR-SYS-03 | The system shall calculate an integer overall CV score ranging from 0 to 100 based on rule-based algorithmic criteria. | Must Have | Analysis Engine |
| FR-SYS-04 | The system shall display the calculated integer CV score on the analysis results graphical user interface. | Must Have | Web Client |
| FR-SYS-05 | The system shall identify the starting index and ending index of the "Education" section within the extracted text string. | Must Have | Analysis Engine |
| FR-SYS-06 | The system shall locate matching skill keywords within the CV text by searching against the predefined Role Profile database table. | Must Have | Recommendation |
| FR-SYS-07 | The system shall compare user-provided credentials against stored database hash values during the authentication process. | Must Have | Security |
| FR-SYS-08 | The system shall set the value of the 'status' database column to 'pending' upon successful storage of a newly uploaded CV file. | Must Have | Database |
| FR-SYS-09 | The system shall transmit a text prompt containing the extracted CV string to the OpenAI API endpoint to generate an executive summary. | Could Have | AI Integration |
| FR-SYS-10 | The system shall restrict unauthorized HTTP GET requests to the `/analysis/{id}` endpoint by verifying the presence of a valid JWT token. | Must Have | Security |

### 2.2 Non-Functional Requirements (NFR)

| ID | Description | Priority | Source |
| :--- | :--- | :--- | :--- |
| NFR-PER-01 | The system shall complete the execution of the 7-step rule-based analysis pipeline in under 10 seconds for a 2-page PDF file. | Must Have | Architecture |
| NFR-SEC-01 | The system shall encrypt all stored user passwords utilizing the bcrypt cryptographic hashing algorithm. | Must Have | Security |
| NFR-AVA-01 | The system shall process incoming API requests with a success rate of 99.5% over a continuous 30-day monitoring window. | Should Have | Operations |
| NFR-SCA-01 | The system shall process up to 50 concurrent background analysis tasks without task omission. | Must Have | System Design |
| NFR-CAP-01 | The system shall reject any file upload request where the payload size exceeds 5,242,880 bytes (5 Megabytes). | Must Have | File Integrity |

### 2.3 Constraints (CON)

| ID | Description | Priority | Source |
| :--- | :--- | :--- | :--- |
| CON-TEC-01 | The system shall execute background task logic exclusively using the Python programming language version 3.12. | Must Have | IT Strategy |
| CON-TEC-02 | The system shall persist relational entity data exclusively using a PostgreSQL database engine in the production environment. | Must Have | IT Strategy |
| CON-EXT-01 | The system shall mediate all external interactions with the OpenAI API strictly via HTTPS over port 443. | Must Have | Security |
| CON-FIN-01 | The system shall route processing requests to the respective sandbox endpoints of Iyzico or Stripe during the development phase. | Must Have | Financial |
| CON-LEG-01 | The system shall physically store persistent user profile data exclusively on servers located within the European Union boundaries. | Should Have | Legal |

### 2.4 Assumptions (ASM)

| ID | Description | Priority | Source |
| :--- | :--- | :--- | :--- |
| ASM-USR-01 | The system shall assume that uploaded PDF files contain a machine-readable text layer embedded within the file structure. | Must Have | Scope Limit |
| ASM-EXT-01 | The system shall assume that the OpenAI API maintains a response latency limit of under 8 seconds per payload. | Must Have | External Dep |
| ASM-ENV-01 | The system shall assume that the host execution environment allocates a minimum of 1 Gigabyte of RAM to the FastAPI process container. | Must Have | Environment |
| ASM-USR-02 | The system shall assume that the text characters within the uploaded documents are encoded in UTF-8 format. | Must Have | Parsing |
| ASM-EXT-02 | The system shall assume that the host operating system enforces standard POSIX file locking mechanisms during concurrent log writing. | Must Have | Environment |

---

## 3. Scenarios

**Scenario 1: SCN-01 - Successful CV Upload and Basic Extraction**
* **Actor:** Registered User
* **Preconditions:** The registered user possesses an active session token authenticated by the backend API.
* **Main Flow:**
  1. The User navigates to the "Upload CV" interface portlet.
  2. The User selects a local `.pdf` file with a size of exactly 1.5 Megabytes.
  3. The User initiates the file transfer procedure by clicking "Analyze".
  4. The system validates the `.pdf` extension against the allowed MIME list.
  5. The system saves the binary file payload to the local storage directory assigning a UUID string.
  6. The system creates a database row for the CV establishing the status as 'pending'.
* **Postconditions:** The file is persisted on the disk volume and its metadata is addressable via the database.
* **Alternative Flows:**
  * **4a. Invalid File Format:** If the user uploads a `.docx` file, the system halts the operation at step 4 and returns an HTTP 415 payload.

**Scenario 2: SCN-02 - Completing Rule-Based Processing Pipeline**
* **Actor:** Analysis Engine (System)
* **Preconditions:** A CV record exists in the database possessing the 'pending' status attribute.
* **Main Flow:**
  1. The system queues a background task utilizing the designated CV identifier.
  2. The system triggers a database update modifying the CV status attribute from 'pending' to 'processing'.
  3. The system executes the PyMuPDF library to project the PDF content into a raw text string.
  4. The system passes the text string sequentially through the 7 modular analyzer instances.
  5. The system calculates an aggregated integer metric between 0 and 100 based on rule hits.
  6. The system commits an `AnalysisResult` row to the database payload mapping to the CV identifier.
  7. The system updates the mapped CV status database attribute to 'completed'.
* **Postconditions:** A populated `AnalysisResult` object is firmly associated with the CV file and queryable.
* **Alternative Flows:**
  * **3a. Parser Failure:** If PyMuPDF yields a strictly empty string payload, the system terminates the pipeline at step 3, updating the CV status mapping to 'failed'.

**Scenario 3: SCN-03 - Resolving AI Executive Summary Enhancement**
* **Actor:** Premium User, AI System
* **Preconditions:** The user possesses a session token containing the 'premium' tier payload claim, and a 'completed' Analysis Result exists for the specified CV.
* **Main Flow:**
  1. The Premium User transmits an HTTP POST prompt specifying the target Analysis ID to the enhancement endpoint.
  2. The system reads the extracted text string associated with the specific Analysis ID.
  3. The system formats a strictly defined JSON instruction payload appending the CV text string.
  4. The system issues an HTTPS POST request to the configured OpenAI completion endpoint utilizing the configured API bearer token.
  5. The OpenAI API processes the payload and returns a JSON string containing the generated executive summary text.
  6. The system executes a database update statement recording the generative summary text against the `AnalysisResult` row entity.
* **Postconditions:** The `ai_summary` explicit database column contains the new string variable.
* **Alternative Flows:**
  * **4a. API Timeout Event:** If the OpenAI API restricts communication via latency dropping the connection, the system gracefully traps the exception at step 4 without mutating database rows and informs the user.

---

## 4. Use Case Descriptions

### UC-01: Document Upload Module
| Category | Detail |
| :--- | :--- |
| **UC ID & Name** | UC-01: Upload CV File |
| **Actor(s)** | Registered User |
| **Preconditions** | The user must be authenticated offering a valid JWT bearer token. |
| **Main Success Scenario** | 1. User issues a multipart form-data payload establishing a target domain and file attachment.<br>2. The system calculates file size ensuring limit conditions.<br>3. The system scans the byte signature maintaining extension compatibility requirements.<br>4. The system executes a local disk write linking a generated UUID.<br>5. The system persists indexing metadata returning the primary identifier index to the user. |
| **Alternative Flows** | **2a.** Payload size exceeds 5MB: System curtails processing returning a 413 HTTP code.<br>**3a.** Invalid signature byte scan: System terminates the event returning a 415 HTTP code. |
| **Postconditions** | Document is safely localized on the storage volume and referenced on the database graph logically marking 'pending'. |
| **Related FRs** | FR-SYS-01, FR-SYS-02, FR-SYS-08 |

### UC-02: Algorithmic Evaluation Processing
| Category | Detail |
| :--- | :--- |
| **UC ID & Name** | UC-02: Execute Analysis Engine Pipeline |
| **Actor(s)** | System Algorithm |
| **Preconditions** | Processing target database row dictates a 'pending' state property. |
| **Main Success Scenario** | 1. The system invokes file targeting logic executing the defined parser factory logic.<br>2. The system maps output text generating structural boundaries (e.g., Education blocks).<br>3. The system calculates an integral evaluation matching the domain criteria specifications.<br>4. The system issues referential mapping records tying scores to identifying rows.<br>5. The system finalizes pipeline logic converting target state attributes to 'completed'. |
| **Alternative Flows** | **1a.** Insufficient parsed text logic blocks (under length limit): System terminates the analysis flow directly adjusting status to 'failed'. |
| **Postconditions** | Identifiable evaluation integer models and localized section mapping indices are successfully committed to the database. |
| **Related FRs** | FR-SYS-03, FR-SYS-04, FR-SYS-05, FR-SYS-06 |

### UC-03: Security Identity Enforcement
| Category | Detail |
| :--- | :--- |
| **UC ID & Name** | UC-03: Token Authentication Guardrail |
| **Actor(s)** | Guest, Registered User |
| **Preconditions** | The system endpoint is decorated by a secure dependency mapping algorithm. |
| **Main Success Scenario** | 1. User application broadcasts a request defining the 'Authorization' header parameter.<br>2. The system parses the raw header string validating symmetrical decoding requirements.<br>3. The system probes database context to map the active user instance strictly tracking ID indices.<br>4. The system validates standard expiration logic timestamps.<br>5. The system delegates control yielding the user instance variable explicitly safely to downstream logic blocks. |
| **Alternative Flows** | **2a.** Symmetrical decoding fault: System strictly interrupts yielding a 401 identity block.<br>**4a.** Expiration logic trap triggered: System terminates establishing a 401 code. |
| **Postconditions** | Downstream processing pipelines securely process localized data linked solely to verified individual row identifiers. |
| **Related FRs** | FR-SYS-07, FR-SYS-10 |

---

## 5. Traceability Matrix

This matrix establishes direct traceability bridging the explicitly declared Functional Requirements strictly against mapped Use Case logical blocks.

| Functional Requirement ID | Mapped Use Case(s) |
| :--- | :--- |
| **FR-SYS-01** (Extract from PDF) | UC-01 |
| **FR-SYS-02** (Extract from TXT) | UC-01 |
| **FR-SYS-03** (Calculate integer score) | UC-02 |
| **FR-SYS-04** (Display integer CV score) | UC-02 |
| **FR-SYS-05** (Identify Education block limits) | UC-02 |
| **FR-SYS-06** (Locate keyword correlations) | UC-02 |
| **FR-SYS-07** (Compare credentials via hashing) | UC-03 |
| **FR-SYS-08** (Assign pending status flag) | UC-01 |
| **FR-SYS-09** (Transmit prompt to OpenAI API) | *(External integration flow outside UC Scope 01-03)* |
| **FR-SYS-10** (Restrict unauthenticated endpoints) | UC-03 |

---

## 6. Validation & Quality

### 6.1 Validation Criteria
To ensure systematic integrity, all drafted requirements underwent validation based on modern SE quality methodologies:
* **Correctness:** Every requirement dictates logical actions physically implementable within the Python Fast-API / React architecture layer.
* **Completeness:** Core end-to-end processing blocks covering upload formatting to database finalization have been detailed preventing system behavior logic voids.
* **Consistency:** The integration of status markers ('pending', 'processing', 'completed') is mirrored uniformly across Use Cases and Scenarios minimizing architectural drift.
* **Clarity:** Vague descriptive grammar (e.g., "fast") is strictly substituted with measurable atomic criteria constraints (e.g., "under 10 seconds").
* **Realism:** Technical capacity limits (e.g., 5MB limitations) accurately reflect available local computational and infrastructural limits.
* **Traceability:** Structural matrix dependencies logically chain individual functions against distinct functional process cases demonstrating clear mapping logic.

### 6.2 Acceptance Criteria (Behavior-Driven Development Format)

**Acceptance Criterion 1 for FR-SYS-03 (Calculate integer score)**
* **GIVEN** the background processing analysis pipeline has fully evaluated a CV text string against formatting criteria
* **WHEN** the ScoreCalculator instance triggers its mathematical aggregation execution block
* **THEN** the system shall establish a resulting overall CV numerical score mapping as a strict integer value ranging comprehensively between 0 and 100 inclusive.

**Acceptance Criterion 2 for NFR-CAP-01 (Reject file over limit)**
* **GIVEN** a registered user attempts to push a local file to the `/cvs/upload` application portlet component
* **WHEN** the physical byte size calculation algorithm measures the file payload equating strictly to 5,242,881 bytes
* **THEN** the system shall deliberately interrupt database interaction preventing save execution signaling rejection HTTP logic.

**Acceptance Criterion 3 for FR-SYS-08 (Assign pending status flag)**
* **GIVEN** a file payload passes secondary MIME and integer limit verifications safely locally
* **WHEN** the system issues its primary disk storage transactional write resolving the execution path
* **THEN** the system shall inject the metadata property marking the specific 'status' string database record mapping solely the word 'pending'.
