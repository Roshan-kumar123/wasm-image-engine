# ⚡ High-Performance WebAssembly Image Engine

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)
![Rust](https://img.shields.io/badge/Rust-Wasm-orange?logo=rust)
![Vite](https://img.shields.io/badge/Vite-Lightning-purple?logo=vite)

A blazing-fast, browser-based image processing engine built to demonstrate systems-level web architecture. This application offloads heavy pixel manipulation to a **Rust-compiled WebAssembly (Wasm)** module, keeping the React UI buttery smooth even when processing 4K images.

## 🚀 Live Demo

[🟢 Live Demo: Wasm Image Engine](https://wasm-image-engine-de5m.vercel.app/)

## 🧠 Architectural Highlights

This is not a standard React application. It was engineered using enterprise-grade performance patterns:

- **WebAssembly (Wasm) Engine:** Core image filters (Grayscale, Invert, Box Blur) are written in strictly typed Rust and compiled to Wasm for near-native mathematical execution.
- **Off-Main-Thread Processing:** The Wasm module is instantiated inside a dedicated **Web Worker**. The main JavaScript thread is never blocked, guaranteeing 60fps UI animations during heavy computation.
- **Zero-Copy Memory Transfer:** Eliminates the massive CPU spikes associated with `postMessage` deep cloning. `ImageData` buffers are passed to the Web Worker using **Transferable Objects**, resulting in instant, zero-copy memory handoffs for massive (30MB+) files.
- **Smart Garbage Collection:** Implements proactive `URL.revokeObjectURL()` cleanup to prevent memory leaks during rapid image swapping.
- **Optimized Export:** Repackages raw canvas data back into highly compressed JPEGs (85% quality) to prevent lossless PNG file-size ballooning on download.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **State Management:** Zustand
- **Styling:** Tailwind CSS v4, Lucide React Icons
- **Systems Backend (In-Browser):** Rust, `wasm-bindgen`, Web Workers

## 📂 Project Structure

```text
├── src/
│   ├── components/       # UI Components (Dropzone, Canvas, ErrorBoundaries)
│   ├── hooks/            # Web Worker bridge and lifecycle management
│   ├── store/            # Zustand global state
│   ├── workers/          # Web Worker entry point (loads Wasm)
│   └── types/            # Strict TypeScript discriminated unions for messaging
├── wasm-processor/       # The Rust Crate
│   ├── src/lib.rs        # Core math and pixel iteration logic
│   └── Cargo.toml        # Configured for LTO and aggressive optimization
```
