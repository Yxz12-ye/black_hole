#pragma once

#include <string>
#include <vector>

class App
{
public:
    App() = default;
    ~App() = default;

    int run(int argc, char *argv[]);

private:
    void printVersion() const;
    void printHelp() const;
};