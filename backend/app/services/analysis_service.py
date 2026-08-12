"""
Analysis service - business logic for triggering CV analysis
and persisting results to the database.
"""

import logging
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.models.career_recommendation import CareerRecommendation
from app.models.suggestion import Suggestion
from app.models.extracted_skill import ExtractedSkill
from app.models.skill import Skill
from app.models.role_profile import RoleProfile
from app.analysis.engine import AnalysisEngine
from app.analysis.base_analyzer import AnalysisContext
from app.analysis.layout_xray import analyze_layout
from app.analysis.section_detector import SECTION_WEIGHTS
from app.services.recommendation_service import RecommendationService
from app.services.ai_service import (
    ai_enhance_analysis,
    ai_normalize_skills,
    is_ai_enabled,
    KNOWN_DOMAINS,
)

logger = logging.getLogger("cvision.services.analysis")


class AnalysisService:
    """Handles analysis business logic - triggering, persisting, and retrieving."""

    @staticmethod
    def _is_users_first_analysis(cv: CV, db: Session) -> bool:
        """True when this CV's owner has no analysis yet.

        Anonymous uploads have no owner and are never treated as a first
        analysis - the /try flow gates its own results and hands them over at
        signup, where the perk is applied to the claimed report instead.
        """
        if cv.user_id is None:
            return False

        return (
            db.query(AnalysisResult)
            .join(CV, CV.id == AnalysisResult.cv_id)
            .filter(CV.user_id == cv.user_id)
            .first()
            is None
        )

    @staticmethod
    def _load_skills(db: Session) -> list[dict[str, Any]]:
        """Load all skills from the database for the skill extractor."""
        skills = db.query(Skill).all()
        return [
            {"id": s.id, "name": s.name, "category": s.category}
            for s in skills
        ]

    @staticmethod
    def _load_role_profiles(db: Session, target_domain: str | None = None) -> list[dict]:
        """Load role profiles from the database for keyword scoring, optionally filtering by domain."""
        query = db.query(RoleProfile)
        
        if target_domain:
            query = query.filter(RoleProfile.domain == target_domain)
            
        profiles = query.all()
        
        # If no profiles match the target domain, fallback to all profiles to prevent engine crash
        if not profiles and target_domain:
            logger.warning(f"No role profiles found for domain '{target_domain}', falling back to all profiles")
            profiles = db.query(RoleProfile).all()
            
        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "domain": p.domain,
                "expected_keywords": p.expected_keywords or [],
                "expected_skills": p.expected_skills or [],
            }
            for p in profiles
        ]

    @staticmethod
    def run_analysis(cv: CV, db: Session, ui_language: str | None = None) -> AnalysisResult:
        """
        Run the full analysis pipeline on a CV and persist results.

        Args:
            cv: The CV model instance (must have extracted_text).
            db: Database session.
            ui_language: The language the user is viewing the site in
                (en/tr/de/fr/es); localizes the rule-based suggestions. None
                falls back to English.

        Returns:
            The created AnalysisResult record.

        Raises:
            ValueError: If the CV has no extracted text or is not in a valid state.
        """
        if not cv.extracted_text:
            raise ValueError(
                f"CV {cv.id} has no extracted text. "
                "Upload and text extraction must complete first."
            )

        if cv.status not in ("completed", "processing"):
            raise ValueError(
                f"CV {cv.id} is in '{cv.status}' state. "
                "Only CVs with 'completed' or 'processing' status can be analyzed."
            )

        # Check if analysis already exists
        existing = (
            db.query(AnalysisResult)
            .filter(AnalysisResult.cv_id == cv.id)
            .first()
        )
        if existing:
            # Delete existing analysis to allow re-analysis
            logger.info(f"Deleting existing analysis {existing.id} for CV {cv.id}")
            db.delete(existing)
            db.flush()

        # Load reference data
        skills_list = AnalysisService._load_skills(db)
        
        # Filter role profiles by the user's selected domain
        role_profiles = AnalysisService._load_role_profiles(db, cv.target_domain)

        logger.info(
            f"Running analysis for CV {cv.id} (Domain: {cv.target_domain}) "
            f"({len(skills_list)} skills, {len(role_profiles)} role profiles)"
        )

        # ATS X-Ray: layout-level analysis (PDF only). analyze_layout never
        # raises - on any failure it returns {"available": False}.
        if cv.file_type == "pdf":
            layout_xray = analyze_layout(Path(cv.file_path))
        else:
            layout_xray = {"available": False, "reason": "plain_text"}

        # Map the CV onto canonical English skill names before scoring. The
        # dictionary is English-only, so without this a Turkish CV scores ~20
        # points below its English twin - on the headline ATS score too, since
        # ScoreCalculator reads extracted_skills. Returns None when AI is
        # unavailable, and the engine then behaves exactly as before.
        ai_skills = ai_normalize_skills(
            cv.extracted_text, [s["name"] for s in skills_list]
        )

        # Run the analysis engine
        engine = AnalysisEngine(
            skills_list, role_profiles, cv.target_domain,
            ai_skills=ai_skills, language=ui_language,
        )
        context: AnalysisContext = engine.run(cv.extracted_text, layout_xray)

        # Computed before the row is added, because adding it first would make
        # the "does this user have any analysis yet" query answer itself. Still
        # needed for the invite reward below, which fires on a real analysis.
        is_first = AnalysisService._is_users_first_analysis(cv, db)

        # The report is open only if it was paid for. `is_first` used to unlock
        # it too - a welcome perk from the weekly-quota days - and that survived
        # the switch to credits, where it double-pays: signup already grants
        # exactly enough credits for one Pro analysis. So a new account chose
        # Normal, was charged 1 credit, and got the whole Pro report anyway,
        # which is every new user's first impression of what Normal includes.
        unlocked = bool(cv.unlock_requested)

        # Persist analysis result
        analysis = AnalysisResult(
            cv_id=cv.id,
            overall_score=context.overall_score,
            ats_score=context.ats_score,
            keyword_score=context.keyword_score,
            completeness_score=context.completeness_score,
            experience_score=context.experience_score,
            summary=context.summary,
            strengths=context.strengths,
            weaknesses=context.weaknesses,
            detected_sections=context.detected_sections,
            layout_xray=layout_xray,
            # A registered user's very first report is unlocked as a welcome
            # perk - it is the moment the product proves itself, and charging
            # for it costs more in conversion than the two credits are worth.
            #
            # Persisting it also fixes a bug in the rule it replaces. The old
            # gate computed "is this their first?" per request as
            # total_analyses == 1, so uploading a second CV silently re-locked
            # the first report: the user watched something they already had get
            # taken away.
            is_unlocked=unlocked,
        )
        db.add(analysis)
        db.flush()  # Get the analysis ID

        if is_first and cv.owner is not None:
            # The invite reward is paid here, on a real analysis, rather than at
            # signup - see ReferralService for why that is what makes the feature
            # safe without email verification.
            from app.services.referral_service import ReferralService

            ReferralService.reward_inviter(db, cv.owner)

        # Persist suggestions
        for sug_data in context.suggestions:
            suggestion = Suggestion(
                analysis_id=analysis.id,
                category=sug_data["category"],
                priority=sug_data["priority"],
                message=sug_data["message"],
                snippets=sug_data.get("snippets", []),
            )
            db.add(suggestion)

        # Persist extracted skills
        for skill_data in context.extracted_skills:
            extracted_skill = ExtractedSkill(
                analysis_id=analysis.id,
                skill_id=skill_data["skill_id"],
                confidence_score=skill_data["confidence_score"],
            )
            db.add(extracted_skill)
            
        # Commit the analysis and its relationships so the ORM populates .extracted_skills
        db.commit()
        db.refresh(analysis)

        # Generate and persist career recommendations
        RecommendationService.generate_recommendations(
            analysis=analysis,
            extracted_skills_list=context.extracted_skills,
            keyword_matches=context.keyword_matches,
            db=db,
            target_domain=cv.target_domain,
        )

        # FINAL COMMIT to save the generated recommendations
        db.commit()

        logger.info(
            f"Analysis {analysis.id} saved for CV {cv.id}: "
            f"score={analysis.overall_score}%, "
            f"{len(context.suggestions)} suggestions, "
            f"{len(context.extracted_skills)} skills"
        )

        # ---- AI Enhancement (runs after rule-based analysis is saved) ----
        if is_ai_enabled():
            logger.info(f"Starting AI enhancement for analysis {analysis.id}...")
            try:
                scores_dict = {
                    "overall_score": analysis.overall_score,
                    "ats_score": analysis.ats_score,
                    "keyword_score": analysis.keyword_score,
                    "completeness_score": analysis.completeness_score,
                    "experience_score": analysis.experience_score,
                }
                # Pass top role profiles for better AI context
                top_profiles = role_profiles[:5] if role_profiles else []
                
                rule_suggestions = context.suggestions[:6]
                
                ai_result = ai_enhance_analysis(
                    cv_text=cv.extracted_text,
                    rule_based_suggestions=rule_suggestions,
                    scores=scores_dict,
                    target_domain=cv.target_domain,
                    role_profiles=top_profiles,
                    # Ground GPT in the engine's verified findings.
                    extracted_skills=[
                        s["skill_name"] for s in context.extracted_skills
                    ],
                    # Only sections worth having. This list is handed to the
                    # model as "suggesting these is high-value", so an unweighted
                    # section here would have it recommend adding exactly the
                    # filler the completeness score just stopped paying for -
                    # "References: available upon request".
                    missing_sections=[
                        name for name, found in context.detected_sections.items()
                        if not found and name in SECTION_WEIGHTS
                    ],
                )
                
                if ai_result:
                    # Replace summary with AI-generated executive summary
                    if ai_result.get("executive_summary"):
                        analysis.ai_summary = ai_result["executive_summary"]
                        # Also update the main summary with AI version for display
                        analysis.summary = ai_result["executive_summary"]
                    
                    # Merge AI strengths and weaknesses (prefer AI's specific ones)
                    if ai_result.get("strengths"):
                        analysis.strengths = ai_result["strengths"]
                    if ai_result.get("weaknesses"):
                        analysis.weaknesses = ai_result["weaknesses"]
                    
                    # Store AI suggestions separately (they include rewrite_hint)
                    analysis.ai_suggestions = ai_result.get("ai_suggestions", [])
                    analysis.ai_enhanced = 1

                    db.commit()
                    logger.info(
                        f"AI enhancement complete for analysis {analysis.id}: "
                        f"{len(analysis.ai_suggestions)} AI suggestions stored"
                    )

                    # The "Other (AI auto-detect)" promise: when the user gave
                    # no real target domain, use the AI-detected field to
                    # regenerate career recommendations within that domain
                    # instead of matching against every profile in the system.
                    detected = (ai_result.get("detected_domain") or "").strip()

                    # Persist it whatever the user selected. It used to be read
                    # here and dropped, so the field that says what CVs really
                    # are was recomputed and discarded on every analysis - and
                    # the HQ chart was left plotting the dropdown default.
                    if detected in KNOWN_DOMAINS:
                        analysis.detected_domain = detected

                    if (
                        (not cv.target_domain or cv.target_domain == "Other")
                        and detected in KNOWN_DOMAINS
                    ):
                        logger.info(
                            f"AI detected domain '{detected}' for analysis "
                            f"{analysis.id}; regenerating recommendations."
                        )
                        db.query(CareerRecommendation).filter(
                            CareerRecommendation.analysis_id == analysis.id
                        ).delete(synchronize_session="fetch")
                        db.flush()
                        RecommendationService.generate_recommendations(
                            analysis=analysis,
                            extracted_skills_list=context.extracted_skills,
                            keyword_matches=context.keyword_matches,
                            db=db,
                            target_domain=detected,
                        )
                        db.commit()
                else:
                    logger.warning(f"AI returned no data for analysis {analysis.id}, keeping rule-based output")
                    
            except Exception as e:
                logger.error(f"AI enhancement failed for analysis {analysis.id}: {e}")
                # AI failure is non-fatal - analysis still has rule-based results
        else:
            logger.info("AI service not enabled, skipping enhancement")

        return analysis

    @staticmethod
    def get_analysis(cv_id: int, db: Session) -> AnalysisResult | None:
        """Get the analysis result for a specific CV."""
        return (
            db.query(AnalysisResult)
            .filter(AnalysisResult.cv_id == cv_id)
            .first()
        )
