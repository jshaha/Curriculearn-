# Test Curriculum Files for NeuroCompiler

## Files Created

### 1. **photosynthesis_lesson.html** (18 slides)
A biology lesson designed to exhibit various cognitive issues that NeuroCompiler should detect.

**Intentional Issues:**
- **Slide 5**: Cognitive overload (5 complex concepts introduced simultaneously)
- **Slide 8**: Poor sequencing (complex equation before conceptual understanding)
- **Slides 6-12**: No reinforcement of previous material (long stretch without review)
- **Slide 10**: Text-heavy, no visual support
- **Slide 12**: Advanced topic (photorespiration) introduced too early

**Good Elements:**
- Slides 2-4: Good scaffolding with analogy and simple intro
- Slide 15: Good review/reinforcement
- Slide 18: Strong summary

### 2. **bayes_theorem_lesson.html** (14 slides)
A statistics lesson with different pacing and complexity issues.

**Intentional Issues:**
- **Slide 5**: Cognitive overload (formula dump with multiple variations)
- **Slide 6**: Too abstract derivation before concrete examples
- **Slides 5-6**: No intuition before formulas

**Good Elements:**
- Slides 2-4: Strong motivation and scaffolding
- Slides 7-9: Excellent worked example with explanation
- Slide 12: Practice problem with solution

## How to Convert to PDF

### Method 1: Browser Print (Easiest)
1. Open the HTML file in any browser
2. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows)
3. Select "Save as PDF" as destination
4. Click Save

### Method 2: Command Line (wkhtmltopdf)
```bash
# Install (Mac)
brew install wkhtmltopdf

# Convert
wkhtmltopdf photosynthesis_lesson.html photosynthesis_lesson.pdf
wkhtmltopdf bayes_theorem_lesson.html bayes_theorem_lesson.pdf
```

### Method 3: Python (weasyprint)
```bash
pip install weasyprint

python -c "from weasyprint import HTML; HTML('photosynthesis_lesson.html').write_pdf('photosynthesis_lesson.pdf')"
```

## Expected NeuroCompiler Analysis Results

### Photosynthesis Lesson

**Predicted Metrics:**
- Learning Score: ~65-72 (medium, could be improved)
- Cognitive Load: ~80-85 (high, especially around slides 5-12)
- Engagement: ~70-76 (decent content but dense)
- Concept Flow: ~55-60 (some abrupt transitions)
- Retention: ~45-50 (insufficient reinforcement)

**Issues NeuroCompiler Should Detect:**
1. **Slide 5** - Cognitive overload
   - Impact: -12 points
   - Recommendation: Break into 2-3 slides

2. **Slide 8** - Poor sequencing
   - Impact: -6 points
   - Recommendation: Move equation after conceptual explanation

3. **Slides 6-12** - No reinforcement
   - Impact: -4 points
   - Recommendation: Insert review question after slide 9

4. **Slide 10** - Low multimodal support
   - Impact: -2 points
   - Recommendation: Add diagram or table

**After Optimization:**
- Expected Learning Score: ~85-90
- Changes: Split slide 5, reorder content, add reinforcement

### Bayes Theorem Lesson

**Predicted Metrics:**
- Learning Score: ~70-75
- Cognitive Load: ~75-80 (high initially, better later)
- Engagement: ~78-82 (good examples)
- Concept Flow: ~60-65 (formula dump disrupts flow)
- Retention: ~72-76 (good practice problems)

**Issues NeuroCompiler Should Detect:**
1. **Slide 5** - Cognitive overload (formula variations)
   - Impact: -8 points
   - Recommendation: Introduce formulas gradually

2. **Slide 6** - Abstract before concrete
   - Impact: -5 points
   - Recommendation: Move derivation to end or appendix

## Testing the Full Pipeline

### 1. Upload Test
```python
# Test file upload
from src.agents import DocumentParser

parser = DocumentParser()
lesson_segments = parser.parse_pdf('test_files/photosynthesis_lesson.pdf')
print(f"Parsed {len(lesson_segments)} segments")
```

### 2. Analysis Test
```python
# Test full pipeline
from src.agents import BrainSimulator, MetricTranslator

brain_sim = BrainSimulator()
metric_translator = MetricTranslator()

# Analyze
brain_states = brain_sim.simulate_from_text_list(lesson_segments)
metrics = metric_translator.translate(brain_states)

print(f"Learning Score: {metrics['learning_score']:.1f}")
print(f"Cognitive Load: {metrics['cognitive_load']:.1f}")
print(f"Issues detected: {len(metrics['problem_segments'])}")
```

### 3. Frontend Test
1. Open `frontend/index.html`
2. Upload `photosynthesis_lesson.pdf`
3. Select objectives
4. View analysis results
5. Generate optimized version

## Creating Your Own Test Lessons

Use this template structure:

```html
<div class="slide">
    <div class="slide-number">Slide X</div>
    <h2>Title</h2>
    <p>Content here...</p>
</div>
```

**Tips for Creating Good Test Cases:**
- Include 12-20 slides for realistic testing
- Add variety: some good, some problematic
- Mix text density levels
- Include both simple and complex concepts
- Add equations, lists, and examples
- Create intentional issues to verify detection

## File Sizes

- **photosynthesis_lesson.html**: ~35 KB
- **bayes_theorem_lesson.html**: ~22 KB
- **PDFs** (after conversion): ~50-80 KB each

Both are small enough for quick testing but comprehensive enough to demonstrate NeuroCompiler's capabilities.

## Lesson Topics Available

1. ✅ **Photosynthesis** (Biology) - 18 slides
2. ✅ **Bayes' Theorem** (Statistics) - 14 slides
3. 💡 **French Revolution** (History) - Can create on request
4. 💡 **Quadratic Equations** (Math) - Can create on request
5. 💡 **DNA Replication** (Biology) - Can create on request

## Using These for Demo

### Demo Script:
1. **Start**: "Let me show you a biology lesson on photosynthesis..."
2. **Upload**: Drag PDF into NeuroCompiler interface
3. **Point Out**: "Notice how it's analyzing brain responses in real-time"
4. **Results**: "Here's what it found - Slide 5 has cognitive overload"
5. **Generate**: "Now watch it automatically improve the lesson"
6. **Compare**: "Learning score went from 72 to 83 - a 36% improvement"

### For Judges/Evaluators:
- Show before/after comparison
- Highlight specific recommendations
- Explain how brain simulation works
- Demonstrate the optimization loop

## Realistic vs Demo Data

These lessons are realistic educational content, not toy examples:
- ✅ Appropriate length (12-18 slides)
- ✅ Actual subject matter (not "Concept A, Concept B")
- ✅ Realistic complexity progression
- ✅ Both good and bad pedagogical practices
- ✅ Natural language, not contrived

This makes your demo much more convincing than showing "Lorem ipsum" or fake data.

## Next Steps

1. **Convert to PDF** using Method 1 above
2. **Test backend** parsing with these PDFs
3. **Verify metrics** match expected ranges
4. **Test frontend** upload and display
5. **Demo** with confidence!
