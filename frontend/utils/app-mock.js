// Main Application Logic for NeuroCompiler

class NeuroCompilerApp {
    constructor() {
        this.currentView = 'upload';
        this.selectedObjectives = new Set();
        this.currentSlide = 5;
        this.totalSlides = 18;

        this.init();
    }

    init() {
        this.setupUploadZone();
        this.setupSampleLessons();
        this.setupObjectives();
        this.setupDashboard();
        this.setupResults();

        // Initialize animations
        this.animateMetrics();
        this.drawChart();
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

    handleFileUpload(file) {
        console.log('File uploaded:', file.name);

        // Show objectives modal
        this.showModal('objectivesModal');
    }

    setupSampleLessons() {
        const sampleCards = document.querySelectorAll('.sample-card');

        sampleCards.forEach(card => {
            card.addEventListener('click', () => {
                const sample = card.dataset.sample;
                console.log('Sample lesson selected:', sample);

                // Show objectives modal
                this.showModal('objectivesModal');
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

        continueBtn.addEventListener('click', () => {
            console.log('Selected objectives:', Array.from(this.selectedObjectives));

            // Hide modal and show dashboard
            this.hideModal('objectivesModal');
            this.switchView('dashboard');
        });
    }

    // ============================================
    // Dashboard View
    // ============================================

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
            generateBtn.addEventListener('click', () => {
                console.log('Generating optimized lesson...');

                // Simulate processing
                generateBtn.innerHTML = `
                    <span class="btn-generate-icon">⏳</span>
                    <span class="btn-generate-text">Optimizing...</span>
                `;

                setTimeout(() => {
                    this.switchView('results');
                }, 2000);
            });
        }

        // Issue expansion
        const issueExpands = document.querySelectorAll('.issue-expand');
        issueExpands.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchTab('timeline');
            });
        });
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
            downloadBtn.addEventListener('click', () => {
                console.log('Downloading optimized lesson...');
                alert('Download functionality would be implemented here');
            });
        }

        // Compare button
        const compareBtn = document.querySelector('.btn-secondary-large');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                console.log('Opening comparison view...');
                alert('Side-by-side comparison would be implemented here');
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
                    this.animateMetrics();
                    this.drawChart();
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

    animateMetrics() {
        const metricValues = document.querySelectorAll('.metric-value');

        metricValues.forEach(element => {
            const target = parseInt(element.dataset.value);
            if (target && window.animations) {
                window.animations.animateCounter(element, target, 1500);
            }
        });

        // Animate dots
        setTimeout(() => {
            document.querySelectorAll('.dot.filled').forEach((dot, i) => {
                setTimeout(() => {
                    dot.style.animation = 'dotPulse 0.4s ease-out';
                }, i * 50);
            });
        }, 1000);
    }

    drawChart() {
        if (window.animations) {
            setTimeout(() => {
                window.animations.drawCognitiveChart('cognitiveChart');
            }, 500);
        }
    }
}

// Add CSS animation for dots
const style = document.createElement('style');
style.textContent = `
    @keyframes dotPulse {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroCompilerApp();
});
