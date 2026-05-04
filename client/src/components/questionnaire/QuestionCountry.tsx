import { useState } from "react";
import { CONTINENTS } from "@/types/questionnaire";

interface QuestionCountryProps {
  value?: string;
  onChange: (value: string) => void;
  continent?: string;
  label: string;
  required?: boolean;
}

export function QuestionCountry({ value, onChange, continent, label, required }: QuestionCountryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCountries = () => {
    if (!continent) return [];
    const continentData = CONTINENTS.find(c => c.name === continent);
    return continentData ? continentData.countries : [];
  };

  const countries = getCountries();

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-white mb-3">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {!continent ? (
        <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm">
          Please select a continent first
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-left hover:border-white/20 transition-colors flex items-center justify-between"
          >
            <span>{value || 'Select a country'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors ${
                    value === country ? 'bg-green-500/20 text-green-400' : 'text-gray-300'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
