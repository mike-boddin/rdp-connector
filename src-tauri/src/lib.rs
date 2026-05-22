use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{Emitter, Manager, WindowEvent};
use tauri::WebviewWindowBuilder;
#[cfg(feature = "teams")]
use tauri_plugin_opener::OpenerExt;
use serde_json;

pub mod advanced_commands;

const OAUTH_WINDOW_NAME: &str = "oauth";
#[cfg(feature = "teams")]
const TEAMS_URL: &str = "https://teams.cloud.microsoft/";

#[tauri::command]
fn get_features() -> Vec<String> {
    #[cfg(feature = "teams")]
    {
        vec!["teams".to_string()]
    }
    #[cfg(not(feature = "teams"))]
    {
        vec![]
    }
}

#[cfg(feature = "teams")]
#[tauri::command]
fn open_teams_window(app: tauri::AppHandle, profile: Option<String>) {
    let browsers = [
        "chromium-browser",
        "chromium",
        "google-chrome",
        "google-chrome-stable",
        "microsoft-edge",
        "microsoft-edge-stable",
    ];

    for browser in browsers {
        let mut args = vec![format!("--app={}", TEAMS_URL), "--no-default-browser-check".to_string()];
        if let Some(ref p) = profile {
            if !p.is_empty() {
                args.push(format!("--profile-directory={}", p));
            }
        }

        if std::process::Command::new(browser)
            .args(args)
            .spawn()
            .is_ok()
        {
            return;
        }
    }

    // Fallback to default browser if no chromium-based browser found
    let _ = app.opener().open_url(TEAMS_URL, None::<&str>);
}

#[tauri::command]
fn open_oauth_window(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let opt_window = app.get_webview_window(OAUTH_WINDOW_NAME);
    match opt_window {
        Some(window) => {
            let js = format!("window.location.replace({})", serde_json::to_string(&url).map_err(|e| e.to_string())?);
            window.eval(&js).map_err(|e| e.to_string())?;
        }
        None => {
            let target_url = url.parse().map_err(|_| "Failed to parse OAuth URL".to_string())?;
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

            let window = builder.build().map_err(|e| e.to_string())?;

            let app_handle = app.clone();
            window.on_window_event(move |x| {
                match x {
                    WindowEvent::CloseRequested { .. } => {
                        let _ = app_handle.emit("oauth-closed", ());
                    }
                    _ => {}
                }
            });
        }
    };
    Ok(())
}

#[tauri::command]
fn close_oauth_window(app: tauri::AppHandle) -> Result<(), String> {
    let opt_window = app.get_webview_window(OAUTH_WINDOW_NAME);
    match opt_window {
        Some(w) => {
            w.close().map_err(|e| e.to_string())?;
        }
        None => {}
    };
    Ok(())
}

#[tauri::command]
fn read_oauth_url(app: tauri::AppHandle) -> Result<String, String> {
    let window = app.get_webview_window(OAUTH_WINDOW_NAME);
    match window {
        Some(w) => Ok(w.url().map_err(|e| e.to_string())?.to_string()),
        None => Ok(String::new())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), String> {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    #[cfg(feature = "teams")]
    {
        builder = builder.plugin(tauri_plugin_opener::init());
    }

    builder
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(Arc::new(Mutex::new(advanced_commands::PtyState {
            writer: None,
            child: None,
        })))
        .invoke_handler(tauri::generate_handler![
            get_features,
            open_oauth_window,
            #[cfg(feature = "teams")]
            open_teams_window,
            read_oauth_url,
            close_oauth_window,
            advanced_commands::start_pty,
            advanced_commands::send_pty_input,
            advanced_commands::stop_pty,
            advanced_commands::focus_rdp
        ])
        .run(tauri::generate_context!())
        .map_err(|e| e.to_string())
}
