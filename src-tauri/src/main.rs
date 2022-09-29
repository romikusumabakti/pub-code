#![cfg_attr(
    all(not(run_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// use std::process::Command;
use tauri::Manager;
use window_shadows::set_shadow;

extern crate machine_uid;

// #[tauri::command]
// fn build(path: &str) {
//     Command::new("C:\\mingw64\\bin\\gcc")
//         .args(["-g", path, "-o", "D:\\main"])
//         .spawn();
// }

// #[tauri::command]
// fn run(path: &str) {
//     Command::new("C:\\mingw64\\bin\\gdb")
//         .args([path, "-batch", "-ex", "set new-console on", "-ex", "run"])
//         .spawn();
// }

#[tauri::command]
fn machine_uid() -> Result<String, String> {
    match machine_uid::get() {
        Ok(uid) => Ok(uid),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn zoom(window: tauri::Window, factor: f64) {
    window
        .with_webview(move |webview| {
            #[cfg(windows)]
            unsafe {
                webview.controller().SetZoomFactor(factor).unwrap();
            }
        })
        .unwrap();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).expect("Unsupported platform!");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![machine_uid, zoom])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
