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
            "SolidWorks", "CATIA", "AutoCAD", "ANSYS", "Finite Element Analysis", "GD&T", "MATLAB", "Problem Solving",
        ]
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
            "HVAC Design", "Load Calculation", "Refrigeration", "ASHRAE Standards", "Ductwork Design", "Thermodynamics", "AutoCAD", "Problem Solving",
        ]
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
            "SAP2000", "ETABS", "STAAD Pro", "Reinforced Concrete Design", "Steel Structure Design", "Seismic Design", "AutoCAD", "Problem Solving",
        ]
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
            "AutoCAD", "Revit", "BIM", "Primavera", "Quantity Surveying", "Site Supervision", "Construction Scheduling", "Project Management",
        ]
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
            "Traffic Modeling", "Highway Design", "VISSIM", "Transportation Planning", "Pavement Design", "GIS", "AutoCAD", "Problem Solving",
        ]
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
            "MS Project", "Risk Management", "Stakeholder Management", "Earned Value Management", "Resource Planning", "Jira", "Agile", "Scrum", "Leadership", "Communication",
        ]
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
            "Product Roadmap", "User Research", "A/B Testing", "Product Analytics", "Backlog Grooming", "Wireframing", "Agile", "Communication", "Presentation",
        ]
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
            "Financial Modeling", "Market Research", "Business Case", "Process Mapping", "Benchmarking", "Cost-Benefit Analysis", "Excel", "Presentation", "Critical Thinking",
        ]
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
            "Workday", "SAP SuccessFactors", "HRIS", "Payroll", "Recruiting", "Talent Acquisition", "Onboarding", "Performance Management", "Communication",
        ]
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
            "SEO", "SEM", "Google Analytics", "Google Ads", "Meta Ads", "Content Marketing", "Email Marketing", "Conversion Rate Optimization", "Social Media Marketing",
        ]
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
            "SEO", "Content Marketing", "Copywriting", "Editorial Calendar", "Content Management System", "Google Analytics", "Technical Writing", "Communication",
        ]
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
            "Medical Device Design", "ISO 13485", "Biomechanics", "Signal Processing", "Medical Imaging", "MATLAB", "Python", "Problem Solving",
        ]
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
            "Environmental Impact Assessment", "Water Treatment", "Air Quality Monitoring", "Waste Management", "GIS", "MATLAB", "Statistics", "Problem Solving",
        ]
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

    # ===========================
    # MEDIA & CREATIVE
    # ===========================
    {
        "title": "Video Editor",
        "description": "Assembles and edits raw footage into finished video, handling cuts, colour and sound.",
        "domain": "Media & Creative",
        "expected_keywords": [
            "video", "editing", "footage", "post-production", "timeline", "cut", "montage", "colour", "export", "render", "sequence", "clip", "broadcast", "content",
        ],
        "expected_skills": [
            "Adobe Premiere", "Final Cut Pro", "DaVinci Resolve", "After Effects", "Video Editing", "Color Grading", "Post-Production", "Audio Mixing",
        ],
    },
    {
        "title": "Motion Graphics Designer",
        "description": "Creates animated graphics, titles and visual effects for video and digital media.",
        "domain": "Media & Creative",
        "expected_keywords": [
            "motion", "graphics", "animation", "vfx", "title", "compositing", "keyframe", "3d", "render", "visual", "design", "video", "effect", "brand",
        ],
        "expected_skills": [
            "After Effects", "Cinema 4D", "Motion Graphics", "Visual Effects", "3D Animation", "Blender", "Storyboarding", "Adobe Illustrator",
        ],
    },
    {
        "title": "Content Producer",
        "description": "Plans and produces video and multimedia content end to end, from concept to delivery.",
        "domain": "Media & Creative",
        "expected_keywords": [
            "content", "producer", "production", "shoot", "concept", "brief", "schedule", "crew", "budget", "delivery", "campaign", "social", "video", "storyboard",
        ],
        "expected_skills": [
            "Video Editing", "Storyboarding", "Post-Production", "Adobe Premiere", "Camera Operation", "Live Streaming", "Project Management", "Communication",
        ],
    },
    {
        "title": "Photographer",
        "description": "Shoots and retouches photographic content for editorial, commercial or event use.",
        "domain": "Media & Creative",
        "expected_keywords": [
            "photography", "photo", "shoot", "camera", "lens", "lighting", "studio", "retouch", "editorial", "portrait", "composition", "exposure", "raw", "image",
        ],
        "expected_skills": [
            "Adobe Lightroom", "Photo Retouching", "Studio Photography", "Adobe Photoshop", "Lighting Design", "Camera Operation", "Composition", "Color Grading",
        ],
    },
    {
        "title": "Sound Engineer",
        "description": "Records, mixes and masters audio for music, broadcast or film.",
        "domain": "Media & Creative",
        "expected_keywords": [
            "sound", "audio", "mixing", "mastering", "recording", "studio", "microphone", "acoustics", "session", "track", "broadcast", "post", "dialogue", "foley",
        ],
        "expected_skills": [
            "Pro Tools", "Adobe Audition", "Audio Mixing", "Sound Design", "Post-Production", "Live Streaming", "Problem Solving", "Communication",
        ],
    },
    {
        "title": "Animator",
        "description": "Creates 2D or 3D animation for film, advertising, games or education.",
        "domain": "Media & Creative",
        "expected_keywords": [
            "animation", "animator", "3d", "2d", "character", "rigging", "keyframe", "render", "modeling", "motion", "storyboard", "visual", "scene", "asset",
        ],
        "expected_skills": [
            "Blender", "Cinema 4D", "3D Animation", "Character Rigging", "Storyboarding", "Visual Effects", "After Effects", "Creativity",
        ],
    },

    # ===========================
    # JOURNALISM & BROADCASTING
    # ===========================
    {
        "title": "Journalist",
        "description": "Researches, reports and writes news stories across print or digital outlets.",
        "domain": "Journalism & Broadcasting",
        "expected_keywords": [
            "journalist", "reporter", "news", "story", "article", "source", "interview", "deadline", "editorial", "press", "beat", "byline", "investigate", "publish",
        ],
        "expected_skills": [
            "News Writing", "Interviewing", "Fact-Checking", "AP Style", "Investigative Reporting", "Feature Writing", "Newsroom CMS", "Communication",
        ],
    },
    {
        "title": "Editor",
        "description": "Commissions, edits and signs off written content, owning accuracy and house style.",
        "domain": "Journalism & Broadcasting",
        "expected_keywords": [
            "editor", "editing", "copy", "style", "proof", "headline", "publish", "content", "editorial", "deadline", "review", "commission", "accuracy", "byline",
        ],
        "expected_skills": [
            "Copy Editing", "Editorial Judgment", "Headline Writing", "AP Style", "Fact-Checking", "News Writing", "Newsroom CMS", "Technical Writing",
        ],
    },
    {
        "title": "Broadcast Producer",
        "description": "Produces television or radio programming, coordinating crew, guests and run of show.",
        "domain": "Journalism & Broadcasting",
        "expected_keywords": [
            "broadcast", "producer", "programme", "studio", "live", "segment", "run", "guest", "script", "crew", "airtime", "transmission", "rundown", "control",
        ],
        "expected_skills": [
            "Broadcast Journalism", "Radio Production", "Teleprompter", "News Writing", "Interviewing", "Live Streaming", "Project Management", "Communication",
        ],
    },
    {
        "title": "Podcast Producer",
        "description": "Plans, records and edits podcast episodes, handling audio quality and distribution.",
        "domain": "Journalism & Broadcasting",
        "expected_keywords": [
            "podcast", "episode", "audio", "recording", "edit", "host", "guest", "distribution", "rss", "series", "script", "interview", "listener", "publish",
        ],
        "expected_skills": [
            "Podcast Production", "Adobe Audition", "Audio Mixing", "Interviewing", "Sound Design", "Pro Tools", "Communication", "Time Management",
        ],
    },

    # ===========================
    # LEGAL
    # ===========================
    {
        "title": "Lawyer",
        "description": "Advises clients and represents them in legal proceedings and negotiations.",
        "domain": "Legal",
        "expected_keywords": [
            "lawyer", "attorney", "legal", "court", "client", "case", "law", "litigation", "contract", "advice", "hearing", "plaintiff", "defendant", "bar",
        ],
        "expected_skills": [
            "Litigation", "Legal Research", "Legal Drafting", "Contract Law", "Case Management", "Legal Opinion", "Arbitration", "Communication",
        ],
    },
    {
        "title": "Legal Counsel",
        "description": "In-house lawyer advising a company on contracts, compliance and risk.",
        "domain": "Legal",
        "expected_keywords": [
            "counsel", "legal", "in-house", "contract", "compliance", "risk", "corporate", "advice", "negotiation", "regulatory", "policy", "review", "governance", "agreement",
        ],
        "expected_skills": [
            "Contract Law", "Corporate Law", "Compliance", "Contract Negotiation", "Legal Drafting", "Regulatory Affairs", "Due Diligence", "Legal Opinion",
        ],
    },
    {
        "title": "Paralegal",
        "description": "Supports lawyers with research, document preparation and case administration.",
        "domain": "Legal",
        "expected_keywords": [
            "paralegal", "legal", "research", "document", "filing", "case", "court", "assistant", "brief", "discovery", "record", "deadline", "client", "support",
        ],
        "expected_skills": [
            "Legal Research", "Legal Drafting", "Case Management", "UYAP", "Contract Law", "Document Management", "Time Management", "Communication",
        ],
    },
    {
        "title": "Compliance Specialist",
        "description": "Ensures the organisation meets regulatory and internal policy requirements.",
        "domain": "Legal",
        "expected_keywords": [
            "compliance", "regulatory", "policy", "audit", "risk", "control", "governance", "kvkk", "gdpr", "report", "framework", "monitor", "standard", "breach",
        ],
        "expected_skills": [
            "Compliance", "Regulatory Affairs", "GDPR", "KVKK", "Risk Management", "Legal Research", "Process Mapping", "Critical Thinking",
        ],
    },

    # ===========================
    # EDUCATION
    # ===========================
    {
        "title": "Teacher",
        "description": "Plans and delivers lessons, assesses learning and manages a classroom.",
        "domain": "Education",
        "expected_keywords": [
            "teacher", "teaching", "classroom", "student", "lesson", "curriculum", "school", "assessment", "grade", "pupil", "learning", "education", "pedagogy", "exam",
        ],
        "expected_skills": [
            "Lesson Planning", "Classroom Management", "Curriculum Design", "Pedagogy", "Assessment Design", "Differentiated Instruction", "Communication", "Mentoring",
        ],
    },
    {
        "title": "Instructional Designer",
        "description": "Designs learning experiences and e-learning material for training programmes.",
        "domain": "Education",
        "expected_keywords": [
            "instructional", "design", "learning", "training", "course", "module", "e-learning", "lms", "content", "objective", "assessment", "learner", "scorm", "blended",
        ],
        "expected_skills": [
            "Instructional Design", "Articulate Storyline", "SCORM", "Learning Management System", "Curriculum Design", "Assessment Design", "Educational Technology", "Technical Writing",
        ],
    },
    {
        "title": "Academic Researcher",
        "description": "Conducts scholarly research, publishes findings and secures funding.",
        "domain": "Education",
        "expected_keywords": [
            "research", "academic", "publication", "journal", "study", "thesis", "grant", "methodology", "data", "conference", "peer", "review", "literature", "hypothesis",
        ],
        "expected_skills": [
            "Research Methodology", "Academic Writing", "Literature Review", "Grant Writing", "Peer Review", "Statistics", "Data Analysis", "Critical Thinking",
        ],
    },
    {
        "title": "Academic Advisor",
        "description": "Guides students on programme choices, progression and personal development.",
        "domain": "Education",
        "expected_keywords": [
            "advisor", "student", "guidance", "counseling", "programme", "enrollment", "progression", "support", "academic", "career", "mentoring", "record", "plan", "university",
        ],
        "expected_skills": [
            "Student Counseling", "Curriculum Design", "Learning Management System", "Academic Writing", "Communication", "Mentoring", "Time Management", "Presentation",
        ],
    },
    {
        "title": "Corporate Training Specialist",
        "description": "Designs and delivers workplace training and measures its impact.",
        "domain": "Education",
        "expected_keywords": [
            "training", "trainer", "workshop", "development", "learning", "employee", "skill", "programme", "facilitation", "onboarding", "evaluation", "corporate", "session", "competency",
        ],
        "expected_skills": [
            "Instructional Design", "Learning Management System", "Assessment Design", "Articulate Storyline", "Presentation", "Onboarding", "Communication", "Mentoring",
        ],
    },

    # ===========================
    # HEALTHCARE & CLINICAL
    # ===========================
    {
        "title": "Nurse",
        "description": "Delivers direct patient care, administers treatment and monitors condition.",
        "domain": "Healthcare & Clinical",
        "expected_keywords": [
            "nurse", "nursing", "patient", "care", "clinical", "ward", "hospital", "treatment", "medication", "vital", "shift", "triage", "chart", "hygiene",
        ],
        "expected_skills": [
            "Patient Care", "Vital Signs Monitoring", "Medication Administration", "IV Therapy", "Wound Care", "Clinical Documentation", "Infection Control", "Basic Life Support",
        ],
    },
    {
        "title": "Physician",
        "description": "Diagnoses and treats patients, ordering and interpreting investigations.",
        "domain": "Healthcare & Clinical",
        "expected_keywords": [
            "physician", "doctor", "patient", "diagnosis", "treatment", "clinical", "hospital", "examination", "prescription", "referral", "medical", "consultation", "chart", "specialty",
        ],
        "expected_skills": [
            "Patient Care", "Clinical Documentation", "Pharmacology", "Electronic Health Records", "Triage", "Advanced Cardiac Life Support", "Medical Imaging", "Patient Education",
        ],
    },
    {
        "title": "Pharmacist",
        "description": "Dispenses medication, reviews prescriptions and advises on safe use.",
        "domain": "Healthcare & Clinical",
        "expected_keywords": [
            "pharmacist", "pharmacy", "medication", "prescription", "drug", "dispense", "dose", "interaction", "patient", "counseling", "stock", "formulary", "clinical", "safety",
        ],
        "expected_skills": [
            "Pharmacology", "Prescription Review", "Patient Education", "Clinical Documentation", "Medication Administration", "Infection Control", "Communication", "Problem Solving",
        ],
    },
    {
        "title": "Physiotherapist",
        "description": "Assesses and treats movement disorders through exercise and manual therapy.",
        "domain": "Healthcare & Clinical",
        "expected_keywords": [
            "physiotherapy", "physical", "therapy", "rehabilitation", "patient", "exercise", "mobility", "injury", "assessment", "treatment", "recovery", "manual", "clinic", "musculoskeletal",
        ],
        "expected_skills": [
            "Physical Therapy", "Rehabilitation", "Manual Therapy", "Patient Care", "Biomechanics", "Patient Education", "Clinical Documentation", "Communication",
        ],
    },
    {
        "title": "Medical Laboratory Technician",
        "description": "Performs laboratory tests on clinical samples and reports results.",
        "domain": "Healthcare & Clinical",
        "expected_keywords": [
            "laboratory", "lab", "sample", "test", "specimen", "analysis", "result", "clinical", "reagent", "quality", "microscope", "blood", "culture", "report",
        ],
        "expected_skills": [
            "Laboratory Testing", "Sample Analysis", "Phlebotomy", "Infection Control", "Clinical Documentation", "Calibration", "Problem Solving", "Time Management",
        ],
    },
    {
        "title": "Dietitian",
        "description": "Assesses nutritional needs and designs diet plans for patients or clients.",
        "domain": "Healthcare & Clinical",
        "expected_keywords": [
            "dietitian", "nutrition", "diet", "patient", "meal", "plan", "assessment", "clinical", "weight", "counseling", "food", "intake", "health", "menu",
        ],
        "expected_skills": [
            "Nutrition Assessment", "Diet Planning", "Patient Education", "Patient Care", "Clinical Documentation", "Menu Planning", "Communication", "Presentation",
        ],
    },

    # ===========================
    # SALES & BUSINESS DEVELOPMENT
    # ===========================
    {
        "title": "Sales Representative",
        "description": "Sells products or services to prospects and closes deals against a quota.",
        "domain": "Sales & Business Development",
        "expected_keywords": [
            "sales", "quota", "prospect", "deal", "close", "pipeline", "lead", "customer", "target", "revenue", "territory", "crm", "pitch", "negotiation",
        ],
        "expected_skills": [
            "CRM", "Salesforce", "Pipeline Management", "Lead Generation", "Cold Calling", "Negotiation", "Quota Attainment", "Communication",
        ],
    },
    {
        "title": "Account Manager",
        "description": "Owns existing customer relationships, growing revenue and retention.",
        "domain": "Sales & Business Development",
        "expected_keywords": [
            "account", "customer", "relationship", "retention", "renewal", "upsell", "portfolio", "revenue", "client", "growth", "crm", "review", "churn", "satisfaction",
        ],
        "expected_skills": [
            "Account Management", "CRM", "Salesforce", "Upselling", "Customer Retention", "Key Account Management", "Negotiation", "Communication",
        ],
    },
    {
        "title": "Business Development Specialist",
        "description": "Finds and develops new markets, partnerships and revenue streams.",
        "domain": "Sales & Business Development",
        "expected_keywords": [
            "business", "development", "partnership", "market", "growth", "opportunity", "prospect", "strategy", "pipeline", "deal", "expansion", "lead", "revenue", "proposal",
        ],
        "expected_skills": [
            "Lead Generation", "Pipeline Management", "B2B Sales", "Market Research", "Negotiation", "Proposal Writing", "CRM", "Presentation",
        ],
    },
    {
        "title": "Sales Engineer",
        "description": "Provides technical expertise in the sales cycle, matching product to customer need.",
        "domain": "Sales & Business Development",
        "expected_keywords": [
            "sales", "technical", "solution", "demo", "customer", "requirement", "proposal", "presales", "tender", "specification", "product", "integration", "pitch", "consultation",
        ],
        "expected_skills": [
            "Technical Sales", "Proposal Writing", "Tender Management", "CRM", "Negotiation", "Presentation", "Problem Solving", "Communication",
        ],
    },
    {
        "title": "Customer Success Manager",
        "description": "Ensures customers adopt the product and achieve outcomes, reducing churn.",
        "domain": "Sales & Business Development",
        "expected_keywords": [
            "customer", "success", "onboarding", "adoption", "retention", "churn", "renewal", "health", "account", "engagement", "support", "outcome", "escalation", "feedback",
        ],
        "expected_skills": [
            "Customer Onboarding", "Customer Retention", "Churn Analysis", "CRM", "Account Management", "Product Analytics", "Communication", "Problem Solving",
        ],
    },

    # ===========================
    # HOSPITALITY & TOURISM
    # ===========================
    {
        "title": "Hotel Manager",
        "description": "Runs hotel operations, owning guest experience, staff and profitability.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "hotel", "manager", "guest", "operations", "occupancy", "staff", "revenue", "service", "booking", "front", "housekeeping", "quality", "budget", "hospitality",
        ],
        "expected_skills": [
            "Opera PMS", "Revenue Management", "Front Office Operations", "Guest Relations", "Housekeeping Management", "Cost Control", "Leadership", "Communication",
        ],
    },
    {
        "title": "Chef",
        "description": "Leads kitchen production, designs menus and controls food quality and cost.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "chef", "kitchen", "menu", "cuisine", "food", "cooking", "brigade", "recipe", "service", "quality", "hygiene", "cost", "plating", "restaurant",
        ],
        "expected_skills": [
            "Culinary Arts", "Menu Planning", "Kitchen Management", "HACCP", "Food Safety", "Cost Control", "Leadership", "Time Management",
        ],
    },
    {
        "title": "Front Office Manager",
        "description": "Manages reception, reservations and the guest arrival experience.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "front", "office", "reception", "reservation", "guest", "check-in", "booking", "desk", "occupancy", "service", "complaint", "upsell", "shift", "hotel",
        ],
        "expected_skills": [
            "Opera PMS", "Front Office Operations", "Reservation Management", "Guest Relations", "Revenue Management", "Hospitality Sales", "Communication", "Leadership",
        ],
    },
    {
        "title": "Tour Operator",
        "description": "Designs and sells travel itineraries, coordinating suppliers and groups.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "tour", "travel", "itinerary", "booking", "group", "destination", "guide", "package", "supplier", "reservation", "transfer", "excursion", "customer", "agency",
        ],
        "expected_skills": [
            "Tour Planning", "Amadeus", "Galileo", "Reservation Management", "Guest Relations", "Cost Control", "Communication", "Presentation",
        ],
    },
    {
        "title": "Food and Beverage Manager",
        "description": "Runs restaurant and bar operations, owning service standards and margin.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "food", "beverage", "restaurant", "bar", "service", "menu", "cover", "margin", "stock", "banquet", "staff", "quality", "cost", "outlet",
        ],
        "expected_skills": [
            "Food and Beverage Management", "Cost Control", "HACCP", "Menu Planning", "Banquet Operations", "Food Safety", "Leadership", "Communication",
        ],
    },

    # ===========================
    # ARCHITECTURE & DESIGN
    # ===========================
    {
        "title": "Architect",
        "description": "Designs buildings and produces the drawings and documentation to construct them.",
        "domain": "Architecture & Design",
        "expected_keywords": [
            "architect", "architecture", "building", "design", "drawing", "plan", "elevation", "permit", "construction", "site", "concept", "model", "code", "detail",
        ],
        "expected_skills": [
            "Revit", "AutoCAD", "ArchiCAD", "SketchUp", "Architectural Drafting", "Building Codes", "Construction Documentation", "Space Planning",
        ],
    },
    {
        "title": "Interior Designer",
        "description": "Designs interior spaces, specifying finishes, furniture and lighting.",
        "domain": "Architecture & Design",
        "expected_keywords": [
            "interior", "design", "space", "finish", "furniture", "lighting", "layout", "render", "material", "client", "concept", "mood", "residential", "commercial",
        ],
        "expected_skills": [
            "SketchUp", "3ds Max", "V-Ray", "Interior Rendering", "Space Planning", "AutoCAD", "Lumion", "Presentation",
        ],
    },
    {
        "title": "Graphic Designer",
        "description": "Creates visual assets for brand, print and digital channels.",
        "domain": "Architecture & Design",
        "expected_keywords": [
            "graphic", "design", "brand", "logo", "layout", "typography", "print", "digital", "visual", "identity", "asset", "campaign", "artwork", "mockup",
        ],
        "expected_skills": [
            "Adobe Illustrator", "Adobe Photoshop", "Adobe InDesign", "Typography", "Brand Identity", "Print Design", "Packaging Design", "Figma",
        ],
    },
    {
        "title": "Landscape Architect",
        "description": "Designs outdoor spaces, planting schemes and public realm.",
        "domain": "Architecture & Design",
        "expected_keywords": [
            "landscape", "design", "planting", "outdoor", "site", "garden", "park", "urban", "plan", "grading", "irrigation", "public", "green", "master",
        ],
        "expected_skills": [
            "Landscape Design", "AutoCAD", "SketchUp", "Urban Planning", "GIS", "Lumion", "Construction Documentation", "Presentation",
        ],
    },
    {
        "title": "Industrial Designer",
        "description": "Designs physical products, balancing form, function and manufacturability.",
        "domain": "Architecture & Design",
        "expected_keywords": [
            "industrial", "product", "design", "prototype", "form", "ergonomics", "manufacturing", "concept", "sketch", "model", "material", "cad", "user", "iteration",
        ],
        "expected_skills": [
            "Industrial Design", "Rhino", "SolidWorks", "Rapid Prototyping", "Adobe Illustrator", "3ds Max", "User Research", "Problem Solving",
        ],
    },

    # ===========================
    # SKILLED TRADES & TECHNICAL
    # ===========================
    {
        "title": "Electrician",
        "description": "Installs, maintains and repairs electrical systems to code.",
        "domain": "Skilled Trades & Technical",
        "expected_keywords": [
            "electrician", "electrical", "wiring", "installation", "circuit", "panel", "voltage", "maintenance", "fault", "cable", "switchboard", "safety", "repair", "inspection",
        ],
        "expected_skills": [
            "Electrical Wiring", "Panel Building", "Troubleshooting", "Blueprint Reading", "Preventive Maintenance", "Occupational Safety", "Lockout Tagout", "Problem Solving",
        ],
    },
    {
        "title": "Maintenance Technician",
        "description": "Keeps plant and equipment running through planned and reactive maintenance.",
        "domain": "Skilled Trades & Technical",
        "expected_keywords": [
            "maintenance", "technician", "repair", "equipment", "breakdown", "preventive", "machine", "fault", "spare", "downtime", "inspection", "plant", "service", "reliability",
        ],
        "expected_skills": [
            "Preventive Maintenance", "Troubleshooting", "Hydraulics", "Pneumatics", "PLC Programming", "Blueprint Reading", "Occupational Safety", "Problem Solving",
        ],
    },
    {
        "title": "Welder",
        "description": "Joins metal components using welding processes to specification.",
        "domain": "Skilled Trades & Technical",
        "expected_keywords": [
            "welder", "welding", "weld", "metal", "fabrication", "joint", "steel", "seam", "torch", "certification", "blueprint", "inspection", "workshop", "assembly",
        ],
        "expected_skills": [
            "Welding", "TIG Welding", "MIG Welding", "Blueprint Reading", "Metrology", "Occupational Safety", "Problem Solving", "Time Management",
        ],
    },
    {
        "title": "CNC Machinist",
        "description": "Sets up and operates CNC machines to produce precision parts.",
        "domain": "Skilled Trades & Technical",
        "expected_keywords": [
            "cnc", "machinist", "machining", "lathe", "mill", "tolerance", "part", "program", "setup", "tooling", "precision", "gcode", "fixture", "production",
        ],
        "expected_skills": [
            "CNC Machining", "CNC Programming", "Lathe Operation", "Milling", "Metrology", "Blueprint Reading", "GD&T", "Calibration",
        ],
    },
    {
        "title": "Automotive Technician",
        "description": "Diagnoses and repairs vehicle mechanical and electronic systems.",
        "domain": "Skilled Trades & Technical",
        "expected_keywords": [
            "automotive", "vehicle", "engine", "repair", "diagnostic", "service", "brake", "transmission", "fault", "garage", "maintenance", "inspection", "part", "workshop",
        ],
        "expected_skills": [
            "Automotive Diagnostics", "Engine Repair", "Troubleshooting", "Preventive Maintenance", "Hydraulics", "Occupational Safety", "Blueprint Reading", "Problem Solving",
        ],
    },

    # ===========================
    # PUBLIC SECTOR & NGO
    # ===========================
    {
        "title": "Policy Specialist",
        "description": "Analyses policy options and advises on regulation and public programmes.",
        "domain": "Public Sector & NGO",
        "expected_keywords": [
            "policy", "public", "regulation", "government", "analysis", "brief", "stakeholder", "legislation", "reform", "consultation", "impact", "report", "sector", "strategy",
        ],
        "expected_skills": [
            "Policy Analysis", "Public Administration", "Stakeholder Engagement", "Advocacy", "Research Methodology", "Academic Writing", "Critical Thinking", "Presentation",
        ],
    },
    {
        "title": "Program Coordinator",
        "description": "Runs the day-to-day delivery of a programme, tracking budget and outcomes.",
        "domain": "Public Sector & NGO",
        "expected_keywords": [
            "program", "coordinator", "project", "delivery", "beneficiary", "budget", "partner", "report", "donor", "field", "activity", "indicator", "workplan", "ngo",
        ],
        "expected_skills": [
            "Program Coordination", "Monitoring and Evaluation", "Logical Framework", "Donor Reporting", "Stakeholder Engagement", "Grant Management", "Project Management", "Communication",
        ],
    },
    {
        "title": "Grant Manager",
        "description": "Secures and administers grant funding, owning proposals and donor compliance.",
        "domain": "Public Sector & NGO",
        "expected_keywords": [
            "grant", "funding", "donor", "proposal", "budget", "compliance", "report", "application", "award", "fundraising", "eligibility", "financial", "programme", "ngo",
        ],
        "expected_skills": [
            "Grant Writing", "Grant Management", "Donor Reporting", "Fundraising", "Monitoring and Evaluation", "Public Procurement", "Compliance", "Technical Writing",
        ],
    },
    {
        "title": "Public Relations Specialist",
        "description": "Manages an organisation's public image, media relations and messaging.",
        "domain": "Public Sector & NGO",
        "expected_keywords": [
            "public", "relations", "media", "press", "communication", "reputation", "message", "release", "spokesperson", "campaign", "crisis", "stakeholder", "coverage", "brand",
        ],
        "expected_skills": [
            "Public Relations", "Media Relations", "Press Release", "Crisis Communication", "Media Monitoring", "Community Outreach", "Communication", "Presentation",
        ],
    },

    # ===========================
    # HOSPITALITY & TOURISM
    # ===========================
    {
        "title": "Waiter",
        "description": "Serves guests at table, takes orders and handles payment in a restaurant or hotel.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "waiter", "waitress", "server", "restaurant", "guest", "order", "table", "service", "menu", "shift", "tip", "pos", "hospitality", "customer",
        ],
        "expected_skills": [
            "Table Service", "Order Taking", "Menu Knowledge", "POS Systems", "Wine Service", "Upselling", "Food Safety", "Customer Service",
        ],
    },
    {
        "title": "Commis Waiter",
        "description": "Supports the service team by setting tables, running food and clearing covers.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "commis", "busser", "runner", "restaurant", "table", "service", "clearing", "setting", "support", "shift", "guest", "food", "hygiene", "team",
        ],
        "expected_skills": [
            "Table Setting", "Tray Service", "Order Taking", "Food Safety", "Customer Service", "Teamwork", "Time Management", "Menu Knowledge",
        ],
    },
    {
        "title": "Barista",
        "description": "Prepares espresso-based drinks and serves customers in a cafe.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "barista", "coffee", "espresso", "cafe", "drink", "milk", "customer", "counter", "pos", "order", "grinder", "shift", "brew", "service",
        ],
        "expected_skills": [
            "Barista Skills", "Espresso Preparation", "Latte Art", "Coffee Brewing", "POS Systems", "Cash Handling", "Customer Service", "Food Safety",
        ],
    },
    {
        "title": "Bartender",
        "description": "Mixes and serves drinks, manages the bar and its stock.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "bartender", "bar", "cocktail", "drink", "beverage", "mixing", "guest", "pos", "stock", "shift", "spirits", "service", "counter", "order",
        ],
        "expected_skills": [
            "Bartending", "Cocktail Preparation", "Mixology", "Wine Service", "POS Systems", "Cash Handling", "Stock Control", "Customer Service",
        ],
    },
    {
        "title": "Housekeeping Attendant",
        "description": "Cleans and prepares guest rooms to the property's standard.",
        "domain": "Hospitality & Tourism",
        "expected_keywords": [
            "housekeeping", "room", "cleaning", "guest", "hotel", "linen", "laundry", "attendant", "standard", "amenity", "shift", "inspection", "hygiene", "turnover",
        ],
        "expected_skills": [
            "Cleaning Standards", "Room Inspection", "Laundry Operations", "Guest Relations", "Occupational Safety", "Time Management", "Teamwork", "Customer Service",
        ],
    },

    # ===========================
    # RETAIL & CUSTOMER SERVICE
    # ===========================
    {
        "title": "Cashier",
        "description": "Handles payments and serves customers at the till.",
        "domain": "Retail & Customer Service",
        "expected_keywords": [
            "cashier", "till", "checkout", "payment", "customer", "store", "register", "cash", "receipt", "shift", "scan", "refund", "queue", "service",
        ],
        "expected_skills": [
            "POS Systems", "Cash Handling", "Customer Service", "Complaint Handling", "Product Knowledge", "Loss Prevention", "Time Management", "Teamwork",
        ],
    },
    {
        "title": "Retail Sales Associate",
        "description": "Advises customers on the shop floor and drives store sales.",
        "domain": "Retail & Customer Service",
        "expected_keywords": [
            "retail", "sales", "store", "customer", "shop", "floor", "product", "merchandising", "stock", "target", "advice", "display", "fitting", "service",
        ],
        "expected_skills": [
            "Product Knowledge", "Visual Merchandising", "POS Systems", "Upselling", "Stock Control", "Customer Service", "Complaint Handling", "Communication",
        ],
    },
    {
        "title": "Store Manager",
        "description": "Runs a retail store: team, stock, targets and profitability.",
        "domain": "Retail & Customer Service",
        "expected_keywords": [
            "store", "manager", "retail", "team", "target", "stock", "sales", "shrinkage", "rota", "profit", "display", "customer", "inventory", "branch",
        ],
        "expected_skills": [
            "Inventory Management", "Visual Merchandising", "Loss Prevention", "Staff Scheduling", "Sales Forecasting", "Cost Control", "Leadership", "Customer Service",
        ],
    },
    {
        "title": "Customer Service Representative",
        "description": "Resolves customer issues across phone, email and chat.",
        "domain": "Retail & Customer Service",
        "expected_keywords": [
            "customer", "service", "support", "complaint", "resolution", "ticket", "chat", "email", "call", "satisfaction", "escalation", "response", "helpdesk", "client",
        ],
        "expected_skills": [
            "Complaint Handling", "Ticketing System", "Zendesk", "Live Chat Support", "CRM", "Customer Service", "Communication", "Problem Solving",
        ],
    },
    {
        "title": "Call Center Agent",
        "description": "Handles inbound and outbound calls to volume and quality targets.",
        "domain": "Retail & Customer Service",
        "expected_keywords": [
            "call", "center", "agent", "inbound", "outbound", "phone", "script", "queue", "customer", "target", "handling", "campaign", "crm", "quality",
        ],
        "expected_skills": [
            "Call Handling", "Ticketing System", "CRM", "Complaint Handling", "Live Chat Support", "Customer Service", "Communication", "Time Management",
        ],
    },
]
