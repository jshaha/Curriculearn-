// Main Application Logic for NeuroCompiler
// CONNECTED VERSION - Uses real API backend

const API_BASE = 'http://localhost:5001/api';

class NeuroCompilerApp {
    constructor() {
        this.currentView = 'upload';
        this.selectedObjectives = new Set();
        this.currentSlide = 5;
        this.totalSlides = 18;
        this.currentLessonId = null;
        this.currentResultId = null;

        this.init();
    }

    init() {
        this.setupUploadZone();
        this.setupSampleLessons();
        this.setupObjectives();
        this.setupDashboard();
        this.setupResults();
    }

    // ============================================
    // Upload View
    // ============================================

    setupUploadZone() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');

        if (!dropzone || !fileInput) return;

        // Click to browse
        dropzone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }

    async handleFileUpload(file) {
        console.log('File uploaded:', file.name);

        try {
            // Upload file to API
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            this.currentLessonId = data.lesson_id;

            console.log('Lesson uploaded:', data);

            // Update file name in dashboard
            const fileNameEl = document.querySelector('.file-name');
            if (fileNameEl) {
                fileNameEl.textContent = file.name;
            }

            // Show objectives modal
            this.showModal('objectivesModal');

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file. Make sure the API server is running (python backend/api_server.py)');
        }
    }

    setupSampleLessons() {
        const sampleCards = document.querySelectorAll('.sample-card');

        sampleCards.forEach(card => {
            card.addEventListener('click', () => {
                const sample = card.dataset.sample;
                console.log('Sample lesson selected:', sample);
                alert('Sample lessons: Please upload your own PDF instead, or run: python run_full_optimization.py');
            });
        });
    }

    // ============================================
    // Objectives Modal
    // ============================================

    setupObjectives() {
        const objectiveCards = document.querySelectorAll('.objective-card');
        const continueBtn = document.getElementById('continueBtn');

        objectiveCards.forEach(card => {
            card.addEventListener('click', () => {
                const objective = card.dataset.objective;

                if (this.selectedObjectives.has(objective)) {
                    this.selectedObjectives.delete(objective);
                    card.classList.remove('selected');
                } else {
                    this.selectedObjectives.add(objective);
                    card.classList.add('selected');
                }

                // Enable continue button if at least one selected
                continueBtn.disabled = this.selectedObjectives.size === 0;
            });
        });

        continueBtn.addEventListener('click', async () => {
            console.log('Selected objectives:', Array.from(this.selectedObjectives));

            // Hide modal
            this.hideModal('objectivesModal');

            // Show dashboard with loading state
            this.switchView('dashboard');

            // Run analysis
            await this.runAnalysis();
        });
    }

    // ============================================
    // Dashboard View
    // ============================================

    async runAnalysis() {
        if (!this.currentLessonId) {
            console.error('No lesson ID');
            return;
        }

        try {
            console.log('Running analysis...');

            // Show analyzing status
            const statusBadge = document.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.classList.add('analyzing');
                statusBadge.innerHTML = '<span class="pulse-dot"></span>Analyzing with brain simulation';
            }

            // Call API
            const response = await fetch(`${API_BASE}/analyze/${this.currentLessonId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    objectives: Array.from(this.selectedObjectives)
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            console.log('Analysis complete:', data);

            // Update metrics display
            this.updateMetrics(data.metrics);

            // Update status
            if (statusBadge) {
                statusBadge.classList.remove('analyzing');
                statusBadge.classList.add('complete');
                statusBadge.innerHTML = '<span class="pulse-dot"></span>Analysis complete';
            }

            // Display issues
            this.displayIssues(data.issues);

        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis failed. Make sure the API server is running.');
        }
    }

    updateMetrics(metrics) {
        // Update metric cards with real data
        const metricCards = [
            { selector: '[data-value="72"]', value: Math.round(metrics.learning_score) },
            { selector: '[data-value="76"]', value: Math.round(metrics.engagement) },
            { selector: '[data-value="84"]', value: Math.round(metrics.cognitive_load) },
            { selector: '[data-value="58"]', value: Math.round(metrics.concept_flow) }
        ];

        metricCards.forEach(({ selector, value }) => {
            const element = document.querySelector(`.metric-value${selector}`);
            if (element) {
                element.dataset.value = value;
                if (window.animations) {
                    window.animations.animateCounter(element, value, 1500);
                }
            }
        });

        // Redraw chart with real data if available
        setTimeout(() => this.drawChart(), 500);
    }

    displayIssues(issues) {
        if (!issues || issues.length === 0) {
            console.log('No issues detected');
            return;
        }

        console.log(`Displaying ${issues.length} issues`);

        // Update issue count in status
        const statusText = document.querySelector('.dashboard-header .file-info');
        if (statusText) {
            const badge = document.createElement('div');
            badge.className = 'status-badge warning';
            badge.textContent = `${issues.length} issues detected`;
            statusText.appendChild(badge);
        }

        // TODO: Update issue list in UI with real data
        // For now, just log them
        issues.forEach(issue => {
            console.log(`- ${issue.issue_type} at ${issue.segment_id} (${issue.severity})`);
        });
    }

    setupDashboard() {
        // Tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // New lesson button
        const newLessonBtn = document.getElementById('newLessonBtn');
        if (newLessonBtn) {
            newLessonBtn.addEventListener('click', () => {
                this.switchView('upload');
                this.currentLessonId = null;
                this.currentResultId = null;
            });
        }

        // Slide navigation
        const prevSlide = document.getElementById('prevSlide');
        const nextSlide = document.getElementById('nextSlide');

        if (prevSlide) {
            prevSlide.addEventListener('click', () => this.navigateSlide(-1));
        }
        if (nextSlide) {
            nextSlide.addEventListener('click', () => this.navigateSlide(1));
        }

        // Generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                await this.runOptimization();
            });
        }

        // Visualize button (add after analyzing)
        const visualizeBtn = document.getElementById('visualizeBtn');
        if (visualizeBtn) {
            visualizeBtn.addEventListener('click', async () => {
                await this.generateVisualizations();
            });
        }
    }

    async runOptimization() {
        if (!this.currentLessonId) {
            console.error('No lesson ID');
            return;
        }

        const generateBtn = document.getElementById('generateBtn');

        try {
            console.log('Running optimization...');

            // Update button state
            if (generateBtn) {
                generateBtn.innerHTML = `
                    <span class="btn-generate-icon">⏳</span>
                    <span class="btn-generate-text">Optimizing...</span>
                `;
                generateBtn.disabled = true;
            }

            // Call API
            const response = await fetch(`${API_BASE}/optimize/${this.currentLessonId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    max_iterations: 2,
                    max_candidates: 3
                })
            });

            if (!response.ok) {
                throw new Error('Optimization failed');
            }

            const data = await response.json();
            console.log('Optimization complete:', data);

            this.currentResultId = data.result_id;

            // Load full result and switch to results view
            await this.loadResultAndDisplay();

        } catch (error) {
            console.error('Optimization error:', error);
            alert('Optimization failed. Check console for details.');

            // Reset button
            if (generateBtn) {
                generateBtn.innerHTML = `
                    <span class="btn-generate-icon">✨</span>
                    <span class="btn-generate-text">Generate Optimized Lesson</span>
                `;
                generateBtn.disabled = false;
            }
        }
    }

    async generateVisualizations() {
        if (!this.currentLessonId) {
            console.error('No lesson ID');
            return;
        }

        try {
            console.log('Generating visualizations...');

            // Update status
            const statusBadge = document.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.classList.add('analyzing');
                statusBadge.innerHTML = '<span class="pulse-dot"></span>Generating visuals...';
            }

            // Call API
            const response = await fetch(`${API_BASE}/visualize/${this.currentLessonId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    max_per_segment: 1
                })
            });

            if (!response.ok) {
                throw new Error('Visualization generation failed');
            }

            const data = await response.json();
            console.log('Visualizations generated:', data);

            // Update status
            if (statusBadge) {
                statusBadge.classList.remove('analyzing');
                statusBadge.classList.add('complete');
                statusBadge.innerHTML = `<span class="pulse-dot"></span>${data.total_visuals} visuals generated`;
            }

            alert(`Generated ${data.total_visuals} visualizations! They'll appear in the optimized slides.`);

        } catch (error) {
            console.error('Visualization error:', error);
            alert('Visualization generation failed. Check console for details.');
        }
    }

    async loadResultAndDisplay() {
        if (!this.currentResultId) {
            console.error('No result ID');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/result/${this.currentResultId}`);

            if (!response.ok) {
                throw new Error('Failed to load result');
            }

            const data = await response.json();
            console.log('Result data:', data);

            // Update results view with real data
            this.updateResultsView(data);

            // Switch to results view
            this.switchView('results');

        } catch (error) {
            console.error('Error loading result:', error);
        }
    }

    updateResultsView(data) {
        // Update score values
        const beforeScore = document.querySelector('.score-before .score-number');
        const afterScore = document.querySelector('.score-after .score-number');
        const improvement = document.querySelector('.score-improvement');

        if (beforeScore) beforeScore.textContent = Math.round(data.original_score);
        if (afterScore) afterScore.textContent = Math.round(data.optimized_score);
        if (improvement) improvement.textContent = `+${Math.round(data.improvement)} points`;

        console.log('Updated results view with real data');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    navigateSlide(direction) {
        this.currentSlide = Math.max(1, Math.min(this.totalSlides, this.currentSlide + direction));

        // Update display
        const counter = document.querySelector('.slide-counter .tabular');
        if (counter) {
            counter.textContent = this.currentSlide;
        }

        console.log('Navigated to slide:', this.currentSlide);
    }

    // ============================================
    // Results View
    // ============================================

    setupResults() {
        // Download button
        const downloadBtn = document.querySelector('.btn-primary-large');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                if (!this.currentResultId) {
                    alert('No result to download');
                    return;
                }

                window.open(`${API_BASE}/download/${this.currentResultId}`, '_blank');
            });
        }
    }

    // ============================================
    // View Management
    // ============================================

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

            // Trigger view-specific actions
            if (viewName === 'dashboard') {
                setTimeout(() => {
                    if (window.animations) {
                        window.animations.drawCognitiveChart('cognitiveChart');
                    }
                }, 100);
            }
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // ============================================
    // Animations
    // ============================================

    drawChart() {
        if (window.animations) {
            setTimeout(() => {
                window.animations.drawCognitiveChart('cognitiveChart');
            }, 500);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroCompilerApp();

    // Check if API is available
    fetch('http://localhost:5001/health')
        .then(res => res.json())
        .then(data => {
            console.log('✅ API server is running:', data.message);
        })
        .catch(err => {
            console.warn('⚠️  API server not running. Start it with: python backend/api_server.py');
        });
});
