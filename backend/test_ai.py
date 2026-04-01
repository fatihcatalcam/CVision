import json
import logging
import sys
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

from app.services.ai_service import ai_enhance_analysis
from app.config import settings

print('Key length:', len(settings.OPENAI_API_KEY) if getattr(settings, 'OPENAI_API_KEY', None) else 0)

dummy_cv = 'Software Engineer with 5 years experience in React and Python.'
dummy_sugg = [{'message': 'Add more numbers'}]
scores = {'overall_score': 50, 'ats_score': 60, 'keyword_score': 40, 'completeness_score': 70, 'experience_score': 30}

print('Calling AI...')
result = ai_enhance_analysis(dummy_cv, dummy_sugg, scores)
print('AI Result:', result)
