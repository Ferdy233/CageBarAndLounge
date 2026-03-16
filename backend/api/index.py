import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cage_bar_.settings")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
application = app
