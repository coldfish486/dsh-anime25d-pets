/**
 * Anime2.5DRig WebGL 渲染引擎适配层
 * 
 * 将 Anime2.5DRig 的 PSD 自动装配 + WebGL 2.5D 渲染核心封装为
 * 可在 dsh-anime25d-pets 客户端中替代 Live2D 模型的渲染器。
 * 
 * 本模块从 Anime2.5DRig 的 index.html 中提取核心渲染代码，
 * 并适配 dsh-anime25d-pets 的 ModelLike 接口。
 */

/** 模型参数（对应 Anime2.5DRig 控制面板的底层参数集）。 */
export interface Anime25DParams {
  angleX: number
  angleY: number
  angleZ: number
  eyeOpenL: number
  eyeOpenR: number
  eyeX: number
  eyeY: number
  brow: number
  mouthOpen: number
  mouthForm: number
  mouthCY: number
  body: number
  physAmp: number
  soft: number
  browAngL: number
  browAngR: number
  browAngSym: number
  bangL: number
  bangC: number
  bangR: number
  armY: number
  armPos: number
  bust: number
  bustY: number
  irisScale: number
  mouthEase: number
  eyeEase: number
  fhAmp: number
  fhSoft: number
  eyeCY: number
  eyeCAng: number
  mouthCAng: number
  eyeScaleL: number
  eyeScaleR: number
  mouthScale: number
}

/** 默认参数（与 Anime2.5DRig 一致）。 */
export const DEFAULT_PARAMS: Anime25DParams = {
  angleX: 0, angleY: 0, angleZ: 0,
  eyeOpenL: 1, eyeOpenR: 1, eyeX: 0, eyeY: 0,
  brow: 0, mouthOpen: 0, mouthForm: 0, mouthCY: 0,
  body: 0, physAmp: 2, soft: 2,
  browAngL: 0, browAngR: 0, browAngSym: 0,
  bangL: 0, bangC: 0, bangR: 0,
  armY: 0, armPos: 0, bust: 2.5, bustY: 1,
  irisScale: 1, mouthEase: 0.45, eyeEase: 0.3,
  fhAmp: 2, fhSoft: 0.4, eyeCY: 0, eyeCAng: 0,
  mouthCAng: 0, eyeScaleL: 1, eyeScaleR: 1, mouthScale: 1,
}

/** 状态/动作 → 表情参数预设。 */
export interface MotionPreset {
  /** 表情参数（覆盖默认值）。 */
  target?: Partial<Anime25DParams>
  /** 动作持续时间（ms），0 = 持续到下一个动作。 */
  duration?: number
  /** 是否抑制鼠标跟随。 */
  suppressFocus?: boolean
}

/** 内置动作映射：状态/互动 → Anime2.5DRig 参数预设。 */
export const DEFAULT_MOTION_PRESETS: Record<string, MotionPreset> = {
  // 空闲：轻微摆动 + 正常表情（持续，由 idle 自动动画驱动）
  Idle: {
    target: { angleX: 0.05, angleY: 0.03, angleZ: 0.02, mouthOpen: 0, mouthForm: 0, eyeOpenL: 1, eyeOpenR: 1, brow: 0 },
  },
  // 思考：抬头 + 明显歪头 + 眼神斜向上飘（在想问题的感觉）
  Thinking: {
    target: { angleX: 0.85, angleY: -0.35, angleZ: 0.5, eyeX: -0.55, eyeY: -0.9, brow: 0.7, mouthOpen: 0.1, mouthForm: -0.1, body: 0.18, physAmp: 1.2 },
  },
  Working: {
    target: { angleX: -0.2, angleY: 0.1, angleZ: -0.15, eyeX: -0.3, eyeY: -0.2, brow: 0.3, mouthOpen: 0 },
  },
  // 出错：明显低头 + 皱眉 + 眼神向下 + 半闭眼（短暂表现后回 idle）
  Failed: {
    target: { angleX: 0, angleY: 0.45, angleZ: 0, brow: -0.8, eyeX: 0, eyeY: 0.5, mouthOpen: 0, mouthForm: -0.6, eyeOpenL: 0.3, eyeOpenR: 0.3, body: 0.1 },
    duration: 2500,
  },
  Sad: {
    target: { angleY: 0.35, brow: -0.7, eyeOpenL: 0.25, eyeOpenR: 0.25, mouthOpen: 0, mouthForm: -0.5, eyeY: 0.4 },
    duration: 2500,
  },
  // 完成：明显开心 + 嘴巴张开 + 眼睛弯 + 身体微倾（短暂庆祝后回 idle）
  Jumping: {
    target: { angleY: -0.25, eyeOpenL: 0.1, eyeOpenR: 0.1, brow: 0.7, mouthOpen: 0.8, mouthForm: 1, irisScale: 1.1, body: -0.15 },
    duration: 3500,
  },
  Done: {
    target: { eyeOpenL: 0.1, eyeOpenR: 0.1, brow: 0.5, mouthOpen: 0.6, mouthForm: 1, irisScale: 1.15, angleY: -0.1 },
    duration: 3500,
  },
  // 等待：眯眯眼 + 歪头放空（慵懒地等审批，不焦虑）
  Waiting: {
    target: { angleX: 0.32, angleY: 0.1, angleZ: 0.18, brow: 0.2, eyeOpenL: 0.25, eyeOpenR: 0.25, eyeX: 0.35, eyeY: 0.08, mouthOpen: 0.04, mouthForm: 0.3, body: 0.08, physAmp: 1.1 },
  },
  // 互动（短暂动作后恢复状态）
  TapHead: {
    target: { angleX: 0.25, angleY: -0.2, angleZ: 0.1, eyeOpenL: 0.6, eyeOpenR: 0.8, mouthOpen: 0.1 },
    duration: 1800,
  },
  TapBody: {
    target: { angleX: 0.1, angleY: 0.15, mouthOpen: 0.1, mouthForm: 0.3 },
    duration: 1500,
  },
  TapLeg: {
    target: { angleX: -0.1, angleY: 0.1, eyeOpenL: 0.5, eyeOpenR: 0.5, mouthOpen: 0.1, mouthForm: 0.2 },
    duration: 1500,
  },
  TapArm: {
    target: { angleX: 0.15, angleY: 0.1, eyeX: 0.3, mouthOpen: 0.05, armY: -0.3 },
    duration: 1500,
  },
}

