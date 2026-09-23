// Global variables for control inputs
let initLength;
let branchAngle;
let lengthDecay;
let initThickness;
let thicknessDecay;
let maxDepth;
let minBranchLength = 15;
let treeVariation;
let drawLeaves;
let leafType;
let leafShape = 'auto';
let windSway;
let windStrength;
let colorTheme;
let treeType = 'sequential'; // Default to sequential tree type
let treeFlowerColor = 'yellow'; // Determined once per tree based on treeSeed
let skyBgSystem; // Dynamic Sky Background Engine
let activeSavedTreeId = null; // Currently active loaded saved tree ID (for in-place editing/updating)

// Fern specific global parameters
let fernFrondCount = 5;
let fernSpreadAngle = 45;
let fernLeafletLength = 75;
let fernLeafletWidth = 100;
let fernTaperProfile = 1.2;
let fernBranchPoints = 8;
let fernAlternateRate = 0;

// High-entropy PRNG engine instance initialized with high-precision timestamp
let globalPRNG = (typeof RandomEngine !== 'undefined') ? new RandomEngine(Date.now() ^ Math.floor(Math.random() * 1e9)) : null;

function randFloat(min = 0, max = 1) {
  if (globalPRNG) {
    return globalPRNG.range(min, max);
  }
  return min + Math.random() * (max - min);
}

function randChoice(arr) {
  if (!arr || arr.length === 0) return null;
  let idx = Math.floor(randFloat(0, arr.length));
  return arr[idx];
}

// Parameter storage state for tree types
let paramState = {
  shared: {
    initLength: 200,
    branchAngle: 20,
    lengthDecay: 0.75,
    initThickness: 36,
    thicknessDecay: 0.66,
    maxDepth: 9,
    treeVariation: 0.80,
    leafType: 'emerald',
    leafShape: 'auto',
    windStrength: 1.0,
    colorTheme: 'cyberpunk',
    growthSpeed: 1.0
  },
  'barnsley-fern': {
    initLength: 640,
    initThickness: 4,
    maxDepth: 3,
    treeVariation: 0.15,
    windStrength: 1.0,
    leafType: 'emerald',
    growthSpeed: 1.0,
    fernFrondCount: 5,
    fernSpreadAngle: 45,
    fernLeafletLength: 75,
    fernLeafletWidth: 100,
    fernTaperProfile: 1.2,
    fernBranchPoints: 8,
    fernAlternateRate: 0
  }
};

function getActiveParamGroup(type) {
  if (type === 'barnsley-fern') {
    return 'barnsley-fern';
  } else {
    return 'shared';
  }
}

