// Simple Cornell-box-style room ray tracing in fragment shader
#version 130

in vec2 v_uv;
out vec4 FragColor;

uniform vec3 u_cam_pos;
uniform vec3 u_cam_forward;
uniform vec3 u_cam_right;
uniform vec3 u_cam_up;
uniform float u_fov_y;      // in radians
uniform vec2 u_resolution;  // framebuffer size
uniform samplerCube u_env_map; // cubemap HDR environment map
uniform float u_time;       // seconds since start, for disk animation

// Accretion disk controls
uniform int   u_enable_disk;          // 0 = off, 1 = on
uniform float u_disk_inner_radius;    // inner radius in world units
uniform float u_disk_outer_radius;    // outer radius in world units
uniform float u_disk_thickness;       // half-thickness around equatorial plane
uniform float u_disk_noise_scale;     // scale of FBM pattern
uniform float u_disk_emission;        // overall brightness multiplier
uniform vec3  u_disk_base_color;      // base (cooler) color
uniform vec3  u_disk_hot_color;       // hot streaks color

uniform vec3 u_light_pos;
uniform vec3 u_light_color;
uniform float u_light_intensity;

// Room dimensions: a box centered at origin, size 2.0 ([-1,1] in each axis)
const float ROOM_SIZE = 4.0;

struct HitInfo {
    float t;
    vec3 normal;
    vec3 color;
    bool hit;
};

// Ray-box walls (Cornell-like)
void intersectRoom(vec3 ro, vec3 rd, inout HitInfo hit) {
    // Axis-aligned planes at x = +/- ROOM_SIZE, y = +/- ROOM_SIZE, z = +/- ROOM_SIZE
    // We'll clamp intersections to be inside the other two axes.

    // Helper to test a plane
    for (int axis = 0; axis < 3; ++axis) { // 三轴
        for (int sign = -1; sign <= 1; sign += 2) { // 三个轴都有面(也就是六面体房间)
            float planePos = float(sign) * ROOM_SIZE;
            float denom = rd[axis];
            if (abs(denom) < 1e-4) {
                continue;
            }
            float t = (planePos - ro[axis]) / denom;
            if (t <= 0.0 || t >= hit.t) {
                continue;
            }

            vec3 p = ro + t * rd;

            // Check inside bounds on the other two axes
            int axis1 = (axis + 1) % 3;
            int axis2 = (axis + 2) % 3;
            if (abs(p[axis1]) > ROOM_SIZE || abs(p[axis2]) > ROOM_SIZE) {
                continue;
            }

            // Inside room means we hit from inside: we want inward-pointing normals
            vec3 n = vec3(0.0);
            n[axis] = float(-sign);

            vec3 col = vec3(0.8); // default gray

            // Color walls similar to Cornell box: left = red, right = green, others white-ish
            if (axis == 0 && sign < 0) {
                // x = -ROOM_SIZE (left)
                col = vec3(0.8, 0.2, 0.2);
            } else if (axis == 0 && sign > 0) {
                // x = +ROOM_SIZE (right)
                col = vec3(0.2, 0.8, 0.2);
            } else if (axis == 1 && sign < 0) {
                // y = -ROOM_SIZE (bottom)
                col = vec3(0.8);
            } else if (axis == 1 && sign > 0) {
                // y = +ROOM_SIZE (top)
                col = vec3(0.9);
            } else {
                // front/back
                col = vec3(0.9);
            }

            hit.t = t;
            hit.normal = n;
            hit.color = col;
            hit.hit = true;
        }
    }
}

// Ray-sphere intersection for a simple object in the room
void intersectSphere(vec3 ro, vec3 rd, inout HitInfo hit, vec3 center, float radius, vec3 color) {
    vec3 oc = ro - center;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) {
        return;
    }
    h = sqrt(h);
    float t = -b - h;
    if (t < 0.0) {
        t = -b + h;
    }
    if (t <= 0.0 || t >= hit.t) {
        return;
    }

    vec3 p = ro + t * rd;
    vec3 n = normalize(p - center);

    hit.t = t;
    hit.normal = n;
    hit.color = color;
    hit.hit = true;
}

// Simple shadow test: check visibility to point light
bool isInShadow(vec3 p, vec3 lightPos) {
    vec3 toLight = lightPos - p;
    float distToLight = length(toLight);
    vec3 dir = toLight / distToLight;

    HitInfo shadowHit;
    shadowHit.t = distToLight;
    shadowHit.hit = false;

    // Room walls
    intersectRoom(p + dir * 1e-3, dir, shadowHit);

    // Sphere in center (same as main)
    intersectSphere(p + dir * 1e-3, dir, shadowHit, vec3(0.0, -0.5, 0.0), 0.5, vec3(1.0));

    return shadowHit.hit;
}
vec3 sampleEnv(vec3 dir) {
    vec3 hdr = texture(u_env_map, normalize(dir)).rgb;
    // Simple Reinhard + gamma tone mapping
    vec3 mapped = hdr / (hdr + vec3(1.0));
    mapped = pow(mapped, vec3(1.0 / 2.2));
    return mapped;
}

