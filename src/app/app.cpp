// clang-format off
#include <glad/glad.h>
#include <GLFW/glfw3.h>
// clang-format on

#include "app.hpp"

#include <chrono>
#include <cmath>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>
#include <cstring>

#include "../utils/logger.hpp"
#include "../utils/string_utils.hpp"
#include "backends/imgui_impl_glfw.h"
#include "backends/imgui_impl_opengl3.h"
#include "config.hpp"
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

namespace {

std::string loadFileToString(const std::string& path) {
    std::ifstream ifs(path, std::ios::binary);
    if (!ifs) {
        throw std::runtime_error("Failed to open file: " + path);
    }
    std::ostringstream oss;
    oss << ifs.rdbuf();
    return oss.str();
}

// 归一化
void normalize3(float v[3]) {
    float len = std::sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len > 0.0f) {
        v[0] /= len;
        v[1] /= len;
        v[2] /= len;
    }
}

// 计算a和b的叉积
void cross3(const float a[3], const float b[3], float out[3]) {
    out[0] = a[1] * b[2] - a[2] * b[1];
    out[1] = a[2] * b[0] - a[0] * b[2];
    out[2] = a[0] * b[1] - a[1] * b[0];
}

}  // namespace

App::App() {
    // Create window and OpenGL context
    m_window = glfwCreateWindow(640, 480, "Title", nullptr, nullptr);
    if (m_window == nullptr) {
        throw std::runtime_error("Unable to create window");
    }

    glfwMakeContextCurrent(m_window);
    glfwSwapInterval(1);  // Enable vsync

    // Initialize GL loader (GLAD, provided via GLFW deps)
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        throw std::runtime_error("Failed to initialize GLAD");
    }

    // Setup Dear ImGui context
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    (void)io;  // currently unused

    // Setup Dear ImGui style
    ImGui::StyleColorsDark();

    // Setup Platform/Renderer backends
    ImGui_ImplGlfw_InitForOpenGL(m_window, true);
    ImGui_ImplOpenGL3_Init("#version 130");

    initRendering();
}

App::~App() {
    shutdownRendering();

    // Cleanup ImGui
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();

    glfwDestroyWindow(m_window);
}

