import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/UI/Button";

export default function AllProgress() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest"); // latest | highest | name
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [selectedProjectName, setSelectedProjectName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [projRes, existingRes] = await Promise.all([
        supabase
          .from("project_requests")
          .select("id, title, created_at, progress_notes, progress_project")
          .eq("user_id", user.id),

        supabase
          .from("existing_project_requests")
          .select("id, title, created_at, progress_notes, progress_project")
          .eq("user_id", user.id),
      ]);

      const combined = [...(projRes.data || []), ...(existingRes.data || [])];
      setProjects(combined);
      setFiltered(combined);
    };

    fetchData();
  }, [user.id]);

  // Filter projects as user types
  useEffect(() => {
    let data = [...projects];

    if (search.trim() !== "")
      data = data.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );

    // Sorting logic
    data.sort((a, b) => {
      if (sort === "highest")
        return b.progress_project - a.progress_project;
      if (sort === "name")
        return a.title.localeCompare(b.title);
      return new Date(b.created_at) - new Date(a.created_at); // latest
    });

    setFiltered(data);
  }, [search, sort, projects]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Project Progress History
      </h2>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="latest">Latest Updated</option>
          <option value="highest">Highest Progress</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((project) => {
          const notes = project.progress_notes || [];
          const latestThree = [...notes]
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 3);

          return (
            <div
              key={project.id}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-700 h-fit w-full transition-transform hover:scale-[1.01]"
            >
              {/* Progress bar */}
              <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full mb-4">
                <div
                  className="h-2 bg-green-500 rounded-full"
            style={{
  width: `${
    project.progress_notes?.length
      ? [...project.progress_notes].sort((a, b) => new Date(b.at) - new Date(a.at))[0].value
      : 0
  }%`
}}

                ></div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 truncate">
                {project.title}
              </h3>

              {/* 3 latest notes */}
              <div className="space-y-3">
                {latestThree.length > 0 ? (
                  latestThree.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700"
                    >
                      <p className="font-semibold text-sm text-white">
                        {n.value}% — {n.note}
                      </p>
                      <p className="text-[11px] text-gray-300 mt-1">
                        {new Date(n.at).toLocaleString()} • {n.author}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    No progress updates yet.
                  </p>
                )}
              </div>

              {/* Show More modal button */}
              {notes.length > 3 && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedNotes(
                        [...notes].sort(
                          (a, b) => new Date(b.at) - new Date(a.at)
                        )
                      );
                      setSelectedProjectName(project.title);
                      setModalOpen(true);
                    }}
                  >
                    Show More
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedProjectName} — Full History
              </h2>
              <button
                className="text-gray-300 hover:text-white text-2xl leading-none"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedNotes.map((n, idx) => (
                <div key={idx} className="p-3 bg-gray-700 rounded-lg">
                  <p className="font-semibold text-sm text-white">
                    {n.value}% — {n.note}
                  </p>
                  <p className="text-[11px] text-gray-300 mt-1">
                    {new Date(n.at).toLocaleString()} • {n.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
