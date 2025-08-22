use std::path::PathBuf;

pub trait IfExists {
    fn if_exists(self) -> Option<PathBuf>;
}

impl IfExists for PathBuf {
    fn if_exists(self) -> Option<PathBuf> {
        if self.exists() {
            Some(self)
        } else {
            None
        }
    }
}
