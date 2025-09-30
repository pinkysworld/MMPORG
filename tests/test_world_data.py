from pathlib import Path
import sys

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from world_data import (
    CITIES,
    MAPS,
    QUESTS,
    available_quests,
    describe_city,
    find_travel_path,
    get_city,
    get_map,
    list_city_names,
)


def test_city_connections_are_bidirectional():
    for city_name, city in CITIES.items():
        for destination in city.travel_connections:
            assert destination in CITIES, f"{destination} missing from CITIES"
            reverse = CITIES[destination].travel_connections
            assert (
                city_name in reverse
            ), f"{city_name} should be reachable from {destination}"


def test_find_travel_path_between_all_cities():
    names = list_city_names()
    for start in names:
        for end in names:
            path = find_travel_path(start, end)
            assert path is not None, f"No path between {start} and {end}"
            assert path[0] == start
            assert path[-1] == end


def test_describe_city_contains_key_sections():
    description = describe_city("Aurora Spires")
    assert description is not None
    for snippet in ["City:", "NPCs:", "Shops:", "Travel Connections:"]:
        assert snippet in description


def test_available_quests_returns_known_quests():
    quests = available_quests("Celestial Bazaar")
    quest_ids = {quest.quest_id for quest in quests}
    assert quest_ids <= set(QUESTS)
    assert "q_celestial_04" in quest_ids


def test_getters_return_expected_objects():
    city = get_city("Verdant Expanse")
    assert city is not None
    map_info = get_map(city.map_key)
    assert map_info is not None
    assert map_info.key == city.map_key


def test_maps_have_points_of_interest():
    for map_obj in MAPS.values():
        assert map_obj.points_of_interest, f"{map_obj.name} missing POIs"
        assert map_obj.traversal, f"{map_obj.name} missing traversal options"
