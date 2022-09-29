#include <stdio.h>
#include <conio.h>
#include "libs/conui.h"

void main()
{
    set_cursor_pos(53, 14);
    set_text_color(YELLOW);
    set_bg_color(DARK_BLUE);
    printf("Hello, world!");
    getch();
}