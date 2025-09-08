import { useTranslation } from "react-i18next";
import {
    Attribute,
    AttributeContent,
    AttributeName,
    AttributePanel,
    AttributeText,
    AttributeTitle,
} from "@/components/common/AttributePanel";
import { AU_IN_M, DAY_IN_S, KM_IN_M } from "@/constant/unit";
import type { CelestialAttributes, CelestialStatistics } from "@/data/schema";
import { displayPressure } from "@/utils/unit";

export const CelestialAttributesPanel: React.FC<{
    celestial: CelestialAttributes;
}> = ({ celestial }) => {
    const { t } = useTranslation();

    return (
        <AttributePanel>
            <AttributeTitle>
                {t("explore.universe.detail.celestial_attributes.title")}
            </AttributeTitle>
            <AttributeContent>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_attributes.height_map_1")}
                    </AttributeName>
                    <AttributeText>{celestial.heightMap1}</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_attributes.height_map_2")}
                    </AttributeName>
                    <AttributeText>{celestial.heightMap2}</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_attributes.population")}
                    </AttributeName>
                    <AttributeText>
                        {celestial.population ? t("common.yes") : t("common.no")}
                    </AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_attributes.shader_preset")}
                    </AttributeName>
                    <AttributeText>{celestial.shaderPreset}</AttributeText>
                </Attribute>
            </AttributeContent>
        </AttributePanel>
    );
};

export const CelestialStatisticsPanel: React.FC<{
    celestial: CelestialStatistics;
}> = ({ celestial }) => {
    const { t } = useTranslation();

    return (
        <AttributePanel>
            <AttributeTitle>
                {t("explore.universe.detail.celestial_statistics.title")}
            </AttributeTitle>
            <AttributeContent>
                <Attribute>
                    <AttributeName>{t("terms.density")}</AttributeName>
                    <AttributeText>{celestial.density.toFixed(2)} kg/m³</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>{t("terms.escape_velocity")}</AttributeName>
                    <AttributeText>{celestial.escapeVelocity.toFixed(2)} m/s</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>{t("terms.eccentricity")}</AttributeName>
                    <AttributeText>{celestial.eccentricity.toFixed(4)}</AttributeText>
                </Attribute>
                {celestial.fragmented && celestial.fragmented === true ? (
                    <Attribute>
                        <AttributeName>
                            {t("explore.universe.detail.celestial_statistics.fragmented")}
                        </AttributeName>
                        <AttributeText>{t("common.yes")}</AttributeText>
                    </Attribute>
                ) : null}
                {celestial.life && celestial.life > 0 ? (
                    <Attribute>
                        <AttributeName>{t("terms.life")}</AttributeName>
                        <AttributeText>{celestial.life.toFixed(0)}</AttributeText>
                    </Attribute>
                ) : null}
                {celestial.locked && celestial.locked === true ? (
                    <Attribute>
                        <AttributeName>
                            {t("explore.universe.detail.celestial_statistics.locked")}
                        </AttributeName>
                        <AttributeText>{t("common.yes")}</AttributeText>
                    </Attribute>
                ) : null}
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.mass_dust")}
                    </AttributeName>
                    <AttributeText>{celestial.massDust.toExponential(2)} kg</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.mass_gas")}
                    </AttributeName>
                    <AttributeText>{celestial.massGas.toExponential(2)} kg</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.orbit_period")}
                    </AttributeName>
                    <AttributeText>
                        {(celestial.orbitPeriod / DAY_IN_S).toFixed(2)} {t("units.day")}
                    </AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.orbit_radius")}
                    </AttributeName>
                    <AttributeText>{(celestial.orbitRadius / AU_IN_M).toFixed(2)} AU</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.pressure")}
                    </AttributeName>
                    <AttributeText>{displayPressure(celestial.pressure)}</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>{t("terms.radius")}</AttributeName>
                    <AttributeText>{(celestial.radius / KM_IN_M).toFixed(0)} km</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.rotation_rate")}
                    </AttributeName>
                    <AttributeText>
                        {(celestial.rotationRate / DAY_IN_S).toFixed(2)} {t("units.day")}
                    </AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.surface_gravity")}
                    </AttributeName>
                    <AttributeText>{celestial.surfaceGravity.toFixed(2)} m/s²</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.temperature")}
                    </AttributeName>
                    <AttributeText>{celestial.temperature.toFixed(2)} K</AttributeText>
                </Attribute>
                <Attribute>
                    <AttributeName>
                        {t("explore.universe.detail.celestial_statistics.spectral_class")}
                    </AttributeName>
                    <AttributeText>{celestial.spectralClass}</AttributeText>
                </Attribute>
            </AttributeContent>
        </AttributePanel>
    );
};
