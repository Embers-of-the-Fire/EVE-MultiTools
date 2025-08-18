# EVE MultiTools Static Data

The data group of EVE MultiTools is designed to support all servers,
including tranquility run by CCP and serenity run by NetEase.

Each server's bundle shares the same structure, and the tool itself
is not meant to be server-specific.

## Bundle Structure

A bundle for a specific server contains the following major parts:
-   A metadata descriptor.
-   Resource folder

The data resources are stored in a single SQLite database,
while images are stored separately.

Unlike some other tools such as PyFA, EVE MultiTools choses to follow
most data behavior in the game.
Which means the source data might be unable to read for human.

### Metadata Descriptor

The descriptor serves as an identity notifier for the resource bundle.
Its name must be `bundle.descriptor`, in lowercase.

The file itself is actually a JSON file:
```jsonc
{
    "server": "tq",  // Server ID, internal representation
    "server-name": { // Server name, with localization
        "en": "Tranquility",
        "zh": "宁静"
    },
    "created": "2025-7-13T13:00:00",
    "game": {        // Game metadata
        "version": "23.01", // Game version
        "build": "2959108", // Game build
    }
}
```

### Resource Folder

There're two major part of resources, the static data and the images.

The static data are stored in `res/static.sqlite`,
and the images are stored in `res/images` (folder).

## How to Create a Bundle

### Dependencies

EVE MultiTools mainly targets Windows platform,
thus the development environment and related scripts are also
targeting Windows.

To create the bundle, you need the following software installed on your dev-env.
- Python 3.12 or higher. It's not guaranteed to work with lower python version as its tested with Python 3.12.
- Python 2.7. A Python 2 environment is required to extract FSD binaries.

### Preparation

To create a bundle, it's strongly suggested to have a live
EVE client on your device. But the project itself only requires the client's index files.

Assume that your game is installed at `X:\EVE`, we need the following files:
```text
- X:\EVE
    - index_tranquility.txt *
    - tq
        - resfileindex.txt  *
        - start.ini         *
```

To perform better compatibility, the data collector does not
copy any pre-installed resource files, but download them directly
from the resource provider.

