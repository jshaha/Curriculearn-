"""
NeuroCompiler REST API Server

Exposes backend optimization pipeline as REST API for frontend.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import json
import tempfile
import uuid
from pathlib import Path
from datetime import datetime

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

# Add paths
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))  # For src.* imports
sys.path.insert(0, str(project_root / 'backend'))  # For neurocompiler.* imports

from neurocompiler.schemas import StructuredLesson, LessonSegment
from neurocompiler.agents import EducationalDiagnostician, CurriculumEditor, LessonOptimizer, VisualizationGenerator

# Import from src directory
import src.agents.curriculum_parser as parser_module
import src.adapters.brain_simulator_adapter as adapter_module

CurriculumParser = parser_module.CurriculumParser
BrainSimulatorAdapter = adapter_module.BrainSimulatorAdapter

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Global storage for lessons and results (in production, use a database)
lessons_db = {}
results_db = {}

# Initialize agents on startup (reuse for all requests)
print("Initializing NeuroCompiler agents...")
simulator = BrainSimulatorAdapter()

# Use Claude-powered agents if enabled via environment variable
use_claude_agents = os.getenv("USE_CLAUDE_AGENTS", "false").lower() == "true"

if use_claude_agents:
    try:
        from neurocompiler.agents.claude import ClaudeDiagnostician, ClaudeCurriculumEditor
        diagnostician = ClaudeDiagnostician()
        editor = ClaudeCurriculumEditor()
        if diagnostician.is_available:
            print("✓ Using Claude-powered agents (API key found)")
        else:
            print("⚠ Claude agents enabled but no API key - will fall back to deterministic")
    except ImportError as e:
        print(f"⚠ Could not import Claude agents: {e}")
        print("  Falling back to deterministic agents")
        diagnostician = EducationalDiagnostician()
        editor = CurriculumEditor()
else:
    diagnostician = EducationalDiagnostician()
    editor = CurriculumEditor()
    print("✓ Using deterministic agents")

optimizer = LessonOptimizer(diagnostician=diagnostician, editor=editor)
visualizer = VisualizationGenerator(model_provider="gemini")  # Uses placeholders if no API key
parser = CurriculumParser()
print("✓ Agents initialized")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "NeuroCompiler API is running"})


@app.route('/api/upload', methods=['POST'])
def upload_lesson():
    """
    Upload a lesson file for analysis.

    Accepts: PDF, PPTX, DOCX, TXT files
    Returns: lesson_id for tracking
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    # Generate unique lesson ID
    lesson_id = str(uuid.uuid4())

    # Save file temporarily
    temp_dir = Path(tempfile.gettempdir()) / "neurocompiler"
    temp_dir.mkdir(exist_ok=True)

    file_path = temp_dir / f"{lesson_id}_{file.filename}"
    file.save(str(file_path))

    try:
        # Parse the file
        print(f"Parsing file: {file.filename}")
        parsed = parser.parse(str(file_path))

        # Convert to StructuredLesson
        segments = []
        for i, text in enumerate(parsed['sections']):
            segments.append(LessonSegment(
                id=f"segment_{i+1}",
                title=f"Section {i+1}",
                content=text,
                concepts=[],
                modality="text"
            ))

        lesson = StructuredLesson(
            id=lesson_id,
            title=parsed['metadata']['filename'],
            learning_goals=[],
            segments=segments
        )

        # Store in database
        lessons_db[lesson_id] = {
            "lesson": lesson,
            "filename": file.filename,
            "uploaded_at": datetime.now().isoformat(),
            "status": "uploaded"
        }

        return jsonify({
            "lesson_id": lesson_id,
            "title": lesson.title,
            "segments_count": len(lesson.segments),
            "message": "File uploaded and parsed successfully"
        })

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up temp file
        if file_path.exists():
            file_path.unlink()


