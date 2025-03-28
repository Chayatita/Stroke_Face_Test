// DOM Elements
const video = document.getElementById('camera');
const preview = document.getElementById('preview');
const startBtn = document.getElementById('startBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const probabilityBar = document.getElementById('probabilityBar');
const probabilityText = document.getElementById('probabilityText');
const resultDetails = document.getElementById('resultDetails');

// Initialize Roboflow
const rf = new Roboflow({
    api_key: "DIggXL01Uhbk48cAXu3V" // Replace with your publishable key for production
});
let model;

// Load AI model
async function loadModel() {
    try {
        model = await rf.detect({
            model: "stroke-aware-bell-s-palsy-pjbqz",
            version: 7
        });
        resultDetails.textContent = "Ready to analyze photos";
    } catch (err) {
        resultDetails.textContent = "Failed to load AI model";
        console.error("Model loading error:", err);
    }
}

// Start camera
startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        video.srcObject = stream;
        analyzeBtn.disabled = false;
        resultDetails.textContent = "Camera ready - Click 'Check Probability'";
    } catch (err) {
        resultDetails.textContent = `Camera error: ${err.message}`;
    }
});

// Analyze from camera
analyzeBtn.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    preview.src = canvas.toDataURL();
    preview.style.display = 'block';
    video.style.display = 'none';
    
    await analyzeImage(canvas);
});

// Handle file upload
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const img = new Image();
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        video.style.display = 'none';
        
        await analyzeImage(canvas);
    };
    img.src = URL.createObjectURL(file);
});

// Main analysis function
async function analyzeImage(canvas) {
    resultDetails.textContent = "Analyzing...";
    analyzeBtn.disabled = true;
    
    try {
        const predictions = await model.detect(canvas);
        
        if (!predictions || predictions.length === 0) {
            updateProbability(0);
            resultDetails.textContent = "No face detected";
            return;
        }
        
        // Find Bell's Palsy prediction
        const bpPrediction = predictions.find(p => p.class.toLowerCase().includes('bell'));
        const probability = bpPrediction ? Math.round(bpPrediction.confidence * 100) : 0;
        
        updateProbability(probability);
        displayResults(probability);
        
    } catch (err) {
        console.error("Analysis error:", err);
        resultDetails.textContent = "Analysis failed. Please try again.";
        updateProbability(0);
    } finally {
        analyzeBtn.disabled = false;
    }
}

// Update visual probability display
function updateProbability(percent) {
    probabilityBar.style.width = `${percent}%`;
    probabilityText.textContent = `${percent}% Probability`;
    
    // Color coding
    if (percent > 70) {
        probabilityBar.style.background = "#e63946"; // Red
    } else if (percent > 30) {
        probabilityBar.style.background = "#ffbe0b"; // Yellow
    } else {
        probabilityBar.style.background = "#2a9d8f"; // Green
    }
}

// Display textual results
function displayResults(probability) {
    if (probability > 70) {
        resultDetails.innerHTML = `
            <strong>High likelihood of Bell's Palsy</strong>
            <p>We recommend consulting a neurologist for evaluation</p>
        `;
    } else if (probability > 30) {
        resultDetails.innerHTML = `
            <strong>Possible facial asymmetry detected</strong>
            <p>Monitor symptoms and consider medical advice if they persist</p>
        `;
    } else {
        resultDetails.innerHTML = `
            <strong>No significant asymmetry detected</strong>
            <p>Normal facial symmetry observed</p>
        `;
    }
}

// Initialize
loadModel();