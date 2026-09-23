/**
 * SkyBackgroundSystem - Lightweight Dynamic Sky Background Renderer for p5.js
 * Supported Presets:
 * 1. 'clear_blue'   - Trong xanh (Clear Blue Sky)
 * 2. 'sunny'        - Nắng rực rỡ (Bright Sunlight & Volumetric Sunbeams)
 * 3. 'rainy'        - Mưa rào (Rainfall Particles)
 * 4. 'misty'        - Sương mù (Misty Ambient Atmosphere)
 * 5. 'sunset'       - Hoàng hôn (Golden Purple Sunset & Setting Sun)
 * 6. 'sunrise'      - Bình minh (Pastel Pink Morning Glow & Rising Sun)
 * 7. 'starry_night' - Đêm đầy sao (Twinkling Starfield & Crescent Moon)
 */

class SkyBackgroundSystem {
  constructor() {
    this.currentPreset = 'starry_night';
    this.targetPreset = 'starry_night';
    this.autoCycle = false;
    this.cycleTime = 0;
    this.cycleDuration = 30.0; // Seconds per sky phase in auto-cycle

    // Particle Systems (Optimized: Clouds & Fog removed for ultra-fast performance)
    this.rainParticles = [];
    this.stars = [];
    this.sunbeams = [];

    this.initialized = false;
  }

