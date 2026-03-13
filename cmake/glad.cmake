add_library(glad STATIC
    ${CMAKE_SOURCE_DIR}/3rdparty/glad/src/glad.c
)

target_include_directories(glad PUBLIC
    ${CMAKE_SOURCE_DIR}/3rdparty/glad/include
)

