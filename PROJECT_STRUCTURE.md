# 项目结构说明

## 完整项目树

```
cpp-start-lite/
├── src/                          # 源代码目录
│   ├── main.cpp                  # 程序入口点
│   ├── config.hpp.in             # 配置文件模板 (自动生成)
│   ├── app/                      # 应用程序模块
│   │   ├── app.hpp               # App 类声明
│   │   └── app.cpp               # App 类实现
│   └── utils/                    # 工具类库
│       ├── logger.hpp            # 日志记录器
│       ├── logger.cpp
│       ├── string_utils.hpp       # 字符串工具
│       └── string_utils.cpp
│
├── cmake/                        # CMake 辅助文件
│   ├── compiler_warnings.cmake   # 编译器警告配置
│   └── use_vcpkg.cmake           # vcpkg 包管理器集成
│
├── build/                        # 构建输出 (git忽略)
│   └── win-clang-debug/
│       ├── bin/                  # 可执行文件
│       │   └── CppTemplate.exe
│       └── generated/
│           └── config.hpp        # 自动生成的配置
│
├── out/                          # 安装输出 (git忽略)
│
├── CMakeLists.txt                # 主 CMake 配置文件
├── CMakePresets.json             # CMake 预设定义
├── .clang-format                 # 代码格式化规则
├── .gitignore                    # Git 忽略文件
├── README.md                     # 项目说明
├── DEVELOPMENT.md                # 开发指南
├── QUICKSTART.md                 # 快速参考
└── PROJECT_STRUCTURE.md          # 本文件
```

## 核心文件说明

### src/main.cpp
程序的主入口点。包含 `main()` 函数，创建 App 对象并调用其 `run()` 方法。

### src/app/app.hpp & app.cpp
主应用程序类，处理：
- 命令行参数解析
- 版本信息显示
- 帮助文本输出
- 应用程序主逻辑

### src/utils/logger.hpp & logger.cpp
**日志记录系统**

特性：
- 多日志级别 (DEBUG, INFO, WARNING, ERROR)
- 时间戳自动添加
- 可配置的日志级别过滤

使用示例：
```cpp
#include "utils/logger.hpp"

Logger::setLevel(Logger::Level::DEBUG);
Logger::debug("Debug message");
Logger::info("Info message");
Logger::warning("Warning message");
Logger::error("Error message");
```

### src/utils/string_utils.hpp & string_utils.cpp
**字符串处理工具库**

提供的函数：
- `toUpper()` - 转换为大写
- `toLower()` - 转换为小写
- `trim()` - 修剪空格
- `trimLeft()` / `trimRight()` - 单侧修剪
- `split()` - 分割字符串
- `replace()` - 替换子字符串
- `startsWith()` / `endsWith()` - 前缀/后缀检查

使用示例：
```cpp
#include "utils/string_utils.hpp"

using namespace StringUtils;

std::string text = "  Hello World  ";
text = trim(text);                    // "Hello World"
text = toLower(text);                 // "hello world"

auto parts = split(text, ' ');        // ["hello", "world"]

if (startsWith(text, "hello")) {
    // ...
}
```

### src/config.hpp.in
CMake 配置文件模板。在构建时自动生成为 `config.hpp`，包含：
- `PROJECT_NAME` - 项目名称
- `PROJECT_VERSION` - 项目版本
- 版本号 (MAJOR, MINOR, PATCH)
- `BUILD_TYPE` - 构建类型 (Debug/Release)
- 平台检测宏

### CMakeLists.txt
主构建配置文件，定义：
- 项目元数据
- C++ 标准设置
- 源文件列表
- 编译选项
- 包含目录
- 链接库
- 安装规则

关键选项：
```cmake
ENABLE_WARNINGS      # 启用编译器警告 (默认 ON)
ENABLE_TESTING       # 启用测试 (默认 OFF)
CMAKE_USE_VCPKG      # 使用 vcpkg (默认 OFF)
```

### CMakePresets.json
CMake 预设定义，包含：
- 9 个预配置的编译器/平台组合
- 继承机制简化配置
- 跨平台支持 (Windows/Linux/macOS)

### cmake/compiler_warnings.cmake
编译器警告配置库：
- MSVC 警告设置
- GCC/Clang 警告设置
- 平台特定优化

### .clang-format
Clang-Format 代码样式配置：
- Google 代码风格基础
- 4 空格缩进
- 100 字符行限制
- 自动格式化规则

## 代码组织原则

### 目录划分
```
src/
├── app/        # 应用程序核心逻辑
├── utils/      # 可复用的工具函数/类
├── models/     # 数据模型 (如需要)
└── services/   # 业务服务层 (如需要)
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | PascalCase | `class Logger` |
| 函数名 | camelCase | `void logMessage()` |
| 变量名 | snake_case | `int max_size` |
| 常量 | UPPER_SNAKE_CASE | `const int MAX_SIZE` |
| 文件名 | snake_case.cpp | `string_utils.cpp` |
| 头文件保护 | pragma once | `#pragma once` |
| 命名空间 | PascalCase | `namespace Utils {}` |

### 包含顺序
```cpp
// 1. 本项目的头文件
#include "app/app.hpp"

// 2. 第三方库头文件
#include <boost/...>

// 3. 标准库头文件
#include <iostream>
#include <vector>
```

## 添加新模块

### 步骤 1: 创建目录结构
```
src/
└── mymodule/
    ├── mymodule.hpp
    └── mymodule.cpp
```

### 步骤 2: 编写代码
```cpp
// src/mymodule/mymodule.hpp
#pragma once

class MyModule {
public:
    void doSomething();
};
```

### 步骤 3: 更新 CMakeLists.txt
```cmake
set(SOURCES
    src/main.cpp
    src/app/app.cpp
    src/mymodule/mymodule.cpp  # 添加
)

set(HEADERS
    src/app/app.hpp
    src/mymodule/mymodule.hpp  # 添加
)
```

### 步骤 4: 重新构建
```bash
cmake --preset win-clang-debug
cmake --build --preset win-clang-debug
```

## 构建工件

构建后生成的关键文件：

```
build/win-clang-debug/
├── bin/
│   └── CppTemplate.exe          # 可执行程序
├── generated/
│   └── config.hpp               # 自动生成的配置
├── compile_commands.json        # 编译命令数据库
├── CMakeFiles/                  # CMake 中间文件
└── *.obj                        # 对象文件
```

## 最佳实践检查清单

- [ ] 代码通过 clang-format 格式化
- [ ] 无编译警告 (`ENABLE_WARNINGS=ON`)
- [ ] 使用适当的访问修饰符 (public/private)
- [ ] 头文件使用 `#pragma once`
- [ ] 日志记录用 `Logger` 类而不是 `cout`
- [ ] 字符串操作使用 `StringUtils` 工具函数
- [ ] 跨平台代码使用条件编译
- [ ] 新文件添加到 CMakeLists.txt
