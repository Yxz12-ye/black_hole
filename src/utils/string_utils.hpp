#pragma once

#include <string>
#include <vector>
#include <algorithm>

namespace StringUtils {

// 转换为大写
std::string toUpper(const std::string& str);

// 转换为小写
std::string toLower(const std::string& str);

// 修剪左边的空格
std::string trimLeft(const std::string& str);

// 修剪右边的空格
std::string trimRight(const std::string& str);

// 修剪两边的空格
std::string trim(const std::string& str);

// 分割字符串
std::vector<std::string> split(const std::string& str, char delimiter);

// 替换子字符串
std::string replace(const std::string& str, const std::string& from,
                   const std::string& to);

// 检查是否以某个字符串开头
bool startsWith(const std::string& str, const std::string& prefix);

// 检查是否以某个字符串结尾
bool endsWith(const std::string& str, const std::string& suffix);

}  // namespace StringUtils