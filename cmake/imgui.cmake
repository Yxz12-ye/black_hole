add_library(imgui
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/imgui.cpp
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/imgui_draw.cpp
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/imgui_widgets.cpp
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/imgui_tables.cpp
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/imgui_demo.cpp
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/backends/imgui_impl_glfw.cpp
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/backends/imgui_impl_opengl3.cpp
)

target_include_directories(imgui PUBLIC
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui
    ${CMAKE_SOURCE_DIR}/3rdparty/imgui/backends
    ${CMAKE_SOURCE_DIR}/3rdparty/glad/include
)

target_compile_definitions(imgui PUBLIC
    IMGUI_IMPL_OPENGL_LOADER_GLAD
)

target_link_libraries(imgui PUBLIC glfw glad)

if (WIN32)
    target_link_libraries(imgui PUBLIC opengl32)
endif()
