#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use window_shadows::set_shadow;
use window_vibrancy::apply_mica;

extern crate machine_uid;

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
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).unwrap();
            apply_mica(&window).unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![machine_uid, zoom])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
