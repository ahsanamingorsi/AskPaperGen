#!/usr/bin/env python3
"""Compatibility entry point. Requires Node.js; run before every deploy."""
import pathlib
import subprocess
subprocess.run(['node', str(pathlib.Path(__file__).with_suffix('.mjs'))], check=True)
