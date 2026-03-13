#include <glad/glad.h>
#include <GLFW/glfw3.h>

#include "app.hpp"

#include <chrono>
#include <iostream>
#include <stdexcept>
#include <thread>

#include "../utils/logger.hpp"
#include "../utils/string_utils.hpp"
#include "backends/imgui_impl_glfw.h"
#include "backends/imgui_impl_opengl3.h"
#include "config.hpp"

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
}

App::~App() {
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

    // Main loop
    while (!glfwWindowShouldClose(m_window)) {
        glfwPollEvents();

        // Start the Dear ImGui frame
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        // Example ImGui UI
        ImGui::Begin("Demo");
        ImGui::Text("Hello from ImGui in App::run()");
        static float clear_color[4] = {0.1f, 0.1f, 0.1f, 1.0f};
        ImGui::ColorEdit3("Clear color", clear_color);
        ImGui::End();

        // Rendering
        ImGui::Render();
        int display_w, display_h;
        glfwGetFramebufferSize(m_window, &display_w, &display_h);
        glViewport(0, 0, display_w, display_h);
        glClearColor(clear_color[0], clear_color[1], clear_color[2], clear_color[3]);
        glClear(GL_COLOR_BUFFER_BIT);
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
