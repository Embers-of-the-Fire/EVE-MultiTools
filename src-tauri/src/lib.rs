#![allow(unexpected_cfgs)]

use log::error;

mod bundle;
mod config;
mod data;
mod init;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::new()
                        .clear_targets()
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::LogDir {
                                file_name: Some("logs".to_string()),
                            },
                        ))
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::Stdout,
                        ))
                        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                        .level(log::LevelFilter::Debug)
                        .build(),
                )?;
            } else {
                app.handle().plugin(
                    tauri_plugin_log::Builder::new()
                        .clear_targets()
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::LogDir {
                                file_name: Some("logs".to_string()),
                            },
                        ))
                        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            if let Err(e) = tauri::async_runtime::block_on(init::init(app)) {
                error!("Failed to initialize application: {e:?}");
                Err(e)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config::get_config,
            config::set_theme,
            config::set_language,
            config::update_config,
            config::reset_config_to_default,
            config::get_config_file_path,
            config::set_enabled_bundle_id,
            bundle::import_bundle_file,
            bundle::remove_bundle,
            bundle::get_bundles,
            bundle::get_enabled_bundle_id,
            bundle::enable_bundle,
            data::image::graphic::get_graphic_path,
            data::image::icon::get_icon_path,
            data::image::skin::get_skin_material_path,
            data::image::faction::get_faction_icon_path,
            data::image::faction::get_faction_logo_path,
            data::statics::types::get_type,
            data::statics::categories::get_category,
            data::statics::groups::get_group,
            data::statics::meta_groups::get_meta_group,
            data::statics::skins::get_skin,
            data::statics::skins::get_skin_material,
            data::statics::skins::get_skin_license,
            data::statics::skins::get_skin_material_id_by_license,
            data::statics::skins::get_licenses_by_skin,
            data::statics::factions::get_faction,
            data::statics::factions::get_faction_ids,
            data::statics::market_group::get_market_group,
            data::statics::market_group::get_market_group_raw,
            data::localization::get_localization,
            data::localization::search_type_by_name,
            data::localization::search_type_by_description,
            data::market::get_market_price,
            data::market::get_market_prices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
