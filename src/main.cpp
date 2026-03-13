#include <GLFW/glfw3.h>

#include "app/app.hpp"

int main(int argc, char* argv[]) {
    if (!glfwInit()) {
        return -1;
    }

    {
        App app;
        int result = app.run(argc, argv);
        glfwTerminate();
        return result;
    }
}
