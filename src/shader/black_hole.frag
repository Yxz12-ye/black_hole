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

// 严格的 GR 光线追踪近似：
// - 黑洞位于原点，史瓦西半径为 SCHWARZSCHILD_RADIUS；
// - 从相机位置 ro，沿初始方向 rd 反向追踪光线（在仿射参数意义下）；
// - 如果轨迹落入 r < r_s，则认为光线被黑洞吸收，像素为黑；
// - 如果轨迹到达 r > FAR_DISTANCE，则认为到达无穷远，
//   使用此处的切向方向 v 作为“来自天空”的方向，从 cubemap 采样。
vec3 traceBlackHole(vec3 ro, vec3 rd) {
    vec3 x = ro;
    vec3 v = normalize(rd);

    for (int i = 0; i < MAX_STEPS; ++i) {
        float r = length(x);

        // 事件视界内：黑洞
        if (r < SCHWARZSCHILD_RADIUS) {
            return vec3(0.0);
        }

        // 远离黑洞：认为进入了“平直时空”区域，方向基本稳定
        if (r > FAR_DISTANCE) {
            // 在无穷远处，光线方向 v 即为到达观察者的反向，所以用 v 采样天空盒
            return sampleEnv(v);
        }

        rk4Step(x, v);
    }

    // 数值积分未明显逃逸或落入：退化为用当前方向采样天空盒。
    return sampleEnv(v);
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
