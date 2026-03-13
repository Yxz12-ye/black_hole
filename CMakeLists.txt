cmake_minimum_required(VERSION 3.16)
project(CppTemplate
    VERSION 0.1.0
    DESCRIPTION "Lightweight cross-platform C++ template"
    LANGUAGES CXX
)

# ============================================================================
# Global Settings
# ============================================================================
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Default build type
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Debug" CACHE STRING "Build type" FORCE)
endif()

# Output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# ============================================================================
# Options
# ============================================================================
option(ENABLE_WARNINGS "Enable compiler warnings" ON)
option(ENABLE_TESTING "Enable testing" OFF)
option(CMAKE_USE_VCPKG "Use vcpkg package manager" OFF)

# ============================================================================
# Vcpkg Support (Optional)
# ============================================================================
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/use_vcpkg.cmake)

# ============================================================================
# Compiler Warnings
# ============================================================================
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/compiler_warnings.cmake)

# ============================================================================
# Configure Header
# ============================================================================
configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/src/config.hpp.in
    ${CMAKE_CURRENT_BINARY_DIR}/generated/config.hpp
    @ONLY
)

# ============================================================================
# Source Files
# ============================================================================
set(SOURCES
    src/main.cpp
    src/app/app.cpp
    src/utils/logger.cpp
    src/utils/string_utils.cpp
)

set(HEADERS
    src/app/app.hpp
    src/utils/logger.hpp
    src/utils/string_utils.hpp
)

# ============================================================================
# Target
# ============================================================================
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_BINARY_DIR}/generated
)

if(ENABLE_WARNINGS)
    target_link_libraries(${PROJECT_NAME} PRIVATE project_warnings)
endif()

# ============================================================================
# Installation
# ============================================================================
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION bin
)

# ============================================================================
# Testing (Optional)
# ============================================================================
if(ENABLE_TESTING)
    enable_testing()

    include(FetchContent)
    if(MSVC)
        # GoogleTest defaults to static CRT on Windows; align with parent project.
        set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    endif()

    FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG v1.17.x
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(googletest)

    add_subdirectory(tests)
endif()

# ============================================================================
# Print Configuration Summary
# ============================================================================
message(STATUS "")
message(STATUS "=== ${PROJECT_NAME} Configuration ===")
message(STATUS "Version:      ${PROJECT_VERSION}")
message(STATUS "Build type:   ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Compiler:     ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "Warnings:     ${ENABLE_WARNINGS}")
message(STATUS "Testing:      ${ENABLE_TESTING}")
message(STATUS "Vcpkg:        ${CMAKE_USE_VCPKG}")
message(STATUS "")
