export default function StatCard({ label, value, color }) {
  const colorClass = {
    indigo: "bg-indigo-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className={`${colorClass[color]} h-2`}></div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-400">{label}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}