/* Cycle 8 · WebGL shader background (local, no third-party code).
   A slow green/blue plasma with a faint golden-spiral swirl. Falls back to nothing if WebGL is unavailable,
   and draws a single still frame when the visitor prefers reduced motion. */
(function () {
  var canvas = document.getElementById('c8-shader-bg');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) ||
           canvas.getContext('experimental-webgl');
  if (!gl) { canvas.remove(); return; }

  var vsrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  var fsrc = [
    'precision mediump float;',
    'uniform vec2 r;uniform float t;',
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy-0.5*r)/min(r.x,r.y);',
    '  float a=atan(uv.y,uv.x);float d=length(uv);',
    '  float spiral=sin(6.0*log(d+0.001)*1.618-a*2.0+t*0.35);',
    '  float plasma=sin(uv.x*3.1+t*0.21)+sin(uv.y*2.7-t*0.17)+sin((uv.x+uv.y)*2.3+t*0.13)+sin(d*5.0-t*0.4);',
    '  float v=0.5+0.25*plasma*0.5+0.25*spiral;',
    '  vec3 green=vec3(0.10,1.0,0.50);vec3 blue=vec3(0.23,0.51,0.96);vec3 gold=vec3(1.0,0.82,0.40);',
    '  vec3 c=mix(blue,green,smoothstep(0.2,0.8,v));',
    '  c=mix(c,gold,smoothstep(0.85,1.0,v)*0.6);',
    '  float scan=0.85+0.15*sin(gl_FragCoord.y*1.5);',
    '  float vign=smoothstep(1.3,0.2,d);',
    '  gl_FragColor=vec4(c*scan*vign*0.55,1.0);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link failed');
  } catch (e) { canvas.remove(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(prog, 'r');
  var uT = gl.getUniformLocation(prog, 't');

  var scale = 0.5; /* render at half resolution: it's a soft background */
  function resize() {
    var w = Math.max(1, Math.floor(window.innerWidth * scale));
    var h = Math.max(1, Math.floor(window.innerHeight * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uR, w, h);
  }
  function draw(ms) {
    resize();
    gl.uniform1f(uT, ms / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { draw(12000); window.addEventListener('resize', function () { draw(12000); }); return; }
  function loop(ms) { if (!document.hidden) draw(ms); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
})();