int App::run(int argc, char* argv[]) {
    std::vector<std::string> args(argv, argv + argc);
    Logger::setLevel(Logger::Level::DEBUG);

    Logger::info("Starting " + std::string(PROJECT_NAME));

    for (size_t i = 1; i < args.size(); ++i) {
        if (args[i] == "--version" || args[i] == "-v") {
            printVersion();
            return 0;
        }
        if (args[i] == "--help" || args[i] == "-h") {
            printHelp();
            return 0;
        }
    }

    std::cout << "\n=== " << PROJECT_NAME << " ===" << std::endl;
    std::cout << "Version: " << PROJECT_VERSION << std::endl;
    std::cout << "Build type: " << BUILD_TYPE << std::endl;
    std::cout << std::endl;

    Logger::debug("Application initialized successfully");
    Logger::info("Ready to process commands");

    float clear_color[4] = {0.02f, 0.02f, 0.05f, 1.0f};

    // Main loop
    while (!glfwWindowShouldClose(m_window)) {
        glfwPollEvents();

        // Start the Dear ImGui frame
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        // Controls window
        ImGui::Begin("Ray Tracing Controls");
        ImGui::Text("Camera");
        ImGui::SliderFloat3("Position", m_camPos, -5.0f, 5.0f);
        ImGui::SliderFloat("Yaw (deg)", &m_camYaw, -180.0f, 180.0f);
        ImGui::SliderFloat("Pitch (deg)", &m_camPitch, -89.0f, 89.0f);
        ImGui::SliderFloat("FOV Y (deg)", &m_fovY, 20.0f, 90.0f);

        ImGui::Separator();
        ImGui::Text("Light");
        ImGui::SliderFloat3("Light Pos", m_lightPos, -3.0f, 3.0f);
        ImGui::ColorEdit3("Light Color", m_lightColor);
        ImGui::SliderFloat("Intensity", &m_lightIntensity, 0.0f, 50.0f);

        ImGui::Separator();
        ImGui::ColorEdit3("Background", clear_color);
        ImGui::End();

        // Rendering
        ImGui::Render();
        int display_w, display_h;
        glfwGetFramebufferSize(m_window, &display_w, &display_h);
        glViewport(0, 0, display_w, display_h);

        glDisable(GL_DEPTH_TEST);
        glClearColor(clear_color[0], clear_color[1], clear_color[2], clear_color[3]);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // Compute camera basis
        // Forward from yaw/pitch (right-handed, Y up, looking down -Z at yaw=0)
        float yawRad = m_camYaw * 3.1415926535f / 180.0f;
        float pitchRad = m_camPitch * 3.1415926535f / 180.0f;
        float camForward[3] = {
            std::sin(yawRad) * std::cos(pitchRad),        // x
            std::sin(pitchRad),                           // y
            -std::cos(yawRad) * std::cos(pitchRad),       // z
        };
        normalize3(camForward);

        float camUp[3] = {m_camUp[0], m_camUp[1], m_camUp[2]};
        normalize3(camUp);

        float camRight[3];
        cross3(camForward, camUp, camRight);
        normalize3(camRight);

        // Re-orthogonalize up vector
        cross3(camRight, camForward, camUp);
        normalize3(camUp);

        // 到这里算出了相机的坐标系(camForward,camUp,camRight)
        // 本质就是去构建相机所需要的像素平面

        // Ray tracing pass
        glUseProgram(m_raytraceProgram);

        int loc_cam_pos = glGetUniformLocation(m_raytraceProgram, "u_cam_pos");
        int loc_cam_forward = glGetUniformLocation(m_raytraceProgram, "u_cam_forward");
        int loc_cam_right = glGetUniformLocation(m_raytraceProgram, "u_cam_right");
        int loc_cam_up = glGetUniformLocation(m_raytraceProgram, "u_cam_up");
        int loc_fov_y = glGetUniformLocation(m_raytraceProgram, "u_fov_y");
        int loc_resolution = glGetUniformLocation(m_raytraceProgram, "u_resolution");
        int loc_light_pos = glGetUniformLocation(m_raytraceProgram, "u_light_pos");
        int loc_light_color = glGetUniformLocation(m_raytraceProgram, "u_light_color");
        int loc_light_intensity = glGetUniformLocation(m_raytraceProgram, "u_light_intensity");

        // 写入相机参数, camRight和camUp确定光追平面
        if (loc_cam_pos >= 0) {
            glUniform3fv(loc_cam_pos, 1, m_camPos);
        }
        if (loc_cam_forward >= 0) {
            glUniform3fv(loc_cam_forward, 1, camForward);
        }
        if (loc_cam_right >= 0) {
            glUniform3fv(loc_cam_right, 1, camRight);
        }
        if (loc_cam_up >= 0) {
            glUniform3fv(loc_cam_up, 1, camUp);
        }
        // fov角度, 和相机与成像平面距离相关, 即平面顶部, 相机 平面底部组成的等腰三角形的顶角度数
        if (loc_fov_y >= 0) {
            float fovRad = m_fovY * 3.1415926535f / 180.0f;
            glUniform1f(loc_fov_y, fovRad);
        }
        if (loc_resolution >= 0) {
            glUniform2f(loc_resolution, static_cast<float>(display_w), static_cast<float>(display_h));
        }
        if (loc_light_pos >= 0) {
            glUniform3fv(loc_light_pos, 1, m_lightPos);
        }
        if (loc_light_color >= 0) {
            glUniform3fv(loc_light_color, 1, m_lightColor);
        }
        if (loc_light_intensity >= 0) {
            glUniform1f(loc_light_intensity, m_lightIntensity);
        }

        // Bind environment cubemap to texture unit 0 for the ray tracing shader
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_CUBE_MAP, m_texture);

        glBindVertexArray(m_fullscreenVao);
        glDrawArrays(GL_TRIANGLES, 0, 3);
        glBindVertexArray(0);
        glUseProgram(0);

        // ImGui on top
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

        glfwSwapBuffers(m_window);

        std::this_thread::sleep_for(std::chrono::milliseconds(16));
    }

    return 0;
}

void App::printVersion() const {
    std::cout << PROJECT_NAME << " v" << PROJECT_VERSION << std::endl;
}

void App::printHelp() const {
    std::cout << "Usage: " << PROJECT_NAME << " [options]\n"
              << "\nOptions:\n"
              << "  -h, --help     Show this help message\n"
              << "  -v, --version  Show version information\n";
}

void App::initRendering() {
    // Fullscreen triangle VAO (no VBO needed, vertex shader uses gl_VertexID)
    glGenVertexArrays(1, &m_fullscreenVao);

    // Load shaders from files (relative to working directory)
    std::string vertSrc = loadFileToString("D:/Code/Cpp/black_hole/src/shader/fullscreen.vert");
    std::string fragSrc = loadFileToString("D:/Code/Cpp/black_hole/src/shader/room_raytrace.frag");

    m_raytraceProgram = createShaderProgram(vertSrc.c_str(), fragSrc.c_str());

    // Load cubemap from separate faces in assets/Nebula6 (px/nx/py/ny/pz/nz).
    const char* imgSrc = "D:/Code/Cpp/black_hole/assets/Nebula6";
    m_texture = createTexture(imgSrc);

    // Bind environment map sampler to texture unit 0 once at init
    glUseProgram(m_raytraceProgram);
    int loc_env = glGetUniformLocation(m_raytraceProgram, "u_env_map");
    if (loc_env >= 0) {
        glUniform1i(loc_env, 0);
    }
    glUseProgram(0);
}

