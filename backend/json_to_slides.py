"""
Convert optimized lesson JSON to slide-based HTML presentation.
Premium presentation viewer with smooth transitions and navigation.
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
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&family=Newsreader:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        :root {{
            --color-space: #0A0E1A;
            --color-space-light: #1A1F2E;
            --color-space-lighter: #252B3D;
            --color-cyan: #00F0FF;
            --color-cyan-dim: rgba(0, 240, 255, 0.15);
            --color-cyan-glow: rgba(0, 240, 255, 0.3);
            --color-magenta: #FF006E;
            --color-magenta-dim: rgba(255, 0, 110, 0.15);
            --color-success: #00FF88;
            --color-warning: #FFB800;
            --color-text: #E8EDF4;
            --color-text-dim: #8A95A8;
            --color-text-dimmer: #5A6578;
        }}

        body {{
            font-family: 'DM Sans', sans-serif;
            background: var(--color-space);
            color: var(--color-text);
            overflow: hidden;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }}

        /* Neural background */
        .neural-bg {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background:
                radial-gradient(circle at 20% 30%, rgba(0, 240, 255, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(255, 0, 110, 0.03) 0%, transparent 50%);
            z-index: 0;
            pointer-events: none;
        }}

        .neural-bg::before {{
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(0, 240, 255, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.02) 1px, transparent 1px);
            background-size: 100px 100px;
            animation: grid-drift 20s linear infinite;
        }}

        @keyframes grid-drift {{
            0% {{ transform: translate(0, 0); }}
            100% {{ transform: translate(100px, 100px); }}
        }}

        /* Slide container */
        .presentation-container {{
            position: relative;
            z-index: 1;
            width: 90vw;
            max-width: 1400px;
            height: 85vh;
            max-height: 900px;
            perspective: 2000px;
        }}

        .slide-viewport {{
            position: relative;
            width: 100%;
            height: 100%;
            background: var(--color-space-light);
            border: 1px solid var(--color-cyan-dim);
            border-radius: 16px;
            overflow: hidden;
            box-shadow:
                0 0 60px rgba(0, 240, 255, 0.1),
                0 30px 80px rgba(0, 0, 0, 0.5);
        }}

        .slide {{
            position: absolute;
            inset: 0;
            padding: 80px 100px;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateX(100%) scale(0.95);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        }}

        .slide.active {{
            opacity: 1;
            transform: translateX(0) scale(1);
            pointer-events: auto;
        }}

        .slide.prev {{
            transform: translateX(-100%) scale(0.95);
        }}

        /* Title slide */
        .slide-title {{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap: 40px;
        }}

        .lesson-title {{
            font-family: 'Newsreader', serif;
            font-size: 4rem;
            font-weight: 300;
            line-height: 1.2;
            background: linear-gradient(135deg, var(--color-cyan) 0%, var(--color-magenta) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            max-width: 900px;
            animation: title-entrance 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
        }}

        @keyframes title-entrance {{
            0% {{
                opacity: 0;
                transform: translateY(30px);
                filter: blur(10px);
            }}
            100% {{
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }}
        }}

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            max-width: 800px;
            animation: metrics-entrance 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;
        }}

        @keyframes metrics-entrance {{
            0% {{
                opacity: 0;
                transform: translateY(20px);
            }}
            100% {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}

        .metric-box {{
            background: var(--color-space-lighter);
            border: 1px solid var(--color-cyan-dim);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s ease;
        }}

        .metric-box:hover {{
            border-color: var(--color-cyan);
            box-shadow: 0 0 30px var(--color-cyan-glow);
            transform: translateY(-5px);
        }}

        .metric-label {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.75rem;
            color: var(--color-text-dim);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
        }}

        .metric-value {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 3rem;
            font-weight: 600;
            color: var(--color-cyan);
            font-variant-numeric: tabular-nums;
        }}

        .metric-value.improvement {{
            color: var(--color-success);
        }}

        .metric-suffix {{
            font-size: 1.5rem;
            color: var(--color-text-dim);
            margin-left: 5px;
        }}

        /* Content slide */
        .slide-content {{
            display: flex;
            flex-direction: column;
            gap: 40px;
        }}

        .content-header {{
            border-left: 3px solid var(--color-cyan);
            padding-left: 30px;
        }}

        .segment-title {{
            font-family: 'Newsreader', serif;
            font-size: 2.5rem;
            font-weight: 600;
            color: var(--color-cyan);
            margin-bottom: 10px;
            line-height: 1.2;
        }}

        .segment-id {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.7rem;
            color: var(--color-text-dimmer);
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }}

        .content-body {{
            flex: 1;
            overflow-y: auto;
            padding-right: 20px;
            font-size: 1.15rem;
            line-height: 1.9;
            color: var(--color-text);
        }}

        .content-body::-webkit-scrollbar {{
            width: 6px;
        }}

        .content-body::-webkit-scrollbar-track {{
            background: var(--color-space-lighter);
            border-radius: 3px;
        }}

        .content-body::-webkit-scrollbar-thumb {{
            background: var(--color-cyan-dim);
            border-radius: 3px;
        }}

        .content-body::-webkit-scrollbar-thumb:hover {{
            background: var(--color-cyan);
        }}

        .concepts {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }}

        .concept-tag {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.8rem;
            padding: 8px 16px;
            background: var(--color-cyan-dim);
            color: var(--color-cyan);
            border: 1px solid var(--color-cyan);
            border-radius: 20px;
            transition: all 0.3s ease;
        }}

        .concept-tag:hover {{
            background: var(--color-cyan);
            color: var(--color-space);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px var(--color-cyan-glow);
        }}

        /* Visualization */
        .visualization {{
            margin: 20px 0;
            text-align: center;
        }}

        .visualization img {{
            max-width: 100%;
            max-height: 400px;
            border-radius: 12px;
            border: 1px solid var(--color-cyan-dim);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }}

        .visualization-caption {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.75rem;
            color: var(--color-text-dimmer);
            margin-top: 10px;
        }}

        /* Navigation */
        .nav-controls {{
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 30px;
            z-index: 10;
            background: var(--color-space-lighter);
            border: 1px solid var(--color-cyan-dim);
            border-radius: 50px;
            padding: 15px 30px;
            backdrop-filter: blur(20px);
        }}

        .nav-btn {{
            width: 50px;
            height: 50px;
            border: 1px solid var(--color-cyan-dim);
            background: var(--color-space);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--color-cyan);
            font-size: 1.2rem;
        }}

        .nav-btn:hover {{
            border-color: var(--color-cyan);
            background: var(--color-cyan);
            color: var(--color-space);
            box-shadow: 0 0 20px var(--color-cyan-glow);
            transform: scale(1.1);
        }}

        .nav-btn:disabled {{
            opacity: 0.3;
            cursor: not-allowed;
        }}

        .nav-btn:disabled:hover {{
            border-color: var(--color-cyan-dim);
            background: var(--color-space);
            color: var(--color-cyan);
            box-shadow: none;
            transform: scale(1);
        }}

        .slide-counter {{
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.9rem;
            color: var(--color-text);
            font-variant-numeric: tabular-nums;
            min-width: 80px;
            text-align: center;
        }}

        .slide-counter .current {{
            color: var(--color-cyan);
            font-weight: 600;
            font-size: 1.2rem;
        }}

        .slide-counter .separator {{
            margin: 0 8px;
            color: var(--color-text-dimmer);
        }}

        .slide-counter .total {{
            color: var(--color-text-dim);
        }}

        /* Progress bar */
        .progress-bar {{
            position: absolute;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--color-cyan), var(--color-magenta));
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 11;
            box-shadow: 0 0 10px var(--color-cyan-glow);
        }}

        /* Keyboard hint */
        .keyboard-hint {{
            position: absolute;
            top: 30px;
            right: 30px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.7rem;
            color: var(--color-text-dimmer);
            display: flex;
            gap: 15px;
            opacity: 0;
            animation: hint-fade-in 1s ease 2s forwards;
        }}

        @keyframes hint-fade-in {{
            to {{ opacity: 1; }}
        }}

        .key {{
            padding: 4px 8px;
            background: var(--color-space-lighter);
            border: 1px solid var(--color-cyan-dim);
            border-radius: 4px;
        }}

        /* Watermark */
        .watermark {{
            position: absolute;
            bottom: 30px;
            right: 30px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.65rem;
            color: var(--color-text-dimmer);
            opacity: 0.5;
        }}

        /* Responsive */
        @media (max-width: 1024px) {{
            .presentation-container {{
                width: 95vw;
                height: 90vh;
            }}

            .slide {{
                padding: 60px 50px;
            }}

            .lesson-title {{
                font-size: 3rem;
            }}

            .segment-title {{
                font-size: 2rem;
            }}

            .content-body {{
                font-size: 1rem;
            }}
        }}

        @media (max-width: 768px) {{
            .slide {{
                padding: 40px 30px;
            }}

            .lesson-title {{
                font-size: 2rem;
            }}

            .segment-title {{
                font-size: 1.5rem;
            }}

            .metrics-grid {{
                grid-template-columns: 1fr;
                gap: 15px;
            }}

            .nav-controls {{
                bottom: 20px;
                padding: 10px 20px;
                gap: 15px;
            }}

            .nav-btn {{
                width: 40px;
                height: 40px;
            }}

            .keyboard-hint {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="neural-bg"></div>

    <div class="presentation-container">
        <div class="slide-viewport">
            <div class="progress-bar" id="progressBar"></div>

            {slides_html}

            <div class="nav-controls">
                <button class="nav-btn" id="prevBtn" aria-label="Previous slide">←</button>
                <div class="slide-counter">
                    <span class="current" id="currentSlide">1</span>
                    <span class="separator">/</span>
                    <span class="total" id="totalSlides">{total_slides}</span>
                </div>
                <button class="nav-btn" id="nextBtn" aria-label="Next slide">→</button>
            </div>

            <div class="keyboard-hint">
                <span><span class="key">←</span> Previous</span>
                <span><span class="key">→</span> Next</span>
                <span><span class="key">Space</span> Next</span>
            </div>

            <div class="watermark">
                NeuroCompiler • {timestamp}
            </div>
        </div>
    </div>

    <script>
        class PresentationViewer {{
            constructor() {{
                this.currentSlide = 0;
                this.totalSlides = {total_slides};
                this.slides = document.querySelectorAll('.slide');
                this.prevBtn = document.getElementById('prevBtn');
                this.nextBtn = document.getElementById('nextBtn');
                this.currentSlideEl = document.getElementById('currentSlide');
                this.progressBar = document.getElementById('progressBar');

                this.init();
            }}

            init() {{
                this.showSlide(0);
                this.setupEventListeners();
            }}

            setupEventListeners() {{
                this.prevBtn.addEventListener('click', () => this.prevSlide());
                this.nextBtn.addEventListener('click', () => this.nextSlide());

                document.addEventListener('keydown', (e) => {{
                    if (e.key === 'ArrowRight' || e.key === ' ') {{
                        e.preventDefault();
                        this.nextSlide();
                    }} else if (e.key === 'ArrowLeft') {{
                        e.preventDefault();
                        this.prevSlide();
                    }}
                }});

                // Touch swipe support
                let touchStartX = 0;
                let touchEndX = 0;

                document.addEventListener('touchstart', (e) => {{
                    touchStartX = e.changedTouches[0].screenX;
                }});

                document.addEventListener('touchend', (e) => {{
                    touchEndX = e.changedTouches[0].screenX;
                    this.handleSwipe();
                }});

                const handleSwipe = () => {{
                    if (touchEndX < touchStartX - 50) this.nextSlide();
                    if (touchEndX > touchStartX + 50) this.prevSlide();
                }};
                this.handleSwipe = handleSwipe;
            }}

            showSlide(index) {{
                this.slides.forEach((slide, i) => {{
                    slide.classList.remove('active', 'prev');
                    if (i === index) {{
                        slide.classList.add('active');
                    }} else if (i < index) {{
                        slide.classList.add('prev');
                    }}
                }});

                this.currentSlide = index;
                this.currentSlideEl.textContent = index + 1;
                this.updateProgress();
                this.updateButtons();
            }}

            updateProgress() {{
                const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
                this.progressBar.style.width = progress + '%';
            }}

            updateButtons() {{
                this.prevBtn.disabled = this.currentSlide === 0;
                this.nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
            }}

            nextSlide() {{
                if (this.currentSlide < this.totalSlides - 1) {{
                    this.showSlide(this.currentSlide + 1);
                }}
            }}

            prevSlide() {{
                if (this.currentSlide > 0) {{
                    this.showSlide(this.currentSlide - 1);
                }}
            }}
        }}

        // Initialize presentation
        new PresentationViewer();
    </script>
</body>
</html>
"""


