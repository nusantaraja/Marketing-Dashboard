export default function SelectField({ label, name, value, options, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor={name}>
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">-- Pilih --</option>
        {Array.isArray(options)
          ? options.map((opt) =>
              typeof opt === "object" ? (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ) : (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              )
            )
          : null}
      </select>
    </div>
  );
}