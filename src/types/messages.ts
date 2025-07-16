/**
 * Message keys for localization
 * These enums are used for consistent message identification between frontend and backend
 */
export enum MessageKey {
    // Error messages
    ERROR_SOMETHING_WENT_WRONG = "error.something_went_wrong",
    ERROR_TRY_AGAIN = "error.try_again",

    // Data package management
    BUNDLE_TITLE = "bundle.title",
    BUNDLE_DESCRIPTION = "bundle.description",
    BUNDLE_IMPORT_BUTTON = "bundle.import_button",
    BUNDLE_IMPORTING = "bundle.importing",
    BUNDLE_ENABLE = "bundle.enable",
    BUNDLE_ENABLED = "bundle.enabled",
    BUNDLE_DELETE = "bundle.delete",
    BUNDLE_DELETING = "bundle.deleting",
    BUNDLE_NO_DATA = "bundle.no_data",

    // Data package operations toast messages
    BUNDLE_IMPORT_SUCCESS = "bundle.toast.import_success",
    BUNDLE_IMPORT_SUCCESS_MESSAGE = "bundle.toast.import_success_message",
    BUNDLE_IMPORT_FAILED = "bundle.toast.import_failed",
    BUNDLE_IMPORT_FAILED_MESSAGE = "bundle.toast.import_failed_message",
    BUNDLE_ENABLE_SUCCESS = "bundle.toast.enable_success",
    BUNDLE_ENABLE_SUCCESS_MESSAGE = "bundle.toast.enable_success_message",
    BUNDLE_ENABLE_FAILED = "bundle.toast.enable_failed",
    BUNDLE_ENABLE_FAILED_MESSAGE = "bundle.toast.enable_failed_message",
    BUNDLE_DELETE_SUCCESS = "bundle.toast.delete_success",
    BUNDLE_DELETE_SUCCESS_MESSAGE = "bundle.toast.delete_success_message",
    BUNDLE_DELETE_FAILED = "bundle.toast.delete_failed",
    BUNDLE_DELETE_FAILED_MESSAGE = "bundle.toast.delete_failed_message",
    BUNDLE_LOAD_FAILED = "bundle.toast.load_failed",
    BUNDLE_LOAD_FAILED_MESSAGE = "bundle.toast.load_failed_message",

    // Data package delete confirmation
    BUNDLE_DELETE_CONFIRM_TITLE = "bundle.delete_confirm.title",
    BUNDLE_DELETE_CONFIRM_MESSAGE = "bundle.delete_confirm.message",
    BUNDLE_DELETE_CONFIRM_WARNING = "bundle.delete_confirm.warning",
    BUNDLE_DELETE_CONFIRM_CANCEL = "bundle.delete_confirm.cancel",
    BUNDLE_DELETE_CONFIRM_CONFIRM = "bundle.delete_confirm.confirm",

    // Data package info labels
    BUNDLE_INFO_GAME_VERSION = "bundle.info.game_version",
    BUNDLE_INFO_BUILD_VERSION = "bundle.info.build_version",
    BUNDLE_INFO_CREATED_TIME = "bundle.info.created_time",

    // Import progress
    BUNDLE_PROGRESS_STAGE = "bundle.progress.stage",

    // Main application
    MAIN_DESCRIPTION = "main.description",

    // Navigation
    NAV_HOME = "nav.home",
    NAV_DATABASE = "nav.database",
    NAV_BUNDLE = "nav.bundle",
    NAV_SETTINGS = "nav.settings",
}

/**
 * Message parameters for dynamic content
 */
export interface MessageParams {
    [key: string]: string | number;
}

/**
 * Localized message structure from backend
 */
export interface LocalizedMessage {
    key: MessageKey;
    params?: MessageParams;
}
