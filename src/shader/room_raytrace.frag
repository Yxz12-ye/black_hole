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

// GR-inspired black hole lensing approximation around origin, using
//   a_GR = -3 (GM/c^2) h^2 / r^5  * r_hat
// where h = |r x v| is the (approximate) angular momentum of the photon.
// Camera at ro, initial ray rd. Returns color from lensed background or black if ray falls in.
vec3 traceBlackHole(vec3 ro, vec3 rd) {
    const float BH_RADIUS      = 0.6;   // approximate Schwarzschild radius
    const float LENS_STRENGTH  = 1.0;   // overall GR lensing strength scale
    const float STEP_SIZE      = 0.06;  // integration step length
    const float MAX_DIST       = 100.0; // when we consider ray escaped to infinity
    const int   MAX_STEPS      = 160;

    vec3 p = ro;
    vec3 d = normalize(rd);

    for (int i = 0; i < MAX_STEPS; ++i) {
        float r = length(p);

        // Fell into black hole: render as black (or could add accretion disk here)
        if (r < BH_RADIUS) {
            return vec3(0.0);
        }

        // Escaped far away: sample environment with final direction
        if (r > MAX_DIST) {
            return sampleEnv(d);
        }

        // GR-inspired bending toward origin using effective acceleration:
        //   a_GR ∝ -3 (GM/c^2) h^2 / r^5 * r_hat
        // In our units we take GM/c^2 ~ BH_RADIUS, and keep a tunable LENS_STRENGTH.
        vec3 rhat = normalize(p);
        vec3 h    = cross(p, d);              // angular momentum ~ r x v
        float h2  = dot(h, h);
        float invR = 1.0 / max(r, BH_RADIUS * 0.5);
        float invR2 = invR * invR;
        float invR5 = invR2 * invR2 * invR;   // 1 / r^5
        float rs    = BH_RADIUS;              // treat BH_RADIUS as ~ Schwarzschild radius

        vec3 accel = -3.0 * LENS_STRENGTH * rs * h2 * invR5 * rhat;

        // Update direction and position
        d = normalize(d + accel * STEP_SIZE);
        p += d * STEP_SIZE;
    }

    // If integration didn't escape or fall in, fall back to environment.
    return sampleEnv(d);
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
