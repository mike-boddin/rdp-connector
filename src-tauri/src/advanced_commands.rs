use tauri::{AppHandle, Emitter, State};
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::io::{Read, Write};
use std::sync::Arc;
use tokio::sync::Mutex;


pub struct PtyState {
    pub writer: Option<Box<dyn Write + Send>>,
    pub child: Option<Box<dyn portable_pty::Child + Send>>,
}

pub type SharedPty = Arc<Mutex<PtyState>>;

#[tauri::command]
pub async fn start_pty(app: AppHandle, state: State<'_, SharedPty>, program: String, args: Vec<String>) -> Result<(), String> {
    let mut proc_state = state.lock().await;
    if proc_state.child.is_some() {
        return Err("Process already running".into());
    }

    let pty_system = NativePtySystem::default();
    let pair = pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new(program);
    for arg in args {
        cmd.arg(arg);
    }

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Spawn a thread to forward PTY output to the frontend
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break, // EOF
                Ok(n) => {
                    let output = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit("pty-output", output);
                }
                Err(_) => break,
            }
        }
    });

    proc_state.writer = Some(writer);
    proc_state.child = Some(child);

    Ok(())
}

#[tauri::command]
pub async fn send_pty_input(state: State<'_, SharedPty>, input: String) -> Result<(), String> {
    let mut proc_state = state.lock().await;
    if let Some(writer) = proc_state.writer.as_mut() {
        writer.write_all(input.as_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(b"\n").map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("PTY not started".into())
    }
}

#[cfg(unix)]
fn kill_process_group(child: &mut dyn portable_pty::Child) {

    if let Some(pid) = child.process_id() {
        unsafe {
            libc::kill(0-pid as i32, libc::SIGKILL);
        }
    }
}

#[tauri::command]
pub async fn stop_pty(state: State<'_, SharedPty>) -> Result<(), String> {
    let mut proc_state = state.lock().await;
    if let Some(mut child) = proc_state.child.take() {
        #[cfg(unix)]
        kill_process_group(child.as_mut());
        let _ = child.kill();
        proc_state.writer = None;
    }
    Ok(())
}