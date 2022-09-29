// Copyright 2021 PUB Education Division
// Author: Romi Kusuma Bakti

#include <windows.h>

#define outputHandle GetStdHandle(STD_OUTPUT_HANDLE)

#define BLACK 0x0
#define DARK_BLUE 0x1
#define DARK_GREEN 0x2
#define DARK_CYAN 0x3
#define DARK_RED 0x4
#define DARK_PURPLE 0x5
#define DARK_YELLOW 0x6
#define DARK_WHITE 0x7
#define GRAY 0x8
#define BLUE 0x9
#define GREEN 0xa
#define CYAN 0xb
#define RED 0xc
#define PURPLE 0xd
#define YELLOW 0xe
#define WHITE 0xf

int text_color = FOREGROUND_INTENSITY;
int bg_color = 0;

void set_cursor_pos(SHORT x, SHORT y)
{
    COORD position = {x, y};
    SetConsoleCursorPosition(outputHandle, position);
}

void set_text_color(int color)
{
    SetConsoleTextAttribute(outputHandle, color | (bg_color << 4));
    text_color = color;
}

void set_bg_color(int color)
{
    SetConsoleTextAttribute(outputHandle, text_color | (color << 4));
    bg_color = color;
}