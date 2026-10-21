"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport WebGL field inspired by landonorris.com:
 * slowly morphing organic lobes, nested topographic isolines, a hill under the cursor.
 * Palette is AVP midnight + champagne gold rather than Lando's cream paper.
 */
export function GoldenWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grainRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const staticScene = reduce || coarse;
    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: "low-power",
      }) ||
      (canvas.getContext("experimental-webgl", {
        alpha: false,
        depth: false,
        stencil: false,
      }) as WebGLRenderingContext | null);

    if (!gl) {
      return paintCanvasFallback(canvas, staticScene);
    }

    const vertSrc = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fragSrc = `
      precision highp float;

      uniform vec2 u_res;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_active;
      uniform float u_scroll;
      uniform float u_quality;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5;
        v += a * noise(p); p = p * 2.01 + 8.4;  a *= 0.5;
        v += a * noise(p);
        if (u_quality > 0.5) {
          p = p * 2.07 + 3.2; a *= 0.5;
          v += a * noise(p);
        }
        return v;
      }

      float blob(vec2 p, vec2 c, float r) {
        vec2 d = p - c;
        float m = dot(d, d);
        return (r * r) / (m + 0.0007);
      }

      void main() {
        vec2 frag = gl_FragCoord.xy;
        vec2 uv = frag / u_res;
        float aspect = u_res.x / max(u_res.y, 1.0);

        vec2 p = uv;
        p.x *= aspect;

        float t = u_time;
        float scroll = u_scroll * 0.00028;

        // Domain warp — multi-frequency breathing field
        vec2 warp = vec2(
          fbm(p * 1.45 + vec2(t * 0.024, scroll)),
          fbm(p * 1.45 + vec2(5.2, 2.1) - vec2(t * 0.019, -scroll))
        );
        p += (warp - 0.5) * 0.24;
        p += 0.05 * vec2(
          sin(p.y * 2.8 + t * 0.12),
          cos(p.x * 2.3 - t * 0.10)
        );

        float field = 0.0;

        // Dynamic fluid lobes across the canvas
        field += blob(p, vec2(aspect * (0.22 + 0.11 * sin(t * 0.07 + 0.2)), 0.38 + 0.11 * cos(t * 0.055)), 0.36);
        field += blob(p, vec2(aspect * (0.78 + 0.09 * cos(t * 0.05 + 1.1)), 0.62 + 0.12 * sin(t * 0.062)), 0.40);
        field += blob(p, vec2(aspect * (0.52 + 0.15 * sin(t * 0.038)), 0.18 + 0.08 * cos(t * 0.048 + 0.8)), 0.28);
        field += blob(p, vec2(aspect * (0.12 + 0.08 * cos(t * 0.044 + 2.2)), 0.82 + 0.07 * sin(t * 0.05)), 0.24);
        field += blob(p, vec2(aspect * (0.88 + 0.07 * sin(t * 0.06 + 0.4)), 0.22 + 0.09 * cos(t * 0.041)), 0.22);
        field += blob(p, vec2(aspect * (0.46 + 0.10 * cos(t * 0.033 + 1.7)), 0.78 + 0.10 * sin(t * 0.046)), 0.26);

        // Cursor ripple & gravitational distortion
        vec2 m = u_mouse / u_res;
        m.x *= aspect;
        float md = length(p - m);
        float ripple = sin(md * 28.0 - t * 3.2) * exp(-md * 5.0) * 0.08 * u_active;
        float hill = (0.46 * exp(-md * md * 12.0) + ripple) * u_active;
        field += hill;

        // Futuristic Palette: Deep Midnight Void + Luminous Amber Gold + Cyan Prismatic accents (Subdued, low-glare)
        vec3 deep   = vec3(0.008, 0.016, 0.055);
        vec3 mid    = vec3(0.018, 0.040, 0.130);
        vec3 lift   = vec3(0.028, 0.065, 0.190);
        vec3 lobe   = vec3(0.045, 0.080, 0.180);
        vec3 cyan   = vec3(0.040, 0.220, 0.400);
        vec3 gold   = vec3(0.850, 0.700, 0.220);
        vec3 amber  = vec3(0.800, 0.520, 0.120);
        vec3 champ  = vec3(0.750, 0.650, 0.420);

        float paperN = fbm(uv * 2.6 + t * 0.012);
        vec3 col = mix(deep, mid, uv.y * 0.50 + paperN * 0.10);
        col = mix(col, lift, smoothstep(0.15, 0.85, uv.x * 0.35 + (1.0 - uv.y) * 0.35) * 0.25);

        // Soft filled organic glass masses (calm contrast)
        float fill = smoothstep(1.55, 2.45, field);
        col = mix(col, lobe, fill * 0.55);

        // Very subtle cyan edge tint
        float fringe = smoothstep(2.35, 2.55, field) - smoothstep(2.55, 2.95, field);
        col += cyan * max(0.0, fringe) * 0.10;

        // Topographic isolines: very sparse and gentle
        float iso = field * 0.45;
        float band = fract(iso);
        float line = 1.0 - smoothstep(0.0, 0.030, abs(band - 0.5));
        line *= smoothstep(1.25, 1.80, field);
        line *= 0.35 + 0.40 * fill;

        // Subtle specular glint
        float glint = pow(0.5 + 0.5 * sin(iso * 6.28318 - t * 0.85 + fbm(p * 3.2) * 8.5), 18.0);
        vec3 lineCol = mix(champ, mix(amber, gold, glint), 0.50 + 0.50 * glint);
        col = mix(col, lineCol, line * (0.22 + 0.20 * glint));

        // Subdued interactive cursor halo
        float aura = exp(-md * md * 6.0) * u_active;
        col += mix(amber, gold, 0.5) * aura * 0.05;
        col += cyan * exp(-md * md * 20.0) * u_active * 0.03;

        // Cinematic vignette (deepens edges for focus & text contrast)
        vec2 vuv = uv * 2.0 - 1.0;
        float vig = 1.0 - dot(vuv, vuv) * 0.32;
        col *= vig;

        // Micro film grain texture
        float g = hash(frag + vec2(fract(t * 14.1) * 47.0, fract(t * 8.7) * 19.0));
        col += (g - 0.5) * 0.026;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return paintCanvasFallback(canvas, staticScene);

    const program = gl.createProgram();
    if (!program) return paintCanvasFallback(canvas, staticScene);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return paintCanvasFallback(canvas, staticScene);
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uActive = gl.getUniformLocation(program, "u_active");
    const uScroll = gl.getUniformLocation(program, "u_scroll");
    const uQuality = gl.getUniformLocation(program, "u_quality");

    const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: 0, tActive: 0 };
    let scroll = 0;
    let tScroll = 0;
    let dpr = 1;
    let raf = 0;
    const start = performance.now();
    let running = true;

    const quality = coarse || window.innerWidth < 720 ? 0 : 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!mouse.tx && !mouse.ty) {
        mouse.tx = (w * 0.62) * dpr;
        mouse.ty = (h * 0.38) * dpr;
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
    };

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX * dpr;
      mouse.ty = (window.innerHeight - e.clientY) * dpr;
      mouse.tActive = 1;
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      mouse.tx = e.touches[0].clientX * dpr;
      mouse.ty = (window.innerHeight - e.touches[0].clientY) * dpr;
      mouse.tActive = 1;
    };
    const onLeave = () => {
      mouse.tActive = 0;
    };
    const onScroll = () => {
      tScroll = window.scrollY || document.documentElement.scrollTop || 0;
    };

    resize();

    const draw = (now: number) => {
      if (!running) return;
      const time = staticScene ? 8.4 : (now - start) / 1000;

      mouse.x += (mouse.tx - mouse.x) * 0.075;
      mouse.y += (mouse.ty - mouse.y) * 0.075;
      mouse.active += (mouse.tActive - mouse.active) * 0.06;
      scroll += (tScroll - scroll) * 0.06;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uActive, mouse.active);
      gl.uniform1f(uScroll, scroll);
      gl.uniform1f(uQuality, quality);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const wrap = grainRef.current;
      if (wrap) {
        wrap.style.setProperty("--mx", `${mouse.x / dpr}px`);
        wrap.style.setProperty("--my", `${window.innerHeight - mouse.y / dpr}px`);
        wrap.style.setProperty("--ma", String(0.12 * mouse.active));
      }

      if (!staticScene) raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!staticScene) {
        raf = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    if (!staticScene) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVis);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (!staticScene) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onTouch);
        window.removeEventListener("mouseleave", onLeave);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVis);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 block pointer-events-none"
        style={{ width: "100vw", height: "100vh" }}
        aria-hidden="true"
      />
      <div
        ref={grainRef}
        className="topo-grain"
        aria-hidden="true"
      />
    </>
  );
}

function paintCanvasFallback(canvas: HTMLCanvasElement, staticScene: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let raf = 0;
  let t = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: false };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const render = () => {
    t += staticScene ? 0 : 0.012;
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    const g = ctx.createRadialGradient(width * 0.7, height * 0.2, 40, width * 0.5, height * 0.5, Math.max(width, height));
    g.addColorStop(0, "#0e2060");
    g.addColorStop(1, "#04091c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    const blobs = [
      { x: 0.22 + Math.sin(t * 0.7) * 0.04, y: 0.38 + Math.cos(t * 0.55) * 0.03, r: 220 },
      { x: 0.76 + Math.cos(t * 0.5) * 0.04, y: 0.6 + Math.sin(t * 0.62) * 0.04, r: 260 },
      { x: 0.5 + Math.sin(t * 0.38) * 0.06, y: 0.2 + Math.cos(t * 0.48) * 0.03, r: 180 },
    ];

    blobs.forEach((b, i) => {
      const cx = b.x * width;
      const cy = b.y * height;
      const fill = ctx.createRadialGradient(cx, cy, b.r * 0.2, cx, cy, b.r);
      fill.addColorStop(0, "rgba(28, 48, 110, 0.45)");
      fill.addColorStop(1, "transparent");
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 1; k <= 2; k++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 215, 64, ${0.07 + k * 0.03})`;
        ctx.lineWidth = k === 2 ? 1.0 : 0.7;
        const rr = b.r * (0.45 + k * 0.22);
        const wobble = 10 + i * 4;
        for (let a = 0; a <= 64; a++) {
          const th = (a / 64) * Math.PI * 2;
          const n = Math.sin(th * 3 + t + i) * wobble + Math.cos(th * 2 - t * 0.7) * (wobble * 0.6);
          const px = cx + Math.cos(th) * (rr + n);
          const py = cy + Math.sin(th) * (rr * 0.78 + n);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    });

    if (mouse.on) {
      const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
      aura.addColorStop(0, "rgba(255, 215, 0, 0.06)");
      aura.addColorStop(1, "transparent");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);
    }

    if (!staticScene) raf = requestAnimationFrame(render);
  };

  const onMove = (e: MouseEvent) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    mouse.on = true;
  };

  resize();
  render();
  window.addEventListener("resize", resize, { passive: true });
  if (!staticScene) window.addEventListener("mousemove", onMove, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    if (!staticScene) window.removeEventListener("mousemove", onMove);
  };
}
