**注:此快速开始项目完全由AI Agent创建, 使用模型为`Claude-Opus-4.5`, 仅供参考**

# CppTemplate

轻量级跨平台 C++ 项目模板。

## 特性

- 🚀 现代 CMake (3.16+) 配置
- 🔧 C++17 标准
- 🖥️ 跨平台支持 (Windows / Linux / macOS)
- 📦 可选 vcpkg 包管理器集成
- ⚠️ 完善的编译器警告配置
- 🎨 Clang-Format 代码格式化
- 📋 CMake Presets 支持多种编译器配置

## 项目结构

```
.
├── CMakeLists.txt          # 主 CMake 配置
├── CMakePresets.json       # CMake 预设配置
├── cmake/
│   ├── compiler_warnings.cmake  # 编译器警告配置
│   └── use_vcpkg.cmake          # vcpkg 集成
├── src/
│   ├── main.cpp            # 程序入口
│   ├── config.hpp.in       # 配置头文件模板
│   └── app/
│       ├── app.hpp         # App 类头文件
│       └── app.cpp         # App 类实现
├── .clang-format           # 代码格式化配置
├── .gitignore
└── README.md
```

## 快速开始

### 依赖

- CMake 3.16+
- C++17 兼容的编译器:
  - GCC 7+
  - Clang 5+
  - MSVC 2017+
- Ninja (推荐) 或其他构建工具

### 构建

#### 使用 CMake Presets (推荐)

```bash
# 查看可用的预设
cmake --list-presets

# Windows (Clang)
cmake --preset win-clang-debug
cmake --build --preset win-clang-debug

# Windows (MSVC)
cmake --preset win-msvc-debug
cmake --build --preset win-msvc-debug

# Linux (GCC)
cmake --preset linux-gcc-debug
cmake --build --preset linux-gcc-debug

# macOS (Clang)
cmake --preset macos-clang-debug
cmake --build --preset macos-clang-debug
```

#### 传统方式

```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Debug
cmake --build .
```

### 运行

```bash
./build/<preset-name>/bin/CppTemplate
./build/<preset-name>/bin/CppTemplate --version
./build/<preset-name>/bin/CppTemplate --help
```

## CMake 选项

| 选项 | 默认值 | 描述 |
|------|--------|------|
| `ENABLE_WARNINGS` | ON | 启用编译器警告 |
| `ENABLE_TESTING` | OFF | 启用测试 |
| `CMAKE_USE_VCPKG` | OFF | 使用 vcpkg 包管理器 |

## 使用 vcpkg

1. 设置环境变量 `VCPKG_ROOT` 指向 vcpkg 安装目录
2. 配置时启用 vcpkg:

```bash
cmake -B build -DCMAKE_USE_VCPKG=ON
```

## License

MIT License
