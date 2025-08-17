####  EVE MultiTools Data Bundle Script - Multi-Workspace Support  ####

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from termcolor import cprint

from bundle_impl import BundleProcessor

PROJECT = Path(__file__).resolve().parent.parent
DOWNLOAD_SEMAPHORE = asyncio.Semaphore(4)


def _success(*args, **kwargs) -> None:
    """Print success message."""
    cprint("Success: ", "green", attrs=["bold"], end="")
    print(*args, **kwargs)


def _warning(*args, **kwargs) -> None:
    """Print warning message."""
    cprint("Warning: ", "yellow", attrs=["bold"], end="")
    print(*args, **kwargs)


def _error(*args, **kwargs) -> None:
    """Print error message and exit."""
    cprint("Error: ", "red", attrs=["bold"], end="")
    cprint(*args, **kwargs)
    sys.exit(1)


def _info(*args, **kwargs) -> None:
    """Print info message."""
    cprint("Info: ", "cyan", attrs=["bold"], end="")
    print(*args, **kwargs)


def discover_workspaces() -> list[Path]:
    """Discover available workspaces in bundle-ws directory."""
    bundle_ws_root = PROJECT / "data" / "bundle-ws"
    
    if not bundle_ws_root.exists():
        _error(f"Bundle workspace root '{bundle_ws_root}' does not exist.")
    
    workspaces = []
    
    # Check if there are subdirectories (new multi-workspace structure)
    subdirs = [p for p in bundle_ws_root.iterdir() if p.is_dir()]
    
    if subdirs:
        # Multi-workspace structure
        for subdir in subdirs:
            # Check if this subdirectory contains the required files
            required_files = ["metadata.json", "start.ini", "resfileindex.txt", "index_application.txt", "fsd"]
            if all((subdir / file).exists() for file in required_files):
                workspaces.append(subdir)
        
        if not workspaces:
            _error("No valid workspaces found in bundle-ws subdirectories.")
    else:
        # Single workspace structure (legacy)
        required_files = ["metadata.json", "start.ini", "resfileindex.txt", "index_application.txt", "fsd"]
        if all((bundle_ws_root / file).exists() for file in required_files):
            workspaces.append(bundle_ws_root)
        else:
            _error("No valid workspace found in bundle-ws root directory.")
    
    return workspaces


async def process_workspace(workspace_path: Path) -> bool:
    """Process a single workspace."""
    workspace_name = workspace_path.name if workspace_path.name != "bundle-ws" else "default"
    
    cprint(f"\n{'='*60}", "blue", attrs=["bold"])
    cprint(f"Processing workspace: {workspace_name}", "blue", attrs=["bold"])
    cprint(f"{'='*60}", "blue", attrs=["bold"])
    
    try:
        processor = BundleProcessor(workspace_path, PROJECT, DOWNLOAD_SEMAPHORE)
        bundle_path = await processor.process_bundle()
        
        if bundle_path:
            _success(f"Bundle for workspace '{workspace_name}' completed successfully!")
            _success(f"Bundle file: {bundle_path}")
            return True
        else:
            _error(f"Failed to process workspace '{workspace_name}'")
            return False
    except Exception as e:
        _error(f"Error processing workspace '{workspace_name}': {e!r}")
        return False


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="EVE MultiTools Data Bundle Generator",
        epilog="Examples:\n"
               "  python bundle.py --list                    List available workspaces\n"
               "  python bundle.py --workspace tq            Process specific workspace\n"
               "  python bundle.py --all                     Process all workspaces\n"
               "  python bundle.py                           Interactive workspace selection",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--workspace", "-w",
        type=str,
        help="Specify workspace name to process"
    )
    group.add_argument(
        "--all", "-a",
        action="store_true",
        help="Process all available workspaces"
    )
    group.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available workspaces and exit"
    )
    group.add_argument(
        "--clean-bundles",
        action="store_true",
        help="Clean up existing bundles before processing"
    )
    group.add_argument(
        "--clean-cache",
        action="store_true",
        help="Clean up existing cache before processing"
    )
    group.add_argument(
        "--clean",
        action="store_true",
        help="Clean up existing bundles and cache before processing"
    )
    
    args = parser.parse_args()
    
    cprint("EVE MultiTools Data Bundle Generator", "magenta", attrs=["bold"])
    cprint("====================================", "magenta", attrs=["bold"])
    
    # Discover available workspaces
    workspaces = discover_workspaces()
    
    if args.list:
        _info("Available workspaces:")
        for workspace in workspaces:
            workspace_name = workspace.name if workspace.name != "bundle-ws" else "default"
            _info(f"  - {workspace_name} ({workspace})")
        return
    
    target_workspaces = []
    
    if args.all:
        target_workspaces = workspaces
        _info(f"Processing all {len(workspaces)} workspaces...")
    elif args.workspace:
        # Find the specified workspace
        workspace_name = args.workspace
        found_workspace = None
        
        for workspace in workspaces:
            current_name = workspace.name if workspace.name != "bundle-ws" else "default"
            if current_name == workspace_name:
                found_workspace = workspace
                break
        
        if found_workspace:
            target_workspaces = [found_workspace]
            _info(f"Processing workspace: {workspace_name}")
        else:
            _error(f"Workspace '{workspace_name}' not found.")
            _info("Available workspaces:")
            for workspace in workspaces:
                workspace_name = workspace.name if workspace.name != "bundle-ws" else "default"
                _info(f"  - {workspace_name}")
            return
    elif args.clean:
        # Clean up existing bundles and cache
        _info("Cleaning up existing bundles and cache...")
        for workspace in workspaces:
            processor = BundleProcessor(workspace, PROJECT, DOWNLOAD_SEMAPHORE)
            processor.load_workspace_descriptor()
            processor.clean_bundles()
            processor.clean_cache()
        _success("Cleanup completed.")
        return
    elif args.clean_bundles:
        # Clean up existing bundles only
        _info("Cleaning up existing bundles...")
        for workspace in workspaces:
            processor = BundleProcessor(workspace, PROJECT, DOWNLOAD_SEMAPHORE)
            processor.load_workspace_descriptor()
            processor.clean_bundles()
        _success("Bundle cleanup completed.")
        return
    elif args.clean_cache:
        # Clean up existing cache only
        _info("Cleaning up existing cache...")
        for workspace in workspaces:
            processor = BundleProcessor(workspace, PROJECT, DOWNLOAD_SEMAPHORE)
            processor.load_workspace_descriptor()
            processor.clean_cache()
        _success("Cache cleanup completed.")
        return
    
    # Process selected workspaces
    if not target_workspaces:
        _error("No workspaces selected for processing.")
        return
    
    success_count = 0
    total_count = len(target_workspaces)
    
    for workspace in target_workspaces:
        success = await process_workspace(workspace)
        if success:
            success_count += 1
    
    # Summary
    cprint(f"\n{'='*60}", "magenta", attrs=["bold"])
    cprint("Processing Summary", "magenta", attrs=["bold"])
    cprint(f"{'='*60}", "magenta", attrs=["bold"])
    
    if success_count == total_count:
        _success(f"All {total_count} workspace(s) processed successfully!")
    elif success_count > 0:
        _warning(f"{success_count} out of {total_count} workspace(s) processed successfully.")
    else:
        _error(f"Failed to process any of the {total_count} workspace(s).")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nOperation canceled by user.")
        sys.exit(1)
