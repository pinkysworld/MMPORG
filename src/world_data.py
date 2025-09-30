"""High level world data for the MMPORG prototype.

This module defines 3D map descriptors, explorable cities, non-player
characters (NPCs) and shops that provide services, equipment and additional
quests.  The data is intentionally declarative so that it can be easily
exported to any engine or toolchain later in development.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class Map3D:
    """Description of a 3D explorable environment."""

    key: str
    name: str
    environment: str
    lighting: str
    level_range: Tuple[int, int]
    traversal: List[str]
    points_of_interest: List[str]
    technical_notes: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class Quest:
    """Story or activity that can be picked up from an NPC or location."""

    quest_id: str
    name: str
    summary: str
    requirements: List[str]
    rewards: List[str]


@dataclass(frozen=True)
class Shop:
    """Vendors available inside a city."""

    name: str
    category: str
    inventory: List[str]
    services: List[str]


@dataclass(frozen=True)
class NPC:
    """Non-player character found inside a city."""

    name: str
    role: str
    description: str
    quests: List[str]


@dataclass(frozen=True)
class City:
    """City definition linking to a 3D map."""

    name: str
    map_key: str
    description: str
    population: int
    travel_connections: Dict[str, str]
    attractions: List[str]
    npcs: List[NPC]
    shops: List[Shop]


MAPS: Dict[str, Map3D] = {
    "aurora_spires": Map3D(
        key="aurora_spires",
        name="Aurora Spires",
        environment="Vertical crystal metropolis suspended above a polar sea",
        lighting="Bioluminescent reflections and dynamic aurora curtains",
        level_range=(5, 20),
        traversal=[
            "multi-layer glider lanes",
            "magnetic elevators",
            "spiral sky-bridges"
        ],
        points_of_interest=[
            "Luminary Council Hall",
            "Starfarer's Observatory",
            "Crystalline Market Tier"
        ],
        technical_notes=[
            "Utilises 4k PBR crystal shaders",
            "Dynamic volumetric clouds with day-night cycle",
            "Supports DLSS/FSR upscale presets for mid-tier GPUs"
        ],
    ),
    "ember_hollow": Map3D(
        key="ember_hollow",
        name="Ember Hollow",
        environment="Subterranean magma caverns converted into forge-city",
        lighting="High contrast lava glow with adjustable bloom",
        level_range=(15, 35),
        traversal=[
            "minecart rail network",
            "grappling hook anchor points",
            "cooling tunnels with thermal updrafts"
        ],
        points_of_interest=[
            "Heartforge Assembly",
            "Molten Archives",
            "Anvil Conclave Arena"
        ],
        technical_notes=[
            "Heat haze post-processing tuned for VR comfort",
            "Supports interactive lava shaders with footstep decals"
        ],
    ),
    "verdant_expanse": Map3D(
        key="verdant_expanse",
        name="Verdant Expanse",
        environment="Open-world forest valley with terraced eco-cities",
        lighting="Soft global illumination with god rays at dawn",
        level_range=(1, 15),
        traversal=[
            "rideable wind beasts",
            "zipline canopy network",
            "river skiff fast travel"
        ],
        points_of_interest=[
            "Council Tree Nexus",
            "Verdure Research Bastion",
            "Echoing Waterfalls"
        ],
        technical_notes=[
            "Nanite-enabled foliage streaming",
            "Procedural wildlife spawning hooks"
        ],
    ),
    "celestial_bazaar": Map3D(
        key="celestial_bazaar",
        name="Celestial Bazaar",
        environment="Floating island marketplace orbiting an ancient titan",
        lighting="Dynamic day-night cycle synced with titan heartbeat",
        level_range=(20, 45),
        traversal=[
            "portal anchors to mainland cities",
            "gravity well jumps",
            "cargo balloon ferries"
        ],
        points_of_interest=[
            "Auction Sphere",
            "Relic Cartographer Guild",
            "Skyborne Menagerie"
        ],
        technical_notes=[
            "Ray-traced reflections for polished metal surfaces",
            "Server-side NPC crowd simulation support"
        ],
    ),
}


QUESTS: Dict[str, Quest] = {
    "q_aurora_01": Quest(
        quest_id="q_aurora_01",
        name="Shards of Resonance",
        summary="Calibrate the aurora amplifiers to restore weather balance.",
        requirements=["Complete tutorial flight path", "Acquire resonance tuner"],
        rewards=["Aerostat Wings cosmetic", "1,200 experience"]
    ),
    "q_ember_02": Quest(
        quest_id="q_ember_02",
        name="Forge of Echoes",
        summary="Assist the Anvil Conclave in forging an experimental weapon.",
        requirements=["Level 20", "Fire resistance potion"],
        rewards=["Epic two-handed hammer", "City reputation +150"]
    ),
    "q_verdant_03": Quest(
        quest_id="q_verdant_03",
        name="Roots of Renewal",
        summary="Investigate blight spreading through the Verdant Expanse.",
        requirements=["Reach Verdant Expanse", "Gather 5 samples of blighted bark"],
        rewards=["Druidic companion seed", "Unique healing ability"]
    ),
    "q_celestial_04": Quest(
        quest_id="q_celestial_04",
        name="Market of Stars",
        summary="Broker peace between rival guilds at the Celestial Bazaar.",
        requirements=["Level 30", "Guild reputation Friendly"],
        rewards=["Access to exclusive auctions", "Legendary crafting recipe"]
    ),
}


def _shops(*shop_defs: Shop) -> List[Shop]:
    return list(shop_defs)


def _npcs(*npc_defs: NPC) -> List[NPC]:
    return list(npc_defs)


CITIES: Dict[str, City] = {
    "Aurora Spires": City(
        name="Aurora Spires",
        map_key="aurora_spires",
        description="A shimmering arcology connected by gravity-defying spires.",
        population=180000,
        travel_connections={
            "Ember Hollow": "Thermal updraft airship",
            "Verdant Expanse": "Skywhale transit",
            "Celestial Bazaar": "Portal Gate Sigma"
        },
        attractions=[
            "Aurora Amphitheatre",
            "Chrono Library",
            "Crystal Gardens"
        ],
        npcs=_npcs(
            NPC(
                name="Lysa Aerwyn",
                role="Sky Warden",
                description="Guardian overseeing aerial traffic and training new pilots.",
                quests=["q_aurora_01"]
            ),
            NPC(
                name="Professor Irix",
                role="Luminary Scholar",
                description="Researcher studying harmonic resonance of the spires.",
                quests=["q_celestial_04"]
            ),
        ),
        shops=_shops(
            Shop(
                name="Gleamforge Outfitters",
                category="Equipment",
                inventory=["Adaptive glider suits", "Photon sabers", "Anti-grav boots"],
                services=["Gear upgrade calibration", "Glider tuning"]
            ),
            Shop(
                name="Celestine Curios",
                category="Artifacts",
                inventory=["Starlit reliquaries", "Chrono crystals", "Arcane schematics"],
                services=["Relic appraisal", "Auction consignments"]
            ),
        ),
    ),
    "Ember Hollow": City(
        name="Ember Hollow",
        map_key="ember_hollow",
        description="An industrial stronghold carved into volcanic caverns.",
        population=95000,
        travel_connections={
            "Aurora Spires": "Thermal updraft airship",
            "Verdant Expanse": "Deep-root subway"
        },
        attractions=[
            "Anvil Conclave Arena",
            "Lavafall Baths",
            "Forge Master's Promenade"
        ],
        npcs=_npcs(
            NPC(
                name="Thorin Emberborn",
                role="Forge Master",
                description="Master smith who crafts legendary weapons for worthy heroes.",
                quests=["q_ember_02"]
            ),
            NPC(
                name="Sera Coalbright",
                role="Information Broker",
                description="Keeps tabs on smuggling routes and offers covert contracts.",
                quests=["q_celestial_04"]
            ),
        ),
        shops=_shops(
            Shop(
                name="Molten Core Smithy",
                category="Blacksmith",
                inventory=["Obsidian greatsword", "Magma shield", "Heat tempered gauntlets"],
                services=["Weapon forging", "Armor infusion"]
            ),
            Shop(
                name="Ashen Provisions",
                category="General Goods",
                inventory=["Fire resistance potions", "Cooling vials", "Charstone rations"],
                services=["Potion brewing", "Expedition outfitting"]
            ),
        ),
    ),
    "Verdant Expanse": City(
        name="Verdant Expanse",
        map_key="verdant_expanse",
        description="Lush biosphere with layered habitats and ancient ruins.",
        population=220000,
        travel_connections={
            "Aurora Spires": "Skywhale transit",
            "Ember Hollow": "Deep-root subway",
            "Celestial Bazaar": "Nature gate spiral"
        },
        attractions=[
            "Echoing Waterfalls",
            "Canopy Archives",
            "Sylvan Arena"
        ],
        npcs=_npcs(
            NPC(
                name="Elandra Moonglade",
                role="Druid Envoy",
                description="Mediator between nature spirits and adventurers.",
                quests=["q_verdant_03"]
            ),
            NPC(
                name="Garrick Trailwarden",
                role="Explorer Guildmaster",
                description="Assigns expeditions to recover relics from hidden ruins.",
                quests=["q_aurora_01", "q_celestial_04"]
            ),
        ),
        shops=_shops(
            Shop(
                name="Verdure Atelier",
                category="Crafting",
                inventory=["Bioluminescent dyes", "Living wood kits", "Spirit-thread"],
                services=["Mount customization", "Habitat decor commissions"]
            ),
            Shop(
                name="Canopy Cantina",
                category="Cuisine",
                inventory=["Skyfruit nectar", "Blossom tea", "Herbal tonics"],
                services=["Buff catering", "Cooking lessons"]
            ),
        ),
    ),
    "Celestial Bazaar": City(
        name="Celestial Bazaar",
        map_key="celestial_bazaar",
        description="Trade nexus orbiting a dormant titan, bustling with guilds.",
        population=300000,
        travel_connections={
            "Aurora Spires": "Portal Gate Sigma",
            "Verdant Expanse": "Nature gate spiral"
        },
        attractions=[
            "Auction Sphere",
            "Relic Cartographer Guild",
            "Skyborne Menagerie"
        ],
        npcs=_npcs(
            NPC(
                name="Master Quill",
                role="Auctioneer",
                description="Controls the high-tier auctions and mediates guild disputes.",
                quests=["q_celestial_04"]
            ),
            NPC(
                name="Xara Voidstep",
                role="Interplanar Merchant",
                description="Sells exotic wares sourced from rifts and hidden planes.",
                quests=["q_ember_02"]
            ),
        ),
        shops=_shops(
            Shop(
                name="Starweave Emporium",
                category="Luxury Goods",
                inventory=["Planar silk cloaks", "Gravity-defying jewelry", "Miniature familiars"],
                services=["Custom enchantments", "Guild contract brokerage"]
            ),
            Shop(
                name="Guildhall Services",
                category="Services",
                inventory=["Guild charter upgrades", "Shared storage expansions", "Raid planning kits"],
                services=["Quest board", "Guild recruitment"]
            ),
        ),
    ),
}


def list_city_names() -> List[str]:
    """Return the available city names sorted alphabetically."""

    return sorted(CITIES.keys())


def get_city(name: str) -> Optional[City]:
    """Fetch a city by name, returning ``None`` if it does not exist."""

    return CITIES.get(name)


def get_map(key: str) -> Optional[Map3D]:
    """Fetch a 3D map description by key."""

    return MAPS.get(key)


def find_travel_path(start: str, destination: str) -> Optional[List[str]]:
    """Find a travel route between two cities using breadth-first search."""

    if start == destination:
        return [start]

    if start not in CITIES or destination not in CITIES:
        return None

    frontier: List[List[str]] = [[start]]
    visited = {start}

    while frontier:
        path = frontier.pop(0)
        current = path[-1]
        for neighbor in CITIES[current].travel_connections:
            if neighbor in visited:
                continue
            new_path = path + [neighbor]
            if neighbor == destination:
                return new_path
            visited.add(neighbor)
            frontier.append(new_path)

    return None


def available_quests(city_name: str) -> List[Quest]:
    """Return the quests that can be started in a specific city."""

    city = CITIES.get(city_name)
    if not city:
        return []

    quest_ids = {quest_id for npc in city.npcs for quest_id in npc.quests}
    return [QUESTS[qid] for qid in sorted(quest_ids) if qid in QUESTS]


def describe_city(name: str) -> Optional[str]:
    """Return a formatted description for the requested city."""

    city = CITIES.get(name)
    if not city:
        return None

    map_info = MAPS.get(city.map_key)
    lines = [
        f"City: {city.name}",
        f"Population: {city.population:,}",
        f"Description: {city.description}",
    ]
    if map_info:
        lines.append(f"Map: {map_info.name} ({map_info.environment})")
        lines.append(
            f"Travel Methods: {', '.join(map_info.traversal)}"
        )
    lines.append("Travel Connections:")
    for destination, method in city.travel_connections.items():
        lines.append(f"  - {destination} via {method}")
    lines.append("Attractions:")
    for attraction in city.attractions:
        lines.append(f"  - {attraction}")
    lines.append("NPCs:")
    for npc in city.npcs:
        quest_names = [QUESTS[qid].name for qid in npc.quests if qid in QUESTS]
        quest_display = ", ".join(quest_names) if quest_names else "None"
        lines.append(f"  - {npc.name} ({npc.role}) :: Quests: {quest_display}")
    lines.append("Shops:")
    for shop in city.shops:
        lines.append(
            f"  - {shop.name} [{shop.category}] offers {', '.join(shop.services)}"
        )

    return "\n".join(lines)


__all__ = [
    "Map3D",
    "Quest",
    "Shop",
    "NPC",
    "City",
    "MAPS",
    "QUESTS",
    "CITIES",
    "list_city_names",
    "get_city",
    "get_map",
    "find_travel_path",
    "available_quests",
    "describe_city",
]
