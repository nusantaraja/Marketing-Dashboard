export default function TextareaField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor={name}>
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows="4"
        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      ></textarea>
    </div>
  );
}