function toggleUIContext(type) {
  const isFern = (type === 'barnsley-fern');
  
  // Show/Hide specific control items using classList
  const fernOnly = document.querySelectorAll('.fern-only');
  const treeOnly = document.querySelectorAll('.tree-only');
  
  fernOnly.forEach(el => {
    if (isFern) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  
  treeOnly.forEach(el => {
    if (isFern) {
      el.classList.add('hidden');
    } else {
      el.classList.remove('hidden');
    }
  });
  
  // Change labels
  const initLengthLabel = document.querySelector('label[for="initLength"]');
  const initThicknessLabel = document.querySelector('label[for="initThickness"]');
  const maxDepthLabel = document.querySelector('label[for="maxDepth"]');
  
  if (isFern) {
    if (initLengthLabel) initLengthLabel.textContent = "Chiều dài lá chính";
    if (initThicknessLabel) initThicknessLabel.textContent = "Độ dày gốc lá";
    if (maxDepthLabel) maxDepthLabel.textContent = "Cấp đệ quy lá (2 - 4)";
  } else {
    if (initLengthLabel) initLengthLabel.textContent = "Chiều dài thân chính";
    if (initThicknessLabel) initThicknessLabel.textContent = "Độ dày gốc";
    if (maxDepthLabel) maxDepthLabel.textContent = "Độ sâu đệ quy";
  }
}

function loadParamsToUI(type) {
  const activeGroup = getActiveParamGroup(type);
  const params = paramState[activeGroup];
  
  if (!params) return;
  
  // Set element values in UI dynamically configuring initLength limits
  if (elements.initLength) {
    if (type === 'barnsley-fern') {
      elements.initLength.min = "300";
      elements.initLength.max = "900";
      elements.initLength.step = "10";
    } else {
      elements.initLength.min = "150";
      elements.initLength.max = "300";
      elements.initLength.step = "5";
    }
    elements.initLength.value = params.initLength;
  }
  if (elements.branchAngle && params.branchAngle !== undefined) elements.branchAngle.value = params.branchAngle;
  if (elements.lengthDecay && params.lengthDecay !== undefined) elements.lengthDecay.value = params.lengthDecay;
  
  // Configure initThickness limits dynamically before setting the value
  if (elements.initThickness) {
    if (type === 'barnsley-fern') {
      elements.initThickness.min = "1";
      elements.initThickness.max = "6";
      elements.initThickness.step = "0.5";
    } else {
      elements.initThickness.min = "36";
      elements.initThickness.max = "99";
      elements.initThickness.step = "1";
    }
    elements.initThickness.value = params.initThickness;
  }
  if (elements.thicknessDecay && params.thicknessDecay !== undefined) elements.thicknessDecay.value = params.thicknessDecay;
  
  // Configure maxDepth limits dynamically before setting the value
  if (elements.maxDepth) {
    if (type === 'barnsley-fern') {
      elements.maxDepth.min = "0";
      elements.maxDepth.max = "4";
    } else {
      elements.maxDepth.min = "8";
      elements.maxDepth.max = "12";
    }
    elements.maxDepth.value = params.maxDepth;
  }
  
  if (elements.treeVariation) elements.treeVariation.value = params.treeVariation;
  if (elements.growthSpeed) elements.growthSpeed.value = params.growthSpeed;
  if (elements.leafType && params.leafType !== undefined) {
    elements.leafType.value = params.leafType;
    leafType = params.leafType;
  }
  if (elements.leafShape && params.leafShape !== undefined) {
    elements.leafShape.value = params.leafShape;
    leafShape = params.leafShape;
  }
  if (elements.windStrength) elements.windStrength.value = params.windStrength;
  if (elements.colorTheme) elements.colorTheme.value = params.colorTheme;
  
  if (elements.fernFrondCount && params.fernFrondCount !== undefined) {
    elements.fernFrondCount.value = params.fernFrondCount;
  }
  if (elements.fernSpreadAngle && params.fernSpreadAngle !== undefined) {
    elements.fernSpreadAngle.value = params.fernSpreadAngle;
  }
  if (elements.fernLeafletLength && params.fernLeafletLength !== undefined) {
    elements.fernLeafletLength.value = params.fernLeafletLength;
  }
  if (elements.fernLeafletWidth && params.fernLeafletWidth !== undefined) {
    elements.fernLeafletWidth.value = params.fernLeafletWidth;
  }
  if (elements.fernTaperProfile && params.fernTaperProfile !== undefined) {
    elements.fernTaperProfile.value = params.fernTaperProfile;
  }
  if (elements.fernBranchPoints && params.fernBranchPoints !== undefined) {
    elements.fernBranchPoints.value = params.fernBranchPoints;
  }
  if (elements.fernAlternateRate && params.fernAlternateRate !== undefined) {
    elements.fernAlternateRate.value = params.fernAlternateRate;
  }

  // Toggle UI visibility
  toggleUIContext(type);
  
  // Refresh display labels via trigger
  triggerAllInputUpdates();
}

// Seed for deterministic noise/random tree generation
let treeSeed;
let canvasElement; // Store canvas reference for taking screenshots

// Real-time animation & growth simulation variables
let animationTime = 0; // Current simulation time T in seconds
let isPlaying = true; // Play state (default to true)
let simulationSpeed = 1.0; // Playback speed modifier
let treeRoot = null; // The root node of the stateful tree

// DOM elements references
const elements = {};

function setup() {
  // Create p5 canvas inside container
  const container = document.getElementById('canvas-container');
  const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('canvas-container');
  canvasElement = canvas; // Store canvas reference for screenshot captures

  // Initialize DOM references and event listeners
  initDOMControls();

  // Color mode setup
  colorMode(RGB, 255, 255, 255, 1);
  
  // Set lower frame rate for better performance if needed, 60fps is default
  frameRate(60);

  // Initialize PRNG seed and generate a 100% randomized tree right at startup!
  randomizeSettings();

  // Initialize Sky Background Engine
  if (typeof SkyBackgroundSystem !== 'undefined') {
    skyBgSystem = new SkyBackgroundSystem();
    skyBgSystem.init(width, height);
    if (elements.skyPreset && elements.skyPreset.value) {
      skyBgSystem.setPreset(elements.skyPreset.value);
    } else {
      skyBgSystem.setPreset('starry_night');
    }
  }
  
  // Populate the garden grid at start
  renderDashboardGrid();
}

function draw() {
  // Read current parameters from UI
  readUIValues();

  // Rebuild the tree root if it's null
  if (!treeRoot) {
    rebuildTree();
  }

  // Increment animation time if playing
  if (isPlaying) {
    let dt = (deltaTime / 1000) * simulationSpeed;
    // Clamp dt to avoid huge jumps if tab is unfocused
    dt = min(dt, 0.1);

    treeRoot.update(dt);
    animationTime += dt;

    // Check if the entire tree has finished growing
    if (treeRoot.isSubtreeFinished()) {
      isPlaying = false; // Pause when fully grown
      
      // Update UI button state
      const playText = document.getElementById('playText');
      const playIcon = document.getElementById('playIcon');
      const pauseIcon = document.getElementById('pauseIcon');
      if (playText && playIcon && pauseIcon) {
        playText.textContent = 'Phát';
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    }
  }

  // Update progress bar and age display
  updateGrowthUI();

  // Draw background based on color theme
  drawThemeBackground();

  // Position tree at the bottom center of screen
  translate(width / 2, height);
  
  // Initial tilt of the trunk based on noise for organic asymmetry
  if (treeVariation > 0) {
    let initTilt = (noise(99.9) - 0.5) * 2 * radians(15) * treeVariation; // +-15 degrees base tilt
    rotate(initTilt);
  }

  // Draw the stateful tree recursively
  let time = frameCount * 0.015; // Time variable for wind sway animation
  treeRoot.draw(time);

  // Ambient sky atmosphere lighting overlay
  if (typeof skyBgSystem !== 'undefined' && skyBgSystem) {
    let tint = skyBgSystem.getAmbientTint();
    if (tint && tint[3] > 0) {
      resetMatrix();
      push();
      noStroke();
      fill(tint[0], tint[1], tint[2], tint[3] / 255.0);
      rect(0, 0, width, height);
      pop();
    }
  }
}

function rebuildTree() {
  readUIValues();
  if (treeSeed === undefined) {
    treeSeed = Math.floor(randFloat(1, 999999999));
  }
  
  if (treeType === 'barnsley-fern') {
    treeRoot = new BarnsleyFernTree({
      initLength: initLength,
      maxDepth: maxDepth,
      treeVariation: treeVariation,
      fernFrondCount: fernFrondCount,
      fernSpreadAngle: fernSpreadAngle,
      initThickness: initThickness,
      fernLeafletLength: fernLeafletLength,
      fernLeafletWidth: fernLeafletWidth,
      fernTaperProfile: fernTaperProfile,
      fernBranchPoints: fernBranchPoints,
      fernAlternateRate: fernAlternateRate,
      windStrength: windStrength,
      leafType: leafType,
      seed: treeSeed
    });
  } else {
    treeRoot = new FractalBranchTree({
      initLength: initLength,
      branchAngle: branchAngle,
      lengthDecay: lengthDecay,
      initThickness: initThickness,
      thicknessDecay: thicknessDecay,
      maxDepth: maxDepth,
      minBranchLength: minBranchLength,
      treeVariation: treeVariation,
      leafType: leafType,
      leafShape: leafShape,
      treeType: treeType,
      windStrength: windStrength,
      colorTheme: colorTheme,
      seed: treeSeed
    });
  }
  
  animationTime = 0;
}

// Update the growth timeline HTML display elements
function updateGrowthUI() {
  const progressBar = document.getElementById('growthProgressBar');
  const ageVal = document.getElementById('growthAge-val');
  const speedVal = document.getElementById('growthSpeed-val');

  let totalTime = (treeRoot && typeof treeRoot.getTotalGrowthTime === 'function') ? treeRoot.getTotalGrowthTime() : 5.0;

  if (progressBar && treeRoot) {
    let progressPercent = totalTime > 0 ? constrain((animationTime / totalTime) * 100, 0, 100) : 0;
    progressBar.style.width = progressPercent.toFixed(1) + '%';
  }
  
  if (ageVal) {
    let displayCur = min(animationTime, totalTime);
    ageVal.textContent = displayCur.toFixed(1) + 's / ' + totalTime.toFixed(1) + 's';
  }
  
  if (speedVal) {
    speedVal.textContent = simulationSpeed.toFixed(1) + 'x';
  }
}


// Draw the application canvas background depending on theme or sky background preset
function drawThemeBackground() {
  if (typeof skyBgSystem !== 'undefined' && skyBgSystem) {
    skyBgSystem.updateAndDraw();
    
    // Apply weather wind bonus to tree wind strength
    let bonusWind = skyBgSystem.getWeatherWindBonus();
    if (treeRoot) {
      treeRoot.windStrength = (windStrength || 1.0) + bonusWind;
    }
  } else {
    switch(colorTheme) {
      case 'cyberpunk':
        background(6, 6, 12);
        break;
      case 'sakura':
        background(15, 12, 15);
        break;
      case 'emerald':
        background(5, 12, 8);
        break;
      case 'autumn':
        background(13, 10, 8);
        break;
      case 'monochrome':
        background(10, 10, 10);
        break;
      case 'rainbow':
      default:
        background(8, 8, 12);
        break;
    }
  }
}

// Responsive layout update
function windowResized() {
  const container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

// Initialize DOM control handlers
function initDOMControls() {
  const ids = [
    'initLength', 'branchAngle', 'lengthDecay', 'initThickness', 
    'thicknessDecay', 'maxDepth', 'minBranchLength', 'treeVariation', 'growthSpeed',
    'leafType', 'leafShape', 'windStrength', 'colorTheme', 'randomBtn', 'resetBtn', 'saveBtn',
    'treeTypeSelect', 'fernFrondCount', 'fernSpreadAngle', 'fernLeafletLength', 'fernLeafletWidth', 'fernTaperProfile', 'fernBranchPoints', 'fernAlternateRate'
  ];

  elements.treeVariation = document.getElementById('treeVariation');

  ids.forEach(id => {
    elements[id] = document.getElementById(id);
  });

  if (elements.treeTypeSelect) {
    elements.treeTypeSelect.addEventListener('change', () => {
      const newTreeType = elements.treeTypeSelect.value;
      loadParamsToUI(newTreeType);
      treeType = newTreeType;
      rebuildTree();
    });
  }

  if (elements.leafType) {
    elements.leafType.addEventListener('change', () => {
      rebuildTree();
    });
  }

  if (elements.leafShape) {
    elements.leafShape.addEventListener('change', () => {
      rebuildTree();
    });
  }

  elements.skyPreset = document.getElementById('skyPreset');
  elements.autoSkyCycle = document.getElementById('autoSkyCycle');

  if (elements.skyPreset) {
    elements.skyPreset.addEventListener('change', () => {
      if (skyBgSystem) {
        skyBgSystem.setPreset(elements.skyPreset.value);
      }
    });
  }

  if (elements.autoSkyCycle) {
    elements.autoSkyCycle.addEventListener('change', () => {
      if (skyBgSystem) {
        skyBgSystem.setAutoCycle(elements.autoSkyCycle.checked);
      }
    });
  }

  // Track slider display updates
  const sliderConfig = [
    { id: 'initLength', valId: 'initLength-val', suffix: 'px' },
    { id: 'branchAngle', valId: 'branchAngle-val', suffix: '°' },
    { id: 'lengthDecay', valId: 'lengthDecay-val', suffix: '' },
    { id: 'initThickness', valId: 'initThickness-val', suffix: 'px' },
    { id: 'thicknessDecay', valId: 'thicknessDecay-val', suffix: '' },
    { id: 'maxDepth', valId: 'maxDepth-val', suffix: '' },
    { id: 'minBranchLength', valId: 'minBranchLength-val', suffix: 'px' },
    { id: 'treeVariation', valId: 'treeVariation-val', suffix: '' },
    { id: 'growthSpeed', valId: 'growthSpeed-val', suffix: 'x' },
    { id: 'windStrength', valId: 'windStrength-val', suffix: '' },
    { id: 'fernFrondCount', valId: 'fernFrondCount-val', suffix: '' },
    { id: 'fernSpreadAngle', valId: 'fernSpreadAngle-val', suffix: '°' },
    { id: 'fernLeafletLength', valId: 'fernLeafletLength-val', suffix: '%' },
    { id: 'fernLeafletWidth', valId: 'fernLeafletWidth-val', suffix: '%' },
    { id: 'fernTaperProfile', valId: 'fernTaperProfile-val', suffix: '' },
    { id: 'fernBranchPoints', valId: 'fernBranchPoints-val', suffix: '' },
    { id: 'fernAlternateRate', valId: 'fernAlternateRate-val', suffix: '%' }
  ];

  sliderConfig.forEach(cfg => {
    const slider = elements[cfg.id];
    const valDisplay = document.getElementById(cfg.valId);
    
    if (slider && valDisplay) {
      // Set initial value
      valDisplay.textContent = slider.value + cfg.suffix;
      
      // Update value dynamically on slide
      slider.addEventListener('input', () => {
        valDisplay.textContent = slider.value + cfg.suffix;
        // Rebuild tree if slider affects tree structure
        const structural = [
          'initLength', 'branchAngle', 'lengthDecay', 'initThickness', 
          'thicknessDecay', 'maxDepth', 'minBranchLength', 'treeVariation', 'fernFrondCount', 'fernSpreadAngle', 'fernLeafletLength', 'fernLeafletWidth', 'fernTaperProfile', 'fernBranchPoints', 'fernAlternateRate'
        ];
        if (structural.includes(cfg.id)) {
          rebuildTree();
        }
      });
    }
  });

  // Growth Play/Pause Button
  const playBtn = document.getElementById('playBtn');
  const playText = document.getElementById('playText');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      // If growth reached completion, play again from start
      if (treeRoot && treeRoot.isSubtreeFinished()) {
        rebuildTree();
        isPlaying = true;
      } else {
        isPlaying = !isPlaying;
      }
      
      if (isPlaying) {
        playText.textContent = 'Tạm dừng';
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      } else {
        playText.textContent = 'Phát';
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    });
  }

  // Restart Button
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      rebuildTree();
      isPlaying = true;
      if (playText && playIcon && pauseIcon) {
        playText.textContent = 'Tạm dừng';
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      }
    });
  }

  // Button Actions
  if (elements.randomBtn) {
    elements.randomBtn.addEventListener('click', () => randomizeSettings(treeType));
  }

  // Save Tree and Garden buttons
  const saveTreeBtn = document.getElementById('saveTreeBtn');
  const gardenBtn = document.getElementById('gardenBtn');
  const closeDashboardBtn = document.getElementById('closeDashboardBtn');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  
  const newHybridBtn = document.getElementById('newHybridBtn');
  const newSequentialBtn = document.getElementById('newSequentialBtn');

  if (saveTreeBtn) {
    saveTreeBtn.addEventListener('click', () => {
      // Pause simulation while naming modal is open
      isPlaying = false;
      document.getElementById('saveModal').classList.remove('hidden');
      const nameInput = document.getElementById('treeNameInput');
      
      // If currently editing a loaded saved tree, pre-fill its name
      if (activeSavedTreeId) {
        let savedTrees = [];
        try {
          const existing = localStorage.getItem('saved_fractal_trees');
          if (existing) savedTrees = JSON.parse(existing);
        } catch (e) {}
        const activeTree = savedTrees.find(t => t.id === activeSavedTreeId);
        if (activeTree && nameInput) {
          nameInput.value = activeTree.name;
        }
      } else if (nameInput) {
        nameInput.value = '';
      }
      if (nameInput) nameInput.focus();
    });
  }

  if (gardenBtn) {
    gardenBtn.addEventListener('click', () => {
      showDashboard();
    });
  }

  if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', () => {
      hideDashboard();
    });
  }

  if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', () => {
      document.getElementById('saveModal').classList.add('hidden');
      isPlaying = true;
    });
  }

  if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', async () => {
      await saveTreeCurrent();
    });
  }

  const treeNameInput = document.getElementById('treeNameInput');
  if (treeNameInput) {
    treeNameInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await saveTreeCurrent();
      }
    });
  }

  if (newHybridBtn) {
    newHybridBtn.addEventListener('click', () => {
      hideDashboard();
      if (elements.treeTypeSelect) elements.treeTypeSelect.value = 'sequential';
      treeType = 'sequential';
      toggleUIContext('sequential');
      loadParamsToUI('sequential');
      randomizeSettings('sequential');
      isPlaying = true;
    });
  }

  if (newSequentialBtn) {
    newSequentialBtn.addEventListener('click', () => {
      hideDashboard();
      if (elements.treeTypeSelect) elements.treeTypeSelect.value = 'sequential';
      treeType = 'sequential';
      toggleUIContext('sequential');
      loadParamsToUI('sequential');
      randomizeSettings('sequential');
      isPlaying = true;
    });
  }

  const newFernBtn = document.getElementById('newFernBtn');
  if (newFernBtn) {
    newFernBtn.addEventListener('click', () => {
      hideDashboard();
      if (elements.treeTypeSelect) elements.treeTypeSelect.value = 'barnsley-fern';
      treeType = 'barnsley-fern';
      toggleUIContext('barnsley-fern');
      loadParamsToUI('barnsley-fern');
      randomizeSettings('barnsley-fern');
      isPlaying = true;
    });
  }
}

