#pragma once

#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>

class Logger {
public:
    enum class Level {
        DEBUG,
        INFO,
        WARNING,
        ERROR
    };

    Logger() = default;
    ~Logger() = default;

    static void setLevel(Level level) { currentLevel = level; }

    static void debug(const std::string& message) { log(Level::DEBUG, message); }
    static void info(const std::string& message) { log(Level::INFO, message); }
    static void warning(const std::string& message) { log(Level::WARNING, message); }
    static void error(const std::string& message) { log(Level::ERROR, message); }

private:
    static Level currentLevel;

    static void log(Level level, const std::string& message);
    static std::string levelToString(Level level);
    static std::string getTimestamp();
};