#include <vector>

#include <gtest/gtest.h>

#include "utils/string_utils.hpp"

TEST(StringUtilsTest, ToUpperConvertsAsciiLetters) {
    EXPECT_EQ(StringUtils::toUpper("Abc123"), "ABC123");
}

TEST(StringUtilsTest, TrimRemovesOuterWhitespace) {
    EXPECT_EQ(StringUtils::trim(" \t hello world \n"), "hello world");
}

TEST(StringUtilsTest, SplitSeparatesByDelimiter) {
    const std::vector<std::string> expected{"a", "b", "c"};
    EXPECT_EQ(StringUtils::split("a,b,c", ','), expected);
}
