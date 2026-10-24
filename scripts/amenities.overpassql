[out:json][timeout:180];
(
  // Public toilets: greater Copenhagen plus the day-trip towns.
  nwr["amenity"="toilets"](55.55,12.40,55.80,12.70);
  nwr["amenity"="toilets"](around:2000,55.65087,12.08147,55.64264,12.08043,55.96935,12.54316,56.03928,12.62125,55.93506,12.30174);
  // Benches in the walkable centre.
  node["amenity"="bench"](55.62,12.50,55.72,12.64);
);
out center tags;