@app.route('/api/analyze/<lesson_id>', methods=['POST'])
def analyze_lesson(lesson_id):
    """
    Run brain simulation and metric analysis on a lesson.

    Optional body params:
    - objectives: list of optimization goals
    """
    if lesson_id not in lessons_db:
        return jsonify({"error": "Lesson not found"}), 404

    lesson = lessons_db[lesson_id]["lesson"]

    try:
        print(f"Analyzing lesson: {lesson.title}")

        # Run brain simulation
        metric_report = simulator.simulate(lesson)
        print(f"Brain simulation complete")

        # Store analysis results
        lessons_db[lesson_id]["status"] = "analyzed"
        lessons_db[lesson_id]["metrics"] = {
            "learning_score": metric_report.learning_score,
            "engagement": metric_report.global_metrics.engagement,
            "cognitive_load": metric_report.global_metrics.cognitive_load,
            "concept_flow": metric_report.global_metrics.concept_flow,
            "retention": metric_report.global_metrics.retention,
            "novelty": metric_report.global_metrics.novelty,
            "information_density": metric_report.global_metrics.information_density,
            "reinforcement": metric_report.global_metrics.reinforcement,
            "multimodal_support": metric_report.global_metrics.multimodal_support
        }
        print(f"Metrics stored")

        # Run diagnostics
        print(f"Running diagnostics...")
        diagnosis_report = diagnostician.diagnose(lesson, metric_report)
        print(f"Diagnostics complete: {len(diagnosis_report.diagnoses)} issues found")

        # Store diagnoses
        diagnoses = []
        for diag in diagnosis_report.diagnoses:
            diagnoses.append({
                "id": diag.id,
                "segment_id": diag.segment_id,
                "issue_type": diag.issue_type,
                "severity": diag.severity,
                "explanation": diag.explanation,
                "recommended_actions": diag.recommended_actions,
                "priority": diag.priority
            })

        lessons_db[lesson_id]["diagnoses"] = diagnoses

        return jsonify({
            "lesson_id": lesson_id,
            "metrics": lessons_db[lesson_id]["metrics"],
            "issues": diagnoses,
            "message": "Analysis complete"
        })

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/optimize/<lesson_id>', methods=['POST'])
def optimize_lesson(lesson_id):
    """
    Run optimization loop to generate improved lesson.

    Optional body params:
    - max_iterations: int (default: 2)
    - max_candidates: int (default: 3)
    """
    if lesson_id not in lessons_db:
        return jsonify({"error": "Lesson not found"}), 404

    lesson = lessons_db[lesson_id]["lesson"]
    body = request.get_json() or {}

    max_iterations = body.get('max_iterations', 2)
    max_candidates = body.get('max_candidates', 3)

    try:
        print(f"Optimizing lesson: {lesson.title}")
        print(f"Max iterations: {max_iterations}, Max candidates: {max_candidates}")

        # Run optimization
        result = optimizer.optimize(
            lesson=lesson,
            simulator=simulator,
            max_iterations=max_iterations,
            max_candidates=max_candidates
        )

        # Store result
        result_id = str(uuid.uuid4())
        results_db[result_id] = {
            "lesson_id": lesson_id,
            "result": result,
            "created_at": datetime.now().isoformat()
        }

        # Update lesson status
        lessons_db[lesson_id]["status"] = "optimized"
        lessons_db[lesson_id]["result_id"] = result_id

        return jsonify({
            "result_id": result_id,
            "lesson_id": lesson_id,
            "original_score": result.original_score,
            "optimized_score": result.best_score,
            "improvement": result.best_score - result.original_score,
            "iterations": result.iterations,
            "message": "Optimization complete"
        })

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/visualize/<lesson_id>', methods=['POST'])
def generate_visualizations(lesson_id):
    """
    Generate AI visualizations for lesson segments.

    Optional body params:
    - segment_ids: list of specific segment IDs (None = all)
    - max_per_segment: int (default: 1)
    """
    if lesson_id not in lessons_db:
        return jsonify({"error": "Lesson not found"}), 404

    lesson = lessons_db[lesson_id]["lesson"]
    body = request.get_json() or {}

    segment_ids = body.get('segment_ids', None)
    max_per_segment = body.get('max_per_segment', 1)

    try:
        print(f"Generating visualizations for: {lesson.title}")

        # Generate visualizations
        visualizations = visualizer.generate_visualizations(
            lesson,
            target_segments=segment_ids,
            max_visuals_per_segment=max_per_segment
        )

        # Store visualizations
        lessons_db[lesson_id]["visualizations"] = visualizations

        # Convert to JSON-serializable format
        result = {}
        for seg_id, visuals in visualizations.items():
            result[seg_id] = [
                {
                    "id": v.id,
                    "segment_id": v.segment_id,
                    "type": v.type.value,
                    "image_data": v.image_data,
                    "alt_text": v.alt_text,
                    "prompt": v.prompt
                }
                for v in visuals
            ]

        return jsonify({
            "lesson_id": lesson_id,
            "visualizations": result,
            "total_visuals": sum(len(v) for v in visualizations.values()),
            "message": "Visualizations generated successfully"
        })

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/result/<result_id>', methods=['GET'])
def get_result(result_id):
    """Get optimization result details."""
    if result_id not in results_db:
        return jsonify({"error": "Result not found"}), 404

    stored = results_db[result_id]
    result = stored["result"]

    return jsonify({
        "result_id": result_id,
        "original_score": result.original_score,
        "optimized_score": result.best_score,
        "improvement": result.best_score - result.original_score,
        "iterations": result.iterations,
        "original_lesson": {
            "title": result.original_lesson.title,
            "segments": [
                {
                    "id": seg.id,
                    "title": seg.title,
                    "content": seg.content,
                    "concepts": seg.concepts
                }
                for seg in result.original_lesson.segments
            ]
        },
        "optimized_lesson": {
            "title": result.best_lesson.title,
            "segments": [
                {
                    "id": seg.id,
                    "title": seg.title,
                    "content": seg.content,
                    "concepts": seg.concepts
                }
                for seg in result.best_lesson.segments
            ]
        }
    })


