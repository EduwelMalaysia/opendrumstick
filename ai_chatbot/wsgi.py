import os
from django.core.wsgi import get_wsgi_application

# ⚠️ REPLACE 'chatbot' with the EXACT name of the folder containing settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_chatbot.settings')

application = get_wsgi_application()