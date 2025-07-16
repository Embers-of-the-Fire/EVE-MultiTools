pub mod proto {
    pub mod schema {
        include!(concat!(env!("OUT_DIR"), "/eve_multitools.data.rs"));
    }
}

pub mod bundle;
