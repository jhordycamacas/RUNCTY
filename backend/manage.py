#!/usr/bin/env python
import os
import sys
from pathlib import Path

import environ
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    # Local convenience only: containers receive their environment from the platform.
    # Variables already set in the shell win over the file.
    environ.Env.read_env(Path(__file__).resolve().parent / ".env")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    execute_from_command_line(sys.argv)
