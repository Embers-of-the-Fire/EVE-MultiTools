use serde::{Deserialize, Serialize};

use crate::bundle::BundleDescriptor;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bundle {
    pub descriptor: BundleDescriptor,
}

impl Bundle {
    pub fn load(descriptor: BundleDescriptor) -> Self {
        Bundle { descriptor }
    }
}
