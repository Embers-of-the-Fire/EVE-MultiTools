# EVE MultiTools

EVE MultiTools is a comprehensive toolset for EVE Online players, providing market analysis, character management, industry tools, and more.

## Development

Before starting development, make sure you have the following items installed:
- pnpm: The frontend part uses pnpm as package manager
- rust toolchain, including cargo: The rust package manager and build tools
- tauri environment: see [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/) for more information.
- python: uv and an extra Python 2.7 environment if you want to generate FSD from scratch.
- protobuf compiler: Required if you want to edit the [schema](data/schema.proto).

And it's recommended to use these utilities:
- biome: This project uses biome to format frontend code.
         For more information, see its [configuration](biome.jsonc).
- ruff: To format python code. See [the configuration](ruff.toml).
- python-matplotlib: The code graph requires matplotlib to generate the graph.
- tokei: A code counter integrated in the code-graph generator.
- shadcn cli(you can use `pnpx shadcn@latest` instead): To manage shadcn components

### Clone the repository

```bash
git clone https://github.com/your-username/eve-multitools.git
cd eve-multitools
```

### Install dependencies

```bash
pnpm install
```

### Run the development application

```bash
pnpm tauri dev
```

### Build release version

```bash
pnpm tauri build
```

### More guides

[Guides](./docs/README.md)

## License

This project is licensed under the [MIT License](LICENSE-MIT)
and the [Apache-v2.0 License](LICENSE-APACHE).

## Code Graph

![code-graph](tokei-chart.png)