// Read current values of control widgets
function readUIValues() {
  if (elements.initLength && !isNaN(parseFloat(elements.initLength.value))) {
    initLength = parseFloat(elements.initLength.value);
  } else if (!initLength) {
    initLength = 200;
  }

  if (elements.branchAngle && !isNaN(parseFloat(elements.branchAngle.value))) {
    branchAngle = parseFloat(elements.branchAngle.value);
  } else if (!branchAngle) {
    branchAngle = 20;
  }

  if (elements.lengthDecay && !isNaN(parseFloat(elements.lengthDecay.value))) {
    lengthDecay = parseFloat(elements.lengthDecay.value);
  } else if (!lengthDecay) {
    lengthDecay = 0.75;
  }

  if (elements.initThickness && !isNaN(parseFloat(elements.initThickness.value))) {
    initThickness = parseFloat(elements.initThickness.value);
  } else if (!initThickness) {
    initThickness = 30;
  }

  if (elements.thicknessDecay && !isNaN(parseFloat(elements.thicknessDecay.value))) {
    thicknessDecay = parseFloat(elements.thicknessDecay.value);
  } else if (!thicknessDecay) {
    thicknessDecay = 0.66;
  }

  if (elements.treeVariation && !isNaN(parseFloat(elements.treeVariation.value))) {
    treeVariation = parseFloat(elements.treeVariation.value);
  } else if (treeVariation === undefined) {
    treeVariation = 0.80;
  }

  if (elements.growthSpeed && !isNaN(parseFloat(elements.growthSpeed.value))) {
    simulationSpeed = parseFloat(elements.growthSpeed.value);
  } else if (!simulationSpeed) {
    simulationSpeed = 1.0;
  }

  drawLeaves = true; // Permanently active

  if (elements.leafType && elements.leafType.value) {
    leafType = elements.leafType.value;
  } else if (!leafType) {
    leafType = 'emerald';
  }

  if (elements.leafShape && elements.leafShape.value) {
    leafShape = elements.leafShape.value;
  } else if (!leafShape) {
    leafShape = 'auto';
  }

  windSway = true; // Permanently active

  if (elements.windStrength && !isNaN(parseFloat(elements.windStrength.value))) {
    windStrength = parseFloat(elements.windStrength.value);
  } else if (windStrength === undefined) {
    windStrength = 1.0;
  }

  if (elements.colorTheme && elements.colorTheme.value) {
    colorTheme = elements.colorTheme.value;
  } else if (!colorTheme) {
    colorTheme = 'cyberpunk';
  }

  if (elements.skyPreset && elements.skyPreset.value && skyBgSystem) {
    if (!skyBgSystem.autoCycle) {
      skyBgSystem.setPreset(elements.skyPreset.value);
    }
  }
  if (elements.autoSkyCycle && skyBgSystem) {
    skyBgSystem.setAutoCycle(elements.autoSkyCycle.checked);
  }

  if (elements.treeTypeSelect && elements.treeTypeSelect.value) {
    treeType = elements.treeTypeSelect.value;
  } else if (!treeType) {
    treeType = 'sequential';
  }

  if (elements.maxDepth && !isNaN(parseInt(elements.maxDepth.value))) {
    maxDepth = parseInt(elements.maxDepth.value);
  } else if (!maxDepth) {
    maxDepth = 9;
  }

  if (elements.minBranchLength && !isNaN(parseFloat(elements.minBranchLength.value))) {
    minBranchLength = parseFloat(elements.minBranchLength.value);
  } else {
    minBranchLength = 15;
  }
  
  if (elements.fernFrondCount && elements.fernFrondCount.value) {
    fernFrondCount = parseInt(elements.fernFrondCount.value);
  }
  if (elements.fernSpreadAngle && elements.fernSpreadAngle.value) {
    fernSpreadAngle = parseFloat(elements.fernSpreadAngle.value);
  }
  if (elements.fernLeafletLength && elements.fernLeafletLength.value) {
    fernLeafletLength = parseFloat(elements.fernLeafletLength.value);
  }
  if (elements.fernLeafletWidth && elements.fernLeafletWidth.value) {
    fernLeafletWidth = parseFloat(elements.fernLeafletWidth.value);
  }
  if (elements.fernTaperProfile && elements.fernTaperProfile.value) {
    fernTaperProfile = parseFloat(elements.fernTaperProfile.value);
  }
  if (elements.fernBranchPoints && elements.fernBranchPoints.value) {
    fernBranchPoints = parseInt(elements.fernBranchPoints.value);
  }
  if (elements.fernAlternateRate && elements.fernAlternateRate.value) {
    fernAlternateRate = parseInt(elements.fernAlternateRate.value);
  }

  // Save current values to the active group in paramState
  const activeGroup = getActiveParamGroup(treeType);
  if (activeGroup === 'barnsley-fern') {
    paramState[activeGroup] = {
      initLength: initLength,
      initThickness: initThickness,
      maxDepth: maxDepth,
      treeVariation: treeVariation,
      growthSpeed: simulationSpeed,
      windStrength: windStrength,
      leafType: leafType,
      fernFrondCount: fernFrondCount,
      fernSpreadAngle: fernSpreadAngle,
      fernLeafletLength: fernLeafletLength,
      fernLeafletWidth: fernLeafletWidth,
      fernTaperProfile: fernTaperProfile,
      fernBranchPoints: fernBranchPoints,
      fernAlternateRate: fernAlternateRate
    };
  } else {
    paramState[activeGroup] = {
      initLength: initLength,
      branchAngle: branchAngle,
      lengthDecay: lengthDecay,
      initThickness: initThickness,
      thicknessDecay: thicknessDecay,
      maxDepth: maxDepth,
      treeVariation: treeVariation,
      growthSpeed: simulationSpeed,
      leafType: leafType,
      leafShape: leafShape,
      windStrength: windStrength,
      colorTheme: colorTheme
    };
  }

  // Optimize and shrink any legacy oversized tree screenshots in the background
  migrateLegacySavedTrees();
}

