import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/UI/Button'
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function AllProgress() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState(null);

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
          .eq("user_id", user.id)
      ]);

      const combined = [
        ...(projRes.data || []),
        ...(existingRes.data || []),
      ];

      setProjects(
        combined.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
    };

    fetchData();
  }, [user.id]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Project Progress History
      </h2>

      <div className="space-y-5">
        {projects.map((project) => {
          const notes = project.progress_notes || [];
          const latestFive = [...notes]
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 5);

          const isExpanded = expanded === project.id;

          return (
     <div
  key={project.id}
  className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-700"
>
  {/* Title */}
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    {project.title}
  </h3>

  {/* Notes */}
  <div className="space-y-3">
    {(expanded === project.id
      ? // show all notes
        [...(project.progress_notes || [])].sort((a, b) => new Date(b.at) - new Date(a.at))
      : // show latest 5
        [...(project.progress_notes || [])]
          .sort((a, b) => new Date(b.at) - new Date(a.at))
          .slice(0, 5)
    ).map((n, idx) => (
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
    ))}
  </div>

  {/* Show More button — only visible if more than 5 notes */}
  {project.progress_notes && project.progress_notes.length > 5 && expanded !== project.id && (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(project.id)}
        className="w-full"
      >
        Show More
      </Button>
    </div>
  )}
</div>

          );
        })}
      </div>
    </div>
  );
}
