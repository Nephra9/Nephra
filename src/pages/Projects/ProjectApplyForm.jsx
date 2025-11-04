import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { db, supabase } from "../../services/supabaseClient";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";

const ProjectApplyForm = ({ projectId }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institution: "",
    degree: "",
    department: "",
    phone: "",
    country: "",
    purpose: "",
    reason: "",
    semester: "",
  });

  // Load user details from Supabase users table
  useEffect(() => {
    const loadUser = async () => {
      if (!user?.id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error) {
        setUserData(data);
        setForm({
          institution: data.institution || "",
          degree: data.degree || "",
          department: data.department || "",
          phone: data.phone || "",
          country: data.country || "",
          purpose: "",
          reason: "",
          semester: "",
        });
      }

      setLoading(false);
    };

    loadUser();
  }, [user?.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save missing details + apply for project
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
alert("hello");
    try {
      // Update missing user information
      const updatePayload = {};

      ["institution", "degree", "department", "phone", "country"].forEach((f) => {
        if (!userData[f] && form[f]) updatePayload[f] = form[f];
      });

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from("users").update(updatePayload).eq("id", user.id);
      }
console.log("user id is "+user.id);
      // Submit project application
   await db.existing_project_requests.create({
  user_id: user.id,
  project_id: projectId,
  purpose: form.purpose,
  semester: form.semester,
  status: "Pending",
});


      alert("Application Submitted Successfully!");
    } catch (error) {
      console.error(error);
      alert("Error submitting form");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        Loading form...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto py-10"
    >
      <Card className="shadow-soft dark:bg-gray-800">
        <Card.Content className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Apply for Project
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ✅ Auto-filled User Info + Input if missing */}
            {[
              { name: "institution", label: "Institution" },
              { name: "degree", label: "Degree" },
              { name: "department", label: "Department" },
              { name: "phone", label: "Contact Information" },
              { name: "country", label: "Country" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label}
                </label>

                {userData[field.name] ? (
                  <p className="text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md">
                    {userData[field.name]}
                  </p>
                ) : (
                  <input
                    type="text"
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={`Enter ${field.label}`}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-primary-500"
                  />
                )}
              </div>
            ))}

            {/* ✅ Required new fields */}
          

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purpose of the Project
              </label>
              <textarea required
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Semester
              </label>
              <input required
                type="text"
                name="semester"
                value={form.semester}
                onChange={handleChange}
                placeholder="Enter Semester"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <Button type="submit" className="w-full mt-5" disabled={saving}>
  {saving ? "Submitting..." : "Apply Now"}
</Button>
          </form>
        </Card.Content>
      </Card>
    </motion.div>
  );
};

export default ProjectApplyForm;