// Generate cool random parameter values using High-Entropy PRNG Suite
function randomizeSettings(userChosenType = null) {
  activeSavedTreeId = null; // Generating a new tree resets active saved tree ID
  treeSeed = Math.floor(randFloat(1, 999999999));
  
  // If no type explicitly specified by UI action, pick a random tree type (hybrid or sequential)
  if (!userChosenType && elements.treeTypeSelect) {
    const chosenType = 'sequential';
    elements.treeTypeSelect.value = chosenType;
    treeType = chosenType;
    toggleUIContext(treeType);
  }

  if (treeType === 'barnsley-fern') {
    // Fern specific random bounds using High-Entropy PRNG
    elements.initLength.value = Math.round(randFloat(540, 840));
    elements.initThickness.value = Math.round(randFloat(2, 6)); // thin stem/leaflet thickness
    elements.maxDepth.value = Math.round(randFloat(0, 4));
    elements.treeVariation.value = parseFloat(randFloat(0.02, 0.25).toFixed(2));
    elements.windStrength.value = parseFloat(randFloat(0.3, 1.7).toFixed(1));
    elements.fernFrondCount.value = Math.round(randFloat(3, 7));
    elements.fernSpreadAngle.value = Math.round(randFloat(30, 80) / 5) * 5;
    elements.fernLeafletLength.value = Math.round(randFloat(55, 135));
    elements.fernLeafletWidth.value = Math.round(randFloat(50, 160));
    elements.fernTaperProfile.value = parseFloat(randFloat(0.6, 2.4).toFixed(1));
    elements.fernBranchPoints.value = Math.round(randFloat(5, 15));
    elements.fernAlternateRate.value = randChoice([0, 0, 30, 50, 70, 100]); // 0 is symmetrical, higher is alternating
    
    // Random leaf color theme for fern
    const leaves = ['emerald', 'eucalyptus', 'sakura', 'autumn', 'ginkgo', 'wisteria', 'frost', 'sunset', 'midnight'];
    elements.leafType.value = randChoice(leaves);
  } else {
    elements.initLength.value = Math.round(randFloat(150, 300));
    elements.branchAngle.value = Math.round(randFloat(12, 36));
    elements.lengthDecay.value = parseFloat(randFloat(0.68, 0.86).toFixed(2));
    elements.initThickness.value = Math.round(randFloat(36, 99));
    elements.thicknessDecay.value = parseFloat(randFloat(0.48, 0.66).toFixed(2));
    elements.maxDepth.value = Math.round(randFloat(8, 11));
    elements.treeVariation.value = parseFloat(randFloat(0.65, 1.2).toFixed(2));
    elements.windStrength.value = parseFloat(randFloat(0.4, 1.8).toFixed(1));

    // Random theme selection
    const themes = ['cyberpunk', 'eucalyptus', 'sakura', 'autumn', 'emerald'];
    elements.colorTheme.value = randChoice(themes);

    // Random leaf selection from all leaf types
    const leaves = ['emerald', 'eucalyptus', 'sakura', 'autumn', 'ginkgo', 'wisteria', 'frost', 'sunset', 'midnight'];
    elements.leafType.value = randChoice(leaves);

    // Random leaf shape selection including all shapes
    const shapes = ['auto', 'willow', 'eucalyptus_long', 'round', 'tung_lahan', 'sakura_leaf', 'pointed', 'needle', 'single_needle', 'maple', 'maple5', 'ginkgo_fan', 'heart', 'bodhi', 'oval'];
    elements.leafShape.value = randChoice(shapes);
  }
  
  elements.growthSpeed.value = 1.0;

  // Rebuild the tree instance with the new randomized parameters & restart growth
  rebuildTree();
  animationTime = 0;
  isPlaying = true;

  // Update UI play button state
  const playText = document.getElementById('playText');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  if (playText && playIcon && pauseIcon) {
    playText.textContent = 'Tạm dừng';
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  }

  // Trigger input events to update DOM displays
  triggerAllInputUpdates();
}

