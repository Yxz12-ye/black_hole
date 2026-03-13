# 开发指南

## 添加新的源文件

### 1. 创建头文件和实现文件

```cpp
// src/utils/math.hpp
#pragma once

int add(int a, int b);
```

```cpp
// src/utils/math.cpp
#include "math.hpp"

int add(int a, int b) {
    return a + b;
}
```

### 2. 更新 CMakeLists.txt

```cmake
set(SOURCES
    src/main.cpp
    src/app/app.cpp
    src/utils/math.cpp  # 添加新文件
)

set(HEADERS
    src/app/app.hpp
    src/utils/math.hpp  # 添加新文件
)
```

## 添加外部库 (使用 vcpkg)

### 1. 编辑 vcpkg.json

```json
{
  "dependencies": [
    "fmt",
    "spdlog"
  ]
}
```

### 2. 更新 CMakeLists.txt

```cmake
find_package(fmt REQUIRED)
find_package(spdlog REQUIRED)

target_link_libraries(${PROJECT_NAME} PRIVATE
    fmt::fmt
    spdlog::spdlog
)
```

### 3. 构建

```bash
cmake --preset win-clang-debug -DCMAKE_USE_VCPKG=ON
cmake --build --preset win-clang-debug
```

## 代码格式化

使用 clang-format 格式化代码：

```bash
# 格式化单个文件
clang-format -i src/main.cpp

# 格式化所有源文件
clang-format -i src/**/*.cpp src/**/*.hpp
```

## 编译器配置

### 启用特定的警告

编辑 `cmake/compiler_warnings.cmake` 文件来自定义警告级别。

### 使用不同的编译器

```bash
# GCC
cmake --preset linux-gcc-debug

# Clang
cmake --preset linux-clang-debug

# MSVC
cmake --preset win-msvc-debug
```

## 调试

### 生成编译命令数据库

CMake 已配置生成 `compile_commands.json`，可用于 IDE 的代码分析。

### 启用详细输出

```bash
cmake --build --preset win-clang-debug --verbose
```

## 项目配置

项目版本和名称在 `CMakeLists.txt` 中定义：

```cmake
project(CppTemplate
    VERSION 0.1.0
    DESCRIPTION "Lightweight cross-platform C++ template"
    LANGUAGES CXX
)
```

配置项在构建时自动生成到 `build/generated/config.hpp`，可在代码中使用：

```cpp
#include "config.hpp"

std::cout << "Project: " << PROJECT_NAME << std::endl;
std::cout << "Version: " << PROJECT_VERSION << std::endl;
```

## 最佳实践

1. **头文件保护**: 使用 `#pragma once`
2. **包含顺序**: 系统库 → 第三方库 → 本项目库
3. **命名规范**: 
   - 类名: PascalCase
   - 函数名: camelCase
   - 变量名: snake_case
   - 常量: UPPER_SNAKE_CASE
4. **代码格式**: 运行 clang-format 保持一致性
5. **编译警告**: 确保没有编译警告

## 常见问题

### Q: 如何更改项目名称？

A: 编辑 `CMakeLists.txt` 的 `project()` 命令中的 `CppTemplate`

### Q: 如何禁用警告？

A: 使用 `-DENABLE_WARNINGS=OFF` 选项或编辑 CMakeLists.txt

### Q: 支持哪些 C++ 标准？

A: 默认 C++17，可通过 `CMAKE_CXX_STANDARD` 修改

### Q: 如何交叉编译？

A: 创建新的工具链文件并使用 `-DCMAKE_TOOLCHAIN_FILE=path/to/toolchain.cmake`
