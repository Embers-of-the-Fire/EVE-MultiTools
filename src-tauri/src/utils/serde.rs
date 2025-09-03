#![allow(
    dead_code,
    reason = "Some code is used conditionally and some is for future use"
)]

use std::any::type_name;

use serde::{Deserialize, Serializer};

trait __Sealed {}

#[allow(
    private_bounds,
    reason = "This trait is not supposed to be implemented outside this module"
)]
pub trait PrimitiveSerializable: __Sealed {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer;
}

impl __Sealed for i8 {}
impl __Sealed for i16 {}
impl __Sealed for i32 {}
impl __Sealed for i64 {}
impl __Sealed for u8 {}
impl __Sealed for u16 {}
impl __Sealed for u32 {}
impl __Sealed for u64 {}
impl __Sealed for f32 {}
impl __Sealed for f64 {}
impl PrimitiveSerializable for i8 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i8(*self)
    }
}
impl PrimitiveSerializable for i16 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i16(*self)
    }
}
impl PrimitiveSerializable for i32 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i32(*self)
    }
}
impl PrimitiveSerializable for i64 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i64(*self)
    }
}
impl PrimitiveSerializable for u8 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u8(*self)
    }
}
impl PrimitiveSerializable for u16 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u16(*self)
    }
}
impl PrimitiveSerializable for u32 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u32(*self)
    }
}
impl PrimitiveSerializable for u64 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u64(*self)
    }
}
impl PrimitiveSerializable for f32 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_f32(*self)
    }
}
impl PrimitiveSerializable for f64 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_f64(*self)
    }
}

pub fn serialize_to_primitive<T, O, S>(value: &T, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: TryInto<O> + Copy,
    O: PrimitiveSerializable,
{
    let out: O = (*value).try_into().map_err(|_| {
        serde::ser::Error::custom(format!(
            "cannot convert `{}` to `{}`",
            type_name::<T>(),
            type_name::<O>()
        ))
    })?;
    out.serialize(serializer)
}

pub fn serialize_option_to_primitive<T, O, S>(
    value: &Option<T>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: TryInto<O> + Copy,
    O: PrimitiveSerializable,
{
    match value {
        Some(v) => serialize_to_primitive(v, serializer),
        None => serializer.serialize_none(),
    }
}

pub fn deserialize_from_primitive<'de, F, T, D>(deserializer: D) -> Result<T, D::Error>
where
    D: serde::Deserializer<'de>,
    F: serde::Deserialize<'de> + TryInto<T>,
{
    let intermediate = F::deserialize(deserializer)?;
    intermediate.try_into().map_err(|_| {
        serde::de::Error::custom(format!(
            "cannot convert `{}` to `{}`",
            type_name::<F>(),
            type_name::<T>()
        ))
    })
}

pub fn deserialize_option_from_primitive<'de, F, T, D>(
    deserializer: D,
) -> Result<Option<T>, D::Error>
where
    D: serde::Deserializer<'de>,
    F: serde::Deserialize<'de> + TryInto<T>,
{
    let intermediate = Option::<F>::deserialize(deserializer)?;
    match intermediate {
        Some(v) => v.try_into().map(Some).map_err(|_| {
            serde::de::Error::custom(format!(
                "cannot convert `{}` to `{}`",
                type_name::<F>(),
                type_name::<T>()
            ))
        }),
        None => Ok(None),
    }
}