// Reset settings to initial defaults
function resetSettings() {
  treeSeed = 42; // Set standard deterministic seed for default tree
  
  if (treeType === 'barnsley-fern') {
    if (elements.initLength) elements.initLength.value = 640;
    if (elements.initThickness) elements.initThickness.value = 4;
    if (elements.maxDepth) elements.maxDepth.value = 3;
    if (elements.treeVariation) elements.treeVariation.value = 0.15;
    if (elements.windStrength) elements.windStrength.value = 1.0;
    if (elements.colorTheme) elements.colorTheme.value = 'emerald';
    
    if (elements.fernFrondCount) elements.fernFrondCount.value = 5;
    if (elements.fernSpreadAngle) elements.fernSpreadAngle.value = 45;
    if (elements.fernLeafletLength) elements.fernLeafletLength.value = 75;
    if (elements.fernLeafletWidth) elements.fernLeafletWidth.value = 100;
    if (elements.fernTaperProfile) elements.fernTaperProfile.value = 1.2;
    if (elements.fernBranchPoints) elements.fernBranchPoints.value = 8;
    if (elements.fernAlternateRate) elements.fernAlternateRate.value = 0;
  } else {
    if (elements.initLength) elements.initLength.value = 200;
    if (elements.branchAngle) elements.branchAngle.value = 20;
    if (elements.lengthDecay) elements.lengthDecay.value = 0.75;
    if (elements.initThickness) elements.initThickness.value = 30;
    if (elements.thicknessDecay) elements.thicknessDecay.value = 0.66;
    if (elements.maxDepth) elements.maxDepth.value = 9;
    if (elements.treeVariation) elements.treeVariation.value = 0.80;
    
    if (elements.leafType) elements.leafType.value = 'emerald';
    if (elements.leafShape) elements.leafShape.value = 'auto';
    if (elements.windStrength) elements.windStrength.value = 1.0;
    if (elements.colorTheme) elements.colorTheme.value = 'cyberpunk';
  }
  if (elements.growthSpeed) elements.growthSpeed.value = 1.0;
  
  rebuildTree();
  animationTime = 0;
  isPlaying = true;
  triggerAllInputUpdates();
}

