"use client";

import CityCombobox from "./CityCombobox";

interface CityMultiSelectProps {
  cities: string[];
  onChange: (cities: string[]) => void;
  maxCities?: number;
}

export default function CityMultiSelect({
  cities,
  onChange,
  maxCities = 10,
}: CityMultiSelectProps) {
  const addCity = (city: string) => {
    if (!cities.includes(city) && cities.length < maxCities) {
      onChange([...cities, city]);
    }
  };

  const removeCity = (city: string) => {
    onChange(cities.filter((c) => c !== city));
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {cities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cities.map((city, i) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-deep-stage border border-white/5 rounded-md text-xs text-house-lights/70"
            >
              {i === 0 && (
                <span className="text-[9px] font-mono font-bold text-signal-orange tracking-wider">
                  HOME
                </span>
              )}
              {city}
              <button
                type="button"
                onClick={() => removeCity(city)}
                className="text-aluminum/40 hover:text-signal-orange transition-colors ml-0.5"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {cities.length < maxCities && (
        <CityCombobox
          value=""
          onChange={addCity}
          exclude={cities}
          placeholder={cities.length === 0 ? "Search cities..." : "Add another city..."}
        />
      )}

      <p className="text-[10px] font-mono text-aluminum/30">
        {cities.length === 0
          ? "Select all markets you're available in. First city is your home base."
          : `${cities.length} of ${maxCities} cities selected. First city is your home base.`}
      </p>
    </div>
  );
}
