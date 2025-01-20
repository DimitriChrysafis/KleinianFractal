const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { antialias: true });

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let isAnimating = true;
let time = 0;
let zoom = 1.0;
let targetZoom = zoom;
const ZOOM_SPEED = 0.15;
let panX = 0.5, panY = 0.9;
let targetPanX = panX, targetPanY = panY;
const PAN_SPEED = 0.1;

async function init() {
    const vertexShaderSource = await fetch('vertex.glsl').then(res => res.text());
    const fragmentShaderSource = await fetch('fragment.glsl').then(res => res.text());

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const program = gl.createProgram();
    const vShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    const positions = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'iTime');
    const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const zoomLocation = gl.getUniformLocation(program, 'zoom');
    const mousePosLocation = gl.getUniformLocation(program, 'mousePos');
    const panLocation = gl.getUniformLocation(program, 'pan');

    let mouseX = 0, mouseY = 0;
    let isDragging = false;
    let lastX = 0, lastY = 0;

    function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        zoom += (targetZoom - zoom) * ZOOM_SPEED;
        panX += (targetPanX - panX) * PAN_SPEED;
        panY += (targetPanY - panY) * PAN_SPEED;

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        gl.uniform1f(timeLocation, time);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(zoomLocation, zoom);
        gl.uniform2f(mousePosLocation, mouseX, mouseY);
        gl.uniform2f(panLocation, panX, panY);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function animate() {
        if (isAnimating) {
            time += 0.016;
            render();
            requestAnimationFrame(animate);
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / rect.width * 2 - 1;
        mouseY = (e.clientY - rect.top) / rect.height * 2 - 1;

        if (isDragging) {
            const dx = (e.clientX - lastX) / canvas.width * zoom * 2;
            const dy = (e.clientY - lastY) / canvas.height * zoom * 2;
            targetPanX -= dx * (canvas.width / canvas.height);
            targetPanY += dy;
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    animate();
}

init();
