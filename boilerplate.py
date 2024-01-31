import os

txt = """// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>."""

directory = '.'  # 替换为你要遍历的目录路径

def process_files(directory):
    # 遍历目录下的所有文件和子目录
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js')) and "node_modules" not in root:
                file_path = os.path.join(root, file)
                with open(file_path, 'r+') as file:
                    content = file.read()
                    file.seek(0, 0)  # 将文件指针移动到文件开头
                    file.write(txt + "\n\n" + content)  # 在文件开头添加多行字符串

# 调用递归函数开始遍历
process_files(directory)