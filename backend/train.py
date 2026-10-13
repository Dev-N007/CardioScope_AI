"""
CardioScope AI - CLI Training Entry Point
Multimodal AI Hackathon 2026 - Track A
"""
import sys
import os

# Delegate to full training pipeline
backend_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(backend_dir, "scripts")
sys.path.insert(0, scripts_dir)

from train_pipeline import main

if __name__ == "__main__":
    print("[CardioScope AI] Launching training pipeline...")
    main()