To generate static data, you must first convert all fsdbinaries
to a format we could recognize.
This requires another project,
[EVE FSD Dumper](https://github.com/Embers-of-the-Fire/EVE-FSD-Dumper).
It's recommended to get your data converted somewhere out of
the tool, in a standalone folder.

### Create a New Bundle

The bundle creator's work space is `[project]/data/bundle-ws`.
The bundler will create the bundle based on what provided in the workspace.
```text
- [project]/data/bundle-ws
    - metadata.json          *1
    - start.ini              *2
    - resfileindex.txt       *2
    - index_application.txt  *2 *3
    - esi.json               *4
    - links.json             *5
    - fsd/                   *6
```

> 1. The metadata JSON file should be like:
>    ```jsonc
>    {
>        "server": "tq", // server id
>        "resource-service": "https://{type}.eveonline.com/{url}", // resource service url
>        "image-service": { // image-related service urls
>            // faction url
>            "npc-faction": "https://images.evetech.net/corporations/{factionId}/logo?size=128",
>        },
>        "server-name": { // server name
>            "en": "Tranquility",
>            "zh": "宁静"
>        },
>    }
>    ```
>    **Note:** The resource service URL must be a python fstring, 
>    with `type` and `url` slots.
>    **Note:** This might be different if you're player other maintained instance of EVE,
>    like the serenity server. 
>    For NetEase owned resource service, the URL pattern
>    should be `https://ma79.gdl.netease.com/eve/{type}/{url}`.
>    **Note:** The image-service might differs a lot between maintainers.
>    For NetEase owned resource service, the image service should be:
>    ```jsonc
>    {
>        "npc-faction": "https://image.evepc.163.com/Alliance/{factionId}_128.png",
>    }
>    ```
> 2. `start.ini`, `resfileindex.txt` and `index_application.txt`
> are all provided by the game client. See [this section](#preparation).
> 3. `index_application.txt` is renamed from `index_<server>.txt`.
> 4. `esi.json` contains some ESI-related configurations. 
>    Those are mainly several URL patterns.
>    For more information about ESI configs, see [this section](#esi-configurations).
> 5. `links.json` contains some external link formatter, like external market website urls.
>    For more information, see [this section](#external-link-configurations).
> 6. `fsd` folder contains all fsd files converted from fsd binaries. 
> See [EVE FSD Dumper](https://github.com/Embers-of-the-Fire/EVE-FSD-Dumper) 
> for more information.

The output bundle will be `[project]/data/bundle/<server-id>.bundle`.

To create the bundle, simply run:
```bash
python3 bundle.py
```

#### ESI Configurations

The esi configuration file is `<bundle-id>/esi.json` like this:
```jsonc
{
    "<another random key>": {
        "url": "<some url pattern>",
        "method": "Get | Post",
        "query": {
            "<query key>": "<query value>"
        },
        "header": {
            "<header key>": "<header value>"
        }
    }
}
```

The currently used keys are:

##### `MARKET-ORDERS`

The `/markets/{region_id}/orders/` route.
  
Required parameter:
- `regionId`: Market region ID.
- `typeId`: Type to fetch.
- `page`: Which page to get.

Example:
- Tranquility, CCP:
  ```json
  {
      "url": "https://esi.evetech.net/markets/{regionId}/orders",
      "method": "Get",
      "query": {
        "order_type": "all",
        "type_id": "{typeId}",
        "page": "{page}"
      },
      "header": {
        "Accept-Language": "en",
        "X-Tenant": "tranquility"
      }
  }
  ```
- Serenity, NetEase:
  ```json
  {
      "url": "https://ali-esi.evepc.163.com/latest/markets/{regionId}/orders/",
      "method": "Get",
      "query": {
        "order_type": "all",
        "type_id": "{typeId}",
        "page": "{page}",
        "datasource": "serenity"
      }
  }

#### External Link Configurations

The external link config file is `<bundle-id>/links.json`:
```jsonc
{
    "<url key>": "<url pattern>"
}
```

Note that some server might not be covered by external providers,
so leaving the url pattern to be a explicit `null` makes sense.

##### Market

##### EVE-C3Q-CC

Key: `MARKET-EVE-C3Q-CC`

Homepage: [EVE Market](https://eve.c3q.cc/market/)

Required parameter:
- `typeId`: target type ID.

Examples:
- Tranquility:
  ```json
  {
      "MARKET-EVE-C3Q-CC": "https://eve.c3q.cc/market/type/{typeId}/sell/"
  }
  ```
- Serenity:
  ```json
  {
      "MARKET-EVE-C3Q-CC": "https://eve.c3q.cc/market/gf/type/{typeId}/sell/"
  }
  ```

##### EVE-C3Q-CC English variant

Key: `MARKET-EVE-C3Q-CC-EN`

Homepage: [EVE Market](https://eve.c3q.cc/market/en)

Required parameter:
- `typeId`: target type ID.

Examples:
- Tranquility:
  ```json
  {
      "MARKET-EVE-C3Q-CC-EN": "https://eve.c3q.cc/market/en/type/{typeId}/sell/"
  }
  ```
- Serenity:
  ```json
  {
      "MARKET-EVE-C3Q-CC-EN": "https://eve.c3q.cc/market/en/gf/type/{typeId}/sell/"
  }
  ```

##### EVE Tycoon

Key: `MARKET-EVE-TYCOON`

Homepage: [EVE Tycoon](https://evetycoon.com/market)

> Note: This provider contains only Tranquility market details.

Required parameter:
- `typeId`: target type ID.

Examples:
- Tranquility:
  ```json
  {
      "MARKET-EVE-TYCOON": "https://evetycoon.com/market/{typeId}"
  }
  ```

## Mock DB

Our Rust backend uses SQLx to read databases,
so we have to create a mock db to please its checker.

Run `python data/mock.py` will generate the mock db.