  init(width, height) {
    this.width = width;
    this.height = height;

    // Initialize 160 rain particles (Alpha in range 0.0 - 1.0)
    this.rainParticles = [];
    for (let i = 0; i < 160; i++) {
      this.rainParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 12 + Math.random() * 18,
        speed: 14 + Math.random() * 12,
        weight: 0.8 + Math.random() * 1.0,
        alpha: 0.45 + Math.random() * 0.35
      });
    }

    // Initialize 200 twinkling stars (Alpha in range 0.0 - 1.0)
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.75),
        size: 0.8 + Math.random() * 2.2,
        baseAlpha: 0.4 + Math.random() * 0.5,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Initialize volumetric sunbeams (Alpha in range 0.0 - 1.0)
    this.sunbeams = [];
    for (let i = 0; i < 7; i++) {
      this.sunbeams.push({
        angle: radians(-25 + i * 8 + Math.random() * 4),
        width: 40 + Math.random() * 50,
        alpha: 0.12 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.initialized = true;
  }

  setPreset(presetKey) {
    if (this.presets[presetKey]) {
      this.currentPreset = presetKey;
      this.targetPreset = presetKey;
    }
  }

  setAutoCycle(enabled) {
    this.autoCycle = enabled;
  }

  get presets() {
    return {
      'none': {
        name: 'Nền đen đặc (Deep Black)',
        topColor: [6, 6, 12],
        bottomColor: [6, 6, 12],
        ambientTint: [0, 0, 0, 0],
        windBonus: 0.0
      },
      'clear_blue': {
        name: 'Trong xanh (Clear Blue)',
        topColor: [96, 165, 250],     // Pure True Sky Blue (Không ngả xanh lá)
        bottomColor: [191, 219, 254], // Soft Pastel Powder Blue
        ambientTint: [147, 197, 253, 0.04],
        windBonus: 0.2
      },
      'sunny': {
        name: 'Nắng dịu (Sunny Pastel)',
        topColor: [185, 242, 254],    // Soft azure blue
        bottomColor: [255, 245, 186], // Soft cream gold
        ambientTint: [255, 248, 220, 0.08],
        windBonus: 0.3,
        hasSunbeams: true
      },
      'rainy': {
        name: 'Mưa rào (Rainy)',
        topColor: [100, 116, 139],    // Soft slate blue-gray
        bottomColor: [148, 163, 184], // Soft misty gray
        ambientTint: [148, 163, 184, 0.10],
        windBonus: 1.2,
        hasRain: true
      },
      'misty': {
        name: 'Sương mù (Misty Fog)',
        topColor: [148, 163, 184],    // Soft slate gray
        bottomColor: [226, 232, 240], // Soft cloud haze
        ambientTint: [203, 213, 225, 0.08],
        windBonus: 0.4
      },
      'sunset': {
        name: 'Hoàng hôn (Sunset Pastel)',
        gradientStops: [
          [255, 248, 220], // 1. Dưới cùng: Vàng kem pastel siêu nhẹ
          [255, 218, 185], // 2. Tầng dưới: Cam đào pastel mờ dịu
          [245, 195, 215], // 3. Tầng trên: Hồng phấn pastel dịu ngọt
          [185, 160, 215]   // 4. Trên cùng: Tím oải hương pastel mượt mờ nhạt
        ],
        ambientTint: [255, 200, 205, 0.08],
        windBonus: 0.3
      },
      'sunrise': {
        name: 'Bình minh (Sunrise Pastel)',
        topColor: [184, 192, 255],    // 3. Trên cùng: Tím/Xanh oải hương dịu
        middleColor: [255, 198, 255], // 2. Ở giữa: Hồng phấn pastel
        bottomColor: [255, 190, 175], // 1. Dưới cùng: Cam đào / Vàng ấp áp
        ambientTint: [255, 200, 190, 0.10],
        windBonus: 0.2
      },
      'starry_night': {
        name: 'Đêm đầy sao (Starry Night)',
        topColor: [25, 25, 65],       // Soft midnight indigo
        bottomColor: [45, 45, 95],     // Soft twilight navy
        ambientTint: [199, 210, 254, 0.08],
        windBonus: 0.1,
        hasStars: true,
        hasMoon: true
      }
    };
  }

  getWeatherWindBonus() {
    let preset = this.presets[this.currentPreset];
    return preset ? (preset.windBonus || 0.0) : 0.0;
  }

  getAmbientTint() {
    let preset = this.presets[this.currentPreset];
    return preset ? (preset.ambientTint || [255, 255, 255, 0.0]) : [255, 255, 255, 0.0];
  }

  updateAndDraw() {
    if (!this.initialized || this.width !== width || this.height !== height) {
      this.init(width, height);
    }

    // Auto-cycle logic
    if (this.autoCycle) {
      this.cycleTime += 1 / 60;
      let cycleList = ['sunrise', 'sunny', 'clear_blue', 'sunset', 'starry_night', 'misty', 'rainy'];
      let index = Math.floor((this.cycleTime / this.cycleDuration) % cycleList.length);
      this.currentPreset = cycleList[index];
    }

    let preset = this.presets[this.currentPreset] || this.presets['clear_blue'];

    // 1. Draw Sky Gradient Background
    this.drawSkyGradient(preset);

    // 2. Draw Moon (if Starry Night)
    if (preset.hasMoon) this.drawMoon(width * 0.80, height * 0.20);

    // 3. Draw Stars
    if (preset.hasStars) this.drawStars();

    // 4. Draw Volumetric Sunbeams
    if (preset.hasSunbeams) this.drawSunbeams(width * 0.78, height * 0.22);

    // 5. Draw Rain Particles
    if (preset.hasRain) this.drawRain();
  }

  drawSkyGradient(preset) {
    let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (ctx) {
      if (preset.gradientStops && preset.gradientStops.length === 4) {
        let grad = ctx.createLinearGradient(0, 0, 0, height);
        let s0 = preset.gradientStops[3]; // Top (Tím)
        let s1 = preset.gradientStops[2]; // Upper-mid (Hồng)
        let s2 = preset.gradientStops[1]; // Lower-mid (Cam)
        let s3 = preset.gradientStops[0]; // Bottom (Vàng)
        grad.addColorStop(0.000, `rgb(${s0[0]}, ${s0[1]}, ${s0[2]})`);
        grad.addColorStop(0.333, `rgb(${s1[0]}, ${s1[1]}, ${s1[2]})`);
        grad.addColorStop(0.666, `rgb(${s2[0]}, ${s2[1]}, ${s2[2]})`);
        grad.addColorStop(1.000, `rgb(${s3[0]}, ${s3[1]}, ${s3[2]})`);

        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        return;
      }

      let topC = preset.topColor;
      let bottomC = preset.bottomColor;
      let grad = ctx.createLinearGradient(0, 0, 0, height);

      if (preset.middleColor) {
        let midC = preset.middleColor;
        grad.addColorStop(0.0, `rgb(${topC[0]}, ${topC[1]}, ${topC[2]})`);
        grad.addColorStop(0.5, `rgb(${midC[0]}, ${midC[1]}, ${midC[2]})`);
        grad.addColorStop(1.0, `rgb(${bottomC[0]}, ${bottomC[1]}, ${bottomC[2]})`);
      } else {
        grad.addColorStop(0.0, `rgb(${topC[0]}, ${topC[1]}, ${topC[2]})`);
        grad.addColorStop(1.0, `rgb(${bottomC[0]}, ${bottomC[1]}, ${bottomC[2]})`);
      }

      ctx.save();
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }
  }

  drawSun(x, y, coreColor, glowColor) {
    let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (ctx) {
      let maxR = 150;
      let radGrad = ctx.createRadialGradient(x, y, 0, x, y, maxR);
      let cC = coreColor;
      let gC = glowColor;
      radGrad.addColorStop(0.0, `rgba(${cC[0]}, ${cC[1]}, ${cC[2]}, 0.65)`);
      radGrad.addColorStop(0.4, `rgba(${gC[0]}, ${gC[1]}, ${gC[2]}, 0.35)`);
      radGrad.addColorStop(0.8, `rgba(${gC[0]}, ${gC[1]}, ${gC[2]}, 0.08)`);
      radGrad.addColorStop(1.0, `rgba(${gC[0]}, ${gC[1]}, ${gC[2]}, 0.0)`);

      ctx.save();
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, maxR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
  }

  drawMoon(x, y) {
    let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (ctx) {
      let maxR = 65;
      let halo = ctx.createRadialGradient(x, y, 20, x, y, maxR);
      halo.addColorStop(0.0, 'rgba(210, 230, 255, 0.16)');
      halo.addColorStop(1.0, 'rgba(210, 230, 255, 0.0)');

      ctx.save();
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, maxR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    push();
    noStroke();
    // Full Circular Moon Disc
    fill(245, 248, 255, 0.96);
    ellipse(x, y, 40, 40);

    // Subtle moon crater textures
    fill(218, 226, 242, 0.35);
    ellipse(x - 5, y - 4, 9, 9);
    ellipse(x + 7, y + 6, 7, 7);
    ellipse(x - 7, y + 7, 5, 5);
    pop();
  }

  drawStars() {
    push();
    noStroke();
    let time = frameCount * 0.05;
    for (let star of this.stars) {
      let alpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed * 10 + star.phase) * 0.25;
      alpha = constrain(alpha, 0.1, 1.0);
      fill(255, 255, 240, alpha);
      ellipse(star.x, star.y, star.size, star.size);
    }
    pop();
  }

  drawSunbeams(sunX, sunY) {
    push();
    noStroke();
    let time = frameCount * 0.01;
    for (let beam of this.sunbeams) {
      let alpha = beam.alpha + Math.sin(time + beam.phase) * 0.05;
      fill(255, 245, 200, alpha);
      beginShape();
      vertex(sunX, sunY);
      let len = height * 1.5;
      let x1 = sunX + Math.sin(beam.angle - 0.08) * len;
      let y1 = sunY + Math.cos(beam.angle - 0.08) * len;
      let x2 = sunX + Math.sin(beam.angle + 0.08) * len;
      let y2 = sunY + Math.cos(beam.angle + 0.08) * len;
      vertex(x1, y1);
      vertex(x2, y2);
      endShape(CLOSE);
    }
    pop();
  }

  drawRain() {
    push();
    strokeCap(ROUND);
    for (let p of this.rainParticles) {
      p.y += p.speed;
      p.x += 1.5; // Wind angle drift

      if (p.y > height) {
        p.y = -p.len;
        p.x = Math.random() * width;
      }
      if (p.x > width) p.x = 0;

      stroke(180, 210, 240, p.alpha);
      strokeWeight(p.weight);
      line(p.x, p.y, p.x - 3, p.y + p.len);
    }
    pop();
  }
}
