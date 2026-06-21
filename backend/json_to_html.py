"""
Convert optimized lesson JSON to beautiful HTML presentation.
Matches the NeuroCompiler frontend aesthetic.
"""

import json
import sys
from pathlib import Path
from datetime import datetime


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - NeuroCompiler</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Newsreader:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {{
            --color-space: #0A0E1A;
            --color-space-light: #1A1F2E;
            --color-cyan: #00F0FF;
            --color-cyan-dim: rgba(0, 240, 255, 0.1);
            --color-magenta: #FF006E;
            --color-success: #00FF88;
            --color-warning: #FFB800;
            --color-text: #E8EDF4;
            --color-text-dim: #8A95A8;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'DM Sans', sans-serif;
            background: var(--color-space);
            color: var(--color-text);
            line-height: 1.6;
            padding: 40px 20px;
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}

        header {{
            text-align: center;
            margin-bottom: 60px;
            padding-bottom: 40px;
            border-bottom: 1px solid var(--color-cyan-dim);
        }}

        h1 {{
            font-family: 'Newsreader', serif;
            font-size: 3rem;
            font-weight: 600;
            margin-bottom: 20px;
            background: linear-gradient(135deg, var(--color-cyan), var(--color-magenta));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}

        .meta {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.9rem;
            color: var(--color-text-dim);
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
        }}

        .metric-badge {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: var(--color-space-light);
            border-radius: 20px;
            border: 1px solid var(--color-cyan-dim);
        }}

        .metric-value {{
            font-weight: 600;
            color: var(--color-cyan);
            font-size: 1.2rem;
        }}

        .improvement {{
            color: var(--color-success);
        }}

        .segment {{
            background: var(--color-space-light);
            border: 1px solid var(--color-cyan-dim);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            transition: all 0.3s ease;
        }}

        .segment:hover {{
            border-color: var(--color-cyan);
            box-shadow: 0 0 20px var(--color-cyan-dim);
        }}

        .segment-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--color-cyan-dim);
        }}

        .segment-title {{
            font-family: 'Newsreader', serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--color-cyan);
        }}

        .segment-id {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.75rem;
            color: var(--color-text-dim);
            background: var(--color-space);
            padding: 4px 12px;
            border-radius: 12px;
        }}

        .segment-content {{
            font-size: 1.05rem;
            line-height: 1.8;
            margin-bottom: 20px;
            white-space: pre-wrap;
        }}

        .concepts {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 20px;
        }}

        .concept-tag {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.8rem;
            padding: 6px 12px;
            background: var(--color-cyan-dim);
            color: var(--color-cyan);
            border-radius: 6px;
            border: 1px solid var(--color-cyan);
        }}

        footer {{
            text-align: center;
            margin-top: 80px;
            padding-top: 40px;
            border-top: 1px solid var(--color-cyan-dim);
            color: var(--color-text-dim);
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.85rem;
        }}

        .watermark {{
            margin-top: 20px;
            opacity: 0.6;
        }}

        @media (max-width: 768px) {{
            h1 {{
                font-size: 2rem;
            }}

            .meta {{
                flex-direction: column;
                gap: 15px;
            }}

            .segment {{
                padding: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>{title}</h1>
            <div class="meta">
                <div class="metric-badge">
                    <span>Learning Score</span>
                    <span class="metric-value">{learning_score}/100</span>
                </div>
                {improvement_badge}
                <div class="metric-badge">
                    <span>Segments</span>
                    <span class="metric-value">{segment_count}</span>
                </div>
            </div>
        </header>

        <main>
            {segments_html}
        </main>

        <footer>
            <p>Generated by NeuroCompiler</p>
            <p class="watermark">Optimized with brain-based learning metrics • {timestamp}</p>
        </footer>
    </div>
</body>
</html>
"""


SEGMENT_TEMPLATE = """
<div class="segment">
    <div class="segment-header">
        <h2 class="segment-title">{title}</h2>
        <span class="segment-id">{segment_id}</span>
    </div>
    <div class="segment-content">{content}</div>
    {concepts_html}
</div>
"""


def convert_json_to_html(json_path: Path, output_path: Path = None):
    """Convert optimized lesson JSON to HTML."""

    # Read JSON
    with open(json_path, 'r') as f:
        data = json.load(f)

    # Extract data
    title = data.get('title', 'Optimized Lesson')
    learning_score = round(data.get('learning_score', 0))
    improvement = data.get('improvement', 0)
    segments = data.get('segments', [])

    # Build improvement badge
    if improvement > 0:
        improvement_badge = f"""
        <div class="metric-badge improvement">
            <span>Improvement</span>
            <span class="metric-value">+{round(improvement)} points</span>
        </div>
        """
    else:
        improvement_badge = ""

    # Build segments HTML
    segments_html_parts = []
    for i, segment in enumerate(segments, 1):
        seg_title = segment.get('title', f'Segment {i}')
        seg_content = segment.get('content', '')
        seg_concepts = segment.get('concepts', [])

        # Build concepts HTML
        if seg_concepts:
            concepts_tags = ''.join([
                f'<span class="concept-tag">{concept}</span>'
                for concept in seg_concepts
            ])
            concepts_html = f'<div class="concepts">{concepts_tags}</div>'
        else:
            concepts_html = ''

        # Build segment HTML
        segment_html = SEGMENT_TEMPLATE.format(
            title=seg_title,
            segment_id=f"segment_{i}",
            content=seg_content,
            concepts_html=concepts_html
        )
        segments_html_parts.append(segment_html)

    segments_html = '\n'.join(segments_html_parts)

    # Build final HTML
    html = HTML_TEMPLATE.format(
        title=title,
        learning_score=learning_score,
        improvement_badge=improvement_badge,
        segment_count=len(segments),
        segments_html=segments_html,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

    # Determine output path
    if output_path is None:
        output_path = json_path.with_suffix('.html')

    # Write HTML
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✓ HTML generated: {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python json_to_html.py <path_to_json> [output_path.html]")
        print("\nExample:")
        print("  python json_to_html.py optimized_lesson.json")
        print("  python json_to_html.py optimized_lesson.json output.html")
        sys.exit(1)

    json_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    if not json_path.exists():
        print(f"Error: File not found: {json_path}")
        sys.exit(1)

    convert_json_to_html(json_path, output_path)
    print(f"\nOpen in browser:")
    print(f"  open {output_path or json_path.with_suffix('.html')}")
