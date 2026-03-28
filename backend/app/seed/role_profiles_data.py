"""
Predefined role profiles for career recommendation matching.
Each profile defines expected keywords and skills for scoring.
"""

ROLE_PROFILES_DATA: list[dict] = [
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
        "title": "Backend Developer Intern",
        "description": "Backend-focused internship role emphasizing API development, database management, and server-side logic.",
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
        "title": "Frontend Developer Intern",
        "description": "Frontend-focused internship role emphasizing modern UI development, responsive design, and user experience.",
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
        "title": "Data Analyst Intern",
        "description": "Data analysis internship focused on extracting insights from data using statistical methods and visualization tools.",
        "domain": "Software Engineering",
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
        "title": "DevOps Engineer Intern",
        "description": "DevOps internship focused on CI/CD pipelines, infrastructure automation, and cloud deployment.",
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
        "title": "QA Engineer Intern",
        "description": "Quality assurance internship focused on test planning, automation, and ensuring software reliability.",
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
        "title": "Production Planning Engineer",
        "description": "Focuses on optimizing production schedules, material requirements, and ensuring efficient manufacturing processes.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "production", "planning", "schedule", "manufacturing", "erp",
            "material", "efficiency", "forecast", "inventory", "lean",
            "supply chain", "optimization", "bottleneck", "capacity",
        ],
        "expected_skills": [
            "ERP Systems", "SAP", "Excel", "Data Analysis", "Lean Manufacturing",
            "Production Planning", "Supply Chain Management", "Problem Solving",
            "AutoCAD",
        ],
    },
    {
        "title": "Process Improvement Analyst",
        "description": "Analyzes current workflows and manufacturing processes to implement Lean or Six Sigma methodologies and reduce waste.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "process", "improvement", "lean", "six sigma", "kaizen",
            "waste", "optimization", "workflow", "efficiency", "bottleneck",
            "time study", "method", "continuous improvement", "quality",
        ],
        "expected_skills": [
            "Lean Six Sigma", "Process Optimization", "Kaizen", "Minitab",
            "Data Analysis", "Time Study", "Value Stream Mapping", "Excel",
        ],
    },
    {
        "title": "Supply Chain Analyst",
        "description": "Manages logistics, supplier relationships, inventory optimization, and distribution network efficiency.",
        "domain": "Industrial Engineering",
        "expected_keywords": [
            "supply chain", "logistics", "inventory", "supplier", "distribution",
            "procurement", "optimization", "forecast", "demand", "warehouse",
            "freight", "erp", "sourcing", "purchasing",
        ],
        "expected_skills": [
            "Supply Chain Management", "Inventory Optimization", "Logistics",
            "ERP Systems", "SAP", "Excel", "Data Visualization", "Purchasing",
        ],
    }
]
