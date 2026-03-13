#include "logger.hpp"

#include <iomanip>
#include <sstream>

Logger::Level Logger::currentLevel = Logger::Level::INFO;

std::string Logger::levelToString(Level level) {
    switch (level) {
    case Level::DEBUG:
        return "[DEBUG]";
    case Level::INFO:
        return "[INFO]";
    case Level::WARNING:
        return "[WARN]";
    case Level::ERROR:
        return "[ERROR]";
    default:
        return "[UNKNOWN]";
    }
}

std::string Logger::getTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

void Logger::log(Level level, const std::string& message) {
    if (level < currentLevel) {
        return;
    }

    std::cout << getTimestamp() << " " << levelToString(level) << " " << message << std::endl;
}