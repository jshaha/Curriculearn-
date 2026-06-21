"""Simple script to start the API server with correct paths."""

import sys
from pathlib import Path

# Add all necessary paths
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'src'))
sys.path.insert(0, str(project_root / 'backend'))

# Now import and run the server
if __name__ == "__main__":
    from backend.api_server import app

    print("\n" + "="*70)
    print(" NeuroCompiler API Server")
    print(" Real Brain Simulation + Curriculum Optimization")
    print("="*70)
    print("\nEndpoints:")
    print("  GET  /health                  - Health check")
    print("  POST /api/upload              - Upload lesson file")
    print("  POST /api/analyze/<id>        - Analyze lesson")
    print("  POST /api/optimize/<id>       - Optimize lesson")
    print("  GET  /api/result/<id>         - Get optimization result")
    print("  GET  /api/download/<id>       - Download optimized lesson")
    print("  GET  /api/lessons             - List all lessons")
    print("\nStarting server on http://localhost:5000")
    print("="*70 + "\n")

    app.run(debug=True, port=5000, host='0.0.0.0')
