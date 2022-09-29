#include <iostream>
#include <conio.h>
#include "libs/conui.h"

using namespace std;

int main()
{
    set_cursor_pos(53, 14);
    set_text_color(YELLOW);
    set_bg_color(DARK_BLUE);
    cout << "Hello, world!";
    getch();
    return 0;
}