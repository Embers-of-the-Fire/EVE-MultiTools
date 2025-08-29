from __future__ import annotations

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from data.bundle_generate.resources import ResourcePath
    from data.bundle_generate.resources import ResourcePathPattern


SKIN_ICONS_RES: ResourcePath = "res:/ui/texture/classes/skins/icons"
FACTION_FLAT_LOGO_RES_PAT: ResourcePathPattern = (
    "res:/ui/texture/eveicon/faction_logos/{flat_logo}_256px.png"
)

LOC_EN_RES: ResourcePath = "res:/localizationfsd/localization_fsd_en-us.pickle"
LOC_ZH_RES: ResourcePath = "res:/localizationfsd/localization_fsd_zh.pickle"

SKINS_STATIC_RES: ResourcePath = "res:/staticdata/skins.static"
SKIN_MATERIALS_STATIC_RES: ResourcePath = "res:/staticdata/skinmaterials.static"
SKIN_LICENSES_STATIC_RES: ResourcePath = "res:/staticdata/skinlicenses.static"

REGIONS_SCHEMA_RES: ResourcePath = "res:/staticdata/regions.schema"
REGIONS_BIN_DATA_RES: ResourcePath = "res:/staticdata/regions.static"