declare global {
  interface Window {
    agPsd?: any
    Rigger?: any
    GenericParts?: any
  }
}

/** WebGL 渲染器 —— 封装 Anime2.5DRig 核心。 */
export class Anime25DRenderer {
  /** 目标画布。 */
  canvas: HTMLCanvasElement
  /** WebGL 上下文。 */
  private gl: WebGLRenderingContext | null = null
  /** WebGL 着色器程序。 */
  private prog: WebGLProgram | null = null
  private locPos = -1
  private locUV = -1
  private locRes: WebGLUniformLocation | null = null
  private locCut: WebGLUniformLocation | null = null
  private locAl: WebGLUniformLocation | null = null
  private locFlip: WebGLUniformLocation | null = null

  /** 渲染层数据。 */
  private layers: any[] = []
  /** 锚点。 */
  private A: any = null
  private CW = 768
  private CH = 768
  private FS = 1
  private NP: any = null
  private BP: any = null
  private FC: any = null
  private CHEST: any = null
  private bounce = { x: 0, v: 0, dy: 0 }

  /** 参数（目标值/当前值）。 */
  private P: Anime25DParams = { ...DEFAULT_PARAMS }
  private T: Anime25DParams = { ...DEFAULT_PARAMS }
  private cur: Anime25DParams = { ...DEFAULT_PARAMS }
  /** 用户手动设置过的参数集合（自动动画不会覆盖这些参数）。 */
  private manualSet = new Set<string>()

  /** 自动动画开关。 */
  private auto = {
    idle: true, blink: true, rand: false, talk: false,
    mouse: false, mic: false, phys: true,
  }

  /** 动画状态。 */
  private blinkT = -1
  private nextBlink = 0
  private rnd = { ax: 0, ay: 0, az: 0, bd: 0, ex: 0, ey: 0 }
  private nextRnd = 0
  private talkOn = false
  private talkV = 0
  private talkTgt = 0
  private nextTalkState = 0
  private nextSyl = 0

  /** 鼠标状态。 */
  private mouse = { x: 0, y: 0, in: false }
  /** 左右镜像翻转。 */
  private flipped = false

  /** 动作定时器（清理用）。 */
  private motionTimer: ReturnType<typeof setTimeout> | null = null
  /** 动画映射参数（当前动作的叠加目标）。 */
  private motionTarget: Partial<Anime25DParams> | null = null
  private motionStartTime = 0
  private motionDuration = 0
  private motionName: string | null = null

  /** 帧循环控制。 */
  private rafId = 0
  private last = 0
  private lastFrame = 0
  private frameInterval = 0
  private disposed = false
  private _onMotionFinish: (() => void) | null = null

