use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{Emitter, Manager, WindowEvent};
use tauri::WebviewWindowBuilder;

pub mod advanced_commands;

const OAUTH_WINDOW_NAME: &str = "oauth";

#[tauri::command]
fn open_oauth_window(app: tauri::AppHandle, url: String) {
    let opt_window = app.get_webview_window(OAUTH_WINDOW_NAME);
    match opt_window {
        Some(window) => {
            let _ = window.eval(&format!("window.location.replace('{}')", url));
        }
        None => {
            let target_url = url.parse().expect("Failed to parse OAuth URL");
            let mut builder = WebviewWindowBuilder::new(
                &app,
                OAUTH_WINDOW_NAME,
                tauri::WebviewUrl::External(target_url),
            )
            .title("Login")
            .inner_size(600.0, 700.0);

            if let Ok(app_data) = app.path().app_data_dir() {
                let _ = std::fs::create_dir_all(&app_data);
                builder = builder.data_directory(app_data).incognito(false);
            }

            let window = builder.build().unwrap();

            let app_handle = app.clone();
            window.on_window_event(move |x| {
                match x {
                    WindowEvent::CloseRequested { .. } => {
                        app_handle.emit("oauth-closed", ()).unwrap();
                    }
                    _ => {}
                }
            });
        }
    };
}

#[tauri::command]
fn close_oauth_window(app: tauri::AppHandle) {
    let opt_window = app.get_webview_window(OAUTH_WINDOW_NAME);
    match opt_window {
        Some(w) => {
            w.close().unwrap();
        }
        None => {}
    };
}

#[tauri::command]
fn read_oauth_url(app: tauri::AppHandle) -> String{
    let window = app.get_webview_window(OAUTH_WINDOW_NAME);
    match window {
        Some(w) => {w.url().unwrap().to_string()},
        None => {String::new()}
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(Arc::new(Mutex::new(advanced_commands::PtyState {
            writer: None,
            child: None,
        })))
        .invoke_handler(tauri::generate_handler![
            open_oauth_window,
            read_oauth_url,
            close_oauth_window,
            advanced_commands::start_pty,
            advanced_commands::send_pty_input,
            advanced_commands::stop_pty,
            advanced_commands::focus_rdp
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
