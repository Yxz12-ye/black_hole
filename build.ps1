# ============================================================================
# CppTemplate 构建脚本 (PowerShell 版) - 跨平台 C++ 项目构建助手
# ============================================================================

param(
    [ValidateSet('Debug', 'Release')]
    [string]$BuildType = 'Debug',
    
    [switch]$Clean,
    [switch]$Help
)

# ============================================================================
# 颜色定义
# ============================================================================
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error-Custom { Write-Host $args[0] -ForegroundColor Red }
function Write-Warning-Custom { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }

# ============================================================================
# 显示帮助信息
# ============================================================================
if ($Help) {
    Write-Host @"
=== CppTemplate PowerShell 构建脚本 ===

用法:
  .\build.ps1 [选项]

选项:
  -BuildType Debug|Release    构建类型 (默认: Debug)
  -Clean                      清理旧的构建文件
  -Help                       显示此帮助信息

自动检测编译器 (优先级):
  1. clang-cl + Ninja     (最快，推荐)
  2. MSVC + Ninja         (快)
  3. MSVC + VS Generator  (默认，较慢)
  4. Clang
  5. GCC

示例:
  .\build.ps1                           # Debug 构建 (自动选择编译器)
  .\build.ps1 -BuildType Release        # Release 构建
  .\build.ps1 -Clean                    # 清理后进行 Debug 构建
  .\build.ps1 -BuildType Release -Clean # 清理后进行 Release 构建

手动选择预设 (绕过自动检测):
  cmake --preset win-clang-cl-debug
  cmake --preset win-msvc-ninja-debug
  cmake --preset win-msvc-vs-debug
  cmake --build --preset win-clang-cl-debug

"@
    exit 0
}

# ============================================================================
# 主程序
# ============================================================================

Write-Success "=== CppTemplate 构建脚本 ==="
Write-Host ""

# 检查 CMake
Write-Host "检查依赖..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "❌ 错误: 未找到 cmake"
    Write-Host "请安装 CMake 3.16+ 后重试"
    exit 1
}

$cmakeVersion = cmake --version | Select-Object -First 1
Write-Success "✓ 找到 CMake: $cmakeVersion"

# 检查编译器
$compiler = $null
if (Get-Command clang-cl -ErrorAction SilentlyContinue) {
    $compiler = "clang-cl"
    $clangVersion = clang-cl --version | Select-Object -First 1
    Write-Success "✓ 找到 Clang-CL: $clangVersion"
} elseif (Get-Command clang++ -ErrorAction SilentlyContinue) {
    $compiler = "clang"
    $clangVersion = clang++ --version | Select-Object -First 1
    Write-Success "✓ 找到 Clang: $clangVersion"
} elseif (Get-Command g++ -ErrorAction SilentlyContinue) {
    $compiler = "gcc"
    $gccVersion = g++ --version | Select-Object -First 1
    Write-Success "✓ 找到 GCC: $gccVersion"
} elseif (Get-Command cl.exe -ErrorAction SilentlyContinue) {
    $compiler = "msvc"
    Write-Success "✓ 找到 MSVC"
} else {
    Write-Error-Custom "❌ 错误: 未找到任何 C++ 编译器"
    Write-Host "请安装 GCC、Clang 或 MSVC 后重试"
    exit 1
}

# 检查 Ninja
Write-Host ""
if (Get-Command ninja -ErrorAction SilentlyContinue) {
    Write-Success "✓ 找到 Ninja"
} else {
    Write-Warning-Custom "⚠ 未找到 Ninja (可选，可使用 Visual Studio 或 Unix Makefiles)"
}

Write-Host ""

# 选择 Preset
$buildTypeLower = $BuildType.ToLower()

if ($compiler -eq "clang-cl") {
    $preset = "win-clang-cl-$buildTypeLower"
} elseif ($compiler -eq "clang") {
    $preset = "win-clang-$buildTypeLower"
} elseif ($compiler -eq "gcc") {
    $preset = "win-gcc-$buildTypeLower"
} else {
    # MSVC: 优先使用 Ninja
    if (Get-Command ninja -ErrorAction SilentlyContinue) {
        $preset = "win-msvc-ninja-$buildTypeLower"
    } else {
        $preset = "win-msvc-vs-$buildTypeLower"
    }
}

Write-Info "使用预设: $preset"
Write-Host ""

# 清理构建 (如果指定 -Clean)
if ($Clean) {
    Write-Warning-Custom "清理构建目录..."
    Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Success "✓ 清理完成"
    Write-Host ""
}

# 配置项目
Write-Warning-Custom "配置项目..."
& cmake --preset $preset
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "❌ 配置失败"
    exit 1
}

Write-Host ""

# 构建项目
Write-Warning-Custom "构建项目..."
& cmake --build --preset $preset
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "❌ 构建失败"
    exit 1
}

Write-Host ""
Write-Success "✓ 构建完成！"
Write-Host ""

# 显示运行信息
Write-Warning-Custom "运行程序:"
Write-Host "  PowerShell:  .\build\$preset\bin\CppTemplate.exe"
Write-Host "  CMD:         build\$preset\bin\CppTemplate.exe"
Write-Host ""

Write-Warning-Custom "查看帮助:"
Write-Host "  .\build\$preset\bin\CppTemplate.exe --help"
Write-Host ""

Write-Success "构建脚本执行完成！"