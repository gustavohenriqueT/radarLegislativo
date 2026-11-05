import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from radar.api import app

__all__ = ["app"]