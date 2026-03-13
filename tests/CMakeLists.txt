add_executable(${PROJECT_NAME}_tests
    string_utils_test.cpp
    ${CMAKE_SOURCE_DIR}/src/utils/string_utils.cpp
)

target_include_directories(${PROJECT_NAME}_tests PRIVATE
    ${CMAKE_SOURCE_DIR}/src
)

target_link_libraries(${PROJECT_NAME}_tests PRIVATE
    GTest::gtest_main
)

if(ENABLE_WARNINGS)
    target_link_libraries(${PROJECT_NAME}_tests PRIVATE project_warnings)
endif()

include(GoogleTest)
gtest_discover_tests(${PROJECT_NAME}_tests)
