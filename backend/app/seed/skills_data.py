"""
Predefined skills dictionary for CV skill extraction.
Organized by category for structured matching and reporting.
"""

SKILLS_DATA: list[dict[str, str]] = [
    # ---- Programming Languages ----
    {"name": "Python", "category": "programming"},
    {"name": "JavaScript", "category": "programming"},
    {"name": "TypeScript", "category": "programming"},
    {"name": "Java", "category": "programming"},
    {"name": "C#", "category": "programming"},
    {"name": "C++", "category": "programming"},
    {"name": "C", "category": "programming"},
    {"name": "Go", "category": "programming"},
    {"name": "Rust", "category": "programming"},
    {"name": "PHP", "category": "programming"},
    {"name": "Ruby", "category": "programming"},
    {"name": "Swift", "category": "programming"},
    {"name": "Kotlin", "category": "programming"},
    {"name": "Scala", "category": "programming"},
    {"name": "R", "category": "programming"},
    {"name": "MATLAB", "category": "programming"},
    {"name": "SQL", "category": "programming"},
    {"name": "Dart", "category": "programming"},
    {"name": "Bash", "category": "programming"},
    {"name": "PowerShell", "category": "programming"},

    # ---- Web Frameworks ----
    {"name": "React", "category": "framework"},
    {"name": "Angular", "category": "framework"},
    {"name": "Vue.js", "category": "framework"},
    {"name": "Next.js", "category": "framework"},
    {"name": "Node.js", "category": "framework"},
    {"name": "Express.js", "category": "framework"},
    {"name": "Django", "category": "framework"},
    {"name": "Flask", "category": "framework"},
    {"name": "FastAPI", "category": "framework"},
    {"name": "Spring Boot", "category": "framework"},
    {"name": "ASP.NET", "category": "framework"},
    {"name": "Ruby on Rails", "category": "framework"},
    {"name": "Laravel", "category": "framework"},
    {"name": "Svelte", "category": "framework"},
    {"name": "jQuery", "category": "framework"},
    {"name": "Bootstrap", "category": "framework"},
    {"name": "Tailwind CSS", "category": "framework"},
    {"name": "Flutter", "category": "framework"},
    {"name": "React Native", "category": "framework"},

    # ---- Databases ----
    {"name": "PostgreSQL", "category": "database"},
    {"name": "MySQL", "category": "database"},
    {"name": "SQLite", "category": "database"},
    {"name": "MongoDB", "category": "database"},
    {"name": "Redis", "category": "database"},
    {"name": "Elasticsearch", "category": "database"},
    {"name": "Oracle", "category": "database"},
    {"name": "SQL Server", "category": "database"},
    {"name": "Firebase", "category": "database"},
    {"name": "DynamoDB", "category": "database"},
    {"name": "Cassandra", "category": "database"},
    {"name": "Neo4j", "category": "database"},

    # ---- DevOps & Cloud ----
    {"name": "Docker", "category": "devops"},
    {"name": "Kubernetes", "category": "devops"},
    {"name": "AWS", "category": "cloud"},
    {"name": "Azure", "category": "cloud"},
    {"name": "Google Cloud", "category": "cloud"},
    {"name": "CI/CD", "category": "devops"},
    {"name": "Jenkins", "category": "devops"},
    {"name": "GitHub Actions", "category": "devops"},
    {"name": "Terraform", "category": "devops"},
    {"name": "Ansible", "category": "devops"},
    {"name": "Nginx", "category": "devops"},
    {"name": "Linux", "category": "devops"},

    # ---- Tools & Platforms ----
    {"name": "Git", "category": "tool"},
    {"name": "GitHub", "category": "tool"},
    {"name": "GitLab", "category": "tool"},
    {"name": "Jira", "category": "tool"},
    {"name": "Confluence", "category": "tool"},
    {"name": "Figma", "category": "tool"},
    {"name": "VS Code", "category": "tool"},
    {"name": "IntelliJ", "category": "tool"},
    {"name": "Postman", "category": "tool"},
    {"name": "Swagger", "category": "tool"},
    {"name": "Slack", "category": "tool"},

    # ---- Data & AI/ML ----
    {"name": "Machine Learning", "category": "data_science"},
    {"name": "Deep Learning", "category": "data_science"},
    {"name": "TensorFlow", "category": "data_science"},
    {"name": "PyTorch", "category": "data_science"},
    {"name": "Scikit-learn", "category": "data_science"},
    {"name": "Pandas", "category": "data_science"},
    {"name": "NumPy", "category": "data_science"},
    {"name": "Matplotlib", "category": "data_science"},
    {"name": "Tableau", "category": "data_science"},
    {"name": "Power BI", "category": "data_science"},
    {"name": "Apache Spark", "category": "data_science"},
    {"name": "Hadoop", "category": "data_science"},
    {"name": "NLP", "category": "data_science"},
    {"name": "Computer Vision", "category": "data_science"},
    {"name": "Data Analysis", "category": "data_science"},
    {"name": "Data Visualization", "category": "data_science"},
    {"name": "Statistics", "category": "data_science"},

    # ---- Testing ----
    {"name": "Unit Testing", "category": "testing"},
    {"name": "Integration Testing", "category": "testing"},
    {"name": "Selenium", "category": "testing"},
    {"name": "Cypress", "category": "testing"},
    {"name": "Jest", "category": "testing"},
    {"name": "Pytest", "category": "testing"},
    {"name": "JUnit", "category": "testing"},
    {"name": "Test Automation", "category": "testing"},

    # ---- Soft Skills ----
    {"name": "Leadership", "category": "soft_skill"},
    {"name": "Teamwork", "category": "soft_skill"},
    {"name": "Communication", "category": "soft_skill"},
    {"name": "Problem Solving", "category": "soft_skill"},
    {"name": "Critical Thinking", "category": "soft_skill"},
    {"name": "Project Management", "category": "soft_skill"},
    {"name": "Agile", "category": "soft_skill"},
    {"name": "Scrum", "category": "soft_skill"},
    {"name": "Time Management", "category": "soft_skill"},
    {"name": "Presentation", "category": "soft_skill"},
    {"name": "Technical Writing", "category": "soft_skill"},
    {"name": "Mentoring", "category": "soft_skill"},

    # ---- Security ----
    {"name": "Cybersecurity", "category": "security"},
    {"name": "Penetration Testing", "category": "security"},
    {"name": "OAuth", "category": "security"},
    {"name": "JWT", "category": "security"},
    {"name": "Encryption", "category": "security"},

    # ---- Architecture & Design ----
    {"name": "REST API", "category": "architecture"},
    {"name": "GraphQL", "category": "architecture"},
    {"name": "Microservices", "category": "architecture"},
    {"name": "Design Patterns", "category": "architecture"},
    {"name": "System Design", "category": "architecture"},
    {"name": "OOP", "category": "architecture"},
    {"name": "Clean Architecture", "category": "architecture"},
    {"name": "Event-Driven Architecture", "category": "architecture"},

    # ---- Industrial Engineering / Supply Chain ----
    {"name": "ERP Systems", "category": "engineering"},
    {"name": "SAP", "category": "engineering"},
    {"name": "Excel", "category": "tool"},
    {"name": "Lean Manufacturing", "category": "engineering"},
    {"name": "Production Planning", "category": "engineering"},
    {"name": "Supply Chain Management", "category": "engineering"},
    {"name": "AutoCAD", "category": "tool"},
    {"name": "Lean Six Sigma", "category": "engineering"},
    {"name": "Process Optimization", "category": "engineering"},
    {"name": "Kaizen", "category": "engineering"},
    {"name": "Minitab", "category": "tool"},
    {"name": "Time Study", "category": "engineering"},
    {"name": "Value Stream Mapping", "category": "engineering"},
    {"name": "Inventory Optimization", "category": "engineering"},
    {"name": "Logistics", "category": "engineering"},
    {"name": "Purchasing", "category": "engineering"},

    # ---- Discipline-specific engineering ----
    # Mechanical Design / HVAC / Structural / Transportation all expected the
    # identical AutoCAD + MATLAB + Excel set and tied at the same score for the
    # same CV; Biomedical and Environmental were likewise indistinguishable.
    # These are the tools that actually separate the disciplines.
    {"name": "SolidWorks", "category": "engineering"},
    {"name": "CATIA", "category": "engineering"},
    {"name": "ANSYS", "category": "engineering"},
    {"name": "Finite Element Analysis", "category": "engineering"},
    {"name": "GD&T", "category": "engineering"},
    {"name": "Thermodynamics", "category": "engineering"},

    {"name": "HVAC Design", "category": "engineering"},
    {"name": "Load Calculation", "category": "engineering"},
    {"name": "Refrigeration", "category": "engineering"},
    {"name": "ASHRAE Standards", "category": "engineering"},
    {"name": "Ductwork Design", "category": "engineering"},

    {"name": "SAP2000", "category": "engineering"},
    {"name": "ETABS", "category": "engineering"},
    {"name": "STAAD Pro", "category": "engineering"},
    {"name": "Reinforced Concrete Design", "category": "engineering"},
    {"name": "Steel Structure Design", "category": "engineering"},
    {"name": "Seismic Design", "category": "engineering"},

    {"name": "Traffic Modeling", "category": "engineering"},
    {"name": "Highway Design", "category": "engineering"},
    {"name": "VISSIM", "category": "engineering"},
    {"name": "Transportation Planning", "category": "engineering"},
    {"name": "Pavement Design", "category": "engineering"},

    {"name": "Medical Device Design", "category": "engineering"},
    {"name": "ISO 13485", "category": "engineering"},
    {"name": "Biomechanics", "category": "engineering"},
    {"name": "Signal Processing", "category": "engineering"},
    {"name": "Medical Imaging", "category": "engineering"},

    {"name": "Environmental Impact Assessment", "category": "engineering"},
    {"name": "Water Treatment", "category": "engineering"},
    {"name": "Air Quality Monitoring", "category": "engineering"},
    {"name": "Waste Management", "category": "engineering"},
    {"name": "GIS", "category": "engineering"},

    # ---- Web fundamentals ----
    # These were expected by Frontend Developer, Full-Stack Developer and
    # UX/UI Designer but missing from this dictionary, so a CV listing them
    # scored nothing for them and those roles could never be fully matched.
    # The taxonomy lint test now makes that class of gap impossible.
    {"name": "HTML", "category": "framework"},
    {"name": "CSS", "category": "framework"},
    {"name": "Sass", "category": "framework"},
    {"name": "Networking", "category": "devops"},
    {"name": "Kafka", "category": "devops"},

    # ---- Project & Delivery ----
    # Added 2026-07 with the recommender's evidence gate. Project Manager,
    # Product Manager, Management Consultant, HR Specialist, Content
    # Strategist, Digital Marketing Specialist and Construction Project
    # Engineer previously expected nothing but Excel and soft skills, so they
    # could not be evidenced by any CV - and any CV carrying that same filler
    # matched them. These are the tools that actually distinguish the work.
    {"name": "MS Project", "category": "project_management"},
    {"name": "Primavera", "category": "project_management"},
    {"name": "Asana", "category": "project_management"},
    {"name": "Risk Management", "category": "project_management"},
    {"name": "Stakeholder Management", "category": "project_management"},
    {"name": "Earned Value Management", "category": "project_management"},
    {"name": "Gantt Chart", "category": "project_management"},
    {"name": "Resource Planning", "category": "project_management"},

    # ---- Product ----
    {"name": "Product Roadmap", "category": "product"},
    {"name": "User Research", "category": "product"},
    {"name": "A/B Testing", "category": "product"},
    {"name": "Product Analytics", "category": "product"},
    {"name": "Wireframing", "category": "product"},
    {"name": "Backlog Grooming", "category": "product"},
    {"name": "Mixpanel", "category": "product"},
    {"name": "Amplitude", "category": "product"},

    # ---- Business & Consulting ----
    {"name": "Financial Modeling", "category": "business"},
    {"name": "Market Research", "category": "business"},
    {"name": "Business Case", "category": "business"},
    {"name": "Process Mapping", "category": "business"},
    {"name": "Due Diligence", "category": "business"},
    {"name": "Benchmarking", "category": "business"},
    {"name": "Cost-Benefit Analysis", "category": "business"},
    {"name": "SWOT Analysis", "category": "business"},

    # ---- Human Resources ----
    {"name": "Workday", "category": "human_resources"},
    {"name": "SAP SuccessFactors", "category": "human_resources"},
    {"name": "HRIS", "category": "human_resources"},
    {"name": "Payroll", "category": "human_resources"},
    {"name": "Recruiting", "category": "human_resources"},
    {"name": "Talent Acquisition", "category": "human_resources"},
    {"name": "Onboarding", "category": "human_resources"},
    {"name": "Performance Management", "category": "human_resources"},
    {"name": "Compensation and Benefits", "category": "human_resources"},
    {"name": "Employee Relations", "category": "human_resources"},

    # ---- Marketing ----
    {"name": "SEO", "category": "marketing"},
    {"name": "SEM", "category": "marketing"},
    {"name": "Google Analytics", "category": "marketing"},
    {"name": "Google Ads", "category": "marketing"},
    {"name": "Meta Ads", "category": "marketing"},
    {"name": "Content Marketing", "category": "marketing"},
    {"name": "Email Marketing", "category": "marketing"},
    {"name": "Marketing Automation", "category": "marketing"},
    {"name": "HubSpot", "category": "marketing"},
    {"name": "Copywriting", "category": "marketing"},
    {"name": "Editorial Calendar", "category": "marketing"},
    {"name": "Content Management System", "category": "marketing"},
    {"name": "Social Media Marketing", "category": "marketing"},
    {"name": "Conversion Rate Optimization", "category": "marketing"},

    # ---- Construction & Built Environment ----
    {"name": "Revit", "category": "engineering"},
    {"name": "BIM", "category": "engineering"},
    {"name": "Quantity Surveying", "category": "engineering"},
    {"name": "Site Supervision", "category": "engineering"},
    {"name": "Construction Scheduling", "category": "engineering"},
]
