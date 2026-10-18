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
      return paintCanvasFallback(canvas, reduce);
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
        return (r * r) / (m + 0.0008);
      }

      void main() {
        vec2 frag = gl_FragCoord.xy;
        vec2 uv = frag / u_res;
        float aspect = u_res.x / max(u_res.y, 1.0);

        vec2 p = uv;
        p.x *= aspect;

        float t = u_time;
        float scroll = u_scroll * 0.00022;

        // Domain warp — the slow "breathing" that makes the map feel alive.
        vec2 warp = vec2(
          fbm(p * 1.35 + vec2(t * 0.021, scroll)),
          fbm(p * 1.35 + vec2(4.2, 1.7) - vec2(t * 0.017, -scroll))
        );
        p += (warp - 0.5) * 0.22;
        p += 0.045 * vec2(
          sin(p.y * 2.6 + t * 0.11),
          cos(p.x * 2.1 - t * 0.09)
        );

        float field = 0.0;

        // Five large lobes, each on a long elliptical orbit (Lando-style sparse islands).
        field += blob(p, vec2(aspect * (0.22 + 0.10 * sin(t * 0.07 + 0.2)), 0.38 + 0.10 * cos(t * 0.055)), 0.34);
        field += blob(p, vec2(aspect * (0.78 + 0.08 * cos(t * 0.05 + 1.1)), 0.62 + 0.11 * sin(t * 0.062)), 0.38);
        field += blob(p, vec2(aspect * (0.52 + 0.14 * sin(t * 0.038)), 0.18 + 0.07 * cos(t * 0.048 + 0.8)), 0.26);
        field += blob(p, vec2(aspect * (0.12 + 0.07 * cos(t * 0.044 + 2.2)), 0.82 + 0.06 * sin(t * 0.05)), 0.22);
        field += blob(p, vec2(aspect * (0.88 + 0.06 * sin(t * 0.06 + 0.4)), 0.22 + 0.08 * cos(t * 0.041)), 0.20);
        field += blob(p, vec2(aspect * (0.46 + 0.09 * cos(t * 0.033 + 1.7)), 0.78 + 0.09 * sin(t * 0.046)), 0.24);

        // Cursor raises a local hill, then the isolines bloom around it.
        vec2 m = u_mouse / u_res;
        m.x *= aspect;
        float md = length(p - m);
        float hill = 0.42 * exp(-md * md * 14.0) * u_active;
        field += hill;

        // Midnight paper
        vec3 deep = vec3(0.016, 0.035, 0.110);
        vec3 mid  = vec3(0.031, 0.075, 0.239);
        vec3 lift = vec3(0.055, 0.125, 0.376);
        vec3 lobe = vec3(0.090, 0.145, 0.320);
        vec3 inner = vec3(0.140, 0.125, 0.070);
        vec3 gold = vec3(1.000, 0.843, 0.251);
        vec3 champagne = vec3(0.94, 0.80, 0.42);

        float paperN = fbm(uv * 2.4 + t * 0.01);
        vec3 col = mix(deep, mid, uv.y * 0.55 + paperN * 0.12);
        col = mix(col, lift, smoothstep(0.15, 0.85, uv.x * 0.35 + (1.0 - uv.y) * 0.4) * 0.35);

        // Soft filled organic shapes (the cream blobs on Lando, recast as navy glass)
        float fill = smoothstep(1.55, 2.35, field);
        col = mix(col, lobe, fill * 0.72);
        float core = smoothstep(3.1, 4.6, field);
        col = mix(col, inner, core * 0.22);

        // Nested topographic isolines — anti-aliased hairlines, thicker every 4th (index contour)
        float iso = field * 1.65;
        float band = fract(iso);
        float line = 1.0 - smoothstep(0.0, 0.045, abs(band - 0.5));
        float indexBand = step(0.75, fract(iso * 0.25 + 0.02));
        line = max(line, indexBand * (1.0 - smoothstep(0.0, 0.08, abs(band - 0.5))));
        line *= smoothstep(1.15, 1.7, field);
        line *= 0.55 + 0.45 * fill;

        // Traveling glint along the contours
        float glint = pow(0.5 + 0.5 * sin(iso * 6.28318 - t * 0.85 + fbm(p * 3.0) * 8.0), 18.0);
        vec3 lineCol = mix(champagne, gold, 0.45 + 0.55 * glint);
        col = mix(col, lineCol, line * (0.42 + 0.38 * glint));

        // Cursor halo
        float aura = exp(-md * md * 6.5) * u_active;
        col += gold * aura * 0.07;

        // Vignette so type in the corners stays readable
        vec2 vuv = uv * 2.0 - 1.0;
        float vig = 1.0 - dot(vuv, vuv) * 0.22;
        col *= vig;

        // Film grain
        float g = hash(frag + vec2(fract(t * 13.7) * 47.0, fract(t * 8.3) * 19.0));
        col += (g - 0.5) * 0.028;

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
    if (!vs || !fs) return paintCanvasFallback(canvas, reduce);

    const program = gl.createProgram();
    if (!program) return paintCanvasFallback(canvas, reduce);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return paintCanvasFallback(canvas, reduce);
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
    let start = performance.now();
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
      const time = reduce ? 8.4 : (now - start) / 1000;

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

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduce) {
        raf = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
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

function paintCanvasFallback(canvas: HTMLCanvasElement, reduce: boolean) {
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
    t += reduce ? 0 : 0.012;
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

      for (let k = 1; k <= 4; k++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 215, 64, ${0.08 + k * 0.03})`;
        ctx.lineWidth = k === 4 ? 1.2 : 0.8;
        const rr = b.r * (0.35 + k * 0.16);
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

    if (!reduce) raf = requestAnimationFrame(render);
  };

  const onMove = (e: MouseEvent) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    mouse.on = true;
  };

  resize();
  render();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", onMove, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMove);
  };
}
