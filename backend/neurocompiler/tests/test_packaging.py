def test_package_imports_from_repo_root():
    from neurocompiler.agents.optimizer import LessonOptimizer
    from neurocompiler.schemas import StructuredLesson

    assert LessonOptimizer is not None
    assert StructuredLesson is not None