  /** 模型原始尺寸（用于适配）。 */
  private baseW = 0
  private baseH = 0
  /** 模型实际内容包围盒（所有图层的最小外接矩形）。 */
  private contentBounds = { x: 0, y: 0, width: 0, height: 0 }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.initWebGL()
    this.initCanvasEvents()
    this.last = performance.now()
    this.nextBlink = this.last + 1800
    this.nextRnd = this.last + 1400
    this.nextTalkState = this.last + 1200
    this.nextSyl = this.last + 500
    this.rafId = requestAnimationFrame(this.tick)
  }

  /** 初始化 WebGL 上下文。 */
  private initWebGL(): void {
    const cv = this.canvas
    this.gl = cv.getContext('webgl', {
      alpha: true, stencil: true, antialias: true, premultipliedAlpha: true,
    })
    if (!this.gl) return

    const gl = this.gl
    function sh(type: number, src: string): WebGLShader {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(s)))
      return s
    }

    this.prog = gl.createProgram()!
    gl.attachShader(this.prog!, sh(gl.VERTEX_SHADER,
      'attribute vec2 aPos; attribute vec2 aUV; uniform vec2 uRes; uniform float uFlip; varying vec2 vUV;' +
      'void main(){ vUV=aUV; vec2 c = aPos/uRes*2.0-1.0; gl_Position=vec4(c.x*uFlip,-c.y,0.0,1.0); }'))
    gl.attachShader(this.prog!, sh(gl.FRAGMENT_SHADER,
      'precision mediump float; varying vec2 vUV; uniform sampler2D uTex; uniform float uCut; uniform float uAlpha;' +
      'void main(){ vec4 c=texture2D(uTex,vUV); if(c.a<uCut) discard; gl_FragColor=c*uAlpha; }'))
    gl.linkProgram(this.prog!)
    gl.useProgram(this.prog!)

    this.locPos = gl.getAttribLocation(this.prog!, 'aPos')
    this.locUV = gl.getAttribLocation(this.prog!, 'aUV')
    this.locRes = gl.getUniformLocation(this.prog!, 'uRes')
    this.locCut = gl.getUniformLocation(this.prog!, 'uCut')
    this.locAl = gl.getUniformLocation(this.prog!, 'uAlpha')
    this.locFlip = gl.getUniformLocation(this.prog!, 'uFlip')

    gl.enableVertexAttribArray(this.locPos)
    gl.enableVertexAttribArray(this.locUV)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  }

  /** 初始化画布事件（鼠标跟随）。 */
  private initCanvasEvents(): void {
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const r = this.canvas.getBoundingClientRect()
      const rawX = (e.clientX - r.left) / r.width * 2 - 1
      // 镜像显示时，屏幕右侧对应模型左侧，反转水平跟随目标。
      this.mouse.x = this.flipped ? -rawX : rawX
      this.mouse.y = (e.clientY - r.top) / r.height * 2 - 1
      this.mouse.in = true
    })
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.in = false
    })
  }

  /** 纹理创建。 */
  private mkTex(imgData: any): WebGLTexture {
    const gl = this.gl!
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  /** 应用装配好的 rig 到 WebGL 层。 */
  private applyRig(rig: any): void {
    const gl = this.gl!
    if (!gl) return

    // 清理旧层
    for (const L of this.layers) {
      if (L.tex) gl.deleteTexture(L.tex)
      if (L.vboPos) gl.deleteBuffer(L.vboPos)
      if (L.vboUV) gl.deleteBuffer(L.vboUV)
      if (L.ibo) gl.deleteBuffer(L.ibo)
    }
    this.layers = []

    this.CW = rig.canvas.w
    this.CH = rig.canvas.h
    this.A = rig.anchors
    this.FS = this.A.faceScale
    this.NP = this.A.neckPivot
    this.BP = this.A.bodyPivot
    this.FC = { x: this.A.face.cx, y: this.A.face.cy }
    this.CHEST = {
      cx: this.NP.cx,
      cy: this.A.neckBottom + (this.A.face.y1 - this.A.face.y0) * 0.60,
      rx: (this.A.face.x1 - this.A.face.x0) * 0.60,
      ry: (this.A.face.y1 - this.A.face.y0) * 0.45,
    }

    for (const Lr of rig.layers) {
      const L = Object.assign({}, Lr)
      const cell = (L.phys ? 30 : 42) * Math.max(0.6, this.CW / 768)
      const nx = Math.max(2, Math.round(L.w / cell))
      const ny = Math.max(2, Math.round(L.h / cell))
      const nv = (nx + 1) * (ny + 1)
      const base = new Float32Array(nv * 2)
      const uv = new Float32Array(nv * 2)
      let k = 0
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          base[k] = L.x + L.w * i / nx
          base[k + 1] = L.y + L.h * j / ny
          uv[k] = i / nx
          uv[k + 1] = j / ny
          k += 2
        }
      }
      const idx: number[] = []
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i
          const b = a + 1
          const c = a + nx + 1
          const d = c + 1
          idx.push(a, b, c, b, d, c)
        }
      }
      L.base = base
      L.cur = new Float32Array(base)
      L.nIdx = idx.length
      L.bn = window.Rigger ? window.Rigger.baseName(L.name.replace(/_(l|r)$/, '')) : L.name

      if (L.strands && L.strands.length) {
        const S = L.strands
        const nS = S.length
        let spacing = 120
        if (nS > 1) {
          const ds: number[] = []
          for (let s = 1; s < nS; s++) ds.push(S[s].x - S[s - 1].x)
          ds.sort((a, b) => a - b)
          spacing = ds[ds.length >> 1]
        }
        const sig = spacing * 0.6
        L.sw = new Float32Array(nv * nS)
        L.su = new Float32Array(nv)
        L.spr = S.map((s: any, i: number) => ({
          stiff: { x: 0, v: 0, dx: 0 },
          soft: { x: 0, v: 0, dx: 0 },
          phase: i * 1.37 + L.z,
        }))
        for (let v = 0; v < nv; v++) {
          const x = base[v * 2]
          const y = base[v * 2 + 1]
          let tot = 0
          for (let s = 0; s < nS; s++) {
            const w = Math.exp(-Math.pow((x - S[s].x) / sig, 2))
            L.sw[v * nS + s] = w
            tot += w
          }
          let rY = 0
          let tY = 0
          if (tot > 1e-6) {
            for (let s = 0; s < nS; s++) {
              L.sw[v * nS + s] /= tot
              rY += L.sw[v * nS + s] * S[s].rootY
              tY += L.sw[v * nS + s] * S[s].tipY
            }
          } else {
            L.sw[v * nS + 0] = 1
            rY = S[0].rootY
            tY = S[0].tipY
          }
          L.su[v] = Math.min(1, Math.max(0, (y - rY) / Math.max(1, tY - rY)))
        }
        if (L.bn === 'front hair') {
          const fw = this.A.face.x1 - this.A.face.x0
          const fcx = this.A.face.cx
          const f = 36
          const b1 = fcx - fw * 0.22
          const b2 = fcx + fw * 0.22
          L.bw = new Float32Array(nv * 3)
          for (let v = 0; v < nv; v++) {
            const x = base[v * 2]
            const s1 = this.smooth((x - b1) / f + 0.5)
            const s2 = this.smooth((x - b2) / f + 0.5)
            L.bw[v * 3] = 1 - s1
            L.bw[v * 3 + 1] = s1 * (1 - s2)
            L.bw[v * 3 + 2] = s2
          }
        }
      }

      L.vboPos = gl.createBuffer()
      L.vboUV = gl.createBuffer()
      L.ibo = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, L.vboUV)
      gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, L.ibo)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW)
      const idata = (typeof ImageData !== 'undefined')
        ? new ImageData(new Uint8ClampedArray(L.img.data), L.img.width, L.img.height)
        : L.img
      L.tex = this.mkTex(idata)
      delete L.img
      this.layers.push(L)
    }

    this.canvas.width = this.CW
    this.canvas.height = this.CH
    this.baseW = this.CW
    this.baseH = this.CH

    // 计算模型实际内容包围盒（所有图层的并集边界）
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const L of this.layers) {
      minX = Math.min(minX, L.x)
      minY = Math.min(minY, L.y)
      maxX = Math.max(maxX, L.x + L.w)
      maxY = Math.max(maxY, L.y + L.h)
    }
    if (minX < Infinity && maxX > -Infinity) {
      this.contentBounds = {
        x: Math.max(0, minX),
        y: Math.max(0, minY),
        width: Math.min(this.CW, maxX) - Math.max(0, minX),
        height: Math.min(this.CH, maxY) - Math.max(0, minY),
      }
      // 保证至少有效
      if (this.contentBounds.width <= 0) this.contentBounds.width = this.CW
      if (this.contentBounds.height <= 0) this.contentBounds.height = this.CH
    } else {
      this.contentBounds = { x: 0, y: 0, width: this.CW, height: this.CH }
    }
  }

  /** 从 PSD 数据加载模型。 */
  async loadPsdData(psdBuffer: ArrayBuffer): Promise<void> {
    if (!window.agPsd) throw new Error('ag-psd.min.js 未加载')
    if (!window.Rigger) throw new Error('rigger.js 未加载')

    const psd = window.agPsd.readPsd(new Uint8Array(psdBuffer), {
      useImageData: true,
      skipThumbnail: true,
    })
    
    const pre = window.Rigger.cleanPsdLayers(psd)
    const options = this.genericOpts()
    const rig = window.Rigger.buildRig(psd, options)
    this.applyRig(rig)
  }

  /** 从 URL 加载 PSD 模型。 */
  async loadFromUrl(url: string): Promise<void> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = await res.arrayBuffer()
    await this.loadPsdData(buf)
  }

  /** 计算通用闭眼/闭口差分选项。 */
  private genericOpts(): Record<string, unknown> {
    const GP = window.GenericParts
    const base = GP
      ? {
          eyeL: GP.get('eyeL'),
          eyeR: GP.get('eyeR'),
          mouth: GP.get('mouth'),
        }
      : {}
    return (base.eyeL || base.mouth) ? { generic: base } : {}
  }

  // ---------- 工具函数 ----------
  private clamp(v: number, a: number, b: number): number {
    return v < a ? a : v > b ? b : v
  }

  private smooth(t: number): number {
    t = this.clamp(t, 0, 1)
    return t * t * (3 - 2 * t)
  }

  // ---------- 淡入淡出 ----------
  private fadeAlpha(L: any, e: Anime25DParams): number {
    if (!L.fade) return 1
    if (L.fade === 'eyeOpen') {
      const v = L.side === 'L' ? e.eyeOpenL : e.eyeOpenR
      return this.smooth((v - (0.10 + e.eyeEase * 0.45)) / 0.15)
    }
    if (L.fade === 'eyeClose') {
      const v = L.side === 'L' ? e.eyeOpenL : e.eyeOpenR
      return 1 - this.smooth((v - (0.10 + e.eyeEase * 0.45)) / 0.15)
    }
    if (L.fade === 'mouthOpen') return this.smooth((e.mouthOpen - (0.05 + e.mouthEase * 0.35)) / 0.12)
    if (L.fade === 'mouthClose') return 1 - this.smooth((e.mouthOpen - (0.05 + e.mouthEase * 0.35)) / 0.12)
    return 1
  }

  // ---------- 顶点变形 ----------
  private deform(L: any, e: Anime25DParams): void {
    const b = L.base
    const o = L.cur
    const n = b.length
    const isHead = L.group === 'head'
    const az = e.angleZ * 0.07
    const cz = Math.cos(az)
    const sz = Math.sin(az)
    const ab = e.body * 0.028
    const cb = Math.cos(ab)
    const sb = Math.sin(ab)
    const nm = L.name
    const bn = L.bn
    const eyeSide = L.side
    const EA = eyeSide === 'L' ? this.A.eyeL : (eyeSide === 'R' ? this.A.eyeR : null)
    const vOpen = eyeSide === 'L' ? e.eyeOpenL : e.eyeOpenR
    const mo = e.mouthOpen
    const mHalfW = (this.A.mouth.x1 - this.A.mouth.x0) / 2
    const nS = L.strands ? L.strands.length : 0
    const bcx = L.x + L.w / 2
    const bcy = L.y + L.h / 2
    const isFH = (bn === 'front hair')

    for (let k = 0; k < n; k += 2) {
      let x = b[k]
      let y = b[k + 1]
      const vi = k >> 1

      // 闭眼/闭口缩放
      if (EA && bn === 'eye_close') {
        const sE = eyeSide === 'L' ? e.eyeScaleL : e.eyeScaleR
        if (sE !== 1) {
          const cxE = (EA.x0 + EA.x1) / 2
          const cyE = (EA.y0 + EA.y1) / 2
          x = cxE + (x - cxE) * sE
          y = cyE + (y - cyE) * sE
        }
      }
      if (bn === 'mouth_open' || bn === 'mouth_close') {
        const sM = e.mouthScale
        if (sM !== 1) {
          x = this.A.mouth.cx + (x - this.A.mouth.cx) * sM
          y = this.A.mouth.cy + (y - this.A.mouth.cy) * sM
        }
      }

      // 局部特征
      if (L.fade === 'eyeOpen' && EA) {
        if (bn === 'irides') {
          const isc = e.irisScale
          x = EA.icx + (x - EA.icx) * isc
          y = EA.icy + (y - EA.icy) * isc
          x += e.eyeX * 11 * this.FS
          y += e.eyeY * 6 * this.FS
          const tl = this.smooth((0.32 - vOpen) / 0.32)
          y = EA.closeY + (y - EA.closeY) * (1 - 0.80 * tl)
        } else {
          y = EA.closeY + (y - EA.closeY) * (1 - 0.85 * (1 - vOpen))
        }
      }
      if (L.fade === 'eyeClose' && EA) {
        y -= vOpen * 3
        y += e.eyeCY * 14 * this.FS
        const thE = e.eyeCAng * 0.3 * (eyeSide === 'L' ? 1 : -1)
        if (thE) {
          const ct = Math.cos(thE)
          const st = Math.sin(thE)
          const rx = x - bcx
          const ry = y - bcy
          x = bcx + rx * ct - ry * st
          y = bcy + rx * st + ry * ct
        }
      }
      if (bn === 'eyebrow') {
        y += (-e.brow * 9 + (1 - vOpen) * 3.5) * this.FS
        const th = (eyeSide === 'L' ? (e.browAngL + e.browAngSym) : (e.browAngR - e.browAngSym)) * 0.30
        if (th) {
          const ct = Math.cos(th)
          const st = Math.sin(th)
          const rx = x - bcx
          const ry = y - bcy
          x = bcx + rx * ct - ry * st
          y = bcy + rx * st + ry * ct
        }
      }
      if (L.fade === 'mouthOpen') {
        y = this.A.mouth.y0 + (y - this.A.mouth.y0) * (0.5 + 0.5 * mo)
        const q = Math.pow(Math.abs(x - this.A.mouth.cx) / (mHalfW + 4), 1.5)
        y -= e.mouthForm * 6 * this.FS * (q - 0.35)
      }
      if (L.fade === 'mouthClose') {
        y += e.mouthCY * 14 * this.FS
        const thM = e.mouthCAng * 0.35
        if (thM) {
          const ct = Math.cos(thM)
          const st = Math.sin(thM)
          const rx = x - this.A.mouth.cx
          const ry = y - this.A.mouth.cy
          x = this.A.mouth.cx + rx * ct - ry * st
          y = this.A.mouth.cy + rx * st + ry * ct
        }
      }
      if (bn === 'face' && y > this.A.mouth.cy) {
        y += mo * 6 * this.FS * this.smooth((y - this.A.mouth.cy) / (this.A.face.y1 - this.A.mouth.cy))
      }

      // 头部变换
      let hw = isHead ? 1 : (L.group === 'body' ? 0.16 : 0)
      if (bn === 'neck') hw = 0.55 * this.smooth((this.A.neckBottom - y) / Math.max(1, this.A.neckBottom - this.A.neckTop))
      if (hw > 0) {
        let rx = x - this.NP.cx
        let ry = y - this.NP.cy
        const rx2 = rx * cz - ry * sz
        const ry2 = rx * sz + ry * cz
        x += (rx2 - rx) * hw
        y += (ry2 - ry) * hw
        const dd = L.depth
        x += hw * this.FS * (e.angleX * (14 + 40 * (dd - 1)) + e.angleX * (this.NP.cy - y) * 0.028)
        y += hw * this.FS * (-e.angleY * (9 + 30 * (dd - 1)) - e.angleY * (dd - 1) * (y - this.FC.y) * 0.05)
      }

      // 呼吸
      y -= (L.group === 'body' ? (e as any).breath * 2.0 : (e as any).breathHead * 1.6) * this.FS
      if (bn === 'topwear' && y < this.CHEST.cy) {
        y -= (e as any).breath * 2.2 * this.FS * this.smooth((this.CHEST.cy - y) / (this.CHEST.ry * 2))
      }
      if (bn === 'topwear') x = this.NP.cx + (x - this.NP.cx) * (1 + (e as any).breath * 0.003)

      // 胸部摇摆
      if (bn === 'topwear') {
        const gx = (x - this.CHEST.cx) / this.CHEST.rx
        const gy = (y - (this.CHEST.cy + e.bustY * 70 * this.FS)) / this.CHEST.ry
        y += this.bounce.dy * e.bust * Math.exp(-gx * gx - gy * gy)
      }

      // 手臂
      if (bn === 'handwear') {
        const w = this.smooth((y - L.y) / L.h * 1.15)
        y -= e.armY * 30 * this.FS * w
        y += e.armPos * 40 * this.FS
        x += e.armY * 6 * this.FS * w * (x < this.NP.cx ? 1 : -1)
      }

      // 前发块
      if (L.bw && L.su) {
        const m = Math.pow(L.su[vi], 1.4) * 22 * this.FS
        x += (e.bangL * L.bw[vi * 3] + e.bangC * L.bw[vi * 3 + 1] + e.bangR * L.bw[vi * 3 + 2]) * m
      }

      // 发丝物理
      if (nS && this.auto.phys) {
        const u = isFH ? Math.min(1, L.su[vi] * 1.6) : L.su[vi]
        const amp = Math.pow(u, isFH ? 1.8 : 2.1) * (isFH ? e.fhAmp : e.physAmp)
        const softMix = Math.pow(u, 1.2) * (isFH ? e.fhSoft : e.soft)
        let dx = 0
        for (let s = 0; s < nS; s++) {
          const w = L.sw[vi * nS + s]
          if (w < 0.001) continue
          const sp = L.spr[s]
          dx += w * (sp.stiff.dx * (1 - softMix) + sp.soft.dx * softMix)
        }
        x += dx * amp
        y += Math.abs(dx) * amp * 0.12
      }

      o[k] = x
      o[k + 1] = y
    }

    // 身体旋转
    if (Math.abs(ab) > 1e-4) {
      for (let k = 0; k < n; k += 2) {
        const rx = o[k] - this.BP.cx
        const ry = o[k + 1] - this.BP.cy
        o[k] = this.BP.cx + rx * cb - ry * sb
        o[k + 1] = this.BP.cy + rx * sb + ry * cb
      }
    }
  }

  // ---------- 动作控制接口 ----------
  /** 播放动作（对应 Live2D 的 motion()）。 */
  async motion(name: string, _index?: number, _priority?: number): Promise<boolean> {
    const preset = DEFAULT_MOTION_PRESETS[name] || DEFAULT_MOTION_PRESETS[name.replace(/_\d+$/, '')]
    if (!preset) {
      // 未识别动作：重置为默认
      this.motionTarget = null
      this.motionName = null
      this.motionDuration = 0
      return false
    }
    this.motionTarget = preset.target ? { ...preset.target } : null
    this.motionName = name
    this.motionDuration = preset.duration || 0
    this.motionStartTime = performance.now()

    // 清理旧的定时器
    if (this.motionTimer) {
      clearTimeout(this.motionTimer)
      this.motionTimer = null
    }
    // 动作结束回调
    if (this.motionDuration > 0) {
      const duration = this.motionDuration
      this.motionTimer = setTimeout(() => {
        if (this.motionName === name && this._onMotionFinish) {
          this._onMotionFinish()
        }
        this.motionTimer = null
      }, duration)
    }
    return true
  }

  /** 停止所有动作。 */
  stopAllMotions(): void {
    this.motionTarget = null
    this.motionName = null
    this.motionDuration = 0
    if (this.motionTimer) {
      clearTimeout(this.motionTimer)
      this.motionTimer = null
    }
  }

  /** 鼠标/视线跟随（对应 Live2D 的 focus()）。 */
  focus(x: number, y: number, instant = false): void {
    // x/y 为 canvas 本地坐标，归一化到 [-1,1]；
    // 镜像显示时水平方向取反，使人物的视线仍朝向屏幕上的鼠标位置。
    const w = this.canvas.width || 1
    const h = this.canvas.height || 1
    const fx = this.flipped ? w - x : x
    const nx = this.clamp((fx / w) * 2 - 1, -1, 1)
    const ny = this.clamp((y / h) * 2 - 1, -1, 1)
    const speed = instant ? 1 : 0.2
    this.P.angleX += (nx * 0.6 - this.P.angleX) * speed
    this.P.angleY += (-ny * 0.5 - this.P.angleY) * speed
    this.P.eyeX += (nx * 1.0 - this.P.eyeX) * speed
    this.P.eyeY += (-ny * 0.8 - this.P.eyeY) * speed
  }

  /** 重置视线到正视前方。 */
  resetFocus(): void {
    this.P.angleX += (0 - this.P.angleX) * 0.2
    this.P.angleY += (0 - this.P.angleY) * 0.2
    this.P.eyeX += (0 - this.P.eyeX) * 0.2
    this.P.eyeY += (0 - this.P.eyeY) * 0.2
  }

  /** 设置单个参数（用户手动调整时记录，自动动画不会覆盖）。 */
  setParam<K extends keyof Anime25DParams>(key: K, value: Anime25DParams[K]): void {
    this.T[key] = value
    this.manualSet.add(String(key))
    // 手动调整参数时停止状态动画覆盖
    if (this.motionTarget) {
      const motionKeys = Object.keys(this.motionTarget)
      if (motionKeys.includes(String(key))) {
        this.motionTarget = null
        this.motionName = null
        this.motionDuration = 0
      }
    }
  }

  /** 批量设置参数（用户手动调整时记录，自动动画不会覆盖）。 */
  setParams(params: Partial<Anime25DParams>): void {
    Object.assign(this.T, params)
    for (const key of Object.keys(params)) {
      this.manualSet.add(key)
    }
    // 如果有状态动画且与手动参数重叠，停止状态动画
    if (this.motionTarget) {
      const motionKeys = Object.keys(this.motionTarget)
      const paramKeys = Object.keys(params)
      if (paramKeys.some((k) => motionKeys.includes(k))) {
        this.motionTarget = null
        this.motionName = null
        this.motionDuration = 0
      }
    }
  }

  /** 重置为默认参数并清除手动跟踪。 */
  resetParams(): void {
    this.T = { ...DEFAULT_PARAMS }
    this.manualSet.clear()
  }

  /** 设置左右镜像翻转。 */
  setFlip(on: boolean): void {
    this.flipped = !!on
  }

  /** 设置 FPS 上限（0 = 不限制）。 */
  setFpsLimit(fps: number): void {
    this.frameInterval = Number.isFinite(fps) && fps > 0 ? 1000 / fps : 0
  }

  /** 设置自动动画开关。 */
  setAuto(key: keyof typeof this.auto, on: boolean): void {
    this.auto[key] = on
    // 开启自动动画时，释放相关的手动参数锁定
    // 这样开启"随机开口说话"后嘴巴可以被 talk 控制，
    // 开启"随机小动作"后头部/眼睛可以被 rand 控制。
    if (on) {
      if (key === 'talk') this.manualSet.delete('mouthOpen')
      if (key === 'rand') {
        this.manualSet.delete('angleX')
        this.manualSet.delete('angleY')
        this.manualSet.delete('angleZ')
        this.manualSet.delete('eyeX')
        this.manualSet.delete('eyeY')
      }
      if (key === 'blink') {
        this.manualSet.delete('eyeOpenL')
        this.manualSet.delete('eyeOpenR')
      }
      if (key === 'idle') {
        this.manualSet.delete('angleX')
        this.manualSet.delete('angleY')
        this.manualSet.delete('angleZ')
        this.manualSet.delete('body')
      }
    }
  }

  /** 获取模型原始尺寸。 */
  get width(): number {
    return this.baseW || this.CW
  }

  get height(): number {
    return this.baseH || this.CH
  }

  /**
   * 获取模型包围盒（基于实际图层内容，转换为 CSS 显示坐标系）。
   * 客户端传入的点击坐标是 CSS 坐标（相对于 canvas 显示区域），
   * 这里需要把 PSD 原始坐标换算为 CSS 坐标，保证空间分区计算正确。
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    // 读取 CSS 显示尺寸
    const cssW = this.canvas.style.width ? parseFloat(this.canvas.style.width) : 0
    const cssH = this.canvas.style.height ? parseFloat(this.canvas.style.height) : 0
    // 如果 CSS 尺寸有效，缩放坐标；否则直接返回 PSD 原始坐标
    if (cssW > 0 && cssH > 0 && this.CW > 0 && this.CH > 0) {
      const scaleX = cssW / this.CW
      const scaleY = cssH / this.CH
      return {
        x: this.contentBounds.x * scaleX,
        y: this.contentBounds.y * scaleY,
        width: this.contentBounds.width * scaleX,
        height: this.contentBounds.height * scaleY,
      }
    }
    return { ...this.contentBounds }
  }

  /** 命中测试（Anime2.5DRig 无实际 HitArea，返回空数组，由空间回退处理）。 */
  hitTest(_x: number, _y: number): string[] {
    return []
  }

  /** 设置动作完成回调。 */
  set onMotionFinish(fn: (() => void) | null) {
    this._onMotionFinish = fn
  }

  get onMotionFinish(): (() => void) | null {
    return this._onMotionFinish
  }

  /** 销毁渲染器。 */
  destroy(): void {
    this.disposed = true
    if (this.rafId) cancelAnimationFrame(this.rafId)
    // 清理 WebGL 资源
    if (this.gl) {
      for (const L of this.layers) {
        if (L.tex) this.gl.deleteTexture(L.tex)
        if (L.vboPos) this.gl.deleteBuffer(L.vboPos)
        if (L.vboUV) this.gl.deleteBuffer(L.vboUV)
        if (L.ibo) this.gl.deleteBuffer(L.ibo)
      }
    }
    this.layers = []
    this._onMotionFinish = null
    
    if (this.motionTimer) {
      clearTimeout(this.motionTimer)
      this.motionTimer = null
    }
  }

  /** 暂停/恢复渲染循环。 */
  pause(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = 0
  }

  resume(): void {
    if (this.disposed || this.rafId) return
    this.last = performance.now()
    this.rafId = requestAnimationFrame(this.tick)
  }

  // ---------- 帧循环 ----------
  private tick = (now: number): void => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.tick)
    if (!this.layers.length || !this.A) return
    // FPS 限制：达到目标间隔才渲染，动画计时仍按真实时间推进。
    if (this.frameInterval > 0 && now - this.lastFrame < this.frameInterval - 1) return
    this.lastFrame = now
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    const t = now / 1000

    // 构建目标参数
    let tgt = { ...this.T }

    // 应用当前动作的叠加参数
    if (this.motionTarget) {
      const elapsed = this.motionDuration > 0 ? (now - this.motionStartTime) / this.motionDuration : 0
      const progress = this.motionDuration > 0 ? Math.min(1, elapsed) : 1
      const ease = this.smooth(progress)
      for (const key of Object.keys(this.motionTarget) as Array<keyof Anime25DParams>) {
        const targetVal = this.motionTarget[key] ?? 0
        const currentVal = (tgt[key] as number) ?? 0
        ;(tgt as any)[key] = currentVal + (targetVal - currentVal) * ease
      }
      // 动作结束
      if (this.motionDuration > 0 && progress >= 1) {
        this.motionTarget = null
        this.motionName = null
        this.motionDuration = 0
      }
    }

    // 鼠标跟随
    if (this.auto.mouse && this.mouse.in) {
      tgt.angleX = this.clamp(this.mouse.x * 0.9, -1, 1)
      tgt.angleY = this.clamp(-this.mouse.y * 0.7, -1, 1)
      tgt.eyeX = this.clamp(this.mouse.x * 1.2, -1, 1)
      tgt.eyeY = this.clamp(-this.mouse.y * 0.8, -1, 1)
    }

    // 空闲动画（不覆盖用户手动设置的参数）
    if (this.auto.idle) {
      if (!this.manualSet.has('angleX')) tgt.angleX += 0.13 * Math.sin(t * 0.42) + 0.05 * Math.sin(t * 1.13)
      if (!this.manualSet.has('angleY')) tgt.angleY += 0.08 * Math.sin(t * 0.31 + 1.7)
      if (!this.manualSet.has('angleZ')) tgt.angleZ += 0.07 * Math.sin(t * 0.23 + 0.5)
      if (!this.manualSet.has('body')) tgt.body += 0.10 * Math.sin(t * 0.19 + 2.1)
    }

    // 随机动作
    if (this.auto.rand) {
      if (now > this.nextRnd) {
        this.nextRnd = now + 1400 + Math.random() * 2600
        this.rnd.ax = (Math.random() * 2 - 1) * 0.55
        this.rnd.ay = (Math.random() * 2 - 1) * 0.40
        this.rnd.az = (Math.random() * 2 - 1) * 0.35
        this.rnd.bd = (Math.random() * 2 - 1) * 0.30
        this.rnd.ex = (Math.random() * 2 - 1) * 0.60
        this.rnd.ey = (Math.random() * 2 - 1) * 0.35
      }
      tgt.angleX = this.clamp(tgt.angleX + this.rnd.ax, -1, 1)
      tgt.angleY = this.clamp(tgt.angleY + this.rnd.ay, -1, 1)
      tgt.angleZ = this.clamp(tgt.angleZ + this.rnd.az, -1, 1)
      tgt.body = this.clamp(tgt.body + this.rnd.bd, -1, 1)
      tgt.eyeX = this.clamp(tgt.eyeX + this.rnd.ex, -1, 1)
      tgt.eyeY = this.clamp(tgt.eyeY + this.rnd.ey, -1, 1)
    }

    // 嘴巴随机
    if (this.auto.talk) {
      if (now > this.nextTalkState) {
        this.talkOn = !this.talkOn
        this.nextTalkState = now + (this.talkOn ? 1200 + Math.random() * 2200 : 600 + Math.random() * 1800)
      }
      if (this.talkOn && now > this.nextSyl) {
        this.nextSyl = now + 70 + Math.random() * 110
        this.talkTgt = Math.random() < 0.25 ? 0.04 : 0.25 + Math.random() * 0.75
      }
      if (!this.talkOn) this.talkTgt = 0
      this.talkV += (this.talkTgt - this.talkV) * Math.min(1, dt * 22)
      if (!this.manualSet.has('mouthOpen')) tgt.mouthOpen = Math.max(tgt.mouthOpen, this.talkV)
    }

    // 眨眼
    if (this.auto.blink) {
      if (this.blinkT < 0 && now > this.nextBlink) {
        this.blinkT = 0
        this.nextBlink = now + 1600 + Math.random() * 3800
        if (Math.random() < 0.18) this.nextBlink = now + 280
      }
      if (this.blinkT >= 0) {
        this.blinkT += dt
        const d = this.blinkT
        let v: number
        if (d < 0.08) v = 1 - d / 0.08
        else if (d < 0.42) v = 0
        else if (d < 0.58) v = (d - 0.42) / 0.16
        else { v = 1; this.blinkT = -1 }
        if (!this.manualSet.has('eyeOpenL')) tgt.eyeOpenL = Math.min(tgt.eyeOpenL, v)
        if (!this.manualSet.has('eyeOpenR')) tgt.eyeOpenR = Math.min(tgt.eyeOpenR, v)
      }
    }

    // 平滑过渡
    for (const key of Object.keys(this.cur) as Array<keyof Anime25DParams>) {
      const tVal = (tgt[key] as number) ?? 0
      const cVal = (this.cur[key] as number) ?? 0
      ;(this.cur as any)[key] = cVal + (tVal - cVal) * Math.min(1, dt * 14)
    }

    const e = { ...this.cur } as Anime25DParams & { breath: number; breathHead: number }
    e.breath = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 3.4)
    e.breathHead = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 3.4 - 0.6)

    // 发丝弹簧物理
    const headDX = (e.angleX * 14 + e.angleZ * 0.07 * (this.NP.cy - this.FC.y)) * this.FS
    for (const L of this.layers) {
      if (!L.spr) continue
      for (const sp of L.spr) {
        const wind = this.auto.idle
          ? (1.8 * Math.sin(t * 0.8 + sp.phase) + 1.0 * Math.sin(t * 1.9 + sp.phase * 2.3))
          : 0
        const txv = headDX + wind * this.FS
        let kk = 70
        let cc = 9
        let axv = -kk * (sp.stiff.x - txv) - cc * sp.stiff.v
        sp.stiff.v += axv * dt
        sp.stiff.x += sp.stiff.v * dt
        sp.stiff.dx = -(sp.stiff.x - txv) * 2.2
        kk = 16
        cc = 1.3
        axv = -kk * (sp.soft.x - txv) - cc * sp.soft.v
        sp.soft.v += axv * dt
        sp.soft.x += sp.soft.v * dt
        sp.soft.dx = -(sp.soft.x - txv) * 3.0
      }
    }

    // 胸部弹跳
    {
      const bustTgt = (e.breath * 3.0 - e.angleY * 6.0 + e.body * 4.0) * this.FS
      const kk = 140
      const cc = 4.2
      const aa = -kk * (this.bounce.x - bustTgt) - cc * this.bounce.v
      this.bounce.v += aa * dt
      this.bounce.x += this.bounce.v * dt
      this.bounce.dy = -(this.bounce.x - bustTgt) * 3.0
    }

    // 渲染
    this.render(e)
  }

  /** 实际执行 WebGL 渲染。 */
  private render(e: Anime25DParams & { breath: number; breathHead: number }): void {
    const gl = this.gl
    if (!gl) return

    gl.viewport(0, 0, this.CW, this.CH)
    gl.clearColor(0, 0, 0, 0)
    gl.clearStencil(0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    gl.uniform2f(this.locRes, this.CW, this.CH)
    gl.uniform1f(this.locFlip, this.flipped ? -1 : 1)

    for (const L of this.layers) {
      const fa = this.fadeAlpha(L, e)
      if (fa < 0.004 && !(L.fade === 'eyeOpen' && L.name.indexOf('eyewhite') === 0)) continue
      this.deform(L, e)
      gl.uniform1f(this.locAl, fa)
      gl.bindBuffer(gl.ARRAY_BUFFER, L.vboPos)
      gl.bufferData(gl.ARRAY_BUFFER, L.cur, gl.DYNAMIC_DRAW)
      gl.vertexAttribPointer(this.locPos, 2, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, L.vboUV)
      gl.vertexAttribPointer(this.locUV, 2, gl.FLOAT, false, 0, 0)
      gl.bindTexture(gl.TEXTURE_2D, L.tex)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, L.ibo)
      if (L.name.indexOf('eyewhite') === 0) {
        gl.enable(gl.STENCIL_TEST)
        gl.stencilFunc(gl.ALWAYS, 1, 0xff)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE)
        gl.uniform1f(this.locCut, 0.25)
        gl.drawElements(gl.TRIANGLES, L.nIdx, gl.UNSIGNED_SHORT, 0)
        gl.disable(gl.STENCIL_TEST)
        gl.uniform1f(this.locCut, 0.0)
      } else if (L.name.indexOf('irides') === 0) {
        gl.enable(gl.STENCIL_TEST)
        gl.stencilFunc(gl.EQUAL, 1, 0xff)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
        gl.drawElements(gl.TRIANGLES, L.nIdx, gl.UNSIGNED_SHORT, 0)
        gl.disable(gl.STENCIL_TEST)
      } else {
        gl.drawElements(gl.TRIANGLES, L.nIdx, gl.UNSIGNED_SHORT, 0)
      }
    }
  }
}





