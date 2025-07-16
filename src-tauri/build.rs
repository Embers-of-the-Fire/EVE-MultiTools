fn main() {
    // Compile the protobuf files
    prost_build::compile_protos(&["../data/schema.proto"], &["../data"])
        .expect("Failed to compile protobuf files");
    tauri_build::build()
}
