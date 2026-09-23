/**
 * VerletJS - High-Performance Verlet Particle & Constraint Physics Engine
 * Standalone offline library for soft-body dynamics, ropes, ragdolls, and global force fields.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VerletJS = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class Vec2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }

    add(v) {
      return new Vec2(this.x + v.x, this.y + v.y);
    }

    sub(v) {
      return new Vec2(this.x - v.x, this.y - v.y);
    }

    mul(scalar) {
      return new Vec2(this.x * scalar, this.y * scalar);
    }

    div(scalar) {
      return new Vec2(this.x / scalar, this.y / scalar);
    }

    dist(v) {
      let dx = this.x - v.x;
      let dy = this.y - v.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
      let len = this.length();
      return len > 0 ? this.div(len) : new Vec2(0, 0);
    }
  }

  class Particle {
    constructor(pos) {
      this.pos = new Vec2(pos.x, pos.y);
      this.lastPos = new Vec2(pos.x, pos.y);
      this.acc = new Vec2(0, 0);
      this.pinned = false;
      this.pinPos = null;
      this.radius = 2.0;
    }

    pin(pos) {
      this.pinned = true;
      this.pinPos = pos ? new Vec2(pos.x, pos.y) : new Vec2(this.pos.x, this.pos.y);
      if (pos) {
        this.pos.set(pos.x, pos.y);
        this.lastPos.set(pos.x, pos.y);
      }
    }

    unpin() {
      this.pinned = false;
      this.pinPos = null;
    }
  }

  class DistanceConstraint {
    constructor(a, b, stiffness = 1.0, distance = null) {
      this.a = a;
      this.b = b;
      this.stiffness = stiffness;
      this.distance = (distance !== null) ? distance : a.pos.dist(b.pos);
    }

    relax(stepCoef) {
      let normal = this.a.pos.sub(this.b.pos);
      let currentDist = normal.length();
      if (currentDist === 0) return;

      let delta = (this.distance - currentDist) / currentDist * this.stiffness * stepCoef;
      let offset = normal.mul(delta * 0.5);

      if (!this.a.pinned) this.a.pos = this.a.pos.add(offset);
      if (!this.b.pinned) this.b.pos = this.b.pos.sub(offset);
    }
  }

  class AngleConstraint {
    constructor(a, b, c, stiffness = 0.5) {
      this.a = a;
      this.b = b; // Center vertex
      this.c = c;
      this.stiffness = stiffness;
      this.angle = this.getAngle();
    }

    getAngle() {
      let ba = this.a.pos.sub(this.b.pos);
      let bc = this.c.pos.sub(this.b.pos);
      return Math.atan2(ba.x * bc.y - ba.y * bc.x, ba.x * bc.x + ba.y * bc.y);
    }

    relax(stepCoef) {
      let currentAngle = this.getAngle();
      let diff = currentAngle - this.angle;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;

      let correction = diff * this.stiffness * stepCoef * 0.5;
      if (!this.a.pinned) {
        let rot = this.a.pos.sub(this.b.pos);
        let cosA = Math.cos(-correction);
        let sinA = Math.sin(-correction);
        this.a.pos.x = this.b.pos.x + (rot.x * cosA - rot.y * sinA);
        this.a.pos.y = this.b.pos.y + (rot.x * sinA + rot.y * cosA);
      }
      if (!this.c.pinned) {
        let rot = this.c.pos.sub(this.b.pos);
        let cosA = Math.cos(correction);
        let sinA = Math.sin(correction);
        this.c.pos.x = this.b.pos.x + (rot.x * cosA - rot.y * sinA);
        this.c.pos.y = this.b.pos.y + (rot.x * sinA + rot.y * cosA);
      }
    }
  }

  class Composite {
    constructor() {
      this.particles = [];
      this.constraints = [];
    }

    addParticle(p) {
      this.particles.push(p);
      return p;
    }

    addConstraint(c) {
      this.constraints.push(c);
      return c;
    }

    createRope(origin, numSegments, segmentLength, stiffness = 0.9) {
      let prev = null;
      for (let i = 0; i < numSegments; i++) {
        let pos = new Vec2(origin.x, origin.y + i * segmentLength);
        let p = new Particle(pos);
        if (i === 0) p.pin(origin);
        this.addParticle(p);

        if (prev) {
          this.addConstraint(new DistanceConstraint(prev, p, stiffness, segmentLength));
        }
        prev = p;
      }
      return this;
    }
  }

  class VerletJS {
    constructor(options = {}) {
      this.gravity = options.gravity ? new Vec2(options.gravity.x, options.gravity.y) : new Vec2(0, 0.4);
      this.friction = (options.friction !== undefined) ? options.friction : 0.98;
      this.drag = (options.drag !== undefined) ? options.drag : 0.99;
      this.stiffnessIterations = options.stiffnessIterations || 4;
      this.composites = [];
      this.windForce = new Vec2(0, 0);
    }

    addComposite(composite) {
      this.composites.push(composite);
      return composite;
    }

    removeComposite(composite) {
      let idx = this.composites.indexOf(composite);
      if (idx !== -1) this.composites.splice(idx, 1);
    }

    clear() {
      this.composites = [];
    }

    setWind(x, y) {
      this.windForce.set(x, y);
    }

    step(dt = 1.0) {
      let stepCoef = dt;

      // 1. Integrate particles (Verlet Position Integration)
      for (let comp of this.composites) {
        for (let p of comp.particles) {
          if (p.pinned) {
            if (p.pinPos) p.pos.set(p.pinPos.x, p.pinPos.y);
            continue;
          }

          let vel = p.pos.sub(p.lastPos).mul(this.friction);

          // Apply forces: Gravity + Wind Force
          let forceX = (this.gravity.x + this.windForce.x) * stepCoef;
          let forceY = (this.gravity.y + this.windForce.y) * stepCoef;

          p.lastPos.set(p.pos.x, p.pos.y);
          p.pos.x += vel.x + forceX;
          p.pos.y += vel.y + forceY;
        }
      }

      // 2. Relax constraints (Iterative Relaxation Solver)
      for (let iter = 0; iter < this.stiffnessIterations; iter++) {
        for (let comp of this.composites) {
          for (let c of comp.constraints) {
            c.relax(stepCoef);
          }
        }
      }
    }
  }

  VerletJS.Vec2 = Vec2;
  VerletJS.Particle = Particle;
  VerletJS.DistanceConstraint = DistanceConstraint;
  VerletJS.AngleConstraint = AngleConstraint;
  VerletJS.Composite = Composite;

  return VerletJS;
}));
