// Neural Network Background Animation
// Creates an animated network of nodes and connections

class NeuralNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.mouse = { x: null, y: null };

        this.config = {
            nodeCount: 60,
            nodeRadius: 3,
            connectionDistance: 150,
            mouseInfluence: 200,
            colors: {
                node: 'rgba(0, 240, 255, 0.6)',
                connection: 'rgba(0, 240, 255, 0.2)',
                magenta: 'rgba(255, 0, 110, 0.4)'
            }
        };

        this.init();
    }

    init() {
        this.resize();
        this.createNodes();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createNodes() {
        this.nodes = [];
        for (let i = 0; i < this.config.nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: this.config.nodeRadius
            });
        }
    }

    updateNodes() {
        this.nodes.forEach(node => {
            // Update position
            node.x += node.vx;
            node.y += node.vy;

            // Bounce off edges
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

            // Mouse influence
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - node.x;
                const dy = this.mouse.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.mouseInfluence) {
                    const force = (this.config.mouseInfluence - distance) / this.config.mouseInfluence;
                    node.x -= dx * force * 0.01;
                    node.y -= dy * force * 0.01;
                }
            }

            // Keep in bounds
            node.x = Math.max(0, Math.min(this.canvas.width, node.x));
            node.y = Math.max(0, Math.min(this.canvas.height, node.y));
        });
    }

    drawConnections() {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    const opacity = 1 - (distance / this.config.connectionDistance);

                    // Alternate colors for visual interest
                    const color = (i + j) % 3 === 0
                        ? this.config.colors.magenta
                        : this.config.colors.connection;

                    this.ctx.strokeStyle = color.replace('0.2', opacity * 0.2);
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawNodes() {
        this.nodes.forEach(node => {
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, node.radius * 3
            );
            gradient.addColorStop(0, this.config.colors.node);
            gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Core node
            this.ctx.fillStyle = this.config.colors.node;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateNodes();
        this.drawConnections();
        this.drawNodes();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NeuralNetwork('neuralCanvas');
});