// Save tree drawing as file
function exportImage() {
  // Prompt user for file name prefix or default to timestamp
  let filename = 'fractal-tree-' + year() + month() + day() + '-' + hour() + minute() + second();
  saveCanvas(filename, 'png');
}

// Trigger input events on all sliders/inputs to refresh text displays and toggle sections
function triggerAllInputUpdates() {
  const ids = [
    'initLength', 'branchAngle', 'lengthDecay', 'initThickness', 
    'thicknessDecay', 'maxDepth', 'minBranchLength', 'treeVariation', 'growthSpeed', 'windStrength',
    'fernFrondCount', 'fernSpreadAngle', 'fernLeafletLength', 'fernLeafletWidth', 'fernTaperProfile', 'fernBranchPoints', 'fernAlternateRate'
  ];
  
  ids.forEach(id => {
    const el = elements[id];
    if (el) {
      // Dispatch input event to refresh text display
      el.dispatchEvent(new Event('input'));
    }
  });
}

// Storage & Dashboard Logic

// Generate a lightweight thumbnail from canvas element (360x270 @ 0.72 quality ~15-20KB)
function generateThumbnail(sourceCanvas, targetWidth = 360, targetHeight = 270, quality = 0.72) {
  try {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = targetWidth;
    thumbCanvas.height = targetHeight;
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.5);

    // Deep dark background
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    if (sw > 0 && sh > 0) {
      // Cover the thumbnail while preserving aspect ratio
      const scale = Math.max(targetWidth / sw, targetHeight / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (targetWidth - dw) / 2;
      const dy = (targetHeight - dh) / 2;
      ctx.drawImage(sourceCanvas, dx, dy, dw, dh);
    }
    return thumbCanvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('Thumbnail generation fallback:', err);
    try {
      return sourceCanvas.toDataURL('image/jpeg', 0.5);
    } catch (e2) {
      return '';
    }
  }
}

