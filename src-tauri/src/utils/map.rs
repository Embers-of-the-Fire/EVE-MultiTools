#[macro_export]
macro_rules! __map {
    {$($l:expr => $r:expr),* $(,)?} => {{
        let mut map = ::std::collections::HashMap::new();
        $(
            map.insert($l, $r);
        )*
        map
    }};
}
