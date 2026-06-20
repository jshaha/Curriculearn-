# Partner Integration TODO

Before real integration, confirm:

1. Can the partner pipeline accept a `StructuredLesson` JSON?
2. Can it return a `MetricReport` JSON for that exact lesson?
3. Does it preserve segment IDs exactly?
4. Does it produce metrics for each segment, or only global metrics?
5. Are all metrics normalized to 0–100?
6. What does `confidence` mean?
7. Can the model be called repeatedly for edited candidate lessons?
8. If not, will the demo use real metrics only for diagnosis and mock metrics for optimization?
9. How long does one simulation call take?
10. Does the pipeline require GPU access?