/** Anime2.5DRig 滑块配置（用于设置面板）。 */
export interface SliderDef {
  key: keyof Anime25DParams
  label: string
  min: number
  max: number
  step: number
  default: number
  group: string
}

/** Anime2.5DRig 全部滑块定义（按控制面板分组）。 */
export const ANIME_SLIDERS: SliderDef[] = [
  // 头部姿态
  { key: 'angleX', label: '左右转头', min: -1, max: 1, step: 0.01, default: 0, group: '头部姿态' },
  { key: 'angleY', label: '上下点头', min: -1, max: 1, step: 0.01, default: 0, group: '头部姿态' },
  { key: 'angleZ', label: '歪头角度', min: -1, max: 1, step: 0.01, default: 0, group: '头部姿态' },
  // 眼睛
  { key: 'eyeOpenL', label: '左眼睁开', min: 0, max: 1, step: 0.01, default: 1, group: '眼睛' },
  { key: 'eyeOpenR', label: '右眼睁开', min: 0, max: 1, step: 0.01, default: 1, group: '眼睛' },
  { key: 'eyeX', label: '视线左右', min: -1, max: 1, step: 0.01, default: 0, group: '眼睛' },
  { key: 'eyeY', label: '视线上下', min: -1, max: 1, step: 0.01, default: 0, group: '眼睛' },
  { key: 'irisScale', label: '瞳孔大小', min: 0.5, max: 1.3, step: 0.01, default: 1, group: '眼睛' },
  { key: 'eyeScaleL', label: '左闭眼大小', min: 0.5, max: 1.5, step: 0.01, default: 1, group: '眼睛' },
  { key: 'eyeScaleR', label: '右闭眼大小', min: 0.5, max: 1.5, step: 0.01, default: 1, group: '眼睛' },
  { key: 'eyeEase', label: '眨眼灵敏度', min: 0, max: 1, step: 0.01, default: 0.3, group: '眼睛' },
  { key: 'eyeCY', label: '闭眼位置微调', min: -1, max: 1, step: 0.01, default: 0, group: '眼睛' },
  { key: 'eyeCAng', label: '闭眼角度微调', min: -1, max: 1, step: 0.01, default: 0, group: '眼睛' },
  // 眉毛
  { key: 'brow', label: '眉毛高低', min: -1, max: 1, step: 0.01, default: 0, group: '眉毛' },
  { key: 'browAngSym', label: '眉毛对称角度', min: -1, max: 1, step: 0.01, default: 0, group: '眉毛' },
  { key: 'browAngL', label: '左眉角度', min: -1, max: 1, step: 0.01, default: 0, group: '眉毛' },
  { key: 'browAngR', label: '右眉角度', min: -1, max: 1, step: 0.01, default: 0, group: '眉毛' },
  // 嘴巴
  { key: 'mouthOpen', label: '嘴巴张开', min: 0, max: 1, step: 0.01, default: 0, group: '嘴巴' },
  { key: 'mouthForm', label: '微笑弧度', min: -1, max: 1, step: 0.01, default: 0, group: '嘴巴' },
  { key: 'mouthCY', label: '闭口位置微调', min: -1, max: 1, step: 0.01, default: 0, group: '嘴巴' },
  { key: 'mouthEase', label: '闭口灵敏度', min: 0, max: 1, step: 0.01, default: 0.45, group: '嘴巴' },
  { key: 'mouthCAng', label: '嘴巴角度微调', min: -1, max: 1, step: 0.01, default: 0, group: '嘴巴' },
  { key: 'mouthScale', label: '嘴巴大小', min: 0.5, max: 1.5, step: 0.01, default: 1, group: '嘴巴' },
  // 发型
  { key: 'fhAmp', label: '刘海摆动幅度', min: 0, max: 3, step: 0.01, default: 2, group: '发型' },
  { key: 'fhSoft', label: '刘海柔软度', min: 0, max: 2, step: 0.01, default: 0.4, group: '发型' },
  { key: 'bangL', label: '左侧刘海', min: -1, max: 1, step: 0.01, default: 0, group: '发型' },
  { key: 'bangC', label: '中间刘海', min: -1, max: 1, step: 0.01, default: 0, group: '发型' },
  { key: 'bangR', label: '右侧刘海', min: -1, max: 1, step: 0.01, default: 0, group: '发型' },
  // 身体物理
  { key: 'body', label: '身体前倾', min: -1, max: 1, step: 0.01, default: 0, group: '身体物理' },
  { key: 'armY', label: '手臂高低', min: -1, max: 1, step: 0.01, default: 0, group: '身体物理' },
  { key: 'armPos', label: '手臂前后', min: -1, max: 1, step: 0.01, default: 0, group: '身体物理' },
  { key: 'bust', label: '胸部摆动', min: 0, max: 5, step: 0.01, default: 2.5, group: '身体物理' },
  { key: 'bustY', label: '胸部位置', min: -1, max: 3, step: 0.01, default: 1, group: '身体物理' },
  { key: 'physAmp', label: '头发摆动幅度', min: 0, max: 3, step: 0.01, default: 2, group: '身体物理' },
  { key: 'soft', label: '头发柔软度', min: 0, max: 2, step: 0.01, default: 2, group: '身体物理' },
]