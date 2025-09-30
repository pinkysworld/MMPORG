# MMPORG World Data

Dieses Repository enthält einen prototypischen Welt-Datensatz für ein MMPORG.
Die Daten beschreiben hochwertige 3D-Karten, mehrere Städte, NPCs sowie
Shops mit zusätzlichen Quests. Das Ziel ist, einer Spiellogik oder einem
Engine-Prototypen sofort umfangreiche Inhalte zur Verfügung zu stellen.

## Inhalte

- **3D Karten** – Vier detaillierte Umgebungen (Aurora Spires, Ember Hollow,
  Verdant Expanse, Celestial Bazaar) mit Traversal-Optionen, Points of Interest
  und technischen Notizen für die Umsetzung.
- **Städte** – Jede Karte besitzt mindestens eine Stadt mit Reisemöglichkeiten
  zu anderen Städten, Sehenswürdigkeiten und Bevölkerungsangaben.
- **NPCs** – Charaktere mit Rollenbeschreibungen und Quest-Zuordnungen, die als
  Ausgangspunkte für Abenteuer dienen.
- **Shops** – Händler mit Inventar und Dienstleistungen, die neue Ausrüstung
  oder Quests anbieten.

## Verwendung

```python
from src.world_data import (
    list_city_names,
    describe_city,
    find_travel_path,
    available_quests,
)

print(list_city_names())
print(find_travel_path("Aurora Spires", "Ember Hollow"))
print(describe_city("Verdant Expanse"))
print([quest.name for quest in available_quests("Celestial Bazaar")])
```

Die Funktionen liefern strukturierte Daten, die direkt in UI, Quest-Logik oder
Content-Pipelines integriert werden können.

## Tests

Für grundlegende Validierungen kann `pytest` eingesetzt werden:

```bash
pip install pytest
pytest
```