@app.route('/api/download/<result_id>', methods=['GET'])
def download_result(result_id):
    """Download optimized lesson as JSON."""
    if result_id not in results_db:
        return jsonify({"error": "Result not found"}), 404

    stored = results_db[result_id]
    result = stored["result"]

    # Create downloadable JSON
    output = {
        "title": result.best_lesson.title,
        "learning_score": result.best_score,
        "improvement": result.best_score - result.original_score,
        "segments": [
            {
                "title": seg.title,
                "content": seg.content,
                "concepts": seg.concepts
            }
            for seg in result.best_lesson.segments
        ]
    }

    # Save to temp file
    temp_file = Path(tempfile.gettempdir()) / f"{result_id}.json"
    with open(temp_file, 'w') as f:
        json.dump(output, f, indent=2)

    return send_file(
        temp_file,
        as_attachment=True,
        download_name="optimized_lesson.json",
        mimetype='application/json'
    )


@app.route('/api/lessons', methods=['GET'])
def list_lessons():
    """List all uploaded lessons."""
    lessons = []
    for lesson_id, data in lessons_db.items():
        lessons.append({
            "lesson_id": lesson_id,
            "title": data["lesson"].title,
            "filename": data["filename"],
            "uploaded_at": data["uploaded_at"],
            "status": data["status"],
            "segments_count": len(data["lesson"].segments)
        })

    return jsonify({"lessons": lessons})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"

    print("\n" + "="*70)
    print(" NeuroCompiler API Server")
    print(" Real Brain Simulation + Curriculum Optimization")
    print("="*70)
    print("\nEndpoints:")
    print("  GET  /health                  - Health check")
    print("  POST /api/upload              - Upload lesson file")
    print("  POST /api/analyze/<id>        - Analyze lesson")
    print("  POST /api/optimize/<id>       - Optimize lesson")
    print("  POST /api/visualize/<id>      - Generate AI visualizations")
    print("  GET  /api/result/<id>         - Get optimization result")
    print("  GET  /api/download/<id>       - Download optimized lesson")
    print("  GET  /api/lessons             - List all lessons")
    print(f"\nStarting server on http://0.0.0.0:{port}")
    print("="*70 + "\n")

    app.run(debug=debug, port=port, host='0.0.0.0')
