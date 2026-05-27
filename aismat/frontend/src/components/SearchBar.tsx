import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: Props): JSX.Element {
  return (
    <div className="group relative">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-mint-gradient opacity-0 blur-lg transition-opacity duration-300 group-focus-within:opacity-30" />
      <div className="relative">
        <Search
          size={18}
          strokeWidth={2.5}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mint-500"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'Пошук за назвою, описом або тегом...'}
          className="input !rounded-2xl !py-3 pl-11 pr-11 text-base shadow-soft"
          aria-label="Пошук матеріалів"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-mint-500 transition hover:bg-mint-100 hover:text-mint-700"
            aria-label="Очистити пошук"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