void App::shutdownRendering() {
    if (m_raytraceProgram != 0) {
        glDeleteProgram(m_raytraceProgram);
        m_raytraceProgram = 0;
    }
    if (m_texture != 0) {
        glDeleteTextures(1, &m_texture);
        m_texture = 0;
    }
    if (m_fullscreenVao != 0) {
        glDeleteVertexArrays(1, &m_fullscreenVao);
        m_fullscreenVao = 0;
    }
}

unsigned int App::compileShader(unsigned int type, const char* src) {
    unsigned int shader = glCreateShader(type);
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);

    int success = 0;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char infoLog[1024];
        glGetShaderInfoLog(shader, sizeof(infoLog), nullptr, infoLog);
        std::string typeStr = (type == GL_VERTEX_SHADER) ? "VERTEX" : "FRAGMENT";
        Logger::error("Shader compilation failed (" + typeStr + "): " + std::string(infoLog));
        glDeleteShader(shader);
        throw std::runtime_error("Shader compilation failed");
    }

    return shader;
}

unsigned int App::createTexture(const char* basePath) {
    // Load a cubemap from 6 HDR faces stored in a directory:
    //   px.hdr, nx.hdr, py.hdr, ny.hdr, pz.hdr, nz.hdr
    std::string base(basePath ? basePath : "");
    if (!base.empty() && base.back() != '/' && base.back() != '\\') {
        base.push_back('/');
    }

    const char* faceNames[6] = {"px.hdr", "nx.hdr", "py.hdr", "ny.hdr", "pz.hdr", "nz.hdr"};

    int width = 0, height = 0, nrChannels = 0;
    GLenum format = GL_RGB;
    GLenum internalFormat = GL_RGB16F;

    // First, load +X to determine resolution and format.
    {
        std::string path = base + faceNames[0];
        float* data = stbi_loadf(path.c_str(), &width, &height, &nrChannels, 0);
        if (!data) {
            throw std::runtime_error("Failed to load cubemap face: " + path);
        }
        if (width <= 0 || height <= 0) {
            stbi_image_free(data);
            throw std::runtime_error("Cubemap face has invalid resolution: " + path);
        }

        if (nrChannels == 1) {
            format = GL_RED;
            internalFormat = GL_R16F;
        } else if (nrChannels == 3) {
            format = GL_RGB;
            internalFormat = GL_RGB16F;
        } else if (nrChannels == 4) {
            format = GL_RGBA;
            internalFormat = GL_RGBA16F;
        }

        // Create cubemap and upload first face.
        unsigned int texture = 0;
        glGenTextures(1, &texture);
        glBindTexture(GL_TEXTURE_CUBE_MAP, texture);

        glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

        glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X,
                     0, internalFormat, width, height, 0, format, GL_FLOAT, data);
        stbi_image_free(data);

        // Upload remaining faces.
        for (int i = 1; i < 6; ++i) {
            int w = 0, h = 0, ch = 0;
            std::string facePath = base + faceNames[i];
            float* faceData = stbi_loadf(facePath.c_str(), &w, &h, &ch, 0);
            if (!faceData) {
                throw std::runtime_error("Failed to load cubemap face: " + facePath);
            }
            if (w != width || h != height || ch != nrChannels) {
                stbi_image_free(faceData);
                throw std::runtime_error("Cubemap faces have inconsistent resolution or channels");
            }

            glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i,
                         0, internalFormat, width, height, 0, format, GL_FLOAT, faceData);
            stbi_image_free(faceData);
        }

        glGenerateMipmap(GL_TEXTURE_CUBE_MAP);
        return texture;
    }
}

unsigned int App::createShaderProgram(const char* vertexSrc, const char* fragmentSrc) {
    unsigned int vs = compileShader(GL_VERTEX_SHADER, vertexSrc);
    unsigned int fs = compileShader(GL_FRAGMENT_SHADER, fragmentSrc);

    unsigned int program = glCreateProgram();
    glAttachShader(program, vs);
    glAttachShader(program, fs);
    glLinkProgram(program);

    int success = 0;
    glGetProgramiv(program, GL_LINK_STATUS, &success);
    if (!success) {
        char infoLog[1024];
        glGetProgramInfoLog(program, sizeof(infoLog), nullptr, infoLog);
        Logger::error("Program link failed: " + std::string(infoLog));
        glDeleteProgram(program);
        glDeleteShader(vs);
        glDeleteShader(fs);
        throw std::runtime_error("Program link failed");
    }

    glDetachShader(program, vs);
    glDetachShader(program, fs);
    glDeleteShader(vs);
    glDeleteShader(fs);

    return program;
}
