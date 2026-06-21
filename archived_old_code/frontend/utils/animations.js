// Animation Utilities for NeuroCompiler

// Counter Animation for Metrics
function animateCounter(element, targetValue, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out-cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (targetValue - start) * eased);

        element.textContent = current.toString().padStart(2, '0');

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue.toString().padStart(2, '0');
        }
    }

    requestAnimationFrame(update);
}

// Stagger Animation for Elements
function staggerAnimation(elements, className, delay = 100) {
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add(className);
        }, index * delay);
    });
}

// Draw Cognitive Chart (Simple Line Chart)
function drawCognitiveChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sample data - engagement and cognitive load over slides
    const slides = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const engagement = [65, 72, 78, 75, 45, 52, 68, 71, 74, 78, 82, 80]; // Dip at slide 5
    const cognitiveLoad = [55, 58, 62, 65, 92, 88, 72, 68, 65, 62, 58, 55]; // Spike at slide 5

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= slides.length; i++) {
        const x = padding + (chartWidth / slides.length) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px "IBM Plex Mono"';
    ctx.textAlign = 'center';

    // X-axis labels (slide numbers)
    slides.forEach((slide, i) => {
        const x = padding + (chartWidth / slides.length) * i + (chartWidth / slides.length / 2);
        ctx.fillText(slide, x, height - padding + 20);
    });

    // Y-axis label
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillText('100', padding - 10, padding);
    ctx.fillText('0', padding - 10, height - padding);
    ctx.restore();

    // Function to plot line
    function plotLine(data, color, label) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        data.forEach((value, i) => {
            const x = padding + (chartWidth / slides.length) * i + (chartWidth / slides.length / 2);
            const y = height - padding - (value / 100) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw points
        data.forEach((value, i) => {
            const x = padding + (chartWidth / slides.length) * i + (chartWidth / slides.length / 2);
            const y = height - padding - (value / 100) * chartHeight;

            // Highlight problem area (slide 5)
            if (i === 4) {
                ctx.fillStyle = '#FF006E';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#FF006E';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Plot engagement line
    plotLine(engagement, '#00F0FF', 'Engagement');

    // Plot cognitive load line
    plotLine(cognitiveLoad, '#F59E0B', 'Cognitive Load');

    // Legend
    const legendY = padding - 30;

    // Engagement legend
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(padding, legendY, 20, 3);
    ctx.fillStyle = '#F9FAFB';
    ctx.font = '12px "IBM Plex Mono"';
    ctx.textAlign = 'left';
    ctx.fillText('Engagement', padding + 30, legendY + 3);

    // Cognitive Load legend
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(padding + 150, legendY, 20, 3);
    ctx.fillStyle = '#F9FAFB';
    ctx.fillText('Cognitive Load', padding + 180, legendY + 3);

    // Problem zone annotation
    const problemX = padding + (chartWidth / slides.length) * 4 + (chartWidth / slides.length / 2);
    ctx.fillStyle = '#FF006E';
    ctx.font = '11px "IBM Plex Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ Problem Zone', problemX, padding - 10);
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Export for use in app.js
window.animations = {
    animateCounter,
    staggerAnimation,
    drawCognitiveChart,
    observer
};
