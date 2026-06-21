"""Tool definitions for ClaudeDiagnostician."""

DIAGNOSTICIAN_TOOLS = [
    {
        "name": "get_segment_metrics",
        "description": "Retrieve the metric scores for a specific segment. Use this to examine cognitive load, concept flow, retention, and other metrics for a segment you want to analyze.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to get metrics for"
                }
            },
            "required": ["segment_id"]
        }
    },
    {
        "name": "get_segment_content",
        "description": "Retrieve the content and concepts for a specific segment. Use this to understand what the segment teaches and how it's structured.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to get content for"
                }
            },
            "required": ["segment_id"]
        }
    },
    {
        "name": "get_adjacent_segments",
        "description": "Get the previous and next segments relative to a given segment. Use this to analyze concept flow and transitions between segments.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to find neighbors for"
                }
            },
            "required": ["segment_id"]
        }
    },
    {
        "name": "record_diagnosis",
        "description": "Record an identified educational issue in a segment. Call this for each issue you identify.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment_id": {
                    "type": "string",
                    "description": "The ID of the segment with the issue"
                },
                "issue_type": {
                    "type": "string",
                    "enum": ["cognitive_overload", "poor_concept_flow", "low_retention", "low_multimodal_support", "novelty_spike"],
                    "description": "The type of educational issue"
                },
                "severity": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "How severe the issue is"
                },
                "explanation": {
                    "type": "string",
                    "description": "A contextual explanation of why this is a problem, referencing the specific content"
                },
                "metric_evidence": {
                    "type": "object",
                    "description": "The metric values that support this diagnosis (e.g., {'cognitive_load': 85})",
                    "additionalProperties": {"type": "number"}
                },
                "recommended_actions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific actions to address this issue, tailored to the content"
                }
            },
            "required": ["segment_id", "issue_type", "severity", "explanation", "metric_evidence", "recommended_actions"]
        }
    },
    {
        "name": "finalize_diagnosis_report",
        "description": "Complete the diagnosis process and generate the final report. Call this once you have recorded all diagnoses.",
        "input_schema": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Brief summary of the overall lesson health and key issues found"
                }
            },
            "required": ["summary"]
        }
    }
]
