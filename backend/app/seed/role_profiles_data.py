"""
Predefined role profiles for career recommendation matching.
Each profile defines expected keywords and skills for scoring.
"""

ROLE_PROFILES_DATA: list[dict] = [
    # ===========================
    # SOFTWARE ENGINEERING
    # ===========================
    {
        "title": "Junior Software Engineer",
        "description": "Entry-level software engineering role focused on full-stack or backend development with clean code practices.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "software", "engineer", "developer", "programming", "code",
            "backend", "frontend", "full-stack", "api", "database",
            "testing", "version control", "debug", "deploy", "algorithms",
            "data structures", "object-oriented", "agile",
        ],
        "expected_skills": [
            "Python", "JavaScript", "Java", "C++", "SQL",
            "Git", "REST API", "Unit Testing", "OOP",
            "Problem Solving", "Teamwork", "Agile",
        ],
    },
    {
        "title": "Backend Developer",
        "description": "Backend-focused role emphasizing API development, database management, and server-side logic.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "backend", "api", "server", "database", "sql",
            "rest", "endpoint", "authentication", "deployment",
            "python", "java", "node", "microservices", "docker",
        ],
        "expected_skills": [
            "Python", "Java", "Node.js", "SQL", "PostgreSQL",
            "REST API", "Docker", "Git", "FastAPI", "Django",
            "Flask", "Express.js", "Unit Testing",
        ],
    },
    {
        "title": "Frontend Developer",
        "description": "Frontend-focused role emphasizing modern UI development, responsive design, and user experience.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "frontend", "ui", "ux", "responsive", "design",
            "html", "css", "javascript", "react", "component",
            "spa", "accessibility", "browser", "mobile-first",
        ],
        "expected_skills": [
            "JavaScript", "TypeScript", "React", "Vue.js", "Angular",
            "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Figma",
            "Git", "Jest", "Cypress", "Next.js",
        ],
    },
    {
        "title": "Full-Stack Developer",
        "description": "Full-stack role combining frontend and backend skills to build complete web applications.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "full-stack", "frontend", "backend", "api", "database",
            "react", "node", "deploy", "cloud", "responsive",
            "agile", "testing", "architecture", "web", "mobile",
        ],
        "expected_skills": [
            "JavaScript", "TypeScript", "React", "Node.js", "Python",
            "SQL", "Git", "Docker", "REST API", "MongoDB",
            "HTML", "CSS", "AWS",
        ],
    },
    {
        "title": "Mobile App Developer",
        "description": "Mobile development role for building native or cross-platform mobile applications.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "mobile", "android", "ios", "app", "flutter",
            "react native", "swift", "kotlin", "ui", "ux",
            "api", "responsive", "user experience", "push notification",
        ],
        "expected_skills": [
            "Flutter", "React Native", "Swift", "Kotlin", "Dart",
            "JavaScript", "Git", "REST API", "Firebase", "Figma",
        ],
    },
    {
        "title": "DevOps Engineer",
        "description": "DevOps role focused on CI/CD pipelines, infrastructure automation, and cloud deployment.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "devops", "ci/cd", "pipeline", "deploy", "infrastructure",
            "automation", "cloud", "container", "monitoring", "linux",
            "docker", "kubernetes", "terraform", "aws",
        ],
        "expected_skills": [
            "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud",
            "CI/CD", "Jenkins", "GitHub Actions", "Terraform",
            "Linux", "Bash", "Git", "Nginx", "Ansible",
        ],
    },
    {
        "title": "QA / Test Engineer",
        "description": "Quality assurance role focused on test planning, automation, and ensuring software reliability.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "testing", "quality", "qa", "automation", "test case",
            "bug", "defect", "regression", "manual testing",
            "test plan", "selenium", "cypress", "performance",
        ],
        "expected_skills": [
            "Selenium", "Cypress", "Jest", "Pytest", "JUnit",
            "Unit Testing", "Integration Testing", "Test Automation",
            "Python", "JavaScript", "Git", "Jira", "Agile",
        ],
    },
    {
        "title": "Cloud Solutions Architect",
        "description": "Cloud architecture role designing scalable, resilient systems on major cloud platforms.",
        "domain": "Software Engineering",
        "expected_keywords": [
            "cloud", "architecture", "aws", "azure", "gcp",
            "scalable", "microservices", "serverless", "infrastructure",
            "security", "networking", "cost optimization", "migration",
        ],
        "expected_skills": [
            "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
            "Terraform", "System Design", "Microservices", "Linux",
            "CI/CD", "Networking",
        ],
    },

    # ===========================
    # DATA & ANALYTICS
    # ===========================
    {
        "title": "Data Analyst",
        "description": "Data analysis role focused on extracting insights from data using statistical methods and visualization tools.",
        "domain": "Data & Analytics",
        "expected_keywords": [
            "data", "analysis", "statistics", "visualization", "report",
            "dashboard", "insight", "sql", "excel", "python",
            "tableau", "metric", "trend", "bi", "etl",
        ],
        "expected_skills": [
            "Python", "SQL", "Pandas", "NumPy", "Matplotlib",
            "Tableau", "Power BI", "Statistics", "Data Analysis",
            "Data Visualization", "R", "Excel",
        ],
    },
    {
        "title": "Data Scientist",
        "description": "Data science role building predictive models and extracting actionable insights from complex datasets.",
        "domain": "Data & Analytics",
        "expected_keywords": [
            "machine learning", "model", "prediction", "statistics",
            "deep learning", "neural network", "feature engineering",
            "data", "python", "algorithm", "regression", "classification",
        ],
        "expected_skills": [
            "Python", "Machine Learning", "TensorFlow", "PyTorch",
            "Scikit-learn", "Pandas", "NumPy", "Statistics",
            "Deep Learning", "SQL", "Data Visualization",
        ],
    },
    {
        "title": "Data Engineer",
        "description": "Data engineering role building and maintaining data pipelines and infrastructure.",
        "domain": "Data & Analytics",
        "expected_keywords": [
            "data pipeline", "etl", "warehouse", "lake", "spark",
            "hadoop", "streaming", "batch", "schema", "ingestion",
            "sql", "python", "cloud", "database", "orchestration",
        ],
        "expected_skills": [
            "Python", "SQL", "Apache Spark", "Hadoop", "AWS",
            "Docker", "PostgreSQL", "MongoDB", "Kafka",
            "Data Analysis", "Linux", "Git",
        ],
    },
    {
        "title": "Business Intelligence Analyst",
        "description": "BI role creating dashboards and reports to support data-driven business decisions.",
        "domain": "Data & Analytics",
        "expected_keywords": [
            "business intelligence", "dashboard", "report", "kpi",
            "visualization", "data", "sql", "tableau", "power bi",
            "insight", "metric", "executive", "stakeholder", "analysis",
        ],
        "expected_skills": [
            "Tableau", "Power BI", "SQL", "Excel", "Data Visualization",
            "Data Analysis", "Statistics", "Python", "Presentation",
        ],
    },

    # ===========================
    # INDUSTRIAL ENGINEERING
    # ===========================
    {
        "title": "Production Planning Engineer",
        "description": "Focuses on optimizing production schedules, material requirements, and ensuring efficient manufacturing processes.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "production", "planning", "schedule", "manufacturing", "erp",
            "material", "efficiency", "forecast", "inventory", "lean",
            "supply chain", "optimization", "bottleneck", "capacity",
            "mrp", "bom", "production line", "factory",
        ],
        "expected_skills": [
            "ERP Systems", "SAP", "Excel", "Data Analysis", "Lean Manufacturing",
            "Production Planning", "Supply Chain Management", "Problem Solving",
            "AutoCAD", "MATLAB", "Project Management",
        ],
    },
    {
        "title": "Process Improvement Engineer",
        "description": "Analyzes current workflows and manufacturing processes to implement Lean or Six Sigma methodologies and reduce waste.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "process", "improvement", "lean", "six sigma", "kaizen",
            "waste", "optimization", "workflow", "efficiency", "bottleneck",
            "time study", "method", "continuous improvement", "quality",
            "value stream", "root cause", "5s", "pdca",
        ],
        "expected_skills": [
            "Lean Six Sigma", "Process Optimization", "Kaizen", "Minitab",
            "Data Analysis", "Time Study", "Value Stream Mapping", "Excel",
            "Statistics", "Project Management", "Problem Solving",
        ],
    },
    {
        "title": "Supply Chain Analyst",
        "description": "Manages logistics, supplier relationships, inventory optimization, and distribution network efficiency.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "supply chain", "logistics", "inventory", "supplier", "distribution",
            "procurement", "optimization", "forecast", "demand", "warehouse",
            "freight", "erp", "sourcing", "purchasing", "lead time",
        ],
        "expected_skills": [
            "Supply Chain Management", "Inventory Optimization", "Logistics",
            "ERP Systems", "SAP", "Excel", "Data Visualization", "Purchasing",
            "Data Analysis", "Problem Solving",
        ],
    },
    {
        "title": "Quality Control Engineer",
        "description": "Ensures products meet quality standards through inspection, testing, and quality management systems.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "quality", "control", "inspection", "standard", "iso",
            "audit", "defect", "tolerance", "specification", "compliance",
            "testing", "measurement", "statistical process control", "spc",
            "continuous improvement", "corrective action",
        ],
        "expected_skills": [
            "Lean Six Sigma", "Minitab", "Statistics", "Excel",
            "Process Optimization", "Data Analysis", "Problem Solving",
            "AutoCAD", "Project Management",
        ],
    },
    {
        "title": "Operations Research Analyst",
        "description": "Uses mathematical modeling and optimization techniques to solve complex operational and logistical problems.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "operations research", "optimization", "linear programming", "simulation",
            "modeling", "decision", "algorithm", "stochastic", "scheduling",
            "transportation", "assignment", "integer programming", "heuristic",
        ],
        "expected_skills": [
            "MATLAB", "Python", "Excel", "Statistics", "Data Analysis",
            "Problem Solving", "Minitab", "R", "Lean Six Sigma",
        ],
    },
    {
        "title": "Industrial Safety Specialist",
        "description": "Develops and implements workplace safety programs, risk assessments, and regulatory compliance procedures.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "safety", "risk", "hazard", "osha", "workplace", "ergonomics",
            "compliance", "incident", "prevention", "assessment", "training",
            "regulation", "investigation", "ppe", "environmental",
        ],
        "expected_skills": [
            "Project Management", "Excel", "Data Analysis", "Problem Solving",
            "Lean Manufacturing", "Statistics", "Communication", "Leadership",
        ],
    },
    {
        "title": "Logistics Coordinator",
        "description": "Coordinates transportation, warehousing, and distribution operations to ensure timely delivery of goods.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "logistics", "transportation", "warehouse", "distribution", "shipping",
            "freight", "route", "delivery", "tracking", "customs",
            "inventory", "fleet", "3pl", "supply chain",
        ],
        "expected_skills": [
            "Logistics", "Supply Chain Management", "ERP Systems", "Excel",
            "SAP", "Data Analysis", "Problem Solving", "Communication",
        ],
    },

    # ===========================
    # MECHANICAL ENGINEERING
    # ===========================
    {
        "title": "Mechanical Design Engineer",
        "description": "Designs mechanical components and systems using CAD tools and engineering principles.",
        "domain": "Mechanical Engineering",
        "expected_keywords": [
            "mechanical", "design", "cad", "solidworks", "drawing",
            "tolerance", "material", "stress", "thermal", "prototype",
            "manufacturing", "assembly", "fea", "simulation", "3d modeling",
        ],
        "expected_skills": [
            "AutoCAD", "MATLAB", "Excel", "Problem Solving",
            "Project Management", "Communication", "Data Analysis",
        ],
    },
    {
        "title": "Manufacturing Engineer",
        "description": "Develops and improves manufacturing processes, tooling, and production methods.",
        "domain": "Mechanical Engineering",
        "expected_keywords": [
            "manufacturing", "process", "tooling", "cnc", "machining",
            "assembly", "production", "lean", "quality", "tolerance",
            "fixture", "jig", "efficiency", "automation",
        ],
        "expected_skills": [
            "AutoCAD", "Lean Manufacturing", "Process Optimization",
            "Excel", "Problem Solving", "Project Management",
            "Data Analysis", "MATLAB",
        ],
    },
    {
        "title": "R&D Engineer",
        "description": "Conducts research and development for new products, technologies, and engineering solutions.",
        "domain": "Mechanical Engineering",
        "expected_keywords": [
            "research", "development", "innovation", "prototype", "testing",
            "experiment", "patent", "material", "simulation", "design",
            "analysis", "feasibility", "specification", "technology",
        ],
        "expected_skills": [
            "MATLAB", "AutoCAD", "Data Analysis", "Statistics",
            "Problem Solving", "Technical Writing", "Excel",
            "Project Management", "Python",
        ],
    },
    {
        "title": "HVAC Engineer",
        "description": "Designs heating, ventilation, and air conditioning systems for buildings and industrial facilities.",
        "domain": "Mechanical Engineering",
        "expected_keywords": [
            "hvac", "heating", "ventilation", "air conditioning", "thermal",
            "energy", "load", "duct", "refrigeration", "building",
            "comfort", "efficiency", "sustainability", "insulation",
        ],
        "expected_skills": [
            "AutoCAD", "Excel", "Project Management", "Problem Solving",
            "Data Analysis", "MATLAB", "Communication",
        ],
    },

    # ===========================
    # ELECTRICAL / ELECTRONICS ENGINEERING
    # ===========================
    {
        "title": "Electrical Design Engineer",
        "description": "Designs electrical systems, circuits, and power distribution networks.",
        "domain": "Electrical Engineering",
        "expected_keywords": [
            "electrical", "circuit", "power", "design", "schematic",
            "pcb", "voltage", "current", "transformer", "motor",
            "control", "plc", "wiring", "panel", "distribution",
        ],
        "expected_skills": [
            "AutoCAD", "MATLAB", "Excel", "Problem Solving",
            "Project Management", "Data Analysis", "Python",
        ],
    },
    {
        "title": "Embedded Systems Engineer",
        "description": "Designs and programs firmware for embedded systems, microcontrollers, and IoT devices.",
        "domain": "Electrical Engineering",
        "expected_keywords": [
            "embedded", "microcontroller", "firmware", "iot", "sensor",
            "rtos", "protocol", "spi", "i2c", "uart", "programming",
            "hardware", "debug", "pcb", "signal",
        ],
        "expected_skills": [
            "C", "C++", "Python", "MATLAB", "Git",
            "Linux", "Problem Solving", "Data Analysis",
        ],
    },
    {
        "title": "Automation / Controls Engineer",
        "description": "Programs and maintains PLC-based industrial automation and control systems.",
        "domain": "Electrical Engineering",
        "expected_keywords": [
            "automation", "plc", "scada", "hmi", "control",
            "programming", "ladder", "sensor", "actuator", "drive",
            "motor", "pid", "industrial", "process", "robotics",
        ],
        "expected_skills": [
            "AutoCAD", "MATLAB", "Excel", "Python", "Problem Solving",
            "Project Management", "Data Analysis", "Communication",
        ],
    },

    # ===========================
    # CIVIL ENGINEERING
    # ===========================
    {
        "title": "Structural Engineer",
        "description": "Designs and analyzes structural systems for buildings, bridges, and infrastructure projects.",
        "domain": "Civil Engineering",
        "expected_keywords": [
            "structural", "concrete", "steel", "foundation", "beam",
            "column", "load", "seismic", "bridge", "building",
            "code", "standard", "reinforcement", "analysis", "design",
        ],
        "expected_skills": [
            "AutoCAD", "Excel", "MATLAB", "Project Management",
            "Problem Solving", "Data Analysis", "Communication",
        ],
    },
    {
        "title": "Construction Project Engineer",
        "description": "Manages construction site activities, schedules, budgets, and contractor coordination.",
        "domain": "Civil Engineering",
        "expected_keywords": [
            "construction", "project", "site", "schedule", "budget",
            "contractor", "safety", "plan", "inspection", "material",
            "concrete", "foundation", "permit", "drawing",
        ],
        "expected_skills": [
            "AutoCAD", "Excel", "Project Management", "Problem Solving",
            "Communication", "Leadership", "Data Analysis",
        ],
    },
    {
        "title": "Transportation Engineer",
        "description": "Plans and designs transportation infrastructure including roads, highways, and traffic systems.",
        "domain": "Civil Engineering",
        "expected_keywords": [
            "transportation", "traffic", "road", "highway", "intersection",
            "signal", "planning", "design", "geometric", "pavement",
            "safety", "capacity", "survey", "gis",
        ],
        "expected_skills": [
            "AutoCAD", "Excel", "Data Analysis", "Project Management",
            "Problem Solving", "Communication", "MATLAB",
        ],
    },

    # ===========================
    # BUSINESS & MANAGEMENT
    # ===========================
    {
        "title": "Business Analyst",
        "description": "Bridges business needs and technical solutions by analyzing processes and defining requirements.",
        "domain": "Business & Management",
        "expected_keywords": [
            "business", "analysis", "requirement", "stakeholder", "process",
            "workflow", "report", "documentation", "strategy", "user story",
            "agile", "scrum", "kpi", "gap analysis",
        ],
        "expected_skills": [
            "Excel", "Data Analysis", "SQL", "Jira", "Agile",
            "Communication", "Presentation", "Problem Solving",
            "Project Management", "Data Visualization",
        ],
    },
    {
        "title": "Project Manager",
        "description": "Plans, executes, and monitors projects, managing timelines, budgets, and team coordination.",
        "domain": "Business & Management",
        "expected_keywords": [
            "project", "management", "plan", "schedule", "budget",
            "risk", "stakeholder", "milestone", "scope", "deliverable",
            "resource", "agile", "waterfall", "pmp", "communication",
        ],
        "expected_skills": [
            "Project Management", "Agile", "Scrum", "Jira",
            "Excel", "Communication", "Leadership", "Problem Solving",
            "Presentation", "Time Management",
        ],
    },
    {
        "title": "Product Manager",
        "description": "Defines product vision, roadmap, and features based on market research and user needs.",
        "domain": "Business & Management",
        "expected_keywords": [
            "product", "roadmap", "feature", "user", "market",
            "strategy", "prioritization", "backlog", "launch", "metric",
            "customer", "mvp", "iteration", "feedback",
        ],
        "expected_skills": [
            "Data Analysis", "Communication", "Presentation", "Agile",
            "Jira", "Excel", "Problem Solving", "Leadership",
            "Project Management",
        ],
    },
    {
        "title": "Management Consultant",
        "description": "Advises organizations on strategy, operations, and organizational improvement.",
        "domain": "Business & Management",
        "expected_keywords": [
            "consulting", "strategy", "analysis", "client", "recommendation",
            "presentation", "stakeholder", "process", "improvement",
            "business", "market", "competitive", "benchmarking",
        ],
        "expected_skills": [
            "Excel", "Data Analysis", "Presentation", "Communication",
            "Problem Solving", "Project Management", "Leadership",
            "Critical Thinking",
        ],
    },
    {
        "title": "Human Resources Specialist",
        "description": "Manages recruitment, employee relations, benefits, and organizational development.",
        "domain": "Business & Management",
        "expected_keywords": [
            "human resources", "recruitment", "hiring", "employee", "onboarding",
            "performance", "benefit", "compensation", "training", "culture",
            "retention", "diversity", "compliance", "labor",
        ],
        "expected_skills": [
            "Communication", "Excel", "Presentation", "Problem Solving",
            "Leadership", "Project Management", "Data Analysis",
        ],
    },

    # ===========================
    # MARKETING & COMMUNICATIONS
    # ===========================
    {
        "title": "Digital Marketing Specialist",
        "description": "Plans and executes digital marketing campaigns across various online channels.",
        "domain": "Marketing & Communications",
        "expected_keywords": [
            "digital", "marketing", "seo", "sem", "social media",
            "campaign", "analytics", "content", "advertising", "google ads",
            "conversion", "engagement", "email", "brand",
        ],
        "expected_skills": [
            "Data Analysis", "Excel", "Communication", "Presentation",
            "Problem Solving", "Data Visualization",
        ],
    },
    {
        "title": "Content Strategist",
        "description": "Develops content plans, editorial calendars, and brand messaging strategies.",
        "domain": "Marketing & Communications",
        "expected_keywords": [
            "content", "strategy", "editorial", "copywriting", "blog",
            "social media", "brand", "storytelling", "engagement", "seo",
            "audience", "channel", "calendar", "messaging",
        ],
        "expected_skills": [
            "Communication", "Presentation", "Data Analysis", "Excel",
            "Problem Solving", "Technical Writing", "Critical Thinking",
        ],
    },

    # ===========================
    # FINANCE & ACCOUNTING
    # ===========================
    {
        "title": "Financial Analyst",
        "description": "Analyzes financial data, creates forecasts, and supports investment and budgeting decisions.",
        "domain": "Finance & Accounting",
        "expected_keywords": [
            "financial", "analysis", "forecast", "budget", "revenue",
            "profit", "loss", "valuation", "investment", "model",
            "excel", "report", "variance", "cash flow",
        ],
        "expected_skills": [
            "Excel", "Data Analysis", "Statistics", "Data Visualization",
            "SQL", "Python", "Communication", "Problem Solving",
            "Presentation",
        ],
    },
    {
        "title": "Accountant",
        "description": "Manages financial records, reconciliations, tax compliance, and auditing procedures.",
        "domain": "Finance & Accounting",
        "expected_keywords": [
            "accounting", "ledger", "reconciliation", "tax", "audit",
            "financial statement", "balance sheet", "journal", "gaap",
            "compliance", "payroll", "invoice", "accounts payable",
        ],
        "expected_skills": [
            "Excel", "Data Analysis", "Communication", "Problem Solving",
            "SAP", "ERP Systems",
        ],
    },

    # ===========================
    # HEALTHCARE & BIOMEDICAL
    # ===========================
    {
        "title": "Biomedical Engineer",
        "description": "Develops medical devices, equipment, and healthcare technologies.",
        "domain": "Healthcare & Biomedical",
        "expected_keywords": [
            "biomedical", "medical device", "healthcare", "clinical",
            "regulatory", "fda", "design", "testing", "prototype",
            "biomaterial", "imaging", "signal processing", "patient",
        ],
        "expected_skills": [
            "MATLAB", "AutoCAD", "Python", "Data Analysis", "Statistics",
            "Excel", "Problem Solving", "Project Management",
        ],
    },
    {
        "title": "Clinical Data Analyst",
        "description": "Analyzes clinical trial data and healthcare datasets to support research and regulatory submissions.",
        "domain": "Healthcare & Biomedical",
        "expected_keywords": [
            "clinical", "data", "trial", "patient", "regulatory",
            "analysis", "study", "protocol", "adverse event", "report",
            "database", "statistics", "submission", "compliance",
        ],
        "expected_skills": [
            "Data Analysis", "Statistics", "Excel", "SQL", "Python",
            "R", "Communication", "Problem Solving",
        ],
    },

    # ===========================
    # ENVIRONMENTAL & ENERGY
    # ===========================
    {
        "title": "Environmental Engineer",
        "description": "Addresses environmental challenges including waste management, pollution control, and sustainability.",
        "domain": "Environmental & Energy",
        "expected_keywords": [
            "environmental", "sustainability", "waste", "pollution",
            "water", "air quality", "remediation", "regulation", "eia",
            "compliance", "treatment", "recycling", "carbon", "emission",
        ],
        "expected_skills": [
            "AutoCAD", "Excel", "Data Analysis", "MATLAB", "Python",
            "Project Management", "Problem Solving", "Statistics",
        ],
    },
    {
        "title": "Energy Analyst",
        "description": "Evaluates energy consumption, renewable energy systems, and efficiency improvement opportunities.",
        "domain": "Environmental & Energy",
        "expected_keywords": [
            "energy", "renewable", "solar", "wind", "efficiency",
            "consumption", "audit", "carbon", "sustainability", "grid",
            "power", "storage", "analysis", "policy",
        ],
        "expected_skills": [
            "Excel", "Data Analysis", "MATLAB", "Python", "Statistics",
            "Problem Solving", "Communication", "Data Visualization",
        ],
    },

    # ===========================
    # CYBERSECURITY
    # ===========================
    {
        "title": "Cybersecurity Analyst",
        "description": "Monitors, detects, and responds to security threats and vulnerabilities.",
        "domain": "Cybersecurity",
        "expected_keywords": [
            "security", "threat", "vulnerability", "incident", "firewall",
            "network", "malware", "phishing", "siem", "compliance",
            "penetration", "encryption", "authentication", "monitoring",
        ],
        "expected_skills": [
            "Cybersecurity", "Linux", "Python", "Networking",
            "Penetration Testing", "Encryption", "Problem Solving",
            "Communication",
        ],
    },

    # ===========================
    # UX / UI DESIGN
    # ===========================
    {
        "title": "UX/UI Designer",
        "description": "Designs intuitive user interfaces and experiences through user research and prototyping.",
        "domain": "UX / UI Design",
        "expected_keywords": [
            "ux", "ui", "design", "user research", "wireframe",
            "prototype", "usability", "figma", "accessibility", "persona",
            "user flow", "interaction", "visual design", "responsive",
        ],
        "expected_skills": [
            "Figma", "HTML", "CSS", "Communication", "Problem Solving",
            "Presentation", "Critical Thinking",
        ],
    },
]
