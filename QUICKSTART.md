# 快速参考

## 常用命令

### 配置和构建

```bash
# 查看所有预设
cmake --list-presets

# 配置 (Windows - Clang)
cmake --preset win-clang-debug

# 构建
cmake --build --preset win-clang-debug

# 构建 Release
cmake --build --preset win-clang-release

# 详细输出
cmake --build --preset win-clang-debug --verbose

# 清理
rm -r build out  # Linux/macOS
rmdir /s build out  # Windows
```

### 运行和测试

```bash
# 运行程序
./build/win-clang-debug/bin/CppTemplate

# 查看帮助
./build/win-clang-debug/bin/CppTemplate --help

# 查看版本
./build/win-clang-debug/bin/CppTemplate --version

# 安装
cmake --install build/win-clang-debug --prefix ./out/install
```

### 代码格式化

```bash
# 格式化所有文件
clang-format -i src/**/*.{hpp,cpp}

# 检查格式 (不修改)
clang-format --dry-run src/main.cpp
```

## 预设列表

| 预设名 | 平台 | 编译器 | 构建类型 |
|--------|------|--------|----------|
| `win-clang-debug` | Windows | Clang | Debug |
| `win-clang-release` | Windows | Clang | Release |
| `win-msvc-debug` | Windows | MSVC | Debug |
| `win-msvc-release` | Windows | MSVC | Release |
| `linux-gcc-debug` | Linux | GCC | Debug |
| `linux-gcc-release` | Linux | GCC | Release |
| `linux-clang-debug` | Linux | Clang | Debug |
| `macos-clang-debug` | macOS | Clang | Debug |
| `macos-clang-release` | macOS | Clang | Release |

## 文件结构速览

```
Project
├── src/                    # 源代码
│   ├── main.cpp           # 程序入口
│   ├── config.hpp.in      # 自动生成的配置
│   └── app/               # App 模块
├── cmake/                  # CMake 辅助脚本
├── CMakeLists.txt         # 主构建配置
├── CMakePresets.json      # 构建预设
├── .clang-format          # 代码格式化规则
├── .gitignore
├── README.md              # 项目文档
├── DEVELOPMENT.md         # 开发指南
└── QUICKSTART.md         # 本文件
```

## CMake 选项

```bash
# 启用警告 (默认 ON)
cmake --preset win-clang-debug -DENABLE_WARNINGS=ON

# 禁用警告
cmake --preset win-clang-debug -DENABLE_WARNINGS=OFF

# 启用测试
cmake --preset win-clang-debug -DENABLE_TESTING=ON

# 使用 vcpkg
cmake --preset win-clang-debug -DCMAKE_USE_VCPKG=ON
```

## 编译器检查

```bash
# 检查 CMake 版本
cmake --version

# 检查 C++ 编译器
g++ --version          # GCC
clang++ --version      # Clang
cl.exe /?              # MSVC

# 检查 Ninja
ninja --version
```

## 环境变量

```bash
# 使用 vcpkg 时必需
set VCPKG_ROOT=D:\vcpkg    # Windows
export VCPKG_ROOT=$HOME/vcpkg  # Linux/macOS
```

## 添加依赖的步骤

1. **使用 vcpkg**:
   ```bash
   vcpkg install fmt spdlog
   ```

2. **更新 CMakeLists.txt**:
   ```cmake
   find_package(fmt REQUIRED)
   target_link_libraries(${PROJECT_NAME} PRIVATE fmt::fmt)
   ```

3. **重新配置和构建**:
   ```bash
   cmake --preset win-clang-debug
   cmake --build --preset win-clang-debug
   ```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 找不到编译器 | 确保编译器在 PATH 中，或使用其他预设 |
| vcpkg 错误 | 设置 `VCPKG_ROOT` 环境变量，确保 vcpkg 已安装依赖 |
| 构建失败 | 删除 build 目录重新构建，检查 CMakeLists.txt |
| 格式化失败 | 确保安装了 clang-format: `apt install clang-format` |
