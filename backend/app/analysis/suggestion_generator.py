"""
Suggestion Generator — produces rule-based, actionable improvement suggestions.
Generates at least 3 suggestions per analysis (FR10).
Each suggestion has a category, priority, and message.
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.suggestion_generator")


class SuggestionGenerator(BaseAnalyzer):
    """Generates actionable improvement suggestions based on analysis results."""

    @property
    def name(self) -> str:
        return "Suggestion Generator"

    def analyze(self, context: AnalysisContext) -> None:
        suggestions: list[dict[str, Any]] = []

        # ---- Section-based suggestions ----
        sections = context.detected_sections

        if not sections.get("summary"):
            suggestions.append({
                "category": "content",
                "priority": "high",
                "message": (
                    "Add a Professional Summary or Objective section at the top of your CV. "
                    "A 2-3 sentence summary helps recruiters quickly understand your profile "
                    "and is one of the first things ATS systems scan."
                ),
                "snippets": []
            })

        if not sections.get("skills"):
            suggestions.append({
                "category": "skills",
                "priority": "high",
                "message": (
                    "Add a dedicated Skills section listing your technical and soft skills. "
                    "Use a comma-separated or bulleted format for easy ATS parsing. "
                    "Include specific technologies, programming languages, and tools."
                ),
                "snippets": []
            })

        if not sections.get("experience"):
            suggestions.append({
                "category": "experience",
                "priority": "high",
                "message": (
                    "Add a Work Experience or Internship section. Even if you're a student, "
                    "include internships, part-time jobs, volunteer work, or freelance projects. "
                    "Use the format: Job Title | Company | Date Range."
                ),
                "snippets": []
            })

        if not sections.get("education"):
            suggestions.append({
                "category": "content",
                "priority": "high",
                "message": (
                    "Add an Education section with your degree, university name, "
                    "and graduation date. Include your GPA if it's strong (e.g., 3.5+)."
                ),
                "snippets": []
            })

        if not sections.get("projects"):
            suggestions.append({
                "category": "content",
                "priority": "medium",
                "message": (
                    "Consider adding a Projects section to showcase hands-on experience. "
                    "Include 2-3 projects with brief descriptions, technologies used, "
                    "and links to GitHub repositories if available."
                ),
                "snippets": []
            })

        if not sections.get("certifications"):
            suggestions.append({
                "category": "content",
                "priority": "low",
                "message": (
                    "Consider adding relevant certifications or online courses "
                    "(e.g., AWS, Google, Coursera, Udemy) to strengthen your profile."
                ),
                "snippets": []
            })

        # ---- ATS-based suggestions ----
        for issue in context.ats_issues:
            if "email" in issue.lower():
                suggestions.append({
                    "category": "ats",
                    "priority": "high",
                    "message": (
                        "Include your email address at the top of your CV. "
                        "This is essential for recruiter contact and ATS processing."
                    ),
                    "snippets": []
                })
            elif "contact" in issue.lower():
                suggestions.append({
                    "category": "ats",
                    "priority": "high",
                    "message": (
                        "Add contact information (email, phone, LinkedIn) "
                        "at the top of your CV for recruiter accessibility."
                    ),
                    "snippets": []
                })
            elif "action verbs" in issue.lower():
                suggestions.append({
                    "category": "formatting",
                    "priority": "medium",
                    "message": (
                        "Use strong action verbs to describe your achievements: "
                        "'Developed', 'Implemented', 'Designed', 'Managed', 'Optimized'. "
                        "Avoid passive phrases like 'responsible for' or 'was part of'."
                    ),
                    "snippets": []
                })
            elif "short" in issue.lower() or "length" in issue.lower():
                suggestions.append({
                    "category": "content",
                    "priority": "medium",
                    "message": (
                        "Your CV appears too brief. Aim for at least one full page. "
                        "Expand on your experiences with specific achievements, "
                        "use bullet points, and quantify results where possible."
                    ),
                    "snippets": []
                })
            elif "caps" in issue.lower():
                suggestions.append({
                    "category": "formatting",
                    "priority": "low",
                    "message": (
                        "Reduce the use of ALL CAPS formatting. Use bold text or "
                        "larger font sizes for headers instead — ATS systems may "
                        "misinterpret excessive capitalization."
                    ),
                    "snippets": []
                })

        # ---- Skill-based suggestions ----
        skill_count = len(context.extracted_skills)
        if skill_count < 5:
            suggestions.append({
                "category": "skills",
                "priority": "high",
                "message": (
                    f"Only {skill_count} recognized skills were detected. "
                    "List more specific technical skills (e.g., Python, React, SQL, Docker). "
                    "Aim for at least 8-12 relevant skills for a competitive profile."
                ),
                "snippets": []
            })

        # Check skill diversity
        if skill_count > 0:
            categories = set(s["skill_category"] for s in context.extracted_skills)
            if len(categories) < 3:
                suggestions.append({
                    "category": "skills",
                    "priority": "medium",
                    "message": (
                        "Your skills are concentrated in few categories. "
                        "Diversify by adding skills from different areas: "
                        "programming languages, frameworks, databases, tools, and soft skills."
                    ),
                    "snippets": []
                })

        # ---- Experience-based suggestions ----
        if context.experience_score < 40 or True: # Always run quantification check
            # Look for exact sentences to highlight
            text = context.extracted_text
            sentences = re.split(r'(?<=[.!?])\s+|\n+|-|•|\*', text)
            
            non_quantified_sentences = []
            action_verbs = r"^(?:Developed|Implemented|Designed|Built|Managed|Led|Created|Improved|Optimized|Oversaw|Delivered|Collaborated|Maintained|Automated|Integrated|Architected)\b"
            
            for s in sentences:
                s = s.strip()
                if not s: continue
                # Does it start with an action verb?
                if re.match(action_verbs, s, re.IGNORECASE):
                    # Does it lack numbers?
                    if not re.search(r'\d', s):
                        # Add snippet!
                        if len(s) > 15: # Avoid too short snippets
                            non_quantified_sentences.append(s)
            
            # Limit to top 3 to avoid overwhelming UI
            non_quantified_sentences = non_quantified_sentences[:3]

            msg = (
                "Quantify your achievements in experience descriptions. "
                "Use numbers: 'Improved API response time by 40%', "
                "'Managed a team of 5', 'Served 1000+ daily users'."
            )
            if non_quantified_sentences:
                msg = "Your CV needs more specific numbers. We've highlighted sentences that use strong action verbs but lack quantifiable metrics (numbers, percentages, or scale). Describe exactly what you achieved."

            suggestions.append({
                "category": "experience",
                "priority": "high" if non_quantified_sentences else "medium",
                "message": msg,
                "snippets": non_quantified_sentences
            })

        # ---- Keyword suggestions ----
        if context.keyword_score < 40:
            suggestions.append({
                "category": "content",
                "priority": "medium",
                "message": (
                    "Your CV lacks industry-standard keywords. Review job descriptions "
                    "for your target role and incorporate relevant terms naturally. "
                    "Keywords help both ATS systems and human reviewers."
                ),
                "snippets": []
            })

        # ---- Ensure minimum 3 suggestions ----
        if len(suggestions) < 3:
            default_suggestions = [
                {
                    "category": "formatting",
                    "priority": "low",
                    "message": (
                        "Use consistent formatting throughout: same font, "
                        "aligned dates, uniform bullet points, and clear section headers."
                    ),
                    "snippets": []
                },
                {
                    "category": "content",
                    "priority": "low",
                    "message": (
                        "Tailor your CV for each application. Adjust keywords and "
                        "highlight the most relevant experience for the specific role."
                    ),
                    "snippets": []
                },
                {
                    "category": "formatting",
                    "priority": "low",
                    "message": (
                        "Keep your CV to 1-2 pages. Remove outdated or irrelevant "
                        "information and focus on your most impactful experiences."
                    ),
                    "snippets": []
                },
            ]
            for default in default_suggestions:
                if len(suggestions) >= 3:
                    break
                # Avoid duplicates by category + rough message similarity
                if not any(s["category"] == default["category"] and
                          s["priority"] == default["priority"]
                          for s in suggestions):
                    suggestions.append(default)

        context.suggestions = suggestions

        logger.info(f"Generated {len(suggestions)} suggestions")
