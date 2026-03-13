#!/bin/bash
# 构建脚本 - 跨平台 C++ 项目构建助手

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== CppTemplate 构建脚本 ===${NC}"
echo ""

# 检查 CMake
if ! command -v cmake &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 cmake${NC}"
    echo "请安装 CMake 3.16+ 后重试"
    exit 1
fi

echo -e "${GREEN}✓${NC} 找到 CMake: $(cmake --version | head -n1)"

# 检查编译器
if command -v clang++ &> /dev/null; then
    COMPILER="clang"
    echo -e "${GREEN}✓${NC} 找到 Clang: $(clang++ --version | head -n1)"
elif command -v g++ &> /dev/null; then
    COMPILER="gcc"
    echo -e "${GREEN}✓${NC} 找到 GCC: $(g++ --version | head -n1)"
elif command -v cl.exe &> /dev/null; then
    COMPILER="msvc"
    echo -e "${GREEN}✓${NC} 找到 MSVC"
else
    echo -e "${RED}❌ 错误: 未找到任何 C++ 编译器${NC}"
    exit 1
fi

echo ""

# 检查 Ninja
if command -v ninja &> /dev/null; then
    echo -e "${GREEN}✓${NC} 找到 Ninja"
else
    echo -e "${YELLOW}⚠${NC}  未找到 Ninja (可选，可使用 Unix Makefiles)"
fi

echo ""

# 选择预设
echo -e "${YELLOW}选择预设:${NC}"
echo "  1. Debug (默认)"
echo "  2. Release"
read -p "请选择 [1-2]: " -n 1 BUILD_TYPE
echo ""

if [ "$BUILD_TYPE" = "2" ]; then
    PRESET_SUFFIX="release"
else
    PRESET_SUFFIX="debug"
fi

# 选择编译器和平台
if [ "$COMPILER" = "clang" ]; then
    PRESET="linux-clang-$PRESET_SUFFIX"
elif [ "$COMPILER" = "gcc" ]; then
    PRESET="linux-gcc-$PRESET_SUFFIX"
else
    PRESET="win-msvc-$PRESET_SUFFIX"
fi

echo -e "${GREEN}使用预设:${NC} $PRESET"
echo ""

# 清理旧的构建 (可选)
read -p "是否清理旧的构建? [y/N]: " -n 1 CLEAN
echo ""
if [ "$CLEAN" = "y" ] || [ "$CLEAN" = "Y" ]; then
    echo -e "${YELLOW}清理构建目录...${NC}"
    rm -rf build out
fi

echo ""
echo -e "${YELLOW}配置项目...${NC}"
cmake --preset $PRESET

echo ""
echo -e "${YELLOW}构建项目...${NC}"
cmake --build --preset $PRESET

echo ""
echo -e "${GREEN}✓ 构建完成！${NC}"
echo ""
echo -e "${YELLOW}运行程序:${NC}"
echo "  Linux/macOS: ./build/$PRESET/bin/CppTemplate"
echo "  Windows:     .\\build\\$PRESET\\bin\\CppTemplate.exe"
echo ""
echo -e "${YELLOW}查看帮助:${NC}"
echo "  ./build/$PRESET/bin/CppTemplate --help"
echo ""
