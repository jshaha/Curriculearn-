"""Tool definitions for ClaudeCurriculumEditor."""

EDITOR_TOOLS = [
    {
        "name": "get_diagnosis_details",
        "description": "Get full details about a diagnosis including the issue type, severity, explanation, and recommended actions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "diagnosis_id": {
                    "type": "string",
                    "description": "The ID of the diagnosis to retrieve"
                }
            },
            "required": ["diagnosis_id"]
        }
    },
    {
        "name": "get_segment_content",
        "description": "Get the full content of a segment including its title, content text, concepts, and modality.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to retrieve"
                }
            },
            "required": ["segment_id"]
        }
    },
    {
        "name": "get_lesson_context",
        "description": "Get the lesson's metadata including title, learning goals, target audience, and list of all segments.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "create_split_section_edit",
        "description": "Split a dense segment into two parts: an intuition/overview segment and a detail segment. Use this for cognitive_overload issues.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to split"
                },
                "first_segment_title": {
                    "type": "string",
                    "description": "Title for the first (intuition) segment"
                },
                "first_segment_content": {
                    "type": "string",
                    "description": "REAL educational content for the first segment focusing on the big picture. Must be substantive content about the subject matter, NOT a template or placeholder. Example: 'Photosynthesis is how plants make their own food using sunlight - think of it as nature's solar power system.'"
                },
                "first_segment_concepts": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Concepts covered in the first segment"
                },
                "second_segment_title": {
                    "type": "string",
                    "description": "Title for the second (detail) segment"
                },
                "second_segment_content": {
                    "type": "string",
                    "description": "REAL educational content for the second segment with detailed explanation. Must include actual facts, processes, or mechanisms from the subject. Example: 'Inside chloroplasts, light reactions in thylakoids split water molecules, releasing oxygen and generating ATP energy carriers.'"
                },
                "second_segment_concepts": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Concepts covered in the second segment"
                },
                "rationale": {
                    "type": "string",
                    "description": "Specific explanation of why this split helps. Reference the actual content and cognitive issue. Example: 'Splitting the dense chloroplast segment reduces cognitive load from 87 to ~60 by separating high-level understanding (solar panels analogy) from biochemical details (thylakoids, ATP synthesis).'"
                }
            },
            "required": ["target_segment_id", "first_segment_title", "first_segment_content", "first_segment_concepts", "second_segment_title", "second_segment_content", "second_segment_concepts", "rationale"]
        }
    },
    {
        "name": "create_insert_segment_edit",
        "description": "Insert a new segment (analogy, example, transition, or question) after a target segment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to insert after"
                },
                "insert_type": {
                    "type": "string",
                    "enum": ["analogy", "example", "transition", "retrieval_question", "recap"],
                    "description": "The type of segment to insert"
                },
                "new_segment_title": {
                    "type": "string",
                    "description": "Title for the new segment"
                },
                "new_segment_content": {
                    "type": "string",
                    "description": "SUBSTANTIVE educational content tailored to the insert_type. ANALOGY: compare to familiar domain with explicit parallels. EXAMPLE: concrete scenario with real numbers/facts. TRANSITION: explicit connections between concepts. QUESTION: test understanding with context. RECAP: summarize key ideas with reinforcement. NO TEMPLATES OR PLACEHOLDERS."
                },
                "new_segment_concepts": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Concepts this segment reinforces or introduces"
                },
                "rationale": {
                    "type": "string",
                    "description": "Why this insertion improves learning"
                }
            },
            "required": ["target_segment_id", "insert_type", "new_segment_title", "new_segment_content", "new_segment_concepts", "rationale"]
        }
    },
    {
        "name": "create_modify_segment_edit",
        "description": "Modify an existing segment's content to simplify or improve it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_segment_id": {
                    "type": "string",
                    "description": "The ID of the segment to modify"
                },
                "new_content": {
                    "type": "string",
                    "description": "The improved content for the segment"
                },
                "rationale": {
                    "type": "string",
                    "description": "Why this modification improves learning"
                }
            },
            "required": ["target_segment_id", "new_content", "rationale"]
        }
    },
    {
        "name": "finalize_candidate",
        "description": "Complete the current edit candidate. Call this after creating all edits for one candidate.",
        "input_schema": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Brief summary of what this candidate improves"
                }
            },
            "required": ["summary"]
        }
    }
]
