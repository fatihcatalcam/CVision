import sys
import traceback
sys.path.insert(0, '.')

try:
    from app.config import settings
    print(f"DB URL: {settings.DATABASE_URL[:50]}")
    
    from app.database import engine, Base
    
    # Import all models
    from app.models.user import User
    from app.models.cv import CV
    from app.models.analysis import AnalysisResult
    from app.models.suggestion import Suggestion
    from app.models.skill import Skill
    from app.models.extracted_skill import ExtractedSkill
    from app.models.role_profile import RoleProfile
    from app.models.career_recommendation import CareerRecommendation
    
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: All tables created in PostgreSQL!")

except Exception as e:
    traceback.print_exc()
    print(f"\nERROR: {e}")
