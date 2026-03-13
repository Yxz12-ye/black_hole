# 入门指南

## 项目概述

这是一个轻量级、现代化的跨平台 C++ 项目模板，包含以下特性：

✅ **现代 CMake** - 3.16+ 配置，CMake Presets 支持  
✅ **C++17 标准** - 利用现代 C++ 特性  
✅ **跨平台** - Windows、Linux、macOS 一致支持  
✅ **开箱即用** - 包含日志、字符串工具等常用模块  
✅ **代码质量** - 完善的警告配置和格式化规则  
✅ **灵活扩展** - 清晰的代码组织，易于添加新模块  

## 五分钟快速开始

### 1️⃣ 预装检查

确保你的系统已安装：

```bash
# 检查 CMake
cmake --version          # 需要 3.16+

# 检查编译器
clang++ --version        # 或 g++ / cl.exe

# 检查构建工具
ninja --version          # 推荐使用 Ninja
```

### 2️⃣ 查看预设

```bash
cmake --list-presets
```

选择适合你平台的预设：
- **Windows**: `win-clang-debug` 或 `win-msvc-debug`
- **Linux**: `linux-gcc-debug` 或 `linux-clang-debug`
- **macOS**: `macos-clang-debug`

### 3️⃣ 构建项目

```bash
# 配置
cmake --preset win-clang-debug

# 构建
cmake --build --preset win-clang-debug
```

### 4️⃣ 运行程序

```bash
./build/win-clang-debug/bin/CppTemplate
```

输出应该如下：
```
2025-12-28 17:15:39 [INFO] Starting CppTemplate

=== CppTemplate ===
Version: 0.1.0
Build type: Debug

2025-12-28 17:15:39 [DEBUG] Application initialized successfully
2025-12-28 17:15:39 [INFO] Ready to process commands
```

## 项目文件导览

### 主要源代码

| 文件 | 用途 |
|------|------|
| `src/main.cpp` | 程序入口点 |
| `src/app/app.hpp` | 应用程序类 |
| `src/utils/logger.hpp` | 日志记录系统 |
| `src/utils/string_utils.hpp` | 字符串工具库 |

### 构建配置

| 文件 | 用途 |
|------|------|
| `CMakeLists.txt` | 主构建配置 |
| `CMakePresets.json` | 编译器预设 |
| `cmake/compiler_warnings.cmake` | 警告配置 |

### 开发文档

| 文件 | 内容 |
|------|------|
| `README.md` | 项目概述 |
| `QUICKSTART.md` | 常用命令速查 |
| `DEVELOPMENT.md` | 深入开发指南 |
| `PROJECT_STRUCTURE.md` | 项目架构说明 |

## 常见任务

### 添加新的类

```bash
# 1. 创建文件
mkdir -p src/mymodule
touch src/mymodule/mymodule.hpp
touch src/mymodule/mymodule.cpp

# 2. 编写代码
# ... 编辑 .hpp 和 .cpp 文件

# 3. 更新 CMakeLists.txt
# 在 set(SOURCES ...) 中添加 src/mymodule/mymodule.cpp
# 在 set(HEADERS ...) 中添加 src/mymodule/mymodule.hpp

# 4. 重新构建
cmake --preset win-clang-debug
cmake --build --preset win-clang-debug
```

### 使用日志系统

```cpp
#include "utils/logger.hpp"

int main() {
    Logger::setLevel(Logger::Level::DEBUG);
    Logger::debug("Debug message");
    Logger::info("App started");
    Logger::warning("Warning!");
    Logger::error("Error occurred");
    return 0;
}
```

### 使用字符串工具

```cpp
#include "utils/string_utils.hpp"

using namespace StringUtils;

std::string text = "  Hello World  ";

// 修剪空格
text = trim(text);              // "Hello World"

// 大小写转换
text = toLower(text);            // "hello world"
text = toUpper(text);            // "HELLO WORLD"

// 分割字符串
auto parts = split(text, ' ');   // ["HELLO", "WORLD"]

// 替换
text = replace(text, "WORLD", "C++");  // "HELLO C++"

// 前缀/后缀检查
if (startsWith(text, "HELLO")) { /*...*/ }
if (endsWith(text, "C++")) { /*...*/ }
```

### 格式化代码

```bash
# 格式化单个文件
clang-format -i src/main.cpp

# 格式化整个项目
clang-format -i src/**/*.{hpp,cpp}

# 检查格式 (不修改)
clang-format --dry-run src/main.cpp
```

### 切换构建类型

```bash
# Debug 构建
cmake --preset win-clang-debug
cmake --build --preset win-clang-debug

# Release 构建
cmake --preset win-clang-release
cmake --build --preset win-clang-release
```

### 清理构建

```bash
# Windows
rmdir /s build out

# Linux/macOS
rm -rf build out
```

## 项目配置

### 修改项目名称

编辑 `CMakeLists.txt`:

```cmake
project(MyAwesomeApp          # 改这里
    VERSION 1.0.0
    DESCRIPTION "My application"
    LANGUAGES CXX
)
```

### 修改版本号

编辑 `CMakeLists.txt`:

```cmake
project(CppTemplate
    VERSION 2.0.0              # 改这里
    DESCRIPTION "Lightweight cross-platform C++ template"
    LANGUAGES CXX
)
```

### 修改 C++ 标准

编辑 `CMakeLists.txt`:

```cmake
set(CMAKE_CXX_STANDARD 20)     # 改成 20、17 或其他值
```

### 禁用编译器警告

方法 1 - CMake 命令行:
```bash
cmake --preset win-clang-debug -DENABLE_WARNINGS=OFF
```

方法 2 - 编辑 CMakeLists.txt:
```cmake
option(ENABLE_WARNINGS "Enable compiler warnings" OFF)  # 改成 OFF
```

## 文件和代码风格

### 代码格式

项目使用 Google 风格 (通过 `.clang-format` 配置)：
- 4 空格缩进
- 100 字符行限制
- Attach 大括号风格

### 命名规范

```cpp
class MyClass { };           // PascalCase
void myFunction() { }         // camelCase
int my_variable = 0;         // snake_case
const int MAX_SIZE = 100;    // UPPER_SNAKE_CASE
```

### 文件组织

```
src/
├── main.cpp                  # 入口点
├── app/                      # 应用程序模块
└── utils/                    # 工具库
```

## 故障排除

### 找不到编译器

**问题**: `cmake: command not found`

**解决**:
- Windows: 安装 LLVM 或 Visual Studio
- Linux: `sudo apt install clang cmake ninja-build`
- macOS: `brew install llvm cmake ninja`

### 构建失败

**问题**: 编译错误

**解决**:
1. 删除 `build` 目录: `rm -rf build`
2. 重新配置: `cmake --preset win-clang-debug`
3. 重新构建: `cmake --build --preset win-clang-debug`

### 警告过多

**问题**: 编译警告太多

**解决**: 编辑 `cmake/compiler_warnings.cmake` 调整警告级别

## 下一步

1. 📖 阅读 `QUICKSTART.md` 了解常用命令
2. 🛠️ 阅读 `DEVELOPMENT.md` 学习如何添加依赖
3. 📁 查看 `PROJECT_STRUCTURE.md` 理解项目组织
4. 🚀 开始编写你的代码！

## 资源

- [CMake 官方文档](https://cmake.org/cmake/help/latest/)
- [C++ 参考](https://en.cppreference.com/)
- [Google C++ 风格指南](https://google.github.io/styleguide/cppguide.html)
- [现代 CMake 指南](https://cliutils.gitlab.io/modern-cmake/)

## 许可证

MIT License - 自由使用和修改