// Downscale an existing base64 image data URL (useful for migration & quota recovery)
function compressBase64Image(dataUrl, targetWidth = 320, targetHeight = 240, quality = 0.65) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = targetWidth;
        thumbCanvas.height = targetHeight;
        const ctx = thumbCanvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.fillStyle = '#0a0b10';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (targetWidth - dw) / 2;
        const dy = (targetHeight - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        resolve(thumbCanvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Background optimization pass to shrink legacy uncompressed full-res tree screenshots
async function migrateLegacySavedTrees() {
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (!existing) return;
    let trees = JSON.parse(existing);
    if (!Array.isArray(trees)) return;

    let modified = false;
    for (let t of trees) {
      if (t.screenshot && t.screenshot.length > 40000) {
        t.screenshot = await compressBase64Image(t.screenshot, 360, 270, 0.7);
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem('saved_fractal_trees', JSON.stringify(trees));
      console.log('Fractal tree storage optimized successfully.');
    }
  } catch (err) {
    console.warn('Storage optimization check note:', err);
  }
}

// Safe storage saving with progressive quota recovery
async function safeSaveTreesToStorage(trees) {
  const STORAGE_KEY = 'saved_fractal_trees';

  const trySet = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  };

  // Attempt 1: Direct save
  if (trySet(trees)) return true;

  console.warn('localStorage quota warning: attempting compression on saved trees...');

  // Attempt 2: Downsample any oversized screenshots (> 40,000 chars)
  for (let t of trees) {
    if (t.screenshot && t.screenshot.length > 40000) {
      t.screenshot = await compressBase64Image(t.screenshot, 320, 240, 0.65);
    }
  }
  if (trySet(trees)) return true;

  // Attempt 3: Aggressively compress all screenshots
  for (let t of trees) {
    if (t.screenshot && t.screenshot.length > 15000) {
      t.screenshot = await compressBase64Image(t.screenshot, 240, 180, 0.5);
    }
  }
  if (trySet(trees)) return true;

  // Attempt 4: Keep screenshots only on the 5 newest trees, empty older screenshots to preserve metadata
  if (trees.length > 5) {
    for (let i = 0; i < trees.length - 5; i++) {
      trees[i].screenshot = '';
    }
    if (trySet(trees)) return true;
  }

  // Attempt 5: Notify user cleanly without an uncaught exception
  alert('Bộ nhớ trình duyệt (localStorage) đã đầy. Hãy xóa bớt một số cây cũ trong Khu vườn để lưu cây mới.');
  return false;
}

// Save or update the current tree parameters and screenshot in local storage
async function saveTreeCurrent() {
  const nameInput = document.getElementById('treeNameInput');
  let name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    name = "Cây Độc Bản (" + new Date().toLocaleDateString() + ")";
  }
  
  // Hide modal first
  const saveModal = document.getElementById('saveModal');
  if (saveModal) saveModal.classList.add('hidden');
  isPlaying = true;
  
  // Capture lightweight thumbnail (360x270 @ 0.72 quality ~15-20KB)
  let dataUrl = '';
  if (canvasElement && canvasElement.elt) {
    dataUrl = generateThumbnail(canvasElement.elt, 360, 270, 0.72);
  }
  
  // Prepare current parameter payload
  const currentParams = {
    initLength: elements.initLength.value,
    branchAngle: elements.branchAngle ? elements.branchAngle.value : undefined,
    lengthDecay: elements.lengthDecay ? elements.lengthDecay.value : undefined,
    initThickness: elements.initThickness.value,
    thicknessDecay: elements.thicknessDecay ? elements.thicknessDecay.value : undefined,
    maxDepth: elements.maxDepth.value,
    treeVariation: elements.treeVariation.value,
    windStrength: elements.windStrength.value,
    growthSpeed: elements.growthSpeed.value,
    leafType: elements.leafType ? elements.leafType.value : (leafType || 'emerald'),
    leafShape: elements.leafShape ? elements.leafShape.value : (leafShape || 'auto'),
    colorTheme: elements.colorTheme.value,
    fernFrondCount: elements.fernFrondCount ? elements.fernFrondCount.value : undefined,
    fernSpreadAngle: elements.fernSpreadAngle ? elements.fernSpreadAngle.value : undefined,
    fernLeafletLength: elements.fernLeafletLength ? elements.fernLeafletLength.value : undefined,
    fernLeafletWidth: elements.fernLeafletWidth ? elements.fernLeafletWidth.value : undefined,
    fernTaperProfile: elements.fernTaperProfile ? elements.fernTaperProfile.value : undefined,
    fernBranchPoints: elements.fernBranchPoints ? elements.fernBranchPoints.value : undefined,
    fernAlternateRate: elements.fernAlternateRate ? elements.fernAlternateRate.value : undefined
  };

  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }

  // Check if we are updating an existing loaded saved tree card
  const existingIdx = activeSavedTreeId ? savedTrees.findIndex(t => t.id === activeSavedTreeId) : -1;

  if (existingIdx !== -1) {
    // Update existing tree in place with fresh screenshot, date, seed, and parameters
    savedTrees[existingIdx].name = name;
    savedTrees[existingIdx].date = new Date().toLocaleString() + " (Đã cập nhật)";
    savedTrees[existingIdx].screenshot = dataUrl;
    savedTrees[existingIdx].seed = treeSeed;
    savedTrees[existingIdx].treeType = treeType;
    savedTrees[existingIdx].params = currentParams;
  } else {
    // Create new saved tree entry
    const newId = Date.now().toString();
    const treeData = {
      id: newId,
      name: name,
      date: new Date().toLocaleString(),
      screenshot: dataUrl,
      seed: treeSeed,
      treeType: treeType,
      params: currentParams
    };
    savedTrees.push(treeData);
    activeSavedTreeId = newId;
  }
  
  await safeSaveTreesToStorage(savedTrees);
  
  // Open the dashboard to show the updated tree card
  showDashboard();
}

// Load a saved tree's parameters and seed
function loadSavedTree(id) {
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }
  
  const tree = savedTrees.find(t => t.id === id);
  if (!tree) return;

  // Set activeSavedTreeId to track this tree for in-place updates when saving
  activeSavedTreeId = id;
  
  // Load variables and seed
  treeSeed = tree.seed;
  treeType = (tree.treeType === 'barnsley-fern') ? 'barnsley-fern' : 'sequential';
  if (elements.treeTypeSelect) {
    elements.treeTypeSelect.value = treeType;
  }
  
  // Load DOM elements values
  const params = tree.params;
  
  let targetLeafShape = params.leafShape || 'auto';
  leafShape = targetLeafShape;
  if (elements.leafShape) {
    elements.leafShape.value = targetLeafShape;
  }

  let targetLeafType = params.leafType || 'emerald';
  leafType = targetLeafType;
  if (elements.leafType) {
    elements.leafType.value = targetLeafType;
  }

  Object.keys(params).forEach(key => {
    if (elements[key] && params[key] !== undefined) {
      elements[key].value = params[key];
    }
  });
  
  // Save loaded parameters to correct active group in paramState
  const activeGroup = getActiveParamGroup(treeType);
  if (activeGroup === 'barnsley-fern') {
    paramState[activeGroup] = {
      initLength: parseFloat(params.initLength),
      initThickness: parseFloat(params.initThickness),
      maxDepth: parseInt(params.maxDepth),
      treeVariation: parseFloat(params.treeVariation),
      growthSpeed: parseFloat(params.growthSpeed || 1.0),
      windStrength: parseFloat(params.windStrength),
      colorTheme: params.colorTheme,
      fernFrondCount: parseInt(params.fernFrondCount || 5),
      fernSpreadAngle: parseFloat(params.fernSpreadAngle || 45),
      fernLeafletLength: parseFloat(params.fernLeafletLength || 75),
      fernLeafletWidth: parseFloat(params.fernLeafletWidth || 100),
      fernTaperProfile: parseFloat(params.fernTaperProfile || 1.2),
      fernBranchPoints: parseInt(params.fernBranchPoints || 8),
      fernAlternateRate: parseInt(params.fernAlternateRate || 0)
    };
  } else {
    paramState[activeGroup] = {
      initLength: parseFloat(params.initLength),
      branchAngle: parseFloat(params.branchAngle),
      lengthDecay: parseFloat(params.lengthDecay),
      initThickness: parseFloat(params.initThickness),
      thicknessDecay: parseFloat(params.thicknessDecay),
      maxDepth: parseInt(params.maxDepth),
      treeVariation: parseFloat(params.treeVariation),
      growthSpeed: parseFloat(params.growthSpeed || 1.0),
      leafType: targetLeafType,
      leafShape: targetLeafShape,
      windStrength: parseFloat(params.windStrength),
      colorTheme: params.colorTheme
    };
  }
  
  // Close dashboard and trigger rebuild
  hideDashboard();
  toggleUIContext(treeType);
  triggerAllInputUpdates();
  rebuildTree();
  
  // Tải trực tiếp cây ở trạng thái trưởng thành hoàn toàn (100% tán lá và cành)
  if (treeRoot && typeof treeRoot.getTotalGrowthTime === 'function') {
    let matureTime = treeRoot.getTotalGrowthTime();
    treeRoot.update(matureTime + 10.0);
    animationTime = matureTime;
  }
  
  isPlaying = true;
}

