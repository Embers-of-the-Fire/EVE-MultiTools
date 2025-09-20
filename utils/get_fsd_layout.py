#!/usr/bin/python

"""Get FSD Layout

This script is used to figure out the very simple
layout of a FSD generated object.

The script will only emit the first level of the
object, despite of the nested parts.

## Usage

```bash
# you can also directly run:
#     ./get_fsd_layout.py
# as an executable on unix-like platforms.
python get_fsd_layout.py /path/to/fsd.json
```

## Example

```bash
$ python utils/get_fsd_layout.py data/bundle-ws/tq/fsd/npccorporations.json

allowedMemberRaces                      optional
ceoID                                   optional
corporationTrades                       optional
deleted                                 required
descriptionID                           optional
divisions                               optional
enemyID                                 optional
exchangeRates                           optional
extent                                  required
factionID                               optional
friendID                                optional
hasPlayerPersonnelManager               required
iconID                                  optional
initialPrice                            required
investors                               optional
lpOfferTables                           optional
mainActivityID                          optional
memberLimit                             required
minSecurity                             required
minimumJoinStanding                     required
nameID                                  required
publicShares                            required
raceID                                  optional
secondaryActivityID                     optional
sendCharTerminationMessage              required
shares                                  required
size                                    required
sizeFactor                              optional
solarSystemID                           optional
stationID                               optional
taxRate                                 required
tickerName                              required
uniqueName                              required
url                                     optional
"""

from __future__ import annotations

import json
import sys


if len(sys.argv) != 2:
    print("Unexpected input parameter.\nSee the Documentation for more information.")
    exit(1)

source = sys.argv[1]

with open(source, "r", encoding="utf-8") as f:
    data = json.load(f)

out = {}

for v in data.values():
    data_keys = set(v.keys())
    collected_keys = set(out.keys())

    in_data = data_keys.difference(collected_keys)
    for key in in_data:
        out[key] = "required"

    in_collected = collected_keys.difference(data_keys)
    for key in in_collected:
        out[key] = "optional"

for k, v in sorted(out.items(), key=lambda t: t[0]):
    print(f"{k: <40}{v}")
