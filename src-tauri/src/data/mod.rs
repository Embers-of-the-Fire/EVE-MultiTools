pub mod proto {
    pub mod schema {
        include!(concat!(env!("OUT_DIR"), "/eve_multitools.data.rs"));
    }
}

pub mod bundle;
pub mod esi;
pub mod image;
pub mod localization;
pub mod market;
pub mod statics;
