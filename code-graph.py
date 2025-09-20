#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys

import matplotlib.pyplot as plt
import yaml


def run_tokei_yaml() -> dict:
    try:
        result = subprocess.run(
            [
                "tokei",
                "--output",
                "yaml",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        data = yaml.safe_load(result.stdout)
        return data
    except subprocess.CalledProcessError:
        return {}
    except FileNotFoundError:
        return {}
    except yaml.YAMLError:
        return {}


def parse_tokei_data(tokei_data: dict) -> tuple[list[int], list[str]]:
    languages = []
    code_lines = []

    for language, stats in tokei_data.items():
        if language == "Total":
            continue
        if isinstance(stats, dict) and "code" in stats:
            languages.append(language)
            code_lines.append(stats["code"])

    return code_lines, languages


def get_language_colors() -> dict[str, str]:
    return {
        "Python": "#3776ab",
        "JavaScript": "#f7df1e",
        "TypeScript": "#3178c6",
        "Java": "#ed8b00",
        "C++": "#00599c",
        "C": "#555555",
        "C#": "#239120",
        "Go": "#00add8",
        "Rust": "#dea584",
        "PHP": "#777bb4",
        "Ruby": "#cc342d",
        "Swift": "#fa7343",
        "Kotlin": "#7f52ff",
        "HTML": "#e34f26",
        "CSS": "#1572b6",
        "SCSS": "#cf649a",
        "Shell": "#89e051",
        "SQL": "#336791",
        "YAML": "#cb171e",
        "JSON": "#000000",
        "XML": "#0060ac",
        "Markdown": "#083fa1",
        "Dockerfile": "#384d54",
        "Makefile": "#427819",
        "Lua": "#000080",
        "Perl": "#0298c3",
        "R": "#276dc3",
    }


def create_clean_tokei_donut(
    data: list[int],
    labels: list[str],
    min_percentage: float = 1.0,
    inner_radius: float = 0.4,
    figsize: tuple[int, int] = (10, 8),
) -> tuple[plt.Figure | None, plt.Axes | None]:
    if not data or not labels:
        return None, None

    color_map = get_language_colors()
    total_lines = sum(data)
    percentages = [d / total_lines * 100 for d in data]

    filtered_data = []
    filtered_labels = []
    filtered_colors = []
    others_total = 0

    for i, (lines, lang, pct) in enumerate(zip(data, labels, percentages, strict=False)):
        if pct >= min_percentage:
            filtered_data.append(lines)
            filtered_labels.append(lang)
            filtered_colors.append(color_map.get(lang, plt.cm.Set3(i / len(data))))
        else:
            others_total += lines

    if others_total > 0:
        filtered_data.append(others_total)
        filtered_labels.append("Others")
        filtered_colors.append("#cccccc")

    with plt.xkcd():
        fig, ax = plt.subplots(figsize=figsize)

        wedges, texts, autotexts = ax.pie(
            filtered_data,
            labels=filtered_labels,
            colors=filtered_colors,
            autopct="%1.1f%%",
            startangle=90,
            wedgeprops={"width": 1 - inner_radius, "linewidth": 2, "edgecolor": "black"},
            textprops={"fontsize": 10},
        )

        ax.text(0, 0, f"{total_lines:,}", ha="center", va="center", fontsize=14, fontweight="bold")
        ax.axis("off")
        plt.tight_layout()
        return fig, ax


def generate_chart(
    output_file: str = "tokei-chart.png",
    min_percentage: float = 1.0,
    show_chart: bool = False,
    inner_radius: float = 0.4,
) -> bool:
    tokei_data = run_tokei_yaml()

    if not tokei_data:
        return False

    code_lines, languages = parse_tokei_data(tokei_data)

    if not code_lines or not languages:
        return False

    fig, ax = create_clean_tokei_donut(
        code_lines, languages, min_percentage=min_percentage, inner_radius=inner_radius
    )

    if fig:
        fig.savefig(output_file, dpi=300, bbox_inches="tight")
        plt.close(fig)
        return True
    else:
        return False


def main():
    success = generate_chart()
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
