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
    // Load a cubemap from 6 HDR faces in a directory (px/nx/py/ny/pz/nz). 
    unsigned int createTexture(const char* basePath);

    void printVersion() const;
    void printHelp() const;

    GLFWwindow* m_window;

    // GPU ray tracing resources
    unsigned int m_fullscreenVao = 0;
    unsigned int m_fullscreenVbo = 0;
    unsigned int m_raytraceProgram = 0;
    unsigned int m_texture = 0;

    // Camera parameters
    float m_camPos[3] = {-1.0f, -4.2f, -9.0f}; // Move further back and slightly up
    // Euler angles in degrees for view direction (yaw = Y axis, pitch = XZ plane)
    float m_camYaw = -9.5f;    // left-right rotation
    float m_camPitch = -32.0f;  // up-down rotation (look slightly down)
    float m_camUp[3] = {0.0f, 1.0f, 0.0f};
    float m_fovY = 70.0f;  // slightly wider fov

    // Light parameters
    float m_lightPos[3] = {0.0f, 1.5f, 0.0f};
    float m_lightColor[3] = {1.0f, 0.95f, 0.9f};
    float m_lightIntensity = 10.0f;

    // Black hole accretion disk parameters
    bool  m_enableDisk = true;
    float m_diskInnerRadius = 1.7f;
    float m_diskOuterRadius = 3.0f;
    float m_diskThickness   = 0.15f;
    float m_diskNoiseScale  = 2.0f;
    float m_diskEmission    = 1.2f; // Lowered from 1.8 to reduce overexposure
    float m_diskBaseColor[3] = {0.8f, 0.4f, 0.1f};
    float m_diskHotColor[3]  = {1.0f, 0.9f, 0.7f};
    float m_timeSeconds     = 0.0f;
};