// Delete a saved tree from localStorage
function deleteSavedTree(id) {
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }
  
  savedTrees = savedTrees.filter(t => t.id !== id);
  try {
    localStorage.setItem('saved_fractal_trees', JSON.stringify(savedTrees));
  } catch (e) {
    console.error('Failed to update localStorage on delete:', e);
  }

  if (activeSavedTreeId === id) {
    activeSavedTreeId = null;
  }
  
  // Refresh the grid display
  renderDashboardGrid();
}

// Open the full-screen dashboard overlay
function showDashboard() {
  document.getElementById('dashboardOverlay').classList.remove('hidden');
  renderDashboardGrid();
}

// Close the dashboard overlay
function hideDashboard() {
  document.getElementById('dashboardOverlay').classList.add('hidden');
}

// Dictionary maps for human-readable card parameter labels
const gardenLabelMaps = {
  leafShape: {
    'willow': 'Lá Liễu Rủ',
    'eucalyptus_long': 'Lá Bạch Đàn Dài',
    'round': 'Lá Bạc Hà Tròn',
    'tung_lahan': 'Lá Tùng La Hán',
    'sakura_leaf': 'Hoa Anh Đào',
    'pointed': 'Lá Đỉnh Nhọn',
    'needle': 'Lá Thông',
    'single_needle': 'Lá Me',
    'maple': 'Lá Phong tròn',
    'maple5': 'Lá Phong nhọn',
    'ginkgo_fan': 'Lá Ngân Hạnh',
    'heart': 'Lá Trái Tim',
    'bodhi': 'Lá Bồ Đề',
    'fern': 'Lá Dương Xỉ',
    'auto': 'Tự Động'
  },
  leafType: {
    'emerald': 'Lục Bảo',
    'autumn': 'Lá Thu Vàng',
    'sakura': 'Hoa Anh Đào Hồng',
    'fire': 'Hỏa Diệm',
    'neon': 'Dạ Quang',
    'golden': 'Hoàng Kim',
    'frost': 'Băng Tuyết'
  },
  colorTheme: {
    'monochrome': 'Monochrome (Trắng - Đen)',
    'cyberpunk': 'Cyberpunk (Gỗ Đen - Lá Neon)',
    'eucalyptus': 'Eucalyptus (Gỗ Thẫm)',
    'sakura': 'Sakura (Gỗ Nâu)',
    'autumn': 'Autumn (Gỗ Hổ Phách)',
    'emerald': 'Forest Emerald (Gỗ Rừng)'
  }
};

// Render dynamic saved tree card grid from localStorage
function renderDashboardGrid() {
  const grid = document.getElementById('gardenGrid');
  if (!grid) return;
  
  // Clean all items
  grid.innerHTML = '';
  
  // Load saved trees from storage
  let savedTrees = [];
  try {
    const existing = localStorage.getItem('saved_fractal_trees');
    if (existing) {
      savedTrees = JSON.parse(existing);
    }
  } catch (e) {
    console.error(e);
  }

  if (savedTrees.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.6;">🌱</div>
        <p style="font-size: 1.1rem; margin-bottom: 8px; font-weight: 500; color: var(--text-main);">Khu vườn của bạn chưa có cây nào.</p>
        <p style="font-size: 0.9rem; opacity: 0.75;">Hãy tùy biến thông số rồi nhấn <strong>"Lưu cây này"</strong> ở thanh điều khiển để bắt đầu bộ sưu tập!</p>
      </div>
    `;
    return;
  }
  
  // Draw cards in reverse order (newest first)
  savedTrees.slice().reverse().forEach(tree => {
    const card = document.createElement('div');
    card.className = 'tree-card';

    const p = tree.params || {};
    const shapeLabel = gardenLabelMaps.leafShape[p.leafShape] || p.leafShape || 'Tự động';
    const leafColorLabel = gardenLabelMaps.leafType[p.leafType] || p.leafType || 'Emerald';
    const barkColorLabel = gardenLabelMaps.colorTheme[p.colorTheme] || p.colorTheme || 'Forest Emerald';
    
    const previewHtml = tree.screenshot
      ? `<img src="${tree.screenshot}" alt="${tree.name}">`
      : `<div class="tree-card-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <path d="M12 2v20M12 7l4 3M12 7l-4 3M12 12l5 3M12 12l-5 3M12 17l6 3M12 17l-6 3"/>
           </svg>
           <span>Cây Độc Bản</span>
         </div>`;

    card.innerHTML = `
      <div class="tree-card-preview">
        ${previewHtml}
      </div>
      <div class="tree-card-info">
        <div class="tree-card-title">${tree.name}</div>
        <div class="tree-card-meta">${tree.date}</div>
        
        <div class="tree-card-params">
          <div class="param-tag"><span class="tag-icon">🌿</span> <span class="tag-label">Dạng lá:</span> <strong>${shapeLabel}</strong></div>
          <div class="param-tag"><span class="tag-icon">🎨</span> <span class="tag-label">Màu lá:</span> <strong>${leafColorLabel}</strong></div>
          <div class="param-tag"><span class="tag-icon">🪵</span> <span class="tag-label">Gốc/cành:</span> <strong>${barkColorLabel}</strong></div>
        </div>

        <div class="tree-card-actions">
          <button class="btn-card-load" onclick="loadSavedTree('${tree.id}')">Xem cây</button>
          <button class="btn-card-delete" onclick="deleteSavedTree('${tree.id}')">Xóa</button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// Bind to window for global inline onclick access
window.loadSavedTree = loadSavedTree;
window.deleteSavedTree = deleteSavedTree;
