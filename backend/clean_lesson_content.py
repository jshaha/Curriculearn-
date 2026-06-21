"""
Clean up lesson content by removing PDF artifacts and metadata.
"""

import json
import re
from pathlib import Path


def clean_content(text: str) -> str:
    """Remove PDF parsing artifacts and clean up text."""

    # Remove file paths (both file:/// and regular paths)
    text = re.sub(r'file:///[^\s]+', '', text)
    text = re.sub(r'/Users/[^\s]+\.html\s*\d*/\d*', '', text)

    # Remove page numbers like "1/18", "2/18", etc.
    text = re.sub(r'\s+\d+/\d+\s*$', '', text)

    # Remove timestamps like "6/20/26, 3:49 PM"
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4},\s+\d{1,2}:\d{2}\s+[AP]M', '', text)

    # Remove "Introduction to Photosynthesis - Lesson Plan" repetitions
    text = re.sub(r'Introduction to Photosynthesis - Lesson Plan\s*', '', text)

    # Remove slide numbers at start like "Slide 1", "Slide 2"
    text = re.sub(r'^Slide \d+\s+', '', text, flags=re.MULTILINE)

    # Add paragraph breaks before common markers
    # Add breaks before "Course:", "Duration:", "Topic:", "Learning Objectives:", etc.
    text = re.sub(r'(Course:|Duration:|Topic:|Learning Objectives?:)', r'\n\n\1', text)

    # Add breaks before numbered/bulleted lists
    text = re.sub(r'(\d+\.|\•|\-)\s+', r'\n\n\1 ', text)

    # Clean up multiple spaces
    text = re.sub(r' +', ' ', text)

    # Clean up multiple newlines (max 2)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Strip leading/trailing whitespace
    text = text.strip()

    return text


def clean_lesson_json(input_path: Path, output_path: Path = None):
    """Clean all content in a lesson JSON file."""

    with open(input_path, 'r') as f:
        data = json.load(f)

    # Clean all segment contents
    for segment in data.get('segments', []):
        if 'content' in segment:
            segment['content'] = clean_content(segment['content'])

    # Clean title
    title = data.get('title', '')
    # Remove UUID prefix
    if '_' in title:
        parts = title.split('_', 1)
        if len(parts[0]) > 30:  # Likely a UUID
            title = parts[1]

    # Remove .pdf extension and clean up
    title = title.replace('.pdf', '').replace('-', ' ').strip()
    data['title'] = title

    # Determine output path
    if output_path is None:
        output_path = input_path.parent / (input_path.stem + '_clean.json')

    # Write cleaned JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✓ Cleaned lesson saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python clean_lesson_content.py <lesson.json> [output.json]")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    if not input_path.exists():
        print(f"Error: File not found: {input_path}")
        sys.exit(1)

    clean_lesson_json(input_path, output_path)