// =============================
// Fractal Brownian Motion noise
// =============================

float hash13(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    vec3 u = f * f * (3.0 - 2.0 * f); // smoothstep

    float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);

    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);

    return mix(nxy0, nxy1, u.z);
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; ++i) {
        value += amplitude * noise3(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// =============================
// Spherical coordinates helpers
// =============================

vec3 toSpherical(vec3 p) {
    float rho = length(p);
    float theta = atan(p.z, p.x);
    float phi = asin(clamp(p.y / max(rho, 1e-6), -1.0, 1.0));
    return vec3(rho, theta, phi);
}

// =============================
// GR-based black-hole lensing
// =============================
//
// 使用 相关公式.md 中给出的史瓦西度规与光线偏折加速度
//   a_GR = -3 (GM/c^2) h^2 / r^5 * r_hat
// 其中 h = |r × v| 是光子的（比）角动量，r_hat = r / |r|。
// 我们在 3D 欧式空间中数值积分光线的空间轨迹，
// 使用 Runge–Kutta 4 阶方法逼近广义相对论给出的光线弯曲轨迹。

// Schwarzschild 半径（事件视界）r_s = 2GM/c^2，在当前单位制下用一个常数给出。
// 如果想调节黑洞大小，只需要改这个参数。
const float SCHWARZSCHILD_RADIUS = 0.6;  // r_s in "world units"

// 数值积分参数：这里只追求物理准确性，不考虑性能。
const float STEP_SIZE      = 0.02;   // 仿射参数步长（越小越精确）
const int   MAX_STEPS      = 800;    // 最大步数（越大越精确）
const float FAR_DISTANCE   = 150.0;  // 认为已经到达“无穷远”的半径
const float EPS_RADIUS     = 1e-4;   // 避免除零

// 根据 a_GR = -3 (GM/c^2) h^2 / r^5 * r_hat 计算加速度。
// 这里把 GM/c^2 = r_s / 2 代入：
//   a_GR = -3 (r_s / 2) h^2 / r^5 * r_hat = -1.5 * r_s * h^2 / r^5 * r_hat
vec3 computeGRAcceleration(vec3 pos, vec3 vel) {
    float r = length(pos);
    if (r < EPS_RADIUS) {
        return vec3(0.0);
    }

    vec3 rhat = pos / r;

    // 比角动量 h = r × v
    vec3 h = cross(pos, vel);
    float h2 = dot(h, h);

    float rs = SCHWARZSCHILD_RADIUS;
    float invR = 1.0 / r;
    float invR2 = invR * invR;
    float invR5 = invR2 * invR2 * invR; // 1 / r^5

    float coeff = -1.5 * rs * h2 * invR5;
    return coeff * rhat;
}

// 单步 RK4 积分：从 (x, v) 沿 λ 方向推进一个 STEP_SIZE。
void rk4Step(inout vec3 x, inout vec3 v) {
    float h = STEP_SIZE;

    vec3 k1_x = v;
    vec3 k1_v = computeGRAcceleration(x, v);

    vec3 v2 = normalize(v + 0.5 * h * k1_v);
    vec3 k2_x = v2;
    vec3 k2_v = computeGRAcceleration(x + 0.5 * h * k1_x, v2);

    vec3 v3 = normalize(v + 0.5 * h * k2_v);
    vec3 k3_x = v3;
    vec3 k3_v = computeGRAcceleration(x + 0.5 * h * k2_x, v3);

    vec3 v4 = normalize(v + h * k3_v);
    vec3 k4_x = v4;
    vec3 k4_v = computeGRAcceleration(x + h * k3_x, v4);

    x += (h / 6.0) * (k1_x + 2.0 * k2_x + 2.0 * k3_x + k4_x);
    v = normalize(v + (h / 6.0) * (k1_v + 2.0 * k2_v + 2.0 * k3_v + k4_v));
}

// 严格的 GR 光线追踪近似 + 吸积盘体积发光：
// - 黑洞位于原点，史瓦西半径为 SCHWARZSCHILD_RADIUS；
// - 从相机位置 ro，沿初始方向 rd 反向追踪光线（在仿射参数意义下）；
// - 如果轨迹落入 r < r_s，则认为光线被黑洞吸收，像素为黑；
// - 如果轨迹穿过赤道附近的椭球形吸积盘，则按 fBM 密度积分发光；
// - 如果轨迹到达 r > FAR_DISTANCE，则认为到达无穷远，
//   使用此处的切向方向 v 作为“来自天空”的方向，从 cubemap 采样。

// 盘体积发光（完全重写，追求星际穿越般的震撼气态和旋转效果）
void adiskColor(vec3 pos, inout vec3 color, inout float alpha) {
    float innerRadius = u_disk_inner_radius;
    float outerRadius = u_disk_outer_radius;

    // --- 1. 基础盘体形状与衰减 ---
    float r = length(pos.xz);
    
    // 如果不在吸积盘范围内，直接返回
    if (r < innerRadius * 0.9 || r > outerRadius * 1.5) return;

    // 垂直方向厚度：中心薄，边缘稍厚，形成喇叭口（Flare）形状
    float flareThickness = u_disk_thickness * (1.0 + (r - innerRadius) * 0.2);
    // 高斯衰减使边缘非常柔和
    float verticalDensity = exp(-pow(abs(pos.y) / flareThickness, 2.5));
    
    // 径向衰减：在内边缘有一个锐利的截断（因为物质掉入视界），外边缘缓慢平滑过渡
    float radialDensity = smoothstep(innerRadius * 0.95, innerRadius * 1.2, r) * 
                          pow(smoothstep(outerRadius * 1.5, outerRadius * 0.5, r), 1.5);
                          
    float baseDensity = verticalDensity * radialDensity;
    if (baseDensity < 0.001) return;

    // --- 2. 开普勒轨道旋转与角速度 ---
    // 越靠近黑洞转得越快: omega ~ r^(-1.5)
    // 为了视觉震撼，放大内圈旋转速度
    float omega = 4.0 * pow(innerRadius / max(r, innerRadius * 0.5), 1.5);
    float angle = atan(pos.z, pos.x);
    // 当前点随时间旋转后的相位
    float phase = angle + u_time * omega;

    // --- 3. 构造极度气态的漩涡结构 (Vortex Structure) ---
    // 使用极坐标变形来产生螺旋臂和丝状气带
    vec2 polar = vec2(r, phase);
    
    // 螺旋臂基础：将 r 映射到 phase 上形成螺旋
    float spiralArms = sin(polar.y * 3.0 - r * 1.5);
    // 让螺旋臂不要太死板，加入一些粗糙的不规则性
    spiralArms = smoothstep(-0.5, 1.0, spiralArms) * 0.5 + 0.5;

    // --- 4. 高质量流体噪声 (Fluid-like fBM) ---
    // 在一个旋转的坐标系中采样 3D 噪声，模拟气体絮流
    vec3 rotPos = vec3(r * cos(phase), pos.y, r * sin(phase));
    
    // 使用一个随半径和时间拉伸的坐标，制造被引力撕裂的丝状感觉 (Spaghetti effect)
    vec3 noisePos = rotPos * u_disk_noise_scale;
    noisePos.x *= 1.0 + r * 0.1; // 径向拉伸
    noisePos.z *= 1.0 + r * 0.1;
    
    float noiseVal = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    // 增加八度数以获得更细碎的气态边缘
    for (int i = 0; i < 5; ++i) {
        // 随时间微小物化流动，让气体看起来是活的
        vec3 flowPos = noisePos * freq + vec3(0.0, u_time * 0.2, u_time * 0.1 * float(i));
        noiseVal += amp * noise3(flowPos);
        freq *= 2.1; // lacunarity
        amp *= 0.45; // gain
    }
    
    // 将噪声重映射，创造高对比度的丝状气云
    float gasClouds = smoothstep(0.3, 0.8, noiseVal);
    
    // 结合螺旋臂和气云
    float structure = mix(gasClouds, gasClouds * spiralArms * 1.5, 0.6);
    
    // 最终密度 = 基础形状 * 气态结构
    float finalDensity = baseDensity * structure * 20.0;

    // --- 5. 温度与颜色分布 (Blackbody-like) ---
    // 内圈温度极高（蓝白），外圈逐渐冷却（黄红暗）
    float tempNorm = clamp((r - innerRadius) / (outerRadius * 0.8 - innerRadius), 0.0, 1.0);
    // 噪声扰动温度，亮的地方更热
    tempNorm = clamp(tempNorm - gasClouds * 0.3, 0.0, 1.0);
    
    // 使用非线性映射让高温区（蓝白）更加集中在视界边缘
    vec3 hotColor = vec3(1.0, 0.9, 0.7);   // 内圈白偏黄
    vec3 midColor = u_disk_hot_color;      // 中圈橙红
    vec3 coldColor = u_disk_base_color;    // 外圈暗红
    
    vec3 gasColor;
    if (tempNorm < 0.3) {
        gasColor = mix(hotColor, midColor, tempNorm / 0.3);
    } else {
        gasColor = mix(midColor, coldColor, (tempNorm - 0.3) / 0.7);
    }

    // --- 6. 多普勒偏折 (Doppler Beaming) - 强化星际穿越感 ---
    // 气体朝向我们运动的一侧蓝移且变亮，背离的一侧红移且变暗
    vec3 tangentVel = normalize(vec3(-pos.z, 0.0, pos.x));
    vec3 viewDir = normalize(pos - u_cam_pos);
    float dopplerCos = dot(tangentVel, viewDir);
    
    // 相对论性多普勒增强系数 D = 1 / (gamma * (1 - v*cos))
    // 这里做一个夸张的艺术化近似：
    float v_c = 0.7 * pow(innerRadius / r, 0.5); // 假设内圈速度达 0.7c
    float dopplerFactor = pow((1.0 + v_c * dopplerCos) / sqrt(1.0 - v_c*v_c), 3.0);
    
    // 同时稍微影响颜色（蓝移变蓝，红移变红）
    vec3 shiftColor = gasColor;
    if (dopplerCos > 0.0) {
        shiftColor = mix(gasColor, vec3(0.8, 0.9, 1.0), dopplerCos * 0.5); // 蓝移发白
    } else {
        shiftColor = mix(gasColor, vec3(1.0, 0.3, 0.1), -dopplerCos * 0.5); // 红移发红
    }

    // --- 7. 发光与吸收积分 ---
    // 越靠近中心内在发光越强
    float intrinsicLuminosity = 1.0 / (pow(r / innerRadius, 2.0) + 0.01);
    
    float brightness = u_disk_emission * dopplerFactor * intrinsicLuminosity;
    
    // 光学深度：气体越浓，遮挡光线越多
    float opticalDepth = finalDensity * 0.05; 
    
    // 只有在存在密度时才进行颜色叠加
    if (opticalDepth > 0.0001) {
        vec3 emission = shiftColor * brightness * finalDensity * 2.0;
        float transmittance = exp(-opticalDepth);
        
        // 解析积分近似：(1 - exp(-tau)) * (Emission / Extinction)
        vec3 stepContribution = emission * (1.0 - transmittance) / max(opticalDepth, 0.001);
        
        color += stepContribution * alpha;
        alpha *= transmittance;
    }
}

vec3 traceBlackHole(vec3 ro, vec3 rd) {
    vec3 x = ro;
    vec3 v = normalize(rd);
    vec3 color = vec3(0.0);
    float alpha = 1.0;

    for (int i = 0; i < MAX_STEPS; ++i) {
        float r = length(x);

        // 事件视界内：黑洞（完全吸收）
        if (r < SCHWARZSCHILD_RADIUS) {
            return color; // 仅剩已积累的盘体发光
        }

        // 吸积盘体积发光
        if (u_enable_disk != 0 && alpha > 0.001) {
            adiskColor(x, color, alpha);
        }

        // 远离黑洞或已经完全不透明：加上远处天空盒
        if (r > FAR_DISTANCE || alpha < 0.001) {
            return color + sampleEnv(v) * alpha;
        }

        rk4Step(x, v);
    }

    // 数值积分未明显逃逸或落入：退化为用当前方向采样环境 + 已有盘发光。
    return color + sampleEnv(v) * alpha;
}

void main() {
    // Generate ray direction from camera through pixel
    vec2 fragCoord = v_uv * u_resolution;
    vec2 ndc = (fragCoord / u_resolution) * 2.0 - 1.0;
    ndc.y *= -1.0; // flip Y (GL's origin is bottom-left for NDC)

    float aspect = u_resolution.x / u_resolution.y;
    float tanHalfFov = tan(0.5 * u_fov_y);

    // Camera space ray
    vec3 rd_cam;
    rd_cam.x = ndc.x * aspect * tanHalfFov;
    rd_cam.y = ndc.y * tanHalfFov;
    rd_cam.z = -1.0;
    rd_cam = normalize(rd_cam);

    // Transform to world space
    vec3 rd = normalize(rd_cam.x * u_cam_right + rd_cam.y * u_cam_up + rd_cam.z * u_cam_forward);
    vec3 ro = u_cam_pos;

    // Black hole at world origin; integrate a bent light path and sample skybox.
    vec3 color = traceBlackHole(ro, rd);

    FragColor = vec4(color, 1.0);
}
