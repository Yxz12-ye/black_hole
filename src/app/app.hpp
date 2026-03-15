#pragma once

#include <string>
#include <vector>

struct GLFWwindow;

class App {
public:
    App();
    ~App();

    int run(int argc, char* argv[]);

private:
    // Rendering helpers
    void initRendering();
    void shutdownRendering();
    unsigned int createShaderProgram(const char* vertexSrc, const char* fragmentSrc);
    unsigned int compileShader(unsigned int type, const char* src);
    unsigned int createTexture(const char* imageSrc);

    void printVersion() const;
    void printHelp() const;

    GLFWwindow* m_window;

    // GPU ray tracing resources
    unsigned int m_fullscreenVao = 0;
    unsigned int m_fullscreenVbo = 0;
    unsigned int m_raytraceProgram = 0;
    unsigned int m_texture = 0;

    // Camera parameters
    float m_camPos[3] = {0.0f, 0.0f, 3.0f};
    // Euler angles in degrees for view direction (yaw = Y axis, pitch = XZ plane)
    float m_camYaw = 0.0f;    // left-right rotation
    float m_camPitch = 0.0f;  // up-down rotation
    float m_camUp[3] = {0.0f, 1.0f, 0.0f};
    float m_fovY = 45.0f;  // degrees

    // Light parameters
    float m_lightPos[3] = {0.0f, 1.5f, 0.0f};
    float m_lightColor[3] = {1.0f, 0.95f, 0.9f};
    float m_lightIntensity = 10.0f;
};
