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
    void printVersion() const;
    void printHelp() const;

    GLFWwindow* m_window;
};