TITLE_SLIDE_TEMPLATE = """
<div class="slide slide-title">
    <h1 class="lesson-title">{title}</h1>
    <div class="metrics-grid">
        <div class="metric-box">
            <div class="metric-label">Learning Score</div>
            <div class="metric-value">{learning_score}<span class="metric-suffix">/100</span></div>
        </div>
        {improvement_metric}
        <div class="metric-box">
            <div class="metric-label">Total Segments</div>
            <div class="metric-value">{segment_count}</div>
        </div>
    </div>
</div>
"""


CONTENT_SLIDE_TEMPLATE = """
<div class="slide slide-content">
    <div class="content-header">
        <h2 class="segment-title">{title}</h2>
        <div class="segment-id">{segment_id}</div>
    </div>
    {visualization_html}
    <div class="content-body">{content}</div>
    {concepts_html}
</div>
"""


def convert_json_to_slides(json_path: Path, output_path: Path = None):
    """Convert optimized lesson JSON to slide presentation."""

    with open(json_path, 'r') as f:
        data = json.load(f)

    title = data.get('title', 'Optimized Lesson')
    # Clean up the title (remove UUID prefix if present)
    if '_' in title:
        parts = title.split('_', 1)
        if len(parts[0]) > 30:  # Likely a UUID
            title = parts[1].replace('.pdf', '').replace('-', ' ')

    learning_score = round(data.get('learning_score', 0))
    improvement = data.get('improvement', 0)
    segments = data.get('segments', [])

    # Build improvement metric
    if improvement > 0:
        improvement_metric = f"""
        <div class="metric-box">
            <div class="metric-label">Improvement</div>
            <div class="metric-value improvement">+{round(improvement)}<span class="metric-suffix">pts</span></div>
        </div>
        """
    else:
        improvement_metric = ""

    # Build title slide
    title_slide = TITLE_SLIDE_TEMPLATE.format(
        title=title,
        learning_score=learning_score,
        improvement_metric=improvement_metric,
        segment_count=len(segments)
    )

    # Build content slides
    content_slides = []
    visualizations = data.get('visualizations', {})

    for i, segment in enumerate(segments, 1):
        seg_title = segment.get('title', f'Segment {i}')
        seg_content = segment.get('content', '').strip()
        seg_concepts = segment.get('concepts', [])
        seg_id = f"segment_{i}"

        # Build visualization HTML if available
        visualization_html = ''
        if seg_id in visualizations and visualizations[seg_id]:
            vis = visualizations[seg_id][0]  # Use first visualization
            visualization_html = f'''
            <div class="visualization">
                <img src="{vis.get('image_data', '')}" alt="{vis.get('alt_text', 'Educational visualization')}">
                <div class="visualization-caption">{vis.get('type', 'visual').replace('_', ' ').title()}</div>
            </div>
            '''

        # Build concepts HTML
        if seg_concepts:
            concepts_tags = ''.join([
                f'<span class="concept-tag">{concept}</span>'
                for concept in seg_concepts
            ])
            concepts_html = f'<div class="concepts">{concepts_tags}</div>'
        else:
            concepts_html = ''

        # Format content (preserve paragraphs)
        formatted_content = '<p>' + seg_content.replace('\n\n', '</p><p>').replace('\n', '<br>') + '</p>'

        content_slide = CONTENT_SLIDE_TEMPLATE.format(
            title=seg_title,
            segment_id=f"Segment {i}",
            visualization_html=visualization_html,
            content=formatted_content,
            concepts_html=concepts_html
        )
        content_slides.append(content_slide)

    # Combine all slides
    all_slides = title_slide + '\n'.join(content_slides)
    total_slides = len(segments) + 1  # +1 for title slide

    # Build final HTML
    html = HTML_TEMPLATE.format(
        title=title,
        slides_html=all_slides,
        total_slides=total_slides,
        timestamp=datetime.now().strftime("%Y-%m-%d")
    )

    # Determine output path
    if output_path is None:
        output_path = json_path.parent / (json_path.stem + '_slides.html')

    # Write HTML
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✓ Slide presentation generated: {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python json_to_slides.py <path_to_json> [output_path.html]")
        print("\nExample:")
        print("  python json_to_slides.py optimized_lesson.json")
        print("  python json_to_slides.py optimized_lesson.json slides.html")
        sys.exit(1)

    json_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    if not json_path.exists():
        print(f"Error: File not found: {json_path}")
        sys.exit(1)

    convert_json_to_slides(json_path, output_path)
    print(f"\nOpen in browser:")
    output = output_path or json_path.parent / (json_path.stem + '_slides.html')
    print(f"  open {output}")
