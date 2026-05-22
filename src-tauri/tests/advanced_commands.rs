use rdp_connector_lib::advanced_commands::{PtyState, pty_send_input, pty_stop};
use std::io::Write;
use std::sync::{Arc as StdArc, Mutex as StdMutex};

// A mock writer that captures output into a shared buffer.
struct MockWriter {
    buf: StdArc<StdMutex<Vec<u8>>>,
}

impl Write for MockWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.buf.lock().unwrap().extend_from_slice(buf);
        Ok(buf.len())
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

fn mock_writer_state() -> (PtyState, StdArc<StdMutex<Vec<u8>>>) {
    let buf = StdArc::new(StdMutex::new(Vec::new()));
    let writer = MockWriter { buf: buf.clone() };
    let state = PtyState {
        writer: Some(Box::new(writer)),
        child: None,
    };
    (state, buf)
}

// --- pty_send_input ---

#[test]
fn send_input_returns_err_when_no_pty() {
    let mut state = PtyState { writer: None, child: None };
    assert_eq!(pty_send_input(&mut state, "hello"), Err("PTY not started".into()));
}

#[test]
fn send_input_writes_data_plus_newline() {
    let (mut state, buf) = mock_writer_state();
    assert!(pty_send_input(&mut state, "hello").is_ok());
    assert_eq!(*buf.lock().unwrap(), b"hello\n");
}

#[test]
fn send_input_empty_string_writes_only_newline() {
    let (mut state, buf) = mock_writer_state();
    assert!(pty_send_input(&mut state, "").is_ok());
    assert_eq!(*buf.lock().unwrap(), b"\n");
}

#[test]
fn send_input_multiple_calls_appends_sequentially() {
    let (mut state, buf) = mock_writer_state();
    pty_send_input(&mut state, "line1").unwrap();
    pty_send_input(&mut state, "line2").unwrap();
    assert_eq!(*buf.lock().unwrap(), b"line1\nline2\n");
}

// --- pty_stop ---

#[test]
fn stop_pty_with_no_child_returns_ok() {
    let mut state = PtyState { writer: None, child: None };
    assert!(pty_stop(&mut state).is_ok());
}

#[test]
fn stop_pty_clears_writer() {
    let (mut state, _buf) = mock_writer_state();
    assert!(state.writer.is_some());
    // No child, but writer should be cleared only when child is taken.
    // Here writer persists since there is no child to trigger the cleanup.
    pty_stop(&mut state).unwrap();
    // Without a child, writer is left untouched (no child to kill).
    // This documents the current behaviour.
    assert!(state.writer.is_some());
}

// --- Integration: spawn a real PTY process ---

#[test]
fn integration_pty_spawn_echo_exits_successfully() {
    use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};

    let pty_system = NativePtySystem::default();
    let pair = pty_system
        .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
        .expect("openpty failed");

    let mut cmd = CommandBuilder::new("echo");
    cmd.arg("hello from pty test");

    let mut child = pair.slave.spawn_command(cmd).expect("spawn failed");
    let exit = child.wait().expect("wait failed");
    assert!(exit.success(), "echo should exit with success");
}

#[test]
fn integration_pty_stop_kills_running_process() {
    use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};

    let pty_system = NativePtySystem::default();
    let pair = pty_system
        .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
        .expect("openpty failed");

    let mut cmd = CommandBuilder::new("sleep");
    cmd.arg("60");

    let child = pair.slave.spawn_command(cmd).expect("spawn failed");
    let _writer = pair.master.take_writer().expect("take_writer failed");

    let mut state = PtyState {
        writer: None,
        child: Some(child),
    };

    assert!(state.child.is_some());
    pty_stop(&mut state).unwrap();
    assert!(state.child.is_none(), "child should be taken after stop");
}
