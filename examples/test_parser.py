"""
Test the curriculum parser with different formats
"""

import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from agents import CurriculumParser


def test_text_parsing():
    """Test parsing plain text"""
    print("\n" + "="*60)
    print("TEST 1: Plain Text File")
    print("="*60)

    parser = CurriculumParser()

    # Test with sample lesson
    test_file = Path(__file__).parent.parent / "test_files" / "sample_lesson.txt"
    lesson = parser.parse(str(test_file))
    print(parser.get_preview(lesson, max_sections=3))

    print(f"✓ Successfully parsed {len(lesson['sections'])} segments")


def test_raw_text_parsing():
    """Test parsing raw text (like transcripts)"""
    print("\n" + "="*60)
    print("TEST 2: Raw Text (Transcript)")
    print("="*60)

    parser = CurriculumParser()

    transcript = """
    Welcome to today's lecture on machine learning.

    Machine learning is a subset of artificial intelligence that enables
    computers to learn from data without being explicitly programmed.

    There are three main types of machine learning: supervised learning,
    unsupervised learning, and reinforcement learning.

    Let's start with supervised learning. In supervised learning, we train
    a model using labeled data. For example, we might have images of cats
    and dogs, each labeled correctly.

    The model learns patterns from these examples and can then classify
    new images it hasn't seen before.
    """

    lesson = parser.parse_text(transcript, segment_by='paragraph')
    print(parser.get_preview(lesson, max_sections=3))

    print(f"✓ Successfully parsed {len(lesson['sections'])} segments")


def test_format_support():
    """Test which formats are supported"""
    print("\n" + "="*60)
    print("TEST 3: Supported Formats")
    print("="*60)

    parser = CurriculumParser()

    print(f"\nSupported file formats:")
    for fmt in parser.supported_formats:
        print(f"  ✓ {fmt}")

    print("\nYou can parse:")
    print("  - PDF lesson plans (.pdf)")
    print("  - PowerPoint presentations (.pptx)")
    print("  - Word documents (.docx)")
    print("  - Plain text files (.txt)")
    print("  - Raw text (transcripts, pasted content)")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("CURRICULUM PARSER - TEST SUITE")
    print("="*60)

    try:
        test_text_parsing()
        test_raw_text_parsing()
        test_format_support()

        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)

        print("\nAgent 1 (Curriculum Parser) is ready!")
        print("\nNext steps:")
        print("  1. Upload your own lesson files (.txt, .pdf, .pptx)")
        print("  2. Parser extracts structured content")
        print("  3. Agent 2 generates brain states")
        print("  4. Agent 3 computes educational metrics")
        print("  5. Agent 4-6 optimize the lesson (your friend's part)")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise


if __name__ == "__main__":
    main()
