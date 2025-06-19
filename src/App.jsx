import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { supabase } from "./lib/supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("marketing");
  const [activeTab, setActiveTab] = useState("prospek");

  // Data prospek
  const [prospects, setProspects] = useState([]);
  const [newProspect, setNewProspect] = useState({
    name: "",
    contact: "",
    company: "",
    source: "",
    status: "baru",
    description: "",
    location: "",
    contact_person: "",
    email: "",
    position: "",
    phone: "",
  });

  // Data aktivitas
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    prospect_id: "",
    activity_type: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Load data saat login
  useEffect(() => {
    if (user) {
      fetchProspects();
      fetchActivities();
    }
  }, [user]);

  const fetchProspects = async () => {
    const { data, error } = await supabase.from("prospects").select("*");
    if (!error) setProspects(data);
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase.from("activities").select("*");
    if (!error) setActivities(data);
  };

  const handleLogin = () => {
    if (role) {
      setUser({ role });
    }
  };

  const handleChangeProspect = (e) => {
    setNewProspect((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitProspect = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("prospects")
      .insert([{
        ...newProspect,
        assigned_to: user.role,
      }])
      .select();

    if (!error && data?.length > 0) {
      setProspects([data[0], ...prospects]);
      setNewProspect({
        name: "",
        contact: "",
        company: "",
        source: "",
        status: "baru",
        description: "",
        location: "",
        contact_person: "",
        email: "",
        position: "",
        phone: "",
      });
    }
  };

  const handleChangeActivity = (e) => {
    setNewActivity((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitActivity = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("activities")
      .insert([{
        ...newActivity,
      }])
      .select();

    if (!error && data?.length > 0) {
      setActivities([data[0], ...activities]);
      setNewActivity({
        prospect_id: "",
        activity_type: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  };

  const deleteProspect = async (id) => {
    await supabase.from("prospects").delete().eq("id", id);
    setProspects(prospects.filter((p) => p.id !== id));
  };

  const deleteActivity = async (id) => {
    await supabase.from("activities").delete().eq("id", id);
    setActivities(activities.filter((a) => a.id !== id));
  };

  const stats = {
    total: prospects.length,
    hot: prospects.filter((p) => p.status === "hot").length,
    pending: prospects.filter((p) => p.status === "pending").length,
    deal: prospects.filter((p) => p.status === "deal").length,
  };

  const isReadOnly = user?.role === "manager" || user?.role === "superadmin";

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Daftar Prospek", 14, 15);

    prospects.forEach((p, i) => {
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${p.name} - ${p.company}`, 14, 25 + i * 10);
    });

    doc.save("daftar_prospek.pdf");
  };

  // Export to Excel
  const exportToExcel = () => {
    const wsProspects = XLSX.utils.json_to_sheet(prospects);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsProspects, "Prospek");

    const wsActivities = XLSX.utils.json_to_sheet(activities);
    XLSX.utils.book_append_sheet(wb, wsActivities, "Aktivitas");

    XLSX.writeFile(wb, "laporan_marketing.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black to-gray-800 text-white px-4">
          <h1 className="text-4xl font-bold mb-6">Laporan Aktivitas Marketing</h1>
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Masuk ke Akun</h2>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg mb-4 bg-gray-700 text-white"
            >
              <option value="marketing">Marketing</option>
              <option value="manager">Manager Marketing</option>
              <option value="superadmin">Direktur Utama</option>
            </select>
            <button
              onClick={handleLogin}
              className="w-full bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-100 transition"
            >
              Masuk
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-10">
          <header className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">
                Dashboard {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </h1>
              <button
                onClick={() => setUser(null)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Keluar
              </button>
            </div>
            <p className="text-gray-400 mt-2">Kelola dan analisis aktivitas prospek.</p>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Prospek" value={stats.total} color="indigo" />
            <StatCard label="Prospek Hot" value={stats.hot} color="red" />
            <StatCard label="Pending" value={stats.pending} color="yellow" />
            <StatCard label="Deal" value={stats.deal} color="green" />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-600 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("prospek")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "prospek"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300"
                }`}
              >
                Prospek
              </button>
              <button
                onClick={() => setActiveTab("aktivitas")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "aktivitas"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300"
                }`}
              >
                Aktivitas
              </button>
            </nav>
          </div>

          {activeTab === "prospek" && (
            <>
              {/* Input Form Prospek */}
              {!isReadOnly && (
                <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4">Form Input Prospek Baru</h2>
                  <form onSubmit={handleSubmitProspect}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Nama Prospek*" name="name" value={newProspect.name} onChange={handleChangeProspect} required />
                      <InputField label="Lokasi Prospek" name="location" value={newProspect.location} onChange={handleChangeProspect} />
                      <InputField label="Nama Kontak Person" name="contact_person" value={newProspect.contact_person} onChange={handleChangeProspect} />
                      <InputField label="Email Kontak" name="email" value={newProspect.email} onChange={handleChangeProspect} />
                      <InputField label="Jabatan Kontak Person" name="position" value={newProspect.position} onChange={handleChangeProspect} />
                      <InputField label="Telepon Kontak" name="phone" value={newProspect.phone} onChange={handleChangeProspect} />
                      <SelectField
                        label="Sumber"
                        name="source"
                        value={newProspect.source}
                        options={["Instagram", "Email Campaign", "Kontak Langsung", "Referensi"]}
                        onChange={handleChangeProspect}
                      />
                      <SelectField
                        label="Status"
                        name="status"
                        value={newProspect.status}
                        options={["baru", "pending", "hot", "deal"]}
                        onChange={handleChangeProspect}
                      />
                    </div>
                    <TextareaField
                      label="Deskripsi"
                      name="description"
                      value={newProspect.description}
                      onChange={handleChangeProspect}
                    />
                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Simpan Prospek
                    </button>
                  </form>
                </div>
              )}

              {/* Table Prospek */}
              <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <h2 className="text-xl font-semibold text-white p-6">Daftar Prospek</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Perusahaan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        {(user.role === "manager" || user.role === "superadmin") && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {prospects.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{p.company}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                p.status === "baru"
                                  ? "bg-gray-600 text-gray-300"
                                  : p.status === "pending"
                                  ? "bg-yellow-600 text-yellow-300"
                                  : p.status === "hot"
                                  ? "bg-red-600 text-red-300"
                                  : "bg-green-600 text-green-300"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          {(user.role === "manager" || user.role === "superadmin") && (
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => deleteProspect(p.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Hapus
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "aktivitas" && (
            <>
              {/* Input Form Aktivitas */}
              {!isReadOnly && (
                <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4">Form Aktivitas Baru</h2>
                  <form onSubmit={handleSubmitActivity}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SelectField
                        label="Pilih Prospek"
                        name="prospect_id"
                        value={newActivity.prospect_id}
                        options={prospects.map((p) => ({ value: p.id, label: `${p.name} - ${p.company}` }))}
                        onChange={handleChangeActivity}
                      />
                      <InputField label="Tanggal Aktivitas" name="date" type="date" value={newActivity.date} onChange={handleChangeActivity} required />
                      <SelectField
                        label="Jenis Aktivitas"
                        name="activity_type"
                        value={newActivity.activity_type}
                        options={["Follow-up Telepon", "Meeting Offline", "Penawaran Proposal", "Presentasi Produk"]}
                        onChange={handleChangeActivity}
                      />
                      <TextareaField
                        label="Deskripsi Aktivitas"
                        name="notes"
                        value={newActivity.notes}
                        onChange={handleChangeActivity}
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Simpan Aktivitas
                    </button>
                  </form>
                </div>
              )}

              {/* Table Aktivitas */}
              <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <h2 className="text-xl font-semibold text-white p-6">Riwayat Aktivitas</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prospek</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Jenis</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catatan</th>
                        {(user.role === "manager" || user.role === "superadmin") && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {activities.map((a) => {
                        const prospect = prospects.find((p) => p.id === a.prospect_id);
                        return (
                          <tr key={a.id} className="hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">{prospect?.name || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{a.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{a.activity_type}</td>
                            <td className="px-6 py-4">{a.notes}</td>
                            {(user.role === "manager" || user.role === "superadmin") && (
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => deleteActivity(a.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Hapus
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Ekspor ke PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Ekspor ke Excel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components

function StatCard({ label, value, color }) {
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

function InputField({ label, name, value, onChange, required = false, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function SelectField({ label, name, value, options, onChange }) {
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

function TextareaField({ label, name, value, onChange }) {
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