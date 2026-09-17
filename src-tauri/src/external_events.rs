use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

use tauri::{AppHandle, Emitter};

const EVENT_RECEIVER_ADDRESS: &str = "127.0.0.1:39421";
const MAX_EVENT_BODY_BYTES: usize = 1024;

pub fn start(app_handle: AppHandle) -> std::io::Result<()> {
    let listener = TcpListener::bind(EVENT_RECEIVER_ADDRESS)?;

    thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(stream) => handle_connection(stream, &app_handle),
                Err(error) => eprintln!("Coding Pet event receiver error: {error}"),
            }
        }
    });

    Ok(())
}

fn handle_connection(stream: TcpStream, app_handle: &AppHandle) {
    let mut reader = BufReader::new(stream);
    let mut request_line = String::new();

    if reader.read_line(&mut request_line).is_err() {
        return;
    }

    let mut content_length = None;
    let mut header = String::new();
    loop {
        header.clear();
        if reader.read_line(&mut header).is_err() {
            return;
        }
        if header == "\r\n" {
            break;
        }

        if let Some((name, value)) = header.split_once(':') {
            if name.eq_ignore_ascii_case("content-length") {
                content_length = value.trim().parse::<usize>().ok();
            }
        }
    }

    let request = request_line.trim_end();
    let Some(length) = content_length else {
        write_response(reader.get_mut(), "400 Bad Request");
        return;
    };

    if !request.eq_ignore_ascii_case("POST /events HTTP/1.1") || length > MAX_EVENT_BODY_BYTES {
        write_response(reader.get_mut(), "404 Not Found");
        return;
    }

    let mut body = vec![0; length];
    if reader.read_exact(&mut body).is_err() {
        write_response(reader.get_mut(), "400 Bad Request");
        return;
    }

    let Ok(payload) = serde_json::from_slice::<serde_json::Value>(&body) else {
        write_response(reader.get_mut(), "400 Bad Request");
        return;
    };

    if app_handle.emit("pet-event", payload).is_err() {
        write_response(reader.get_mut(), "503 Service Unavailable");
        return;
    }

    write_response(reader.get_mut(), "202 Accepted");
}

fn write_response(stream: &mut TcpStream, status: &str) {
    let response = format!("HTTP/1.1 {status}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
    let _ = stream.write_all(response.as_bytes());
}